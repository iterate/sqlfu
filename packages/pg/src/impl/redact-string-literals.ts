// Focused tokenizer that walks SQL just far enough to find string-literal
// boundaries. Used by `pgAnalyzeQueries` to redact string contents before
// the regex-based `$N → NULL::<type>` substitution would mangle text inside
// quotes (or before `pgsql-ast-parser` would choke on `$$ … $$`).
//
// Recognized lexical forms (non-recognized chars pass through verbatim):
//
//   'foo'                   single-quoted string, '' is the embedded-quote
//                           escape (no \-escapes when standard_conforming_strings
//                           is on, which is the default since pg 9.1)
//   E'foo' / e'foo'         escape-string with C-style \-escapes
//   $$body$$                dollar-quoted, no tag
//   $tag$body$tag$          dollar-quoted with custom tag (an identifier);
//                           the same `$tag$` must close it
//   "foo"                   quoted identifier — recognized so we *skip
//                           over* it without mistaking embedded ' for a
//                           string opener; never redacted
//   /* … */                 block comment (pg nests them; depth-counted)
//   -- …                    line comment to next \n
//
// Everything else passes through unchanged. The tokenizer is *not* a
// general SQL parser; it's only correct for the lexical layer.
//
// Two consumers expose the redactors:
//   - `redactAllStringLiterals(sql)`   — the aggressive form. Replaces
//     every '...' / E'...' / $$...$$ string body with the sentinel
//     `null/*sqlfu_redacted_literal*/::text`. Used before the temp-view
//     path's regex `$N` substitution: any `$N` left in the redacted
//     output is necessarily a real parameter, never a substring of a
//     literal. The `null::text` survives any downstream cast chain
//     (pg accepts NULL through any conversion at constant-folding time).
//   - `redactDollarQuotedStrings(sql)` — minimal form. Only $$..$$ /
//     $tag$..$tag$ get the sentinel; single-quoted strings pass through
//     so future literal-not-null inference can still see them as real
//     string literals. Used before the AST pipeline (which uses
//     `pgsql-ast-parser`, which has no grammar for dollar-quoting).
//
// The sentinel embeds a marker comment so a later pass can recognize
// "this NULL was a redacted literal" and treat it as not-null without
// needing to track positions out of band. Pg strips the comment during
// parse — view definitions show `SELECT NULL::text` — so it's purely
// metadata for our own analysis layer.

export const REDACTION_MARKER = '/*sqlfu_redacted_literal*/';
export const REDACTION_SUBSTITUTE = `null${REDACTION_MARKER}::text`;

export interface RedactOptions {
  /**
   * When true, single-quoted strings (`'…'`) and escape-strings (`E'…'`)
   * are also redacted. When false, only dollar-quoted strings get the
   * substitute. The latter is what the AST path wants: it preserves
   * regular string literals for downstream nullability inference, while
   * stripping the dollar-quoted forms that `pgsql-ast-parser` can't
   * parse.
   */
  includeSingleQuoted: boolean;
}

export function redactAllStringLiterals(sql: string): string {
  return redact(sql, {includeSingleQuoted: true});
}

export function redactDollarQuotedStrings(sql: string): string {
  return redact(sql, {includeSingleQuoted: false});
}

function redact(sql: string, options: RedactOptions): string {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    // Block comment — pg's nest, so depth-count.
    if (ch === '/' && next === '*') {
      const end = scanBlockComment(sql, i);
      out += sql.slice(i, end);
      i = end;
      continue;
    }

    // Line comment.
    if (ch === '-' && next === '-') {
      const end = scanLineComment(sql, i);
      out += sql.slice(i, end);
      i = end;
      continue;
    }

    // Quoted identifier — pass through, never redact, but recognize the
    // boundaries so we don't mistake an inner quote for a string opener.
    if (ch === '"') {
      const end = scanQuotedIdentifier(sql, i);
      out += sql.slice(i, end);
      i = end;
      continue;
    }

    // E-string / e-string. The leading E/e must be a standalone token
    // (not the tail of a longer identifier).
    if ((ch === 'E' || ch === 'e') && next === "'" && !isWordChar(sql[i - 1])) {
      const end = scanEString(sql, i);
      if (options.includeSingleQuoted) {
        out += REDACTION_SUBSTITUTE;
      } else {
        out += sql.slice(i, end);
      }
      i = end;
      continue;
    }

    // Single-quoted string.
    if (ch === "'") {
      const end = scanSingleQuoted(sql, i);
      if (options.includeSingleQuoted) {
        out += REDACTION_SUBSTITUTE;
      } else {
        out += sql.slice(i, end);
      }
      i = end;
      continue;
    }

    // Dollar-quoted string ($tag$body$tag$). The tag is optional; an
    // identifier when present. Distinguish from positional `$N` parameter
    // and from `$` used as a regular character: the opener is `$` then
    // an identifier-or-empty then `$`.
    if (ch === '$') {
      const opener = scanDollarOpener(sql, i);
      if (opener) {
        const end = scanDollarQuoted(sql, i, opener.tag);
        out += REDACTION_SUBSTITUTE;
        i = end;
        continue;
      }
    }

    // Pass through.
    out += ch;
    i++;
  }
  return out;
}

/** `i` points at `/*`. Returns the index just past the matching `* /`. */
function scanBlockComment(sql: string, i: number): number {
  let depth = 1;
  let j = i + 2;
  while (j < sql.length && depth > 0) {
    if (sql[j] === '/' && sql[j + 1] === '*') {
      depth++;
      j += 2;
    } else if (sql[j] === '*' && sql[j + 1] === '/') {
      depth--;
      j += 2;
    } else {
      j++;
    }
  }
  return j;
}

/** `i` points at `--`. Returns index just past the trailing newline (or end). */
function scanLineComment(sql: string, i: number): number {
  let j = i + 2;
  while (j < sql.length && sql[j] !== '\n') j++;
  if (j < sql.length) j++; // consume the newline itself
  return j;
}

/** `i` points at `"`. Returns index just past the closing quote. `""` is the embedded-quote escape. */
function scanQuotedIdentifier(sql: string, i: number): number {
  let j = i + 1;
  while (j < sql.length) {
    if (sql[j] === '"') {
      if (sql[j + 1] === '"') {
        j += 2; // escaped embedded quote
      } else {
        return j + 1;
      }
    } else {
      j++;
    }
  }
  return j;
}

/** `i` points at `'`. Returns index just past the closing quote. */
function scanSingleQuoted(sql: string, i: number): number {
  let j = i + 1;
  while (j < sql.length) {
    if (sql[j] === "'") {
      if (sql[j + 1] === "'") {
        j += 2;
      } else {
        return j + 1;
      }
    } else {
      j++;
    }
  }
  return j;
}

/** `i` points at `E` or `e` followed by `'`. Returns index just past closing quote. Backslash-escapes are honored. */
function scanEString(sql: string, i: number): number {
  let j = i + 2; // skip past E and the opening '
  while (j < sql.length) {
    const c = sql[j];
    if (c === '\\') {
      j += 2; // skip the escaped char
      continue;
    }
    if (c === "'") {
      if (sql[j + 1] === "'") {
        j += 2;
      } else {
        return j + 1;
      }
    } else {
      j++;
    }
  }
  return j;
}

/**
 * `i` points at `$`. If the run looks like a dollar-quote opener
 * (`$tag$` or `$$`), return the tag and the opener length. Otherwise
 * return null — the `$` is part of a positional parameter (`$1`) or
 * just a literal `$` somewhere unusual.
 *
 * The tag is an identifier: starts with a letter or `_`, continues
 * with letters/digits/`_`. Length zero (`$$`) is allowed.
 */
function scanDollarOpener(sql: string, i: number): {tag: string; openerLength: number} | null {
  let j = i + 1;
  // Read tag.
  while (j < sql.length && isIdentifierChar(sql[j], j === i + 1)) j++;
  if (sql[j] === '$') {
    return {tag: sql.slice(i + 1, j), openerLength: j - i + 1};
  }
  return null;
}

/** Find the matching `$tag$` close. */
function scanDollarQuoted(sql: string, i: number, tag: string): number {
  const closer = `$${tag}$`;
  const openerLength = closer.length;
  let j = i + openerLength;
  while (j < sql.length) {
    if (sql.startsWith(closer, j)) {
      return j + closer.length;
    }
    j++;
  }
  return j;
}

function isWordChar(ch: string | undefined): boolean {
  return ch != null && /[A-Za-z0-9_]/.test(ch);
}

function isIdentifierChar(ch: string, isFirst: boolean): boolean {
  if (isFirst) return /[A-Za-z_]/.test(ch);
  return /[A-Za-z0-9_]/.test(ch);
}
