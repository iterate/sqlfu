import fs from 'node:fs/promises';

import type {Migration} from '../migrations/index.js';
import type {QueryResultMode} from '../types.js';

export type InlineConfigSource = {
  name: string;
  className?: string;
  modulePath: string;
  sourceText: string;
  definitions: InlineSqlTemplate;
  migrations: InlineMigrationSource[];
  migrationsArray: InlineMigrationsArraySource;
  queries: InlineQuerySource[];
};

export type InlineSqlTemplate = {
  sql: string;
  tagStart: number;
  templateStart: number;
};

export type InlineMigrationSource = {
  name: string;
  content: InlineSqlTemplate;
};

export type InlineMigrationsArraySource =
  | {
      kind: 'present';
      insertPosition: number;
    }
  | {
      kind: 'missing';
      insertPropertyPosition: number;
      propertyIndent: string;
    };

export type InlineQuerySource = {
  name: string;
  content: InlineSqlTemplate;
};

export type InlineQueryType = {
  className?: string;
  configName: string;
  queryName: string;
  type: string;
  mode: QueryResultMode;
};

type InlineConfigTarget = {
  className?: string;
  name: string;
};

type InlineConfigCall = {
  target: InlineConfigTarget | null;
  openParen: number;
};

export async function readInlineConfigSources(modulePath: string): Promise<InlineConfigSource[]> {
  const sourceText = await fs.readFile(modulePath, 'utf8');
  return parseInlineConfigSources(modulePath, sourceText);
}

export function parseInlineConfigSources(modulePath: string, sourceText: string): InlineConfigSource[] {
  const sources: InlineConfigSource[] = [];
  for (const inlineCall of findDefineConfigCalls(sourceText)) {
    const source = parseInlineConfigSourceForCall(modulePath, sourceText, inlineCall);
    if (source) sources.push(source);
  }
  const duplicate = firstDuplicate(sources.map((source) => inlineConfigReferenceName(source)));
  if (duplicate) {
    throw new Error(`${modulePath} contains more than one inline defineConfig(...) call assigned to "${duplicate}".`);
  }
  return sources;
}

function parseInlineConfigSourceForCall(
  modulePath: string,
  sourceText: string,
  inlineCall: InlineConfigCall,
): InlineConfigSource | null {
  const definitionStart = skipTrivia(sourceText, inlineCall.openParen + 1);
  if (sourceText[definitionStart] !== '{') {
    return null;
  }
  const definitionEnd = findMatchingDelimiter(sourceText, definitionStart, '{', '}');
  if (!looksLikeInlineDefineConfigObject(sourceText, definitionStart, definitionEnd)) {
    return null;
  }
  const parsedDefinition = parseObjectProperties(sourceText, definitionStart, definitionEnd, modulePath);
  if (!isInlineDefineConfigShape(sourceText, parsedDefinition.properties, modulePath)) {
    return null;
  }
  const definitionProperties = assertPlainProperties(parsedDefinition, `inline defineConfig(...) in ${modulePath}`);

  const afterDefinition = skipTrivia(sourceText, definitionEnd + 1);
  if (sourceText[afterDefinition] !== ')') {
    throw new Error(`inline defineConfig(...) in ${modulePath} must contain exactly one object literal argument.`);
  }
  if (!inlineCall.target) {
    throw new Error(
      `${modulePath} inline defineConfig(...) calls must be exported as default, assigned to top-level const declarations, or assigned to static properties on top-level named classes.`,
    );
  }

  const definitions = readSqlProperty(definitionProperties, 'definitions', modulePath);
  const migrationsProperty = definitionProperties.find((property) => property.name === 'migrations');
  const migrationsArray =
    migrationsProperty && readArrayInitializer(sourceText, migrationsProperty, 'migrations', modulePath);
  const queriesProperty = readProperty(definitionProperties, 'queries', modulePath);
  const queriesObject = readObjectInitializer(sourceText, queriesProperty, 'queries', modulePath);

  return {
    className: inlineCall.target.className,
    name: inlineCall.target.name,
    modulePath,
    sourceText,
    definitions,
    migrations: migrationsArray ? readMigrationSources(sourceText, migrationsArray, modulePath) : [],
    migrationsArray: migrationsArray
      ? {
          kind: 'present',
          insertPosition: migrationsArray.end,
        }
      : {
          kind: 'missing',
          insertPropertyPosition: lineStartIndex(sourceText, queriesProperty.nameStart),
          propertyIndent: lineIndentAt(sourceText, queriesProperty.nameStart),
        },
    queries: readQuerySources(sourceText, queriesObject, modulePath),
  };
}

function looksLikeInlineDefineConfigObject(
  sourceText: string,
  definitionStart: number,
  definitionEnd: number,
): boolean {
  const definitionBody = sourceText.slice(definitionStart + 1, definitionEnd);
  return definitionBody.includes('sql`') || definitionBody.includes('sql<');
}

function isInlineDefineConfigShape(sourceText: string, properties: PropertySpan[], modulePath: string): boolean {
  const definitions = properties.find((property) => property.name === 'definitions');
  if (!definitions) return false;
  const definitionsStart = skipTrivia(sourceText, definitions.start);
  if (startsWithSqlTag(sourceText, definitionsStart)) return true;
  const quote = sourceText[definitionsStart] || '';
  if (quote === "'" || quote === '"' || quote === '`') return false; // file-backed path string
  // The call body contains sql tagged templates (the looksLike... gate) but
  // "definitions" is neither a sql tag nor a path string — e.g. a hoisted
  // `const ddl = sql\`...\``. Silently treating this as file-backed would make
  // the CLI dynamic-import the module and crash with an unrelated error.
  throw new Error(
    `${modulePath} defineConfig(...) looks like an inline config (it contains sql tagged templates) but ` +
      '"definitions" is not a literal sql`...` template. Define the schema inline with sql`...` so sqlfu can ' +
      'statically analyze it, or use a string path for a file-backed config.',
  );
}

function startsWithSqlTag(sourceText: string, index: number): boolean {
  if (!startsWithIdentifier(sourceText, index, 'sql')) return false;
  const previous = sourceText[index - 1] || '';
  const next = sourceText[index + 'sql'.length] || '';
  if (isIdentifierPart(previous) || isIdentifierPart(next)) return false;
  const afterTag = skipTrivia(sourceText, index + 'sql'.length);
  return sourceText[afterTag] === '`' || sourceText[afterTag] === '<';
}

export async function writeInlineQueryTypes(modulePath: string, queryTypes: InlineQueryType[]): Promise<boolean> {
  const inlines = await readRequiredInlineConfigSources(modulePath);
  const replacements = inlines.flatMap((inline) =>
    inline.queries.flatMap((query) => {
      const queryType = queryTypes.find(
        (candidate) =>
          candidate.className === inline.className &&
          candidate.configName === inline.name &&
          candidate.queryName === query.name,
      );
      if (!queryType) {
        // Query analysis can fail per query; the generator reports those after
        // writing. Leave the failing query's existing annotation untouched.
        return [];
      }
      return renderInlineQueryTypeReplacements(inlines[0].sourceText, query, queryType);
    }),
  );
  const output = applyReplacements(inlines[0].sourceText, replacements);
  if (output === inlines[0].sourceText) {
    return false;
  }
  await fs.writeFile(modulePath, output);
  return true;
}

function renderInlineQueryTypeReplacements(
  sourceText: string,
  query: InlineQuerySource,
  queryType: InlineQueryType,
): SourceReplacement[] {
  const replacement = replaceSqlTagPrefix(sourceText, query.content, queryType);
  return replacement ? [replacement] : [];
}

function replaceSqlTagPrefix(
  sourceText: string,
  template: InlineSqlTemplate,
  queryType: InlineQueryType,
): SourceReplacement | null {
  const text = renderSqlTagPrefix(queryType);
  const existingText = sourceText.slice(template.tagStart, template.templateStart);
  if (normalizeInlineTypeTagPrefix(existingText) === normalizeInlineTypeTagPrefix(text)) {
    return null;
  }
  return {
    start: template.tagStart,
    end: template.templateStart,
    text,
  };
}

function renderSqlTagPrefix(queryType: InlineQueryType): string {
  return `sql.${queryType.mode === 'metadata' ? 'run' : queryType.mode}<${queryType.type}>`;
}

function normalizeInlineTypeTagPrefix(value: string): string {
  return value.replace(/;\s*\}/gu, '}').replace(/\s+/g, '');
}

export async function appendInlineMigration(
  modulePath: string,
  migration: {
    app?: string;
    name: string;
    content: string;
  },
): Promise<void> {
  const inline = await readRequiredInlineConfigSource(modulePath, migration.app);
  const style = inferInlineSourceStyle(inline.sourceText);
  if (inline.migrationsArray.kind === 'missing') {
    const insertPosition = inline.migrationsArray.insertPropertyPosition;
    const elementIndent = `${inline.migrationsArray.propertyIndent}${style.indent}`;
    const property =
      `${inline.migrationsArray.propertyIndent}migrations: [\n` +
      `${renderInlineMigrationObject(elementIndent, migration, style)}${style.trailingComma ? ',' : ''}\n` +
      `${inline.migrationsArray.propertyIndent}],\n`;
    await fs.writeFile(
      modulePath,
      `${inline.sourceText.slice(0, insertPosition)}${property}${inline.sourceText.slice(insertPosition)}`,
    );
    return;
  }

  const insertPosition = inline.migrationsArray.insertPosition;
  let beforeInsert = inline.sourceText.slice(0, insertPosition).trimEnd();
  const closingIndent = lineIndentAt(inline.sourceText, insertPosition);
  const elementIndent = `${closingIndent}${style.indent}`;
  if (inline.migrations.length > 0) {
    // The separating comma goes right after the previous element's last code
    // character — `beforeInsert` may end with a trailing line comment, and a
    // comma appended there would be swallowed by the comment.
    const lastCode = lastCodeIndexBefore(inline.sourceText, insertPosition);
    if (lastCode !== null && inline.sourceText[lastCode] !== ',') {
      beforeInsert = `${beforeInsert.slice(0, lastCode + 1)},${beforeInsert.slice(lastCode + 1)}`;
    }
  }
  const insertion = `\n${renderInlineMigrationObject(elementIndent, migration, style)}${style.trailingComma ? ',' : ''}\n${closingIndent}`;
  await fs.writeFile(modulePath, `${beforeInsert}${insertion}${inline.sourceText.slice(insertPosition)}`);
}

function lastCodeIndexBefore(sourceText: string, limit: number): number | null {
  let cursor = 0;
  let last: number | null = null;
  while (cursor < limit) {
    const next = skipTrivia(sourceText, cursor);
    if (next >= limit) break;
    const end = skipSourceElement(sourceText, next);
    last = Math.min(end, limit) - 1;
    cursor = end;
  }
  return last;
}

export function inlineMigrationsToMigrationFiles(inline: InlineConfigSource): Migration[] {
  return inline.migrations.map((migration) => ({
    path: `${migration.name}.sql`,
    content: migration.content.sql,
  }));
}

async function readRequiredInlineConfigSources(modulePath: string): Promise<InlineConfigSource[]> {
  const inlines = await readInlineConfigSources(modulePath);
  if (inlines.length === 0) {
    throw new Error(`No inline defineConfig(...) call found in ${modulePath}.`);
  }
  return inlines;
}

async function readRequiredInlineConfigSource(
  modulePath: string,
  name: string | undefined,
): Promise<InlineConfigSource> {
  const inlines = await readRequiredInlineConfigSources(modulePath);
  if (!name && inlines.length > 1) {
    throw new Error(
      `${modulePath} contains more than one inline defineConfig(...) call. Pass an inline app name to select one; use ClassName.propertyName for static class configs.`,
    );
  }
  const inline = name ? inlines.find((candidate) => inlineConfigReferenceName(candidate) === name) : inlines[0];
  if (!inline) {
    throw new Error(`No inline defineConfig(...) call named "${name}" found in ${modulePath}.`);
  }
  return inline;
}

function findDefineConfigCalls(sourceText: string): InlineConfigCall[] {
  const calls: InlineConfigCall[] = [];
  forEachCodeIndexWithDepth(sourceText, (index, depth) => {
    if (!startsWithIdentifier(sourceText, index, 'defineConfig')) return;
    const previous = sourceText[index - 1] || '';
    const next = sourceText[index + 'defineConfig'.length] || '';
    if (isIdentifierPart(previous) || previous === '.' || isIdentifierPart(next)) return;
    const openParen = skipTrivia(sourceText, index + 'defineConfig'.length);
    if (sourceText[openParen] === '(') {
      calls.push({
        target: readDefineConfigTarget(sourceText, index, depth),
        openParen,
      });
    }
  });
  return calls;
}

function isTopLevelDepth(depth: SourceDepth): boolean {
  return depth.braces === 0 && depth.brackets === 0 && depth.parens === 0;
}

function isClassStaticPropertyDepth(depth: SourceDepth): boolean {
  return depth.braces === 1 && depth.brackets === 0 && depth.parens === 0;
}

function readDefineConfigTarget(sourceText: string, index: number, depth: SourceDepth): InlineConfigTarget | null {
  if (isTopLevelDepth(depth)) {
    const name = readDefineConfigConstName(sourceText, index);
    return name ? {name} : null;
  }
  if (isClassStaticPropertyDepth(depth)) {
    return readDefineConfigStaticPropertyTarget(sourceText, index);
  }
  return null;
}

function readDefineConfigConstName(sourceText: string, index: number): string | null {
  const prefix = sourceText.slice(0, index);
  const constMatch = prefix.match(/(?:^|[;\n])\s*(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)(?:\s*:[^=]+)?\s*=\s*$/u);
  if (constMatch) return constMatch[1];
  // `export default defineConfig({...})` has no binding name; "default" keeps
  // duplicate detection and generated-type matching working for the common
  // single-config module shape that `sqlfu init` scaffolds.
  return /(?:^|[;\n])\s*export\s+default\s*$/u.test(prefix) ? 'default' : null;
}

function readDefineConfigStaticPropertyTarget(sourceText: string, index: number): InlineConfigTarget | null {
  const classBodyStart = findEnclosingTopLevelBrace(sourceText, index);
  if (classBodyStart === null) return null;
  const className = readTopLevelClassName(sourceText, classBodyStart);
  if (!className) return null;
  const name = readStaticPropertyName(sourceText, classBodyStart + 1, index);
  return name ? {className, name} : null;
}

function findEnclosingTopLevelBrace(sourceText: string, limit: number): number | null {
  let cursor = 0;
  let braces = 0;
  let topLevelBrace: number | null = null;
  while (cursor < limit) {
    const skipped = skipSourceElement(sourceText, cursor);
    if (skipped !== cursor + 1) {
      cursor = skipped;
      continue;
    }
    const char = sourceText[cursor];
    if (char === '{') {
      if (braces === 0) topLevelBrace = cursor;
      braces += 1;
    } else if (char === '}') {
      braces -= 1;
      if (braces === 0) topLevelBrace = null;
    }
    cursor += 1;
  }
  return braces === 1 ? topLevelBrace : null;
}

function readTopLevelClassName(sourceText: string, classBodyStart: number): string | null {
  const prefix = sourceText.slice(0, classBodyStart);
  const match = prefix.match(
    /(?:^|[;\n])\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)[^{]*$/u,
  );
  return match?.[1] || null;
}

function readStaticPropertyName(sourceText: string, classBodyStart: number, index: number): string | null {
  const prefix = sourceText.slice(classBodyStart, index);
  const match = prefix.match(
    /(?:^|[;\n])\s*(?:(?:public|private|protected|readonly|accessor)\s+)*static\s+(?:readonly\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*!?(?:\s*:[^=]+)?\s*=\s*$/u,
  );
  return match?.[1] || null;
}

function inlineConfigReferenceName(inline: Pick<InlineConfigSource, 'className' | 'name'>): string {
  return inline.className ? `${inline.className}.${inline.name}` : inline.name;
}

function firstDuplicate(values: string[]): string | undefined {
  const seen: string[] = [];
  for (const value of values) {
    if (seen.includes(value)) return value;
    seen.push(value);
  }
  return undefined;
}

type SourceSpan = {
  start: number;
  end: number;
};

type SourceReplacement = SourceSpan & {
  text: string;
};

type PropertySpan = SourceSpan & {
  name: string;
  nameStart: number;
};

function readSqlProperty(properties: PropertySpan[], name: string, modulePath: string): InlineSqlTemplate {
  return readSqlTemplate(
    sourceTextFor(properties),
    readProperty(properties, name, modulePath),
    `${modulePath} ${name}`,
  );
}

function readArrayInitializer(
  sourceText: string,
  property: PropertySpan,
  name: string,
  modulePath: string,
): SourceSpan {
  const start = skipTrivia(sourceText, property.start);
  if (sourceText[start] !== '[') {
    throw new Error(`inline defineConfig(...) in ${modulePath} must provide "${name}" as an array literal.`);
  }
  return {start, end: findMatchingDelimiter(sourceText, start, '[', ']')};
}

function readObjectInitializer(
  sourceText: string,
  property: PropertySpan,
  name: string,
  modulePath: string,
): SourceSpan {
  const start = skipTrivia(sourceText, property.start);
  if (sourceText[start] !== '{') {
    throw new Error(`inline defineConfig(...) in ${modulePath} must provide "${name}" as an object literal.`);
  }
  return {start, end: findMatchingDelimiter(sourceText, start, '{', '}')};
}

function readProperty(properties: PropertySpan[], name: string, modulePath: string): PropertySpan {
  const property = properties.find((candidate) => candidate.name === name);
  if (!property) {
    throw new Error(`inline defineConfig(...) in ${modulePath} must provide a "${name}" property assignment.`);
  }
  return property;
}

function readMigrationSources(sourceText: string, array: SourceSpan, modulePath: string): InlineMigrationSource[] {
  return parseArrayElements(sourceText, array).map((element, index) => {
    const objectStart = skipTrivia(sourceText, element.start);
    if (sourceText[objectStart] !== '{') {
      throw new Error(`inline defineConfig(...) migration ${index} in ${modulePath} must be an object literal.`);
    }
    const objectEnd = findMatchingDelimiter(sourceText, objectStart, '{', '}');
    const properties = assertPlainProperties(
      parseObjectProperties(sourceText, objectStart, objectEnd, modulePath),
      `inline defineConfig(...) migration ${index} in ${modulePath}`,
    );
    const name = readStringInitializer(
      sourceText,
      readProperty(properties, 'name', modulePath),
      `${modulePath} migration name`,
    );
    const content = readSqlTemplate(
      sourceText,
      readProperty(properties, 'content', modulePath),
      `${modulePath} migration ${name}`,
    );
    return {name, content};
  });
}

function readQuerySources(sourceText: string, object: SourceSpan, modulePath: string): InlineQuerySource[] {
  const queryProperties = assertPlainProperties(
    parseObjectProperties(sourceText, object.start, object.end, modulePath),
    `inline defineConfig(...) queries in ${modulePath}`,
  );
  return queryProperties.map((property) => ({
    name: property.name,
    content: readSqlTemplate(sourceText, property, `${modulePath} query ${property.name}`),
  }));
}

function readSqlTemplate(sourceText: string, span: SourceSpan, location: string): InlineSqlTemplate {
  const tagStart = skipTrivia(sourceText, span.start);
  if (!startsWithIdentifier(sourceText, tagStart, 'sql')) {
    throw new Error(`${location} must use the sql tag.`);
  }
  let cursor = skipTrivia(sourceText, tagStart + 'sql'.length);
  if (sourceText[cursor] === '.') {
    const modeName = readIdentifier(sourceText, skipTrivia(sourceText, cursor + 1), `${location} sql tag`);
    if (!isQueryResultModeTag(modeName.value)) {
      throw new Error(`${location} uses unsupported sql tag mode ${JSON.stringify(modeName.value)}.`);
    }
    cursor = skipTrivia(sourceText, modeName.end);
  }
  if (sourceText[cursor] === '<') {
    cursor = skipTrivia(sourceText, findMatchingAngle(sourceText, cursor) + 1);
  }
  if (sourceText[cursor] !== '`') {
    throw new Error(`${location} must be a sql\`...\` tagged template.`);
  }
  const templateStart = cursor;
  const templateEnd = findTemplateEnd(sourceText, templateStart, location);
  const afterTemplate = skipSqlMapCalls(sourceText, skipTrivia(sourceText, templateEnd + 1), span.end, location);
  if (afterTemplate < span.end) {
    throw new Error(`${location} must be a sql\`...\` tagged template, optionally followed by .map(...).`);
  }
  return {
    // Cooked, not raw: the runtime template literal decodes escapes, so static
    // analysis must see the same text the runtime executes.
    sql: cookTemplateText(sourceText.slice(templateStart + 1, templateEnd)).trim(),
    tagStart,
    templateStart,
  };
}

function cookTemplateText(raw: string): string {
  return raw.replace(
    /\\(?:u\{([0-9A-Fa-f]+)\}|u([0-9A-Fa-f]{4})|x([0-9A-Fa-f]{2})|\r?\n|([\s\S]))/gu,
    (_match, uBrace: string, u4: string, x2: string, single: string | undefined) => {
      if (uBrace) return String.fromCodePoint(Number.parseInt(uBrace, 16));
      if (u4) return String.fromCharCode(Number.parseInt(u4, 16));
      if (x2) return String.fromCharCode(Number.parseInt(x2, 16));
      if (single === undefined) return ''; // line continuation
      const simple: Record<string, string> = {n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', 0: '\0'};
      return simple[single] || single;
    },
  );
}

function skipSqlMapCalls(sourceText: string, start: number, end: number, location: string): number {
  let cursor = start;
  while (cursor < end && sourceText[cursor] === '.') {
    const method = readIdentifier(sourceText, skipTrivia(sourceText, cursor + 1), `${location} sql tag method`);
    if (method.value !== 'map') {
      return cursor;
    }
    cursor = skipTrivia(sourceText, method.end);
    if (sourceText[cursor] !== '(') {
      throw new Error(`${location} sql.map must be called with a mapper function.`);
    }
    cursor = skipTrivia(sourceText, findMatchingDelimiter(sourceText, cursor, '(', ')') + 1);
  }
  return cursor;
}

function readIdentifier(sourceText: string, start: number, location: string): {value: string; end: number} {
  if (!isIdentifierStart(sourceText[start] || '')) {
    throw new Error(`${location} must use an identifier.`);
  }
  let end = start + 1;
  while (isIdentifierPart(sourceText[end] || '')) {
    end += 1;
  }
  return {value: sourceText.slice(start, end), end};
}

function isQueryResultModeTag(value: string): value is QueryResultMode | 'run' {
  return value === 'many' || value === 'nullableOne' || value === 'one' || value === 'metadata' || value === 'run';
}

function readStringInitializer(sourceText: string, span: SourceSpan, location: string): string {
  const start = skipTrivia(sourceText, span.start);
  const quote = sourceText[start];
  if (quote !== "'" && quote !== '"' && quote !== '`') {
    throw new Error(`${location} must be a string literal.`);
  }
  const end = quote === '`' ? findTemplateEnd(sourceText, start, location) : findStringEnd(sourceText, start, quote);
  const after = skipTrivia(sourceText, end + 1);
  if (after < span.end) {
    throw new Error(`${location} must be a string literal.`);
  }
  return sourceText.slice(start + 1, end);
}

type ParsedObjectProperties = {
  properties: PropertySpan[];
  /** Object elements the scanner can't model: spreads, shorthand, methods, computed keys. */
  unsupported: string[];
};

function parseObjectProperties(
  sourceText: string,
  objectStart: number,
  objectEnd: number,
  modulePath: string,
): ParsedObjectProperties {
  const properties: PropertySpan[] = [];
  const unsupported: string[] = [];
  let cursor = objectStart + 1;
  while (cursor < objectEnd) {
    cursor = skipTriviaAndCommas(sourceText, cursor);
    if (cursor >= objectEnd) break;

    const name = tryReadPropertyName(sourceText, cursor);
    const colonIndex = name && skipTrivia(sourceText, name.end);
    if (!name || sourceText[colonIndex!] !== ':') {
      // Not a plain `name: value` assignment. Skip the whole element so config
      // probing degrades gracefully — confirmed-inline callers reject these
      // via assertPlainProperties below.
      unsupported.push(describeObjectElement(sourceText, cursor));
      cursor = findTopLevelValueEnd(sourceText, cursor, objectEnd) + 1;
      continue;
    }
    const valueStart = colonIndex! + 1;
    const valueEnd = findTopLevelValueEnd(sourceText, valueStart, objectEnd);
    properties.push({
      name: name.value,
      nameStart: colonIndex!,
      start: valueStart,
      end: valueEnd,
    });
    cursor = valueEnd + 1;
  }
  Object.defineProperty(properties, sourceTextSymbol, {value: sourceText});
  return {properties, unsupported};
}

function assertPlainProperties(parsed: ParsedObjectProperties, location: string): PropertySpan[] {
  if (parsed.unsupported.length > 0) {
    throw new Error(
      `${location} only supports plain property assignments; found: ${parsed.unsupported.join(', ')}.`,
    );
  }
  return parsed.properties;
}

function describeObjectElement(sourceText: string, start: number): string {
  const lineEnd = sourceText.indexOf('\n', start);
  const snippet = sourceText.slice(start, lineEnd === -1 ? start + 30 : Math.min(lineEnd, start + 30)).trim();
  return JSON.stringify(snippet);
}

function parseArrayElements(sourceText: string, array: SourceSpan): SourceSpan[] {
  const elements: SourceSpan[] = [];
  let cursor = array.start + 1;
  while (cursor < array.end) {
    cursor = skipTriviaAndCommas(sourceText, cursor);
    if (cursor >= array.end) break;
    const end = findTopLevelValueEnd(sourceText, cursor, array.end);
    elements.push({start: cursor, end});
    cursor = end + 1;
  }
  return elements;
}

function tryReadPropertyName(sourceText: string, start: number): {value: string; end: number} | null {
  const quote = sourceText[start];
  if (quote === "'" || quote === '"' || quote === '`') {
    const end =
      quote === '`' ? findTemplateEnd(sourceText, start, 'object property name') : findStringEnd(sourceText, start, quote);
    return {value: sourceText.slice(start + 1, end), end: end + 1};
  }
  if (!isIdentifierStart(sourceText[start] || '')) {
    return null;
  }
  let end = start + 1;
  while (isIdentifierPart(sourceText[end] || '')) {
    end += 1;
  }
  return {value: sourceText.slice(start, end), end};
}

function findTopLevelValueEnd(sourceText: string, start: number, limit: number): number {
  let cursor = start;
  while (cursor < limit) {
    const char = sourceText[cursor];
    if (char === ',' || char === '}' || char === ']') {
      return cursor;
    }
    if (char === '{') {
      cursor = findMatchingDelimiter(sourceText, cursor, '{', '}') + 1;
      continue;
    }
    if (char === '[') {
      cursor = findMatchingDelimiter(sourceText, cursor, '[', ']') + 1;
      continue;
    }
    if (char === '(') {
      cursor = findMatchingDelimiter(sourceText, cursor, '(', ')') + 1;
      continue;
    }
    cursor = skipSourceElement(sourceText, cursor);
  }
  return limit;
}

function findMatchingDelimiter(sourceText: string, openIndex: number, open: string, close: string): number {
  let depth = 0;
  let cursor = openIndex;
  while (cursor < sourceText.length) {
    const char = sourceText[cursor];
    if (char === open) {
      depth += 1;
      cursor += 1;
      continue;
    }
    if (char === close) {
      depth -= 1;
      if (depth === 0) return cursor;
      cursor += 1;
      continue;
    }
    cursor = skipSourceElement(sourceText, cursor);
  }
  throw new Error(`Unbalanced ${open}${close} in inline defineConfig(...) source.`);
}

function findMatchingAngle(sourceText: string, openIndex: number): number {
  let depth = 0;
  let cursor = openIndex;
  while (cursor < sourceText.length) {
    const char = sourceText[cursor];
    if (char === '=' && sourceText[cursor + 1] === '>') {
      // The `>` of an arrow function type (e.g. `render: () => string`) is not
      // an angle-bracket closer.
      cursor += 2;
      continue;
    }
    if (char === '<') {
      depth += 1;
      cursor += 1;
      continue;
    }
    if (char === '>') {
      depth -= 1;
      if (depth === 0) return cursor;
      cursor += 1;
      continue;
    }
    cursor = skipSourceElement(sourceText, cursor);
  }
  throw new Error('Unbalanced sql<...> type argument in inline defineConfig(...) source.');
}

type SourceDepth = {
  braces: number;
  brackets: number;
  parens: number;
};

function forEachCodeIndexWithDepth(sourceText: string, callback: (index: number, depth: SourceDepth) => void): void {
  let cursor = 0;
  const depth = {braces: 0, brackets: 0, parens: 0};
  while (cursor < sourceText.length) {
    callback(cursor, depth);
    const skipped = skipSourceElement(sourceText, cursor);
    if (skipped !== cursor + 1) {
      cursor = skipped;
      continue;
    }
    const char = sourceText[cursor];
    if (char === '{') depth.braces += 1;
    if (char === '}') depth.braces -= 1;
    if (char === '[') depth.brackets += 1;
    if (char === ']') depth.brackets -= 1;
    if (char === '(') depth.parens += 1;
    if (char === ')') depth.parens -= 1;
    cursor += 1;
  }
}

function skipSourceElement(sourceText: string, index: number): number {
  const char = sourceText[index];
  const next = sourceText[index + 1];
  if (char === '/' && next === '/') return skipLineComment(sourceText, index);
  if (char === '/' && next === '*') return skipBlockComment(sourceText, index);
  if (char === '/') {
    const regexEnd = maybeSkipRegexLiteral(sourceText, index);
    if (regexEnd !== null) return regexEnd;
  }
  if (char === "'" || char === '"') return findStringEnd(sourceText, index, char) + 1;
  if (char === '`') return skipTemplateLiteral(sourceText, index);
  return index + 1;
}

/**
 * `/` is ambiguous: division or the start of a regex literal. A regex literal
 * containing a quote, backtick, or brace corrupts the lex if treated as plain
 * characters. Standard lexer heuristic: `/` starts a regex unless the previous
 * significant token could end an expression (identifier, number, `)`, `]`, or
 * a string) — with keywords like `return` treated as expression starts.
 * Returns null for division, and also bails to null when no closing `/` is
 * found on the same line, so a mis-detection degrades to the old behavior
 * instead of swallowing the rest of the file.
 */
function maybeSkipRegexLiteral(sourceText: string, index: number): number | null {
  if (!isRegexAllowedAt(sourceText, index)) return null;
  let cursor = index + 1;
  let inCharacterClass = false;
  while (cursor < sourceText.length) {
    const char = sourceText[cursor];
    if (char === '\\') {
      cursor += 2;
      continue;
    }
    if (char === '\n') return null;
    if (char === '[') inCharacterClass = true;
    else if (char === ']') inCharacterClass = false;
    else if (char === '/' && !inCharacterClass) {
      cursor += 1;
      while (isIdentifierPart(sourceText[cursor] || '')) cursor += 1;
      return cursor;
    }
    cursor += 1;
  }
  return null;
}

const regexPrecedingKeywords = new Set([
  'await',
  'case',
  'delete',
  'do',
  'else',
  'in',
  'instanceof',
  'new',
  'of',
  'return',
  'throw',
  'typeof',
  'void',
  'yield',
]);

function isRegexAllowedAt(sourceText: string, index: number): boolean {
  let cursor = index - 1;
  while (cursor >= 0 && /\s/u.test(sourceText[cursor] || '')) cursor -= 1;
  if (cursor < 0) return true;
  const char = sourceText[cursor] || '';
  if (char === ')' || char === ']' || char === "'" || char === '"' || char === '`') return false;
  if (!isIdentifierPart(char)) return true;
  let wordStart = cursor;
  while (wordStart > 0 && isIdentifierPart(sourceText[wordStart - 1] || '')) wordStart -= 1;
  return regexPrecedingKeywords.has(sourceText.slice(wordStart, cursor + 1));
}

function skipTrivia(sourceText: string, index: number): number {
  let cursor = index;
  while (cursor < sourceText.length) {
    const char = sourceText[cursor];
    const next = sourceText[cursor + 1];
    if (/\s/u.test(char || '')) {
      cursor += 1;
      continue;
    }
    if (char === '/' && next === '/') {
      cursor = skipLineComment(sourceText, cursor);
      continue;
    }
    if (char === '/' && next === '*') {
      cursor = skipBlockComment(sourceText, cursor);
      continue;
    }
    return cursor;
  }
  return cursor;
}

function skipTriviaAndCommas(sourceText: string, index: number): number {
  let cursor = index;
  while (cursor < sourceText.length) {
    const next = skipTrivia(sourceText, cursor);
    if (sourceText[next] !== ',') return next;
    cursor = next + 1;
  }
  return cursor;
}

function skipLineComment(sourceText: string, index: number): number {
  const end = sourceText.indexOf('\n', index + 2);
  return end === -1 ? sourceText.length : end + 1;
}

function skipBlockComment(sourceText: string, index: number): number {
  const end = sourceText.indexOf('*/', index + 2);
  if (end === -1) {
    throw new Error('Unclosed block comment in inline defineConfig(...) source.');
  }
  return end + 2;
}

function findStringEnd(sourceText: string, start: number, quote: string): number {
  let cursor = start + 1;
  while (cursor < sourceText.length) {
    const char = sourceText[cursor];
    if (char === '\\') {
      cursor += 2;
      continue;
    }
    if (char === quote) return cursor;
    cursor += 1;
  }
  throw new Error('Unclosed string literal in inline defineConfig(...) source.');
}

function findTemplateEnd(sourceText: string, start: number, location: string): number {
  let cursor = start + 1;
  while (cursor < sourceText.length) {
    const char = sourceText[cursor];
    if (char === '\\') {
      cursor += 2;
      continue;
    }
    if (char === '$' && sourceText[cursor + 1] === '{') {
      throw new Error(`${location} cannot use template interpolations.`);
    }
    if (char === '`') return cursor;
    cursor += 1;
  }
  throw new Error(`Unclosed template literal in ${location}.`);
}

function skipTemplateLiteral(sourceText: string, start: number): number {
  let cursor = start + 1;
  while (cursor < sourceText.length) {
    const char = sourceText[cursor];
    if (char === '\\') {
      cursor += 2;
      continue;
    }
    if (char === '$' && sourceText[cursor + 1] === '{') {
      cursor = findMatchingDelimiter(sourceText, cursor + 1, '{', '}') + 1;
      continue;
    }
    if (char === '`') return cursor + 1;
    cursor += 1;
  }
  throw new Error('Unclosed template literal in inline defineConfig(...) source.');
}

function startsWithIdentifier(sourceText: string, index: number, identifier: string): boolean {
  return sourceText.slice(index, index + identifier.length) === identifier;
}

function isIdentifierStart(value: string): boolean {
  return /[A-Za-z_$]/u.test(value);
}

function isIdentifierPart(value: string): boolean {
  return /[A-Za-z0-9_$]/u.test(value);
}

function applyReplacements(sourceText: string, replacements: {start: number; end: number; text: string}[]): string {
  return replacements
    .slice()
    .sort((left, right) => right.start - left.start)
    .reduce(
      (current, replacement) =>
        `${current.slice(0, replacement.start)}${replacement.text}${current.slice(replacement.end)}`,
      sourceText,
    );
}

function lineIndentAt(sourceText: string, index: number): string {
  const lineStart = sourceText.lastIndexOf('\n', index - 1) + 1;
  return sourceText.slice(lineStart, index).match(/^[ \t]*/)?.[0] || '';
}

function lineStartIndex(sourceText: string, index: number): number {
  return sourceText.lastIndexOf('\n', index - 1) + 1;
}


type InlineSourceStyle = {
  indent: string;
  quote: '"' | "'";
  trailingComma: boolean;
};

function inferInlineSourceStyle(sourceText: string): InlineSourceStyle {
  const indent = sourceText
    .split('\n')
    .map((line) => line.match(/^[ \t]+/u)?.[0])
    .find(Boolean);
  const quote = sourceText.match(/['"]/u)?.[0] as `"` | `'`;
  return {
    indent: indent || '  ',
    quote: (quote || `'`) as InlineSourceStyle['quote'],
    trailingComma: /,\s*[}\]]/u.test(sourceText),
  };
}

function renderInlineMigrationObject(
  indent: string,
  migration: {name: string; content: string},
  style: InlineSourceStyle,
): string {
  const content = migration.content.trim();
  const propertyIndent = `${indent}${style.indent}`;
  const bodyIndent = `${propertyIndent}${style.indent}`;
  const body = content
    .split('\n')
    .map((line) => `${bodyIndent}${escapeTemplateLiteral(line.trimEnd())}`)
    .join('\n');
  return `${indent}{\n${propertyIndent}name: ${quotedString(migration.name, style.quote)},\n${propertyIndent}content: sql\`\n${body}\n${propertyIndent}\`${style.trailingComma ? ',' : ''}\n${indent}}`;
}

function quotedString(value: string, quote: '"' | "'"): string {
  return `${quote}${value.replaceAll('\\', '\\\\').replaceAll(quote, `\\${quote}`)}${quote}`;
}

function escapeTemplateLiteral(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
}

const sourceTextSymbol = Symbol('sourceText');

function sourceTextFor(properties: PropertySpan[]): string {
  return (properties as unknown as {[sourceTextSymbol]: string})[sourceTextSymbol];
}
