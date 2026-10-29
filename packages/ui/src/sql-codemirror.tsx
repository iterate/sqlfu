import {SQLite, keywordCompletionSource, schemaCompletionSource, sql} from '@codemirror/lang-sql';
import type {SQLNamespace} from '@codemirror/lang-sql';
import {javascript} from '@codemirror/lang-javascript';
import {yaml} from '@codemirror/lang-yaml';
import {EditorState, type Extension, Prec} from '@codemirror/state';
import {lintGutter, linter} from '@codemirror/lint';
import {EditorView, keymap} from '@codemirror/view';
import {acceptCompletion, autocompletion} from '@codemirror/autocomplete';
import type {Completion, CompletionContext, CompletionResult, CompletionSource} from '@codemirror/autocomplete';
import CodeMirror from '@uiw/react-codemirror';
import CodeMirrorMerge from 'react-codemirror-merge';
import type {ReactNode} from 'react';

import {Dialog, DialogContent, DialogTitle, DialogTrigger} from './components/ui/dialog.js';
import type {SqlEditorDiagnostic, StudioRelation} from './shared.js';
import {useResolvedTheme} from './theme.js';

const FULLSCREEN_HEIGHT = '78vh';

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;
const appCodeMirrorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--code-bg)',
    color: 'var(--text)',
  },
  '&.cm-focused': {
    outline: '1px solid var(--accent-border-mid)',
  },
  '.cm-scroller': {
    backgroundColor: 'var(--code-bg)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--code-gutter-bg)',
    color: 'var(--muted)',
    borderRight: '1px solid var(--line)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--code-active-line-bg)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--code-active-line-bg)',
    color: 'var(--text)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--accent-strong)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--code-selection-bg)',
  },
  '.cm-tooltip': {
    border: '1px solid var(--line)',
    borderRadius: '0.35rem',
    backgroundColor: 'var(--code-tooltip-bg)',
    color: 'var(--text)',
    boxShadow: 'var(--shadow)',
  },
  '.cm-tooltip-autocomplete, .cm-tooltip-autocomplete > ul': {
    backgroundColor: 'var(--code-tooltip-bg)',
    color: 'var(--text)',
  },
  '.cm-tooltip-autocomplete > ul': {
    fontFamily: "'IBM Plex Mono', 'SFMono-Regular', 'Menlo', monospace",
  },
  '.cm-tooltip-autocomplete ul li': {
    backgroundColor: 'transparent',
    color: 'var(--text)',
  },
  '.cm-tooltip-autocomplete ul li:hover': {
    backgroundColor: 'var(--code-tooltip-hover-bg)',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'var(--code-tooltip-selected-bg)',
    color: 'var(--code-tooltip-selected-text)',
  },
  '.cm-completionMatchedText': {
    color: 'var(--accent-strong)',
    textDecoration: 'none',
  },
  '.cm-completionIcon': {
    color: 'var(--muted)',
    opacity: '1',
  },
});

export type CodeMirrorAction = {
  icon: ReactNode;
  name: string;
  onAction: () => void | Promise<void>;
  disabled?: boolean;
  title?: string;
};

type SqlCodeMirrorProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  relations: StudioRelation[];
  diagnostics?: SqlEditorDiagnostic[];
  onExecute?: (sql: string) => void;
  onSave?: (sql: string) => void;
  readOnly?: boolean;
  height?: string;
  actions?: CodeMirrorAction[];
};

function SqlCodeMirrorBase(input: SqlCodeMirrorProps) {
  const theme = useResolvedTheme();
  const schema = buildSqlSchema(input.relations);
  const completionSource = buildSqlCompletionSource(input.relations, schema);
  const executeKeymapHandler = (view: EditorView) => {
    input.onExecute?.(view.state.doc.toString());
    return true;
  };
  const saveKeymapHandler = (view: EditorView) => {
    if (!input.onSave) return false;
    input.onSave(view.state.doc.toString());
    return true;
  };
  const extensions: Extension[] = [
    sql({
      dialect: SQLite,
      schema,
    }),
    autocompletion({
      interactionDelay: 0,
      override: [completionSource],
    }),
    linter(() =>
      (input.diagnostics ?? []).map((diagnostic) => ({
        from: diagnostic.from,
        to: diagnostic.to,
        message: diagnostic.message,
        severity: 'error' as const,
      })),
    ),
    lintGutter(),
    EditorView.lineWrapping,
    EditorState.readOnly.of(Boolean(input.readOnly)),
    EditorView.editable.of(!input.readOnly),
    appCodeMirrorTheme,
    Prec.highest(
      keymap.of([
        {
          key: 'Mod-Enter',
          run: executeKeymapHandler,
        },
        {
          key: 'Mod-s',
          run: saveKeymapHandler,
          preventDefault: true,
        },
        {
          key: 'Tab',
          run: (view) => acceptCompletion(view),
        },
      ]),
    ),
  ];

  return (
    <CodeMirror
      value={input.value}
      height={input.height ?? '16rem'}
      aria-label={input.ariaLabel}
      theme={theme}
      extensions={extensions}
      basicSetup={{
        foldGutter: false,
      }}
      onChange={input.onChange}
    />
  );
}

export function SqlCodeMirror(input: SqlCodeMirrorProps) {
  return (
    <FullscreenAffordance
      title={input.ariaLabel}
      inline={<SqlCodeMirrorBase {...input} />}
      fullscreen={<SqlCodeMirrorBase {...input} height={FULLSCREEN_HEIGHT} />}
      actions={input.actions}
    />
  );
}

type TextCodeMirrorProps = {
  value: string;
  ariaLabel: string;
  readOnly?: boolean;
  height?: string;
  language?: 'plain' | 'yaml' | 'markdown' | 'typescript';
  onChange?: (value: string) => void;
  actions?: CodeMirrorAction[];
};

function TextCodeMirrorBase(input: TextCodeMirrorProps) {
  const theme = useResolvedTheme();
  return (
    <CodeMirror
      value={input.value}
      height={input.height ?? '16rem'}
      aria-label={input.ariaLabel}
      theme={theme}
      extensions={buildTextExtensions(Boolean(input.readOnly), input.language ?? 'plain')}
      basicSetup={{
        foldGutter: false,
      }}
      onChange={(value) => input.onChange?.(value)}
    />
  );
}

export function TextCodeMirror(input: TextCodeMirrorProps) {
  return (
    <FullscreenAffordance
      title={input.ariaLabel}
      inline={<TextCodeMirrorBase {...input} />}
      fullscreen={<TextCodeMirrorBase {...input} height={FULLSCREEN_HEIGHT} />}
      actions={input.actions}
    />
  );
}

type TextDiffCodeMirrorProps = {original: string; draft: string; ariaLabel: string; actions?: CodeMirrorAction[]};

function TextDiffCodeMirrorBase(input: TextDiffCodeMirrorProps & {height?: string}) {
  const theme = useResolvedTheme();
  return (
    <div
      aria-label={input.ariaLabel}
      className="text-diff-editor-host"
      style={input.height ? {height: input.height} : undefined}
    >
      <CodeMirrorMerge
        orientation="a-b"
        theme={theme}
        className="text-diff-editor"
        collapseUnchanged={{
          margin: 1,
          minSize: 4,
        }}
      >
        <Original value={input.original} extensions={buildTextExtensions(true, 'plain')} />
        <Modified value={input.draft} extensions={buildTextExtensions(true, 'plain')} />
      </CodeMirrorMerge>
    </div>
  );
}

export function TextDiffCodeMirror(input: TextDiffCodeMirrorProps) {
  return (
    <FullscreenAffordance
      title={input.ariaLabel}
      inline={<TextDiffCodeMirrorBase {...input} />}
      fullscreen={<TextDiffCodeMirrorBase {...input} height={FULLSCREEN_HEIGHT} />}
      actions={input.actions}
    />
  );
}

function FullscreenAffordance(props: {
  title: string;
  inline: ReactNode;
  fullscreen: ReactNode;
  actions?: CodeMirrorAction[];
}) {
  return (
    <div className="cm-host">
      {props.inline}
      <Dialog>
        <EditorActions title={props.title} actions={props.actions} includeFullscreen />
        <DialogContent className="cm-fullscreen-dialog">
          <DialogTitle className="cm-fullscreen-dialog-title">{props.title}</DialogTitle>
          <div className="cm-host">
            {props.fullscreen}
            <EditorActions title={props.title} actions={props.actions} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditorActions(props: {title: string; actions?: CodeMirrorAction[]; includeFullscreen?: boolean}) {
  if (!props.includeFullscreen && (!props.actions || props.actions.length === 0)) {
    return null;
  }

  return (
    <div className="cm-actions">
      {props.actions?.map((action) => (
        <button
          key={action.name}
          type="button"
          className="cm-action-button"
          aria-label={action.name}
          title={action.title || action.name}
          disabled={action.disabled}
          onClick={action.onAction}
        >
          {action.icon}
        </button>
      ))}
      {props.includeFullscreen ? (
        <DialogTrigger asChild>
          <button
            type="button"
            className="cm-action-button"
            aria-label="Open editor fullscreen"
            aria-description={props.title}
            title={`Open ${props.title} fullscreen`}
          >
            <FullscreenIcon />
          </button>
        </DialogTrigger>
      ) : null}
    </div>
  );
}

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path d="M3 6V3h3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M13 10v3h-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 13H3v-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 3h3v3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function buildSqlSchema(relations: StudioRelation[]): SQLNamespace {
  return Object.fromEntries(
    relations.map((relation) => [
      relation.name,
      relation.columns.map((column) => ({
        label: column.name,
        type: 'property' as const,
        detail: column.type || 'untyped',
      })),
    ]),
  );
}

function buildSqlCompletionSource(relations: StudioRelation[], schema: SQLNamespace): CompletionSource {
  const schemaSource = schemaCompletionSource({dialect: SQLite, schema});
  const keywordSource = keywordCompletionSource(SQLite);
  const relationByName = new Map(relations.map((relation) => [relation.name, relation]));

  return (context) => {
    const schemaResult = schemaSource(context) as CompletionResult | null;
    const keywordResult = keywordSource(context) as CompletionResult | null;
    if (!schemaResult && !keywordResult) {
      return null;
    }

    const relevantCompletions = buildRelevantSqlCompletions(context, relationByName);
    const shadowedLabels = new Set(relevantCompletions.map((completion) => completion.label));
    const options = [
      ...relevantCompletions,
      ...withoutShadowedLabels(schemaResult?.options || [], shadowedLabels),
      ...withoutShadowedLabels(keywordResult?.options || [], shadowedLabels),
    ];

    let from = context.pos;
    let to: number | undefined;
    let validFor: CompletionResult['validFor'] = /^\w*$/u;
    if (schemaResult) {
      from = schemaResult.from;
      to = schemaResult.to;
      validFor = schemaResult.validFor || validFor;
    } else if (keywordResult) {
      from = keywordResult.from;
      to = keywordResult.to;
      validFor = keywordResult.validFor || validFor;
    }

    return {from, to, options, validFor};
  };
}

function buildRelevantSqlCompletions(
  context: CompletionContext,
  relationByName: Map<string, StudioRelation>,
): Completion[] {
  if (isCompletingQualifiedName(context)) {
    return [];
  }

  const doc = context.state.doc.toString();
  const tree = SQLite.language.parser.parse(doc);
  const statement = findSqlStatement(tree.resolveInner(context.pos, -1));
  if (!statement || isCompletingSqlRelationName(statement, doc, context.pos)) {
    return [];
  }

  const references = findSqlRelationReferences(statement, doc, relationByName);
  const seenColumnLabels = new Set<string>();
  const seenRelationLabels = new Set<string>();
  const columns: Completion[] = [];
  const referencedRelations: Completion[] = [];

  for (const reference of references) {
    if (!seenRelationLabels.has(reference.label)) {
      seenRelationLabels.add(reference.label);
      referencedRelations.push({
        label: reference.label,
        type: reference.alias ? 'constant' : 'type',
        detail: reference.alias ? reference.relation.name : undefined,
        boost: 49 - referencedRelations.length,
      });
    }

    for (const column of reference.relation.columns) {
      if (seenColumnLabels.has(column.name)) {
        continue;
      }
      seenColumnLabels.add(column.name);
      columns.push({
        label: column.name,
        type: 'property',
        detail: `${reference.relation.name} · ${column.type || 'untyped'}`,
        boost: 99 - columns.length,
      });
    }
  }

  return [...columns, ...referencedRelations];
}

function findSqlStatement(node: SqlSyntaxNode | null): SqlSyntaxNode | null {
  for (let current = node; current; current = current.parent) {
    if (current.name === 'Statement') {
      return current;
    }
  }
  return null;
}

function findSqlRelationReferences(
  statement: SqlSyntaxNode,
  doc: string,
  relationByName: Map<string, StudioRelation>,
): SqlRelationReference[] {
  const references: SqlRelationReference[] = [];
  let pending: PendingSqlRelationReference | null = null;
  let expectsRelation = false;

  const flushPending = () => {
    if (!pending) {
      return;
    }
    references.push({
      label: pending.relation.name,
      relation: pending.relation,
      alias: false,
    });
    pending = null;
  };

  for (let node = statement.firstChild; node; node = node.nextSibling) {
    const keyword = sqlKeyword(doc, node);
    if (keyword && sqlRelationStartKeywords.has(keyword)) {
      flushPending();
      expectsRelation = true;
      continue;
    }
    if (keyword && sqlRelationEndKeywords.has(keyword)) {
      flushPending();
      expectsRelation = false;
      continue;
    }
    if (!expectsRelation) {
      continue;
    }
    if (isSqlComma(doc, node)) {
      flushPending();
      expectsRelation = true;
      continue;
    }
    if (keyword === 'as') {
      continue;
    }

    const identifier = sqlIdentifierPath(doc, node).at(-1);
    if (!identifier) {
      continue;
    }

    if (pending) {
      references.push({
        label: identifier,
        relation: pending.relation,
        alias: true,
      });
      pending = null;
      continue;
    }

    const relation = relationByName.get(identifier);
    if (relation) {
      pending = {relation};
    }
  }

  flushPending();
  return references;
}

function isCompletingQualifiedName(context: CompletionContext) {
  const currentWord = context.matchBefore(/\w*/u);
  const from = currentWord ? currentWord.from : context.pos;
  return context.state.sliceDoc(from - 1, from) === '.';
}

function isCompletingSqlRelationName(statement: SqlSyntaxNode, doc: string, pos: number) {
  let inRelationList = false;
  for (let node = statement.firstChild; node && node.from < pos; node = node.nextSibling) {
    const keyword = sqlKeyword(doc, node);
    if (keyword && sqlRelationStartKeywords.has(keyword)) {
      inRelationList = true;
    } else if (keyword && sqlRelationEndKeywords.has(keyword)) {
      inRelationList = false;
    } else if (isSqlComma(doc, node) && inRelationList) {
      inRelationList = true;
    }
  }
  return inRelationList;
}

function withoutShadowedLabels(options: readonly Completion[], shadowedLabels: Set<string>) {
  return options.filter((option) => !shadowedLabels.has(option.label));
}

function sqlKeyword(doc: string, node: SqlSyntaxNode) {
  if (node.name !== 'Keyword') {
    return null;
  }
  return doc.slice(node.from, node.to).toLowerCase();
}

function sqlIdentifierPath(doc: string, node: SqlSyntaxNode): string[] {
  if (node.name === 'CompositeIdentifier') {
    const path: string[] = [];
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (isSqlIdentifier(child)) {
        path.push(sqlIdentifierName(doc, child));
      }
    }
    return path;
  }
  if (isSqlIdentifier(node)) {
    return [sqlIdentifierName(doc, node)];
  }
  return [];
}

function sqlIdentifierName(doc: string, node: SqlSyntaxNode) {
  const text = doc.slice(node.from, node.to);
  const quoted = /^([`'"\[])(.*)([`'"\]])$/u.exec(text);
  return quoted ? quoted[2]! : text;
}

function isSqlIdentifier(node: SqlSyntaxNode) {
  return node.name === 'Identifier' || node.name === 'QuotedIdentifier';
}

function isSqlComma(doc: string, node: SqlSyntaxNode) {
  return node.name === 'Punctuation' && doc.slice(node.from, node.to) === ',';
}

const sqlRelationStartKeywords = new Set(['from', 'join']);
const sqlRelationEndKeywords = new Set([
  'all',
  'distinct',
  'except',
  'fetch',
  'for',
  'group',
  'having',
  'intersect',
  'limit',
  'offset',
  'on',
  'order',
  'union',
  'using',
  'where',
]);

type SqlSyntaxNode = {
  name: string;
  from: number;
  to: number;
  parent: SqlSyntaxNode | null;
  firstChild: SqlSyntaxNode | null;
  nextSibling: SqlSyntaxNode | null;
};

type SqlRelationReference = {
  label: string;
  relation: StudioRelation;
  alias: boolean;
};

type PendingSqlRelationReference = {
  relation: StudioRelation;
};

function buildTextExtensions(readOnly: boolean, language: 'plain' | 'yaml' | 'markdown' | 'typescript'): Extension[] {
  return [
    ...(language === 'yaml' ? [yaml()] : []),
    ...(language === 'typescript' ? [javascript({typescript: true})] : []),
    EditorView.lineWrapping,
    EditorState.readOnly.of(readOnly),
    EditorView.editable.of(!readOnly),
    appCodeMirrorTheme,
  ];
}
