import {SQLite, sql} from '@codemirror/lang-sql';
import type {SQLNamespace} from '@codemirror/lang-sql';
import {javascript} from '@codemirror/lang-javascript';
import {yaml} from '@codemirror/lang-yaml';
import {EditorState, type Extension, Prec} from '@codemirror/state';
import {lintGutter, linter} from '@codemirror/lint';
import {EditorView, keymap} from '@codemirror/view';
import {acceptCompletion, autocompletion} from '@codemirror/autocomplete';
import CodeMirror from '@uiw/react-codemirror';
import CodeMirrorMerge from 'react-codemirror-merge';
import type {ReactNode} from 'react';

import {Dialog, DialogContent, DialogTitle, DialogTrigger} from './components/ui/dialog.js';
import type {SqlEditorDiagnostic, StudioRelation} from './shared.js';
import {useResolvedTheme} from './theme.js';

const FULLSCREEN_HEIGHT = '78vh';

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;

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
};

function SqlCodeMirrorBase(input: SqlCodeMirrorProps) {
  const theme = useResolvedTheme();
  const schema = buildSqlSchema(input.relations);
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
    />
  );
}

type TextDiffCodeMirrorProps = {original: string; draft: string; ariaLabel: string};

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
    />
  );
}

function FullscreenAffordance(props: {title: string; inline: ReactNode; fullscreen: ReactNode}) {
  return (
    <div className="cm-host">
      {props.inline}
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="cm-fullscreen-button"
            aria-label="Open editor fullscreen"
            aria-description={props.title}
            title={`Open ${props.title} fullscreen`}
          >
            <FullscreenIcon />
          </button>
        </DialogTrigger>
        <DialogContent className="cm-fullscreen-dialog">
          <DialogTitle className="cm-fullscreen-dialog-title">{props.title}</DialogTitle>
          {props.fullscreen}
        </DialogContent>
      </Dialog>
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

function buildTextExtensions(readOnly: boolean, language: 'plain' | 'yaml' | 'markdown' | 'typescript'): Extension[] {
  return [
    ...(language === 'yaml' ? [yaml()] : []),
    ...(language === 'typescript' ? [javascript({typescript: true})] : []),
    EditorView.lineWrapping,
    EditorState.readOnly.of(readOnly),
    EditorView.editable.of(!readOnly),
  ];
}
