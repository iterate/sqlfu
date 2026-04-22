import {useState} from 'react';
import useLocalStorageState from 'use-local-storage-state';
import {useQuery} from '@tanstack/react-query';

import type {StudioRelation} from './shared.js';
import {
  DEFAULT_LIMIT,
  FILTER_OPERATORS,
  buildRelationQuery,
  defaultRelationQueryState,
  isDefaultRelationQueryState,
  operatorTakesValue,
  type FilterOperator,
  type RelationQueryFilter,
  type RelationQueryState,
} from './relation-query-builder.js';
import {SqlCodeMirror} from './sql-codemirror.js';

type DataSource =
  | {mode: 'default'}
  | {mode: 'sql'; sql: string; rows: Record<string, unknown>[]; visibleColumns: string[]; isLoading: boolean; error: Error | null};

export type RelationQuerySqlResult = {
  rows?: Record<string, unknown>[];
  mode?: string;
};

export type RelationQueryPanelProps = {
  relation: StudioRelation;
  runSql: (input: {sql: string}) => Promise<RelationQuerySqlResult>;
  renderDefaultDataTable: () => React.ReactNode;
  renderSqlDataTable: (input: {rows: Record<string, unknown>[]; columns: string[]; storageKey: string}) => React.ReactNode;
};

export function RelationQueryPanel(input: RelationQueryPanelProps) {
  const {relation} = input;
  const allColumns = relation.columns.map((c) => c.name);

  const [state, setState] = useLocalStorageState<RelationQueryState>(
    `sqlfu-ui/relation-query/${relation.name}`,
    {
      defaultValue: defaultRelationQueryState({tableName: relation.name, allColumns}),
    },
  );
  const [customSql, setCustomSql] = useLocalStorageState<string | null>(
    `sqlfu-ui/relation-query-custom/${relation.name}`,
    {defaultValue: null},
  );
  const [accordionOpen, setAccordionOpen] = useLocalStorageState<boolean>(
    `sqlfu-ui/relation-query-open/${relation.name}`,
    {defaultValue: false},
  );
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

  const safeState = reconcileState(state, relation.name, allColumns);
  const generatedSql = buildRelationQuery(safeState);
  const effectiveSql = customSql ?? generatedSql;
  const isStructured = customSql === null;
  const isDefault = isStructured && isDefaultRelationQueryState(safeState);
  const limitError = !hasLimitClause(effectiveSql)
    ? 'Your query must end with a `limit` clause. Remove manual edits or use the SQL Runner for unbounded queries.'
    : null;
  const simpleShapeMatch = isSimpleSelectFromTable(effectiveSql, relation.name);

  const runQuery = useQuery({
    queryKey: ['relation-query', relation.name, effectiveSql],
    queryFn: () => input.runSql({sql: effectiveSql}),
    enabled: !isDefault && !limitError,
    placeholderData: (previous) => previous,
  });

  const mutate = (updater: (previous: RelationQueryState) => RelationQueryState) => {
    if (!isStructured) {
      setCustomSql(null);
    }
    setState((previous) => updater(reconcileState(previous, relation.name, allColumns)));
    if (!accordionOpen) setAccordionOpen(true);
  };

  const handleSortClick = (column: string) => {
    mutate((s) => {
      const current = s.sort?.column === column ? s.sort.direction : null;
      const next = current === null ? 'asc' : current === 'asc' ? 'desc' : null;
      return {...s, sort: next === null ? null : {column, direction: next}};
    });
  };
  const handleHideToggle = (column: string) => {
    mutate((s) => {
      const hidden = new Set(s.hiddenColumns);
      if (hidden.has(column)) hidden.delete(column);
      else hidden.add(column);
      return {...s, hiddenColumns: allColumns.filter((c) => hidden.has(c))};
    });
  };
  const handleFilterApply = (filter: RelationQueryFilter) => {
    mutate((s) => {
      const existingIndex = s.filters.findIndex((f) => f.column === filter.column);
      const nextFilters =
        existingIndex >= 0
          ? s.filters.map((f, i) => (i === existingIndex ? filter : f))
          : [...s.filters, filter];
      return {...s, filters: nextFilters};
    });
    setActiveFilterColumn(null);
  };
  const handleFilterClear = (column: string) => {
    mutate((s) => ({...s, filters: s.filters.filter((f) => f.column !== column)}));
    setActiveFilterColumn(null);
  };
  const handleLimitChange = (value: number) => {
    mutate((s) => ({...s, limit: Math.max(1, value)}));
  };
  const handlePrev = () => mutate((s) => ({...s, offset: Math.max(0, s.offset - s.limit)}));
  const handleNext = () => mutate((s) => ({...s, offset: s.offset + s.limit}));
  const handleReset = () => {
    setState(defaultRelationQueryState({tableName: relation.name, allColumns}));
    setCustomSql(null);
  };
  const handleSqlChange = (value: string) => {
    if (value === generatedSql) {
      setCustomSql(null);
      return;
    }
    setCustomSql(value);
  };

  const dataSource: DataSource = isDefault
    ? {mode: 'default'}
    : {
        mode: 'sql',
        sql: effectiveSql,
        rows: extractRows(runQuery.data),
        visibleColumns: extractColumns(runQuery.data, safeState),
        isLoading: runQuery.isFetching,
        error: runQuery.error as Error | null,
      };

  return (
    <div className="relation-query-panel">
      <div className="relation-query-toolbar" aria-label="Relation query toolbar">
        <div className="relation-query-columns" role="group" aria-label="Column controls">
          {allColumns.map((column) => {
            const sortDir = safeState.sort?.column === column ? safeState.sort.direction : null;
            const activeFilter = safeState.filters.find((f) => f.column === column);
            const isHidden = safeState.hiddenColumns.includes(column);
            return (
              <div
                key={column}
                className={`relation-query-column-chip${isHidden ? ' is-hidden' : ''}`}
                aria-label={`Column ${column} controls`}
              >
                <span className="relation-query-column-name">{column}</span>
                <button
                  type="button"
                  className={`icon-button${sortDir ? ' is-active' : ''}`}
                  aria-label={`Sort ${column} ${sortDir === 'asc' ? 'descending' : sortDir === 'desc' ? 'off' : 'ascending'}`}
                  aria-pressed={sortDir !== null}
                  disabled={!isStructured}
                  onClick={() => handleSortClick(column)}
                  title={sortDir === 'asc' ? 'Sorted ascending' : sortDir === 'desc' ? 'Sorted descending' : 'Click to sort'}
                >
                  {sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '↕'}
                </button>
                <button
                  type="button"
                  className={`icon-button${activeFilter ? ' is-active' : ''}`}
                  aria-label={`Filter ${column}`}
                  aria-pressed={Boolean(activeFilter)}
                  aria-haspopup="dialog"
                  disabled={!isStructured}
                  onClick={() => setActiveFilterColumn((current) => (current === column ? null : column))}
                  title={activeFilter ? `Filter: ${activeFilter.operator} ${activeFilter.value ?? ''}` : 'Add filter'}
                >
                  ▽
                </button>
                <button
                  type="button"
                  className={`icon-button${isHidden ? ' is-active' : ''}`}
                  aria-label={isHidden ? `Show ${column}` : `Hide ${column}`}
                  aria-pressed={isHidden}
                  disabled={!isStructured}
                  onClick={() => handleHideToggle(column)}
                  title={isHidden ? 'Hidden — click to show' : 'Click to hide'}
                >
                  {isHidden ? '🚫' : '👁'}
                </button>
                {activeFilterColumn === column ? (
                  <FilterPopover
                    column={column}
                    current={activeFilter}
                    onApply={handleFilterApply}
                    onClear={() => handleFilterClear(column)}
                    onCancel={() => setActiveFilterColumn(null)}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="relation-query-pagination">
          <label className="relation-query-limit">
            Limit
            <input
              type="number"
              min={1}
              value={safeState.limit}
              aria-label="Query limit"
              disabled={!isStructured}
              onChange={(event) => handleLimitChange(Number.parseInt(event.currentTarget.value, 10) || DEFAULT_LIMIT)}
            />
          </label>
          <button
            type="button"
            className="button"
            disabled={!isStructured || safeState.offset === 0}
            onClick={handlePrev}
          >
            Previous
          </button>
          <button type="button" className="button" disabled={!isStructured} onClick={handleNext}>
            Next
          </button>
          <span className="pill" aria-label="Current offset">
            offset {safeState.offset}
          </span>
          {isDefault ? null : (
            <button type="button" className="button" onClick={handleReset} aria-label="Reset query to default">
              Reset
            </button>
          )}
        </div>
      </div>

      {dataSource.mode === 'default' ? (
        input.renderDefaultDataTable()
      ) : (
        <SqlResultView
          storageKey={`relation-query/${relation.name}`}
          rows={dataSource.rows}
          columns={dataSource.visibleColumns}
          isLoading={dataSource.isLoading}
          error={dataSource.error}
          renderTable={input.renderSqlDataTable}
        />
      )}

      <details
        className="card relation-details"
        open={accordionOpen || !isDefault}
        onToggle={(event) => setAccordionOpen(event.currentTarget.open)}
      >
        <summary className="authority-card-summary" role="button">
          <span className="card-title relation-details-title">Query</span>
          <span className="accordion-chevron" aria-hidden="true">
            ▾
          </span>
        </summary>
        <div className="authority-card-body">
          {limitError ? <div className="error-view">{limitError}</div> : null}
          {!isStructured && !simpleShapeMatch ? (
            <div className="info-callout">
              Your query is no longer a simple <code>select … from {relation.name}</code>. Consider opening it in the{' '}
              <a href="#sql">full SQL Runner</a> for more control.
            </div>
          ) : null}
          <SqlCodeMirror
            value={effectiveSql}
            ariaLabel="Relation query editor"
            relations={[relation]}
            onChange={handleSqlChange}
          />
        </div>
      </details>
    </div>
  );
}

function SqlResultView(input: {
  storageKey: string;
  rows: Record<string, unknown>[];
  columns: string[];
  isLoading: boolean;
  error: Error | null;
  renderTable: (input: {rows: Record<string, unknown>[]; columns: string[]; storageKey: string}) => React.ReactNode;
}) {
  if (input.error) {
    return <div className="error-view">{String(input.error.message ?? input.error)}</div>;
  }
  if (input.isLoading && input.rows.length === 0) {
    return <p className="muted">Loading…</p>;
  }
  return input.renderTable({rows: input.rows, columns: input.columns, storageKey: input.storageKey});
}

function FilterPopover(input: {
  column: string;
  current: RelationQueryFilter | undefined;
  onApply: (filter: RelationQueryFilter) => void;
  onClear: () => void;
  onCancel: () => void;
}) {
  const [operator, setOperator] = useState<FilterOperator>(input.current?.operator ?? '=');
  const [value, setValue] = useState<string>(input.current?.value ?? '');
  const requiresValue = operatorTakesValue(operator);
  const submit = () => {
    const filter: RelationQueryFilter = requiresValue
      ? {column: input.column, operator, value}
      : {column: input.column, operator};
    input.onApply(filter);
  };
  return (
    <div
      className="relation-query-filter-popover"
      role="dialog"
      aria-label={`Filter ${input.column}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          submit();
        } else if (event.key === 'Escape') {
          input.onCancel();
        }
      }}
    >
      <select
        aria-label="Filter operator"
        value={operator}
        onChange={(event) => setOperator(event.currentTarget.value as FilterOperator)}
      >
        {FILTER_OPERATORS.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
      {requiresValue ? (
        <input
          type="text"
          aria-label="Filter value"
          value={value}
          autoFocus
          onChange={(event) => setValue(event.currentTarget.value)}
          placeholder={operator === 'in' ? 'e.g. 1, 2, 3' : operator === 'like' ? '%search%' : 'value'}
        />
      ) : null}
      <div className="relation-query-filter-actions">
        <button type="button" className="button primary" onClick={submit}>
          Apply
        </button>
        {input.current ? (
          <button type="button" className="button" onClick={input.onClear}>
            Clear
          </button>
        ) : null}
        <button type="button" className="button" onClick={input.onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function reconcileState(state: RelationQueryState, tableName: string, allColumns: string[]): RelationQueryState {
  const columnSet = new Set(allColumns);
  return {
    ...state,
    tableName,
    allColumns,
    hiddenColumns: state.hiddenColumns.filter((c) => columnSet.has(c)),
    filters: state.filters.filter((f) => columnSet.has(f.column)),
    sort: state.sort && columnSet.has(state.sort.column) ? state.sort : null,
  };
}

function hasLimitClause(sql: string): boolean {
  return /\blimit\s+\d+/i.test(sql);
}

function isSimpleSelectFromTable(sql: string, tableName: string): boolean {
  const pattern = new RegExp(`^\\s*select\\s+[\\s\\S]*?\\s+from\\s+"?${escapeRegex(tableName)}"?(\\s|;|$)`, 'i');
  return pattern.test(sql);
}

function escapeRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractRows(data: unknown): Record<string, unknown>[] {
  if (data && typeof data === 'object' && 'rows' in data && Array.isArray((data as {rows: unknown[]}).rows)) {
    return (data as {rows: Record<string, unknown>[]}).rows;
  }
  return [];
}

function extractColumns(data: unknown, state: RelationQueryState): string[] {
  const rows = extractRows(data);
  if (rows.length > 0) return Object.keys(rows[0]!);
  return state.allColumns.filter((c) => !state.hiddenColumns.includes(c));
}
