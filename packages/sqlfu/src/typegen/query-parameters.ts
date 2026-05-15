export type ParameterExpansion =
  | {
      kind: 'scalar-array';
      name: string;
    }
  | {
      kind: 'object-fields';
      name: string;
      fields: string[];
      driverFields: string[];
    }
  | {
      kind: 'object-array';
      name: string;
      fields: string[];
      sqlShape: 'values' | 'row-list';
      acceptsSingleOrArray: boolean;
    };

export type NamedParameterReference = {
  raw: string;
  name: string;
  path: string[];
  start: number;
  end: number;
  wrappedInParens: boolean;
};

export type SqlIgnoredRange = {
  kind: 'line-comment' | 'block-comment' | 'string';
  start: number;
  end: number;
};

export function prepareSqlForAnalysis(sql: string, parameterExpansions: ParameterExpansion[]): string {
  return stripSqlComments(applyParameterExpansionsForAnalysis(sql, parameterExpansions));
}

export function applyParameterExpansionsForAnalysis(sql: string, expansions: ParameterExpansion[]): string {
  if (expansions.length === 0) return sql;
  sql = rewriteRowListExpansionsForAnalysis(sql, expansions);
  const expansionMap = new Map(expansions.map((expansion) => [expansion.name, expansion]));
  return replaceNamedParameters(sql, (reference) => {
    if (reference.path.length > 0) {
      return `:${expandedFieldName(reference.name, reference.path[0]!)}`;
    }

    const expansion = expansionMap.get(reference.name);
    if (!expansion) return reference.raw;

    if (expansion.kind === 'scalar-array') {
      const placeholder = `:${reference.name}`;
      return reference.wrappedInParens ? placeholder : `(${placeholder})`;
    }

    if (expansion.kind === 'object-fields') {
      return reference.raw;
    }

    const replacement = expansion.fields.map((field) => `:${expandedFieldName(expansion.name, field)}`).join(', ');
    if (reference.wrappedInParens) return replacement;
    return `(${replacement})`;
  });
}

export function replaceNamedParameters(sql: string, replace: (reference: NamedParameterReference) => string): string {
  let output = '';
  let cursor = 0;
  for (const reference of findNamedParameterReferences(sql)) {
    output += sql.slice(cursor, reference.start);
    output += replace(reference);
    cursor = reference.end;
  }
  return output + sql.slice(cursor);
}

export function findNamedParameterReferences(sql: string): NamedParameterReference[] {
  const references: NamedParameterReference[] = [];
  let quote: "'" | '"' | '`' | null = null;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index]!;
    const next = sql[index + 1];

    if (lineComment) {
      if (char === '\n' || char === '\r') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (char === quote) {
        if (sql[index + 1] === quote) {
          index += 1;
          continue;
        }
        quote = null;
      }
      continue;
    }

    if (char === '-' && next === '-') {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      continue;
    }

    if (char !== ':') continue;
    if (next === ':') {
      index += 1;
      continue;
    }

    const match = sql.slice(index).match(/^:([A-Za-z_$][A-Za-z0-9_$]*)/);
    if (!match) continue;

    const start = index;
    let cursor = index + match[0]!.length;
    const referencePath: string[] = [];
    while (sql[cursor] === '.') {
      const fieldMatch = sql.slice(cursor).match(/^\.([A-Za-z_$][A-Za-z0-9_$]*)/);
      if (!fieldMatch) break;
      referencePath.push(fieldMatch[1]!);
      cursor += fieldMatch[0]!.length;
    }

    cursor = assertNoParameterModifier(sql, cursor);

    const raw = sql.slice(start, cursor);
    references.push({
      raw,
      name: match[1]!,
      path: referencePath,
      start,
      end: cursor,
      wrappedInParens: isWrappedInParens(sql, start, cursor),
    });
    index = cursor - 1;
  }

  return references;
}

export function parseInlineParameterExpansions(sql: string): ParameterExpansion[] {
  const expansions = new Map<string, ParameterExpansion>();
  const references = findNamedParameterReferences(sql);

  for (const expansion of inferInsertValuesParameterExpansions(sql)) {
    addParameterExpansion(expansions, expansion);
  }
  for (const expansion of inferRowInParameterExpansions(sql)) {
    addParameterExpansion(expansions, expansion);
  }

  for (const reference of references) {
    if (reference.path.length > 1) {
      throw new Error(`Nested parameter paths are not supported yet: ${reference.raw}`);
    }

    if (reference.path.length === 1) {
      const fieldName = reference.path[0]!;
      addParameterExpansion(expansions, {
        kind: 'object-fields',
        name: reference.name,
        fields: [fieldName],
        driverFields: [fieldName],
      });
    }
  }

  for (const reference of references) {
    if (reference.path.length > 0) continue;
    const expansion = expansions.get(reference.name);
    if (expansion?.kind === 'object-fields') {
      throw new Error(
        `Parameter ${JSON.stringify(reference.name)} cannot be used both as ${reference.raw} and ${expansion.kind}`,
      );
    }
  }

  return Array.from(expansions.values());
}

export function addParameterExpansion(
  expansions: Map<string, ParameterExpansion>,
  expansion: ParameterExpansion,
): void {
  const existing = expansions.get(expansion.name);
  if (!existing) {
    expansions.set(expansion.name, expansion);
    return;
  }

  if (existing.kind !== expansion.kind) {
    throw new Error(
      `Parameter ${JSON.stringify(expansion.name)} cannot use both ${existing.kind} and ${expansion.kind}`,
    );
  }

  if (existing.kind === 'object-fields' && expansion.kind === 'object-fields') {
    for (const fieldName of expansion.fields) {
      if (!existing.fields.includes(fieldName)) {
        existing.fields.push(fieldName);
      }
    }
    existing.driverFields.push(...expansion.driverFields);
    return;
  }

  if (existing.kind === 'object-array' && expansion.kind === 'object-array') {
    if (
      existing.fields.join('\0') !== expansion.fields.join('\0') ||
      existing.sqlShape !== expansion.sqlShape ||
      existing.acceptsSingleOrArray !== expansion.acceptsSingleOrArray
    ) {
      throw new Error(`Parameter ${JSON.stringify(expansion.name)} cannot use multiple inferred field sets`);
    }
    return;
  }
}

export function stripSqlComments(sql: string): string {
  const chars = sql.split('');
  for (const comment of findSqlIgnoredRanges(sql).filter((range) => range.kind !== 'string')) {
    for (let index = comment.start; index < comment.end; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') {
        chars[index] = ' ';
      }
    }
  }
  return chars.join('');
}

export function findSqlIgnoredRanges(sql: string): SqlIgnoredRange[] {
  const ranges: SqlIgnoredRange[] = [];
  let quote: "'" | '"' | '`' | null = null;
  let quoteStart = 0;
  let lineCommentStart: number | null = null;
  let blockCommentStart: number | null = null;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index]!;
    const next = sql[index + 1];

    if (lineCommentStart !== null) {
      if (char === '\n' || char === '\r') {
        ranges.push({kind: 'line-comment', start: lineCommentStart, end: index});
        lineCommentStart = null;
      }
      continue;
    }

    if (blockCommentStart !== null) {
      if (char === '*' && next === '/') {
        ranges.push({kind: 'block-comment', start: blockCommentStart, end: index + 2});
        blockCommentStart = null;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (char === quote) {
        if (next === quote) {
          index += 1;
          continue;
        }
        ranges.push({kind: 'string', start: quoteStart, end: index + 1});
        quote = null;
      }
      continue;
    }

    if (char === '-' && next === '-') {
      lineCommentStart = index;
      index += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      blockCommentStart = index;
      index += 1;
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      quoteStart = index;
    }
  }

  if (lineCommentStart !== null) {
    ranges.push({kind: 'line-comment', start: lineCommentStart, end: sql.length});
  }
  if (blockCommentStart !== null) {
    ranges.push({kind: 'block-comment', start: blockCommentStart, end: sql.length});
  }
  if (quote) {
    ranges.push({kind: 'string', start: quoteStart, end: sql.length});
  }

  return ranges;
}

export function expandedFieldName(parameterName: string, fieldName: string): string {
  return `${parameterName}__${fieldName}`;
}

function rewriteRowListExpansionsForAnalysis(sql: string, expansions: ParameterExpansion[]): string {
  let output = sql;
  for (const expansion of expansions) {
    if (expansion.kind !== 'object-array' || expansion.sqlShape !== 'row-list') continue;
    const pattern = new RegExp(`\\(([^()]+)\\)\\s+(?:not\\s+)?in\\s*\\(\\s*:${expansion.name}\\s*\\)`, 'gi');
    output = replaceSqlPatternOutsideCommentsAndStrings(output, pattern, (match, [rawFields = '']) => {
      const fields = parseSimpleSqlFieldList(rawFields, 'inferred row IN parameter');
      if (fields.join('\0') !== expansion.fields.join('\0')) return match;
      const predicates = rawFields
        .split(',')
        .map((field) => field.trim())
        .map((field, index) => `${field} = :${expandedFieldName(expansion.name, fields[index]!)}`)
        .join(' and ');
      return `(${predicates})`;
    });
  }
  return output;
}

function assertNoParameterModifier(sql: string, index: number): number {
  if (sql[index] !== ':' || sql[index + 1] === ':') return index;

  const match = sql.slice(index).match(/^:([A-Za-z_$][A-Za-z0-9_$]*)/);
  throw new Error(`Unsupported parameter modifier: ${match ? match[0] : sql.slice(index, index + 1)}`);
}

function inferInsertValuesParameterExpansions(sql: string): ParameterExpansion[] {
  const expansions: ParameterExpansion[] = [];
  const searchableSql = maskSqlCommentsAndStrings(sql);
  const identifier = `[A-Za-z_$][A-Za-z0-9_$]*`;
  const tableName = `${identifier}(?:\\s*\\.\\s*${identifier})?`;
  const pattern = new RegExp(
    `\\binsert\\s+(?:or\\s+${identifier}\\s+)?into\\s+${tableName}\\s*\\(([^)]*)\\)\\s+values\\s+:(${identifier})\\b`,
    'gi',
  );

  for (const match of searchableSql.matchAll(pattern)) {
    expansions.push({
      kind: 'object-array',
      name: match[2]!,
      fields: parseSimpleSqlFieldList(match[1]!, 'inferred INSERT values parameter'),
      sqlShape: 'values',
      acceptsSingleOrArray: true,
    });
  }
  return expansions;
}

function inferRowInParameterExpansions(sql: string): ParameterExpansion[] {
  const expansions: ParameterExpansion[] = [];
  const searchableSql = maskSqlCommentsAndStrings(sql);
  const pattern = /\(([^()]+)\)\s+(?:not\s+)?in\s*\(\s*:([A-Za-z_$][A-Za-z0-9_$]*)\s*\)/gi;

  for (const match of searchableSql.matchAll(pattern)) {
    const fields = parseSimpleSqlFieldList(match[1]!, 'inferred row IN parameter');
    if (fields.length < 2) continue;
    expansions.push({
      kind: 'object-array',
      name: match[2]!,
      fields,
      sqlShape: 'row-list',
      acceptsSingleOrArray: false,
    });
  }
  return expansions;
}

function parseSimpleSqlFieldList(rawFields: string, syntaxName: string): string[] {
  const fields = rawFields
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean);
  if (fields.length === 0) {
    throw new Error(`${syntaxName} needs at least one field`);
  }

  const names = fields.map((field) => {
    const match = field.match(/^(?:(?:[A-Za-z_$][A-Za-z0-9_$]*)\.)?([A-Za-z_$][A-Za-z0-9_$]*)$/);
    if (!match) {
      throw new Error(`${syntaxName} only supports simple column names: ${JSON.stringify(field)}`);
    }
    return match[1]!;
  });

  const duplicate = names.find((field, index) => names.indexOf(field) !== index);
  if (duplicate) {
    throw new Error(`${syntaxName} cannot infer duplicate field ${JSON.stringify(duplicate)}`);
  }
  return names;
}

function isWrappedInParens(sql: string, start: number, end: number): boolean {
  return previousNonWhitespace(sql, start) === '(' && nextNonWhitespace(sql, end) === ')';
}

function previousNonWhitespace(sql: string, index: number): string | undefined {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const char = sql[cursor]!;
    if (!/\s/.test(char)) return char;
  }
  return undefined;
}

function nextNonWhitespace(sql: string, index: number): string | undefined {
  for (let cursor = index; cursor < sql.length; cursor += 1) {
    const char = sql[cursor]!;
    if (!/\s/.test(char)) return char;
  }
  return undefined;
}

function maskSqlCommentsAndStrings(sql: string): string {
  const chars = sql.split('');
  for (const range of findSqlIgnoredRanges(sql)) {
    for (let index = range.start; index < range.end; index += 1) {
      chars[index] = ' ';
    }
  }
  return chars.join('');
}

function replaceSqlPatternOutsideCommentsAndStrings(
  sql: string,
  pattern: RegExp,
  replace: (match: string, groups: string[]) => string,
): string {
  const searchableSql = maskSqlCommentsAndStrings(sql);
  let output = '';
  let cursor = 0;
  for (const match of searchableSql.matchAll(pattern)) {
    const start = match.index!;
    const end = start + match[0]!.length;
    output += sql.slice(cursor, start);
    output += replace(
      sql.slice(start, end),
      match.slice(1).map((group) => group || ''),
    );
    cursor = end;
  }
  return output + sql.slice(cursor);
}
