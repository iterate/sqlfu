import {unified} from 'unified';
import remarkParse from 'remark-parse';
import {createHighlighter} from 'shiki';
import batteriesSource from './batteries.md?raw';
import draftSource from './draft.md?raw';
import generateSource from './generate.md?raw';
import runtimeSource from './runtime.md?raw';

type Artifact = {
  caption: string;
  html: string;
};

type ParsedLine = {
  text: string;
  annotations: Record<string, string | true>;
};

const theme = 'github-dark-default';
const highlighterPromise = createHighlighter({
  themes: [theme],
  langs: ['sql', 'ts'],
});
const beatCache = new Map<string, Promise<Map<string, Artifact>>>();
const sources: Record<string, string> = {
  batteries: batteriesSource,
  draft: draftSource,
  generate: generateSource,
  runtime: runtimeSource,
};

export async function renderDemo(beat: string, artifact: string) {
  const artifacts = await loadBeat(beat);
  const match = artifacts.get(artifact);
  if (!match) {
    throw new Error(`Unknown landing demo artifact ${beat}/${artifact}`);
  }
  return match;
}

async function loadBeat(beat: string) {
  const cached = beatCache.get(beat);
  if (cached) return cached;

  const loaded = readBeat(beat);
  beatCache.set(beat, loaded);
  return loaded;
}

async function readBeat(beat: string) {
  const source = sources[beat];
  if (!source) {
    throw new Error(`Unknown landing demo beat ${beat}`);
  }
  const tree = unified().use(remarkParse).parse(source);
  const artifacts = new Map<string, Artifact>();
  let caption = '';

  for (const node of tree.children as any[]) {
    if (node.type === 'heading') {
      caption = headingText(node);
      continue;
    }
    if (node.type !== 'code') continue;

    const meta = parseAnnotations(node.meta || '');
    const key = String(meta.artifact || slug(caption));
    artifacts.set(key, {
      caption,
      html: await renderCodeBlock(String(node.lang || 'text'), String(node.value), meta),
    });
  }

  return artifacts;
}

function headingText(node: any) {
  return (node.children || [])
    .map((child: any) => child.value || '')
    .join('')
    .trim();
}

async function renderCodeBlock(lang: string, source: string, meta: Record<string, string | true>) {
  if (lang === 'term' || lang === 'term-output') {
    return `<pre><code>${renderTerminal(source)}</code></pre>`;
  }

  const lines = splitAnnotatedLines(source);
  const renderedLines = await renderHighlightedLines(lang, lines);
  const blockSpeed = typeof meta.speed === 'string' ? meta.speed : '';
  const hasLineRegions = lines.some((line) =>
    ['speed', 'diff-add', 'reveal-pause', 'reveal-line', 'pop-after-typing'].some((key) =>
      Object.prototype.hasOwnProperty.call(line.annotations, key),
    ),
  );

  if (blockSpeed && hasLineRegions) {
    return `<pre><code>${renderAnimatedRegions(renderedLines, lines, blockSpeed)}</code></pre>`;
  }

  const attrs = blockSpeed ? ` data-type-speed="${escapeAttribute(blockSpeed)}"` : '';
  return `<pre><code${attrs}>${renderedLines.map((line, index) => renderLine(line, lines[index].annotations)).join('\n')}</code></pre>`;
}

async function renderHighlightedLines(lang: string, lines: ParsedLine[]) {
  const highlighter = await highlighterPromise;
  const shikiLang = lang === 'typescript' ? 'ts' : lang;
  const source = lines.map((line) => (shikiLang === 'sql' ? maskSqlParams(line.text) : line.text)).join('\n');
  const tokens = highlighter.codeToTokens(source, {
    lang: shikiLang,
    theme,
    includeExplanation: true,
  }).tokens;

  return tokens.map((lineTokens: any[]) => lineTokens.map((token) => renderToken(token, shikiLang)).join(''));
}

function renderAnimatedRegions(renderedLines: string[], lines: ParsedLine[], blockSpeed: string) {
  const parts: string[] = [];
  let typingBuffer: string[] = [];

  const flushTyping = () => {
    if (typingBuffer.length === 0) return;
    parts.push(`<span data-type-speed="${escapeAttribute(blockSpeed)}">${typingBuffer.join('\n')}</span>`);
    typingBuffer = [];
  };

  for (let index = 0; index < lines.length; index++) {
    const line = renderLine(renderedLines[index], lines[index].annotations);
    if (lines[index].annotations['pop-after-typing']) {
      flushTyping();
      parts.push(line);
      continue;
    }
    typingBuffer.push(line);
  }

  flushTyping();
  return parts.join('\n');
}

function renderLine(inner: string, annotations: Record<string, string | true>) {
  const attrs = attrsForAnnotations(annotations);
  if (!attrs) return inner;
  return `<span${attrs}>${inner}</span>`;
}

function renderTerminal(source: string) {
  const lines = splitAnnotatedLines(source);
  const parts: string[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const outputGroup = line.annotations['terminal-output'];
    if (typeof outputGroup === 'string' || outputGroup === true) {
      const group = String(outputGroup);
      const grouped: ParsedLine[] = [];
      while (index < lines.length) {
        const candidate = lines[index];
        if (String(candidate.annotations['terminal-output']) !== group) break;
        grouped.push(candidate);
        index++;
      }
      index--;
      parts.push(renderTerminalOutput(grouped));
      continue;
    }

    const rendered = renderTerminalInline(line.text);
    const attrs = attrsForAnnotations(line.annotations);
    parts.push(attrs ? `<span${attrs}>${rendered}</span>` : rendered);
  }

  return parts.join('\n');
}

function renderTerminalOutput(lines: ParsedLine[]) {
  const [first] = lines;
  const pause = first.annotations['output-pause'];
  const attrs = [
    'class="terminal-output terminal-block"',
    'data-terminal-output',
    typeof pause === 'string' ? `data-output-pause="${escapeAttribute(pause)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inner = lines
    .map((line) => {
      const rendered = renderTerminalInline(line.text);
      const nestedAttrs = attrsForAnnotations(line.annotations, new Set(['terminal-output', 'output-pause']));
      return nestedAttrs ? `<span${nestedAttrs}>${rendered}</span>` : rendered;
    })
    .join('\n');

  return `<span ${attrs}>${inner}</span>`;
}

function renderTerminalInline(text: string) {
  if (text.startsWith('$ ')) {
    return `<span class="term-prompt">$</span> <span class="tok-command">${escapeHtml(text.slice(2))}</span>`;
  }
  return escapeHtml(text);
}

function renderToken(token: any, lang: string) {
  const content = String(token.content || '');
  if (!content) return '';

  if (lang === 'sql' && content.includes('SQLFU_PARAM_')) {
    return renderSqlParamToken(content);
  }

  const className = classForToken(token);
  const escaped = escapeHtml(content);
  return className ? `<span class="${className}">${escaped}</span>` : escaped;
}

function renderSqlParamToken(content: string) {
  const parts = content.split(/(SQLFU_PARAM_[A-Za-z_][A-Za-z0-9_]*)/g);
  return parts
    .map((part) => {
      const match = /^SQLFU_PARAM_([A-Za-z_][A-Za-z0-9_]*)$/.exec(part);
      if (match) return `<span class="tok-param">:${escapeHtml(match[1])}</span>`;
      return escapeHtml(part);
    })
    .join('');
}

function classForToken(token: any) {
  const scopes = (token.explanation || [])
    .flatMap((part: any) => part.scopes || [])
    .map((scope: any) => scope.scopeName || '')
    .join(' ');

  if (scopes.includes('comment')) return 'tok-comment';
  if (scopes.includes('string')) return 'tok-string';
  if (scopes.includes('constant.numeric')) return 'tok-number';
  if (scopes.includes('keyword') || scopes.includes('storage.')) return 'tok-keyword';
  if (scopes.includes('variable.other.property')) return 'tok-prop';
  if (scopes.includes('entity.name') || scopes.includes('variable.')) return 'tok-name';
  return '';
}

function splitAnnotatedLines(source: string) {
  return source.split('\n').map((line) => {
    const parsed = parseLineAnnotation(line);
    return parsed;
  });
}

function parseLineAnnotation(line: string): ParsedLine {
  const match =
    /^(.*?)(?:\s+\{([A-Za-z0-9_.:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s{}]+))?(?:\s+[A-Za-z0-9_.:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s{}]+))?)*)\})$/.exec(
      line,
    );
  if (!match) return {text: line, annotations: {}};

  const annotations = parseAnnotations(match[2]);
  return {text: match[1], annotations};
}

function parseAnnotations(source: string) {
  const annotations: Record<string, string | true> = {};
  for (const token of source.split(/\s+/).filter(Boolean)) {
    const [key, ...valueParts] = token.split('=');
    if (valueParts.length === 0) {
      annotations[key] = true;
      continue;
    }
    annotations[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
  }
  return annotations;
}

function attrsForAnnotations(annotations: Record<string, string | true>, skip = new Set<string>()) {
  const attrs: string[] = [];
  const classes: string[] = [];

  if (annotations['diff-add'] && !skip.has('diff-add')) {
    classes.push('diff-line', 'diff-added');
  }
  if (annotations['generated-type-hint'] && !skip.has('generated-type-hint')) {
    classes.push('generated-type-hint');
  }
  if (annotations.speed && !skip.has('speed')) {
    attrs.push(`data-type-speed="${escapeAttribute(String(annotations.speed))}"`);
  }
  if ((annotations['reveal-line'] || annotations['reveal-pause']) && !skip.has('reveal-line')) {
    attrs.push('data-reveal-line');
  }
  if (annotations['reveal-pause'] && !skip.has('reveal-pause')) {
    attrs.push(`data-reveal-pause="${escapeAttribute(String(annotations['reveal-pause']))}"`);
  }
  if (annotations['hide-typing-whitespace'] && !skip.has('hide-typing-whitespace')) {
    attrs.push('data-hide-typing-whitespace');
  }
  if (annotations['run-command'] && !skip.has('run-command')) {
    attrs.push('data-run-command="true"');
  }
  if (annotations['pop-after-typing'] && !skip.has('pop-after-typing')) {
    attrs.push('data-pop-after-typing');
  }
  if (annotations['pop-pause'] && !skip.has('pop-pause')) {
    attrs.push(`data-pop-pause="${escapeAttribute(String(annotations['pop-pause']))}"`);
  }
  if (annotations['dismiss-before-next'] && !skip.has('dismiss-before-next')) {
    attrs.push('data-dismiss-before-next');
  }
  if (annotations['corner-before-next'] && !skip.has('corner-before-next')) {
    attrs.push('data-corner-before-next');
  }
  if (annotations['corner-after-next'] && !skip.has('corner-after-next')) {
    attrs.push('data-corner-after-next');
  }

  if (classes.length > 0) attrs.unshift(`class="${classes.join(' ')}"`);
  return attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
}

function maskSqlParams(source: string) {
  return source.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, 'SQLFU_PARAM_$1');
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
