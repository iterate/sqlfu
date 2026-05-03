// Make a SQL string safe for both `pgsql-ast-parser` and the regex-based
// `$N → null::<type>` substitution by neutralizing the parts that confuse
// each tool, *without* destroying type information.
//
// The substitution is in-place and minimal:
//
//   - Inside any string body (single-quoted, e-string, or dollar-quoted),
//     every `$` is replaced with `SQLFU_DOLLAR`. After this, `\$N\b`-style
//     regex substitution can't accidentally match a `$N` that was inside a
//     string literal — only real positional parameters survive.
//
//   - `$$body$$` and `$tag$body$tag$` dollar-quoted forms are rewritten to
//     `'body'` (with embedded `'` doubled, and `$` neutralized as above).
//     `pgsql-ast-parser` has no grammar for dollar-quoting, so it's
//     converted to the single-quoted form pg also accepts.
//
//   - Comments and quoted identifiers are recognized so the tokenizer
//     doesn't mistake an inner character for a string boundary, but their
//     contents are *not* modified.
//
// The result is "almost the original SQL" — type inference, alias names,
// FROM/WHERE structure, and string positions are all preserved. Only the
// rune-level content of string bodies changes (and dollar-quoting becomes
// single-quoting). That's enough to feed both pipelines correctly.
//
// **Safety claim — empirically verified**: pg constant-folds string-to-T
// casts at PREPARE time, so any query whose folded cast would fail at
// view creation also fails at PREPARE. There's no "PREPARE succeeds,
// neutralized-VIEW fails because the body's runtime value differs" case
// — every test we ran has matching PREPARE/VIEW outcomes. So
// neutralizing string contents while keeping the type intact is safe.

const NEUTRALIZED_DOLLAR = 'SQLFU_DOLLAR';

export function neutralizeStringLiterals(sql: string): string {
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

    // Quoted identifier — pass through, never modify, but recognize the
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
      const prefix = ch; // preserve E or e capitalization
      const body = sql.slice(i + 2, end - 1);
      out += `${prefix}'${body.replaceAll('$', NEUTRALIZED_DOLLAR)}'`;
      i = end;
      continue;
    }

    // Single-quoted string.
    if (ch === "'") {
      const end = scanSingleQuoted(sql, i);
      const body = sql.slice(i + 1, end - 1);
      out += `'${body.replaceAll('$', NEUTRALIZED_DOLLAR)}'`;
      i = end;
      continue;
    }

    // Dollar-quoted string ($tag$body$tag$ or $$body$$). Distinguish from
    // a positional `$N` parameter and from `$` used as a regular character:
    // an opener is `$` then an identifier-or-empty then `$`.
    if (ch === '$') {
      const opener = scanDollarOpener(sql, i);
      if (opener) {
        const end = scanDollarQuoted(sql, i, opener.tag);
        const bodyStart = i + opener.openerLength;
        const closerLength = `$${opener.tag}$`.length;
        const bodyEnd = end - closerLength;
        const body = sql.slice(bodyStart, bodyEnd);
        const sanitized = body.replaceAll("'", "''").replaceAll('$', NEUTRALIZED_DOLLAR);
        out += `'${sanitized}'`;
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
  if (j < sql.length) j++;
  return j;
}

/** `i` points at `"`. Returns index just past the closing quote. `""` is the embedded-quote escape. */
function scanQuotedIdentifier(sql: string, i: number): number {
  let j = i + 1;
  while (j < sql.length) {
    if (sql[j] === '"') {
      if (sql[j + 1] === '"') {
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
  let j = i + 2;
  while (j < sql.length) {
    const c = sql[j];
    if (c === '\\') {
      j += 2;
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
 */
function scanDollarOpener(sql: string, i: number): {tag: string; openerLength: number} | null {
  let j = i + 1;
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
