import fs from 'node:fs/promises';
import path from 'node:path';

import {
  Node,
  Project,
  SyntaxKind,
  type ArrayLiteralExpression,
  type ObjectLiteralExpression,
  type PropertyAssignment,
  type SourceFile,
  type TaggedTemplateExpression,
} from 'ts-morph';

import type {Migration} from '../migrations/index.js';

export type InlineSqlfuSource = {
  modulePath: string;
  sourceText: string;
  definitions: InlineSqlTemplate;
  migrations: InlineMigrationSource[];
  migrationsArray: {
    insertPosition: number;
  };
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

export type InlineQuerySource = {
  name: string;
  content: InlineSqlTemplate;
};

export async function readInlineSqlfuSource(modulePath: string): Promise<InlineSqlfuSource | null> {
  const sourceText = await fs.readFile(modulePath, 'utf8');
  return parseInlineSqlfuSource(modulePath, sourceText);
}

export function parseInlineSqlfuSource(modulePath: string, sourceText: string): InlineSqlfuSource | null {
  const sourceFile = createSourceFile(modulePath, sourceText);
  const inlineCall = findInlineSqlfuCall(sourceFile);
  if (!inlineCall) return null;

  const [definitionArg] = inlineCall.getArguments();
  if (!definitionArg || !Node.isObjectLiteralExpression(definitionArg)) {
    throw new Error(`inlineSqlfu(...) in ${modulePath} must be called with an object literal.`);
  }

  const definitions = readSqlProperty(definitionArg, 'definitions', modulePath);
  const migrationsArray = readArrayProperty(definitionArg, 'migrations', modulePath);
  const queriesObject = readObjectProperty(definitionArg, 'queries', modulePath);

  return {
    modulePath,
    sourceText,
    definitions,
    migrations: readMigrationSources(migrationsArray, modulePath),
    migrationsArray: {
      insertPosition: migrationsArray.getEnd() - 1,
    },
    queries: readQuerySources(queriesObject, modulePath),
  };
}

export async function writeInlineQueryTypes(
  modulePath: string,
  queryTypes: ReadonlyMap<string, string>,
): Promise<void> {
  const inline = await readRequiredInlineSqlfuSource(modulePath);
  const replacements = inline.queries.map((query) => {
    const queryType = queryTypes.get(query.name);
    if (!queryType) {
      throw new Error(`Missing generated inline query type for ${query.name}.`);
    }
    return {
      start: query.content.tagStart,
      end: query.content.templateStart,
      text: `sql<${queryType}>`,
    };
  });
  await fs.writeFile(modulePath, applyReplacements(inline.sourceText, replacements));
}

export async function appendInlineMigration(
  modulePath: string,
  migration: {
    name: string;
    content: string;
  },
): Promise<void> {
  const inline = await readRequiredInlineSqlfuSource(modulePath);
  const insertPosition = inline.migrationsArray.insertPosition;
  const beforeInsert = inline.sourceText.slice(0, insertPosition).trimEnd();
  const closingIndent = lineIndentAt(inline.sourceText, insertPosition);
  const elementIndent = `${closingIndent}  `;
  const prefix = inline.migrations.length === 0 ? '\n' : `${beforeInsert.endsWith(',') ? '' : ','}\n`;
  const insertion = `${prefix}${renderInlineMigrationObject(elementIndent, migration)}\n${closingIndent}`;
  await fs.writeFile(
    modulePath,
    `${beforeInsert}${insertion}${inline.sourceText.slice(insertPosition)}`,
  );
}

export function inlineMigrationsToMigrationFiles(inline: InlineSqlfuSource): Migration[] {
  return inline.migrations.map((migration) => ({
    path: `${migration.name}.sql`,
    content: migration.content.sql,
  }));
}

async function readRequiredInlineSqlfuSource(modulePath: string): Promise<InlineSqlfuSource> {
  const inline = await readInlineSqlfuSource(modulePath);
  if (!inline) {
    throw new Error(`No inlineSqlfu(...) call found in ${modulePath}.`);
  }
  return inline;
}

function createSourceFile(modulePath: string, sourceText: string): SourceFile {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      allowJs: true,
    },
  });
  return project.createSourceFile(modulePath, sourceText);
}

function findInlineSqlfuCall(sourceFile: SourceFile) {
  const calls = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((call) => call.getExpression().getText() === 'inlineSqlfu');
  if (calls.length > 1) {
    throw new Error(`${sourceFile.getFilePath()} contains more than one inlineSqlfu(...) call.`);
  }
  return calls[0] || null;
}

function readSqlProperty(object: ObjectLiteralExpression, name: string, modulePath: string): InlineSqlTemplate {
  return readSqlTemplate(readPropertyAssignment(object, name, modulePath).getInitializer(), `${modulePath} ${name}`);
}

function readArrayProperty(object: ObjectLiteralExpression, name: string, modulePath: string): ArrayLiteralExpression {
  const initializer = readPropertyAssignment(object, name, modulePath).getInitializer();
  if (!initializer || !Node.isArrayLiteralExpression(initializer)) {
    throw new Error(`inlineSqlfu(...) in ${modulePath} must provide "${name}" as an array literal.`);
  }
  return initializer;
}

function readObjectProperty(object: ObjectLiteralExpression, name: string, modulePath: string): ObjectLiteralExpression {
  const initializer = readPropertyAssignment(object, name, modulePath).getInitializer();
  if (!initializer || !Node.isObjectLiteralExpression(initializer)) {
    throw new Error(`inlineSqlfu(...) in ${modulePath} must provide "${name}" as an object literal.`);
  }
  return initializer;
}

function readPropertyAssignment(
  object: ObjectLiteralExpression,
  name: string,
  modulePath: string,
): PropertyAssignment {
  const property = object.getProperty(name);
  if (!property || !Node.isPropertyAssignment(property)) {
    throw new Error(`inlineSqlfu(...) in ${modulePath} must provide a "${name}" property assignment.`);
  }
  return property;
}

function readMigrationSources(array: ArrayLiteralExpression, modulePath: string): InlineMigrationSource[] {
  return array.getElements().map((element, index) => {
    if (!Node.isObjectLiteralExpression(element)) {
      throw new Error(`inlineSqlfu(...) migration ${index} in ${modulePath} must be an object literal.`);
    }
    const name = readStringInitializer(readPropertyAssignment(element, 'name', modulePath), `${modulePath} migration name`);
    const content = readSqlTemplate(
      readPropertyAssignment(element, 'content', modulePath).getInitializer(),
      `${modulePath} migration ${name}`,
    );
    return {name, content};
  });
}

function readQuerySources(object: ObjectLiteralExpression, modulePath: string): InlineQuerySource[] {
  return object.getProperties().map((property) => {
    if (!Node.isPropertyAssignment(property)) {
      throw new Error(`inlineSqlfu(...) queries in ${modulePath} must use property assignments.`);
    }
    const name = propertyNameText(property, `${modulePath} query`);
    const content = readSqlTemplate(property.getInitializer(), `${modulePath} query ${name}`);
    return {name, content};
  });
}

function readSqlTemplate(node: Node | undefined, location: string): InlineSqlTemplate {
  if (!node || !Node.isTaggedTemplateExpression(node)) {
    throw new Error(`${location} must be a sql\`...\` tagged template.`);
  }
  if (node.getTag().getText() !== 'sql') {
    throw new Error(`${location} must use the sql tag.`);
  }
  const template = node.getTemplate();
  if (!Node.isNoSubstitutionTemplateLiteral(template)) {
    throw new Error(`${location} cannot use template interpolations.`);
  }
  return {
    sql: template.getLiteralText().trim(),
    tagStart: node.getTag().getStart(),
    templateStart: template.getStart(),
  };
}

function readStringInitializer(property: PropertyAssignment, location: string): string {
  const initializer = property.getInitializer();
  if (!initializer) {
    throw new Error(`${location} must have an initializer.`);
  }
  if (Node.isStringLiteral(initializer) || Node.isNoSubstitutionTemplateLiteral(initializer)) {
    return initializer.getLiteralText();
  }
  throw new Error(`${location} must be a string literal.`);
}

function propertyNameText(property: PropertyAssignment, location: string): string {
  const name = property.getNameNode();
  if (Node.isIdentifier(name) || Node.isStringLiteral(name) || Node.isNoSubstitutionTemplateLiteral(name)) {
    return name.getText().replace(/^['"`]|['"`]$/g, '');
  }
  throw new Error(`${location} name must be an identifier or string literal.`);
}

function applyReplacements(
  sourceText: string,
  replacements: {start: number; end: number; text: string}[],
): string {
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

function renderInlineMigrationObject(indent: string, migration: {name: string; content: string}): string {
  const content = migration.content.trim();
  if (!content.includes('\n')) {
    return `${indent}{ name: ${singleQuoted(migration.name)}, content: sql\`${escapeTemplateLiteral(content)}\` }`;
  }
  const bodyIndent = `${indent}  `;
  const body = content
    .split('\n')
    .map((line) => `${bodyIndent}${escapeTemplateLiteral(line.trimEnd())}`)
    .join('\n');
  return `${indent}{ name: ${singleQuoted(migration.name)}, content: sql\`\n${body}\n${indent}\` }`;
}

function singleQuoted(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function escapeTemplateLiteral(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
}
