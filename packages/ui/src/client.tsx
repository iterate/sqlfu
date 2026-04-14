import {Suspense, useSyncExternalStore} from 'react';
import type {ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import Form from '@rjsf/core';
import type {RJSFSchema} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';

import type {QueryCatalog, QueryCatalogEntry} from '../../sqlfu/src/typegen/index.ts';
import type {
  QueryExecutionResponse,
  SqlRunnerResponse,
  StudioRelation,
  StudioSchemaResponse,
  TableRowsResponse,
} from './shared.js';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<Shell loading />}>
        <Studio />
      </Suspense>
    </QueryClientProvider>
  );
}

function Studio() {
  const route = useHashRoute();
  const schemaQuery = useSuspenseQuery({
    queryKey: ['schema'],
    queryFn: () => fetchJson<StudioSchemaResponse>('/api/schema'),
  });
  const catalogQuery = useSuspenseQuery({
    queryKey: ['catalog'],
    queryFn: () => fetchJson<QueryCatalog>('/api/catalog'),
  });

  const selectedTable = selectTable(route, schemaQuery.data.relations);
  const selectedQuery = selectQuery(route, catalogQuery.data.queries);

  return (
    <Shell>
      <aside className="sidebar">
        <div className="sidebar-block">
          <div className="eyebrow">Explorer</div>
          <h1>sqlfu/ui</h1>
          <p className="lede">SQLite browsing, ad hoc SQL, and generated query forms from the current `sqlfu` project.</p>
        </div>

        <nav className="sidebar-block">
          <div className="section-title">Tools</div>
          <a className={route.kind === 'sql' ? 'nav-link active' : 'nav-link'} href="#sql">
            SQL runner
          </a>
          {catalogQuery.data.queries.length > 0 ? (
            <a className={route.kind === 'query' ? 'nav-link active' : 'nav-link'} href={`#query/${selectedQuery?.id ?? catalogQuery.data.queries[0]!.id}`}>
              Generated queries
            </a>
          ) : null}
        </nav>

        <nav className="sidebar-block">
          <div className="section-title">Relations</div>
          {schemaQuery.data.relations.map((relation: StudioRelation) => (
            <a
              key={relation.name}
              className={selectedTable?.name === relation.name && route.kind !== 'query' && route.kind !== 'sql' ? 'nav-link active' : 'nav-link'}
              href={`#table/${encodeURIComponent(relation.name)}`}
            >
              <span>{relation.name}</span>
              <small>{relation.kind}</small>
            </a>
          ))}
        </nav>

        <nav className="sidebar-block">
          <div className="section-title">Queries</div>
          {catalogQuery.data.queries.map((query) => (
            <a
              key={query.id}
              className={selectedQuery?.id === query.id ? 'nav-link active' : 'nav-link'}
              href={`#query/${encodeURIComponent(query.id)}`}
            >
              <span>{query.id}</span>
              <small>{query.kind === 'query' ? query.queryType.toLowerCase() : 'error'}</small>
            </a>
          ))}
        </nav>
      </aside>

      <main className="main">
        {route.kind === 'sql' ? (
          <SqlRunnerPanel />
        ) : route.kind === 'query' && selectedQuery ? (
          <QueryPanel entry={selectedQuery} />
        ) : selectedTable ? (
          <TablePanel relation={selectedTable} page={route.kind === 'table' ? route.page : 0} />
        ) : (
          <EmptyState />
        )}
      </main>
    </Shell>
  );
}

function TablePanel(input: {
  relation: StudioRelation;
  page: number;
}) {
  const rowsQuery = useSuspenseQuery({
    queryKey: ['table', input.relation.name, input.page],
    queryFn: () => fetchJson<TableRowsResponse>(`/api/table/${encodeURIComponent(input.relation.name)}?page=${input.page}`),
  });

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">{input.relation.kind}</div>
          <h2>{input.relation.name}</h2>
        </div>
        <div className="pill-row">
          <span className="pill">{input.relation.columns.length} columns</span>
          {typeof input.relation.rowCount === 'number' ? <span className="pill">{input.relation.rowCount} rows</span> : null}
        </div>
      </header>

      <div className="split-grid">
        <section className="card">
          <div className="card-title">Columns</div>
          <div className="column-list">
            {input.relation.columns.map((column) => (
              <div key={column.name} className="column-item">
                <strong>{column.name}</strong>
                <span>{column.type || 'untyped'}</span>
                <small>{column.primaryKey ? 'pk' : column.notNull ? 'not null' : 'nullable'}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-title">Sample rows</div>
          <DataTable columns={rowsQuery.data.columns} rows={rowsQuery.data.rows} />
          <div className="pager">
            <a className={input.page === 0 ? 'button disabled' : 'button'} href={`#table/${encodeURIComponent(input.relation.name)}/${Math.max(0, input.page - 1)}`}>
              Previous
            </a>
            <span>Page {input.page + 1}</span>
            <a className="button" href={`#table/${encodeURIComponent(input.relation.name)}/${input.page + 1}`}>
              Next
            </a>
          </div>
        </section>
      </div>

      {input.relation.sql ? (
        <section className="card">
          <div className="card-title">Definition</div>
          <pre className="code-block">{input.relation.sql}</pre>
        </section>
      ) : null}
    </section>
  );
}

function SqlRunnerPanel() {
  const mutation = useMutation({
    mutationFn: (sql: string) =>
      postJson<SqlRunnerResponse>('/api/sql', {sql}),
  });

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">Tool</div>
          <h2>SQL runner</h2>
        </div>
      </header>

      <section className="card">
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new globalThis.FormData(form);
            mutation.mutate(String(data.get('sql') ?? ''));
          }}
        >
          <textarea
            className="sql-editor"
            name="sql"
            defaultValue={`select name, type\nfrom sqlite_schema\nwhere name not like 'sqlite_%'\norder by type, name;`}
          />
          <div className="actions">
            <button className="button primary" type="submit">
              Run SQL
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-title">Result</div>
        {mutation.isPending ? <p>Running…</p> : null}
        {mutation.error ? <ErrorView error={mutation.error} /> : null}
        {mutation.data ? <ExecutionResult result={mutation.data} /> : <p className="muted">Submit SQL to inspect rows or metadata.</p>}
      </section>
    </section>
  );
}

function QueryPanel(input: {
  entry: QueryCatalogEntry;
}) {
  if (input.entry.kind === 'error') {
    return (
      <section className="panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Generated query</div>
            <h2>{input.entry.id}</h2>
          </div>
        </header>
        <section className="card">
          <div className="card-title">Query error</div>
          <p>{input.entry.error.name}</p>
          <pre className="code-block">{input.entry.error.description}</pre>
        </section>
      </section>
    );
  }

  const mutation = useMutation({
    mutationFn: (body: {data?: unknown; params?: unknown}) =>
      postJson<QueryExecutionResponse>(`/api/query/${encodeURIComponent(input.entry.id)}`, body),
  });

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">{input.entry.queryType.toLowerCase()}</div>
          <h2>{input.entry.id}</h2>
        </div>
        <div className="pill-row">
          <span className="pill">{input.entry.resultMode}</span>
          <span className="pill">{input.entry.sqlFile}</span>
        </div>
      </header>

      <div className="split-grid">
        <section className="card">
          <div className="card-title">SQL</div>
          <pre className="code-block">{input.entry.sql}</pre>
        </section>

        <section className="card">
          <div className="card-title">Run query</div>
          <div className="form-stack">
            {input.entry.dataSchema || input.entry.paramsSchema ? (
              <Form
                schema={buildExecutionSchema(input.entry)}
                validator={validator}
                onSubmit={({formData}) =>
                  mutation.mutate({
                    data: isRecord(formData) && isRecord(formData.data) ? formData.data : undefined,
                    params: isRecord(formData) && isRecord(formData.params) ? formData.params : undefined,
                  })}
              >
                <button className="button primary" type="submit">
                  Run generated query
                </button>
              </Form>
            ) : (
              <button className="button primary" type="button" onClick={() => mutation.mutate({})}>
                Run generated query
              </button>
            )}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-title">Result</div>
        {mutation.isPending ? <p>Running…</p> : null}
        {mutation.error ? <ErrorView error={mutation.error} /> : null}
        {mutation.data ? <ExecutionResult result={mutation.data} /> : <p className="muted">Submit form data to execute the query.</p>}
      </section>
    </section>
  );
}

function ExecutionResult(input: {
  result: QueryExecutionResponse | SqlRunnerResponse;
}) {
  if (input.result.mode === 'metadata') {
    return <pre className="code-block">{JSON.stringify(input.result.metadata, null, 2)}</pre>;
  }

  const rows = input.result.rows ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]!) : [];
  return <DataTable columns={columns} rows={rows} />;
}

function DataTable(input: {
  columns: readonly string[];
  rows: readonly Record<string, unknown>[];
}) {
  if (input.rows.length === 0) {
    return <p className="muted">No rows.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {input.columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {input.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {input.columns.map((column) => (
                <td key={column}>{renderCell(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="panel">
      <section className="card">
        <div className="card-title">No relations found</div>
        <p className="muted">Create `definitions.sql`, run migrations or sync, and add `.sql` files to start exploring.</p>
      </section>
    </section>
  );
}

function Shell(input: {
  children?: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="app-shell">
      {input.loading ? (
        <main className="main">
          <section className="panel">
            <section className="card">
              <div className="card-title">Loading</div>
            </section>
          </section>
        </main>
      ) : (
        input.children
      )}
    </div>
  );
}

function ErrorView(input: {
  error: unknown;
}) {
  return <pre className="code-block error">{String(input.error)}</pre>;
}

function renderCell(value: unknown) {
  if (value == null) {
    return <span className="muted">null</span>;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function useHashRoute(): Route {
  const hash = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('hashchange', onStoreChange);
      return () => window.removeEventListener('hashchange', onStoreChange);
    },
    () => window.location.hash,
    () => '',
  );
  return parseHash(hash);
}

function parseHash(hash: string): Route {
  const value = hash.replace(/^#/, '');
  if (!value) {
    return {kind: 'home'};
  }

  const [kind, first, second] = value.split('/').map(decodeURIComponent);
  if (kind === 'sql') {
    return {kind: 'sql'};
  }
  if (kind === 'table' && first) {
    return {kind: 'table', name: first, page: Number(second ?? '0') || 0};
  }
  if (kind === 'query' && first) {
    return {kind: 'query', id: first};
  }
  return {kind: 'home'};
}

function selectTable(route: Route, relations: readonly StudioRelation[]) {
  if (route.kind === 'table') {
    return relations.find((relation) => relation.name === route.name) ?? relations[0];
  }
  return relations[0];
}

function selectQuery(route: Route, queries: readonly QueryCatalogEntry[]) {
  if (route.kind === 'query') {
    return queries.find((query) => query.id === route.id) ?? queries[0];
  }
  return queries[0];
}

function buildExecutionSchema(entry: Extract<QueryCatalogEntry, {kind: 'query'}>): RJSFSchema {
  const properties: Record<string, RJSFSchema> = {};
  const required: string[] = [];

  if (entry.dataSchema) {
    properties.data = entry.dataSchema as RJSFSchema;
    required.push('data');
  }
  if (entry.paramsSchema) {
    properties.params = entry.paramsSchema as RJSFSchema;
    required.push('params');
  }

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function fetchJson<TValue>(url: string): Promise<TValue> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<TValue>;
}

async function postJson<TValue>(url: string, body: unknown): Promise<TValue> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<TValue>;
}

type Route =
  | {
    readonly kind: 'home';
  }
  | {
    readonly kind: 'sql';
  }
  | {
    readonly kind: 'table';
    readonly name: string;
    readonly page: number;
  }
  | {
    readonly kind: 'query';
    readonly id: string;
  };

createRoot(document.getElementById('root')!).render(<App />);
