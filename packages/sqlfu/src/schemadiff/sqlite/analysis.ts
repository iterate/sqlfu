/*
 * SQLite-specific dependency and blocker analysis.
 * This file turns inspected SQLite schema objects into planner-facing facts so planning can consume typed records instead of re-deriving dependencies inline.
 *
 * Inspired by dependency handling in @pgkit/migra / @pgkit/schemainspect (TypeScript ports of djrobstep's Python originals).
 * See ../CLAUDE.md for the broader inspiration notes.
 */
import {createTableCheckReferencesDroppedColumns, triggerReferenceFacts, viewReferenceFacts} from './references.js';
import type {
  SqliteColumnDropDependencyAnalysis,
  SqliteDependencyFact,
  SqliteExternalBlockerRecord,
  SqliteInspectedDatabase,
  SqliteInspectedTrigger,
  SqliteInspectedView,
} from './types.js';

export function tableHasCheckConstraintReferencingColumns(
  createSql: string,
  columnNames: ReadonlySet<string>,
): boolean {
  return createTableCheckReferencesDroppedColumns(createSql, columnNames);
}

export function analyzeColumnDropDependencies(input: {
  tableName: string;
  removedColumnNames: ReadonlySet<string>;
  schema: SqliteInspectedDatabase;
}): SqliteColumnDropDependencyAnalysis {
  const {tableName, removedColumnNames, schema} = input;
  const viewDependencyFacts = analyzeViewDependencies(schema);
  const triggerDependencyFacts = analyzeTriggerDependencies(schema, viewDependencyFacts);

  const directlyAffectedViewNames = viewDependencyFacts
    .filter((fact) => fact.dependsOnNames.includes(tableName))
    .filter((fact) => fact.referencedColumnNames?.some((columnName) => removedColumnNames.has(columnName)))
    .map((fact) => fact.ownerName);

  const affectedViewNames = expandAffectedViewNames(directlyAffectedViewNames, viewDependencyFacts);
  const affectedViewNameSet = new Set(affectedViewNames);

  const directTriggerFacts = triggerDependencyFacts.filter((fact) => {
    if (fact.dependsOnNames.includes(tableName)) {
      return fact.referencedColumnNames?.some((columnName) => removedColumnNames.has(columnName)) || false;
    }
    return fact.dependsOnNames.some((name) => affectedViewNameSet.has(name));
  });
  const affectedTriggerNames = directTriggerFacts
    .map((fact) => fact.ownerName)
    .sort((left, right) => left.localeCompare(right));

  const externalBlockers: SqliteExternalBlockerRecord[] = [
    ...affectedViewNames.map((viewName) => ({
      kind: 'view' as const,
      objectId: `view:${viewName}`,
      objectName: viewName,
      tableName,
      referencedColumnNames:
        viewDependencyFacts.find((fact) => fact.ownerName === viewName)?.referencedColumnNames || [],
      dependencyNames: viewDependencyFacts.find((fact) => fact.ownerName === viewName)?.dependsOnNames || [],
    })),
    ...affectedTriggerNames.map((triggerName) => ({
      kind: 'trigger' as const,
      objectId: `trigger:${triggerName}`,
      objectName: triggerName,
      tableName,
      referencedColumnNames:
        triggerDependencyFacts.find((fact) => fact.ownerName === triggerName)?.referencedColumnNames || [],
      dependencyNames: triggerDependencyFacts.find((fact) => fact.ownerName === triggerName)?.dependsOnNames || [],
    })),
  ];

  return {
    tableName,
    removedColumnNames: [...removedColumnNames].sort((left, right) => left.localeCompare(right)),
    viewDependencyFacts,
    triggerDependencyFacts,
    affectedViewNames,
    affectedTriggerNames,
    externalBlockers,
  };
}

export function analyzeViewDependencies(
  schema: SqliteInspectedDatabase,
): (SqliteDependencyFact & {referencedColumnNames: string[]})[] {
  const candidateNames = [...Object.keys(schema.tables), ...Object.keys(schema.views)];

  return Object.values(schema.views).map((view) => {
    const references = viewReferenceFacts(view.createSql);
    const dependsOnNames = candidateNames
      .filter((name) => name !== view.name)
      .filter((name) => references.referencedTables.includes(name.toLowerCase()))
      .sort((left, right) => left.localeCompare(right));

    return {
      kind: 'view-dependency' as const,
      ownerId: `view:${view.name}`,
      ownerName: view.name,
      dependsOnNames,
      referencedColumnNames: references.referencedColumns,
    };
  });
}

export function analyzeTriggerDependencies(
  schema: SqliteInspectedDatabase,
  viewDependencyFacts: (SqliteDependencyFact & {referencedColumnNames: string[]})[],
): (SqliteDependencyFact & {referencedColumnNames: string[]})[] {
  const candidateNames = [...Object.keys(schema.tables), ...viewDependencyFacts.map((fact) => fact.ownerName)];

  return Object.values(schema.triggers).map((trigger) => {
    const references = triggerReferenceFacts(trigger.createSql, trigger.onName);
    return {
      kind: 'trigger-dependency' as const,
      ownerId: `trigger:${trigger.name}`,
      ownerName: trigger.name,
      dependsOnNames: triggerDependencyNames(trigger, candidateNames, references.referencedTables),
      referencedColumnNames: references.referencedColumns,
    };
  });
}

export function directViewDependencies(viewName: string, facts: SqliteDependencyFact[]): string[] {
  return (
    facts
      .find((fact) => fact.ownerName === viewName)
      ?.dependsOnNames?.slice()
      .sort((left, right) => left.localeCompare(right)) || []
  );
}

export function triggerSelectableNames(
  triggerName: string,
  candidateSelectableNames: ReadonlySet<string>,
  facts: SqliteDependencyFact[],
): string[] {
  const fact = facts.find((entry) => entry.ownerName === triggerName);
  if (!fact) {
    return [];
  }

  return fact.dependsOnNames
    .filter((name) => candidateSelectableNames.has(name))
    .sort((left, right) => left.localeCompare(right));
}

function expandAffectedViewNames(
  directlyAffectedViewNames: string[],
  viewDependencyFacts: SqliteDependencyFact[],
): string[] {
  const reverseDependencies = new Map<string, string[]>();

  for (const fact of viewDependencyFacts) {
    for (const dependencyName of fact.dependsOnNames) {
      const dependents = reverseDependencies.get(dependencyName) || [];
      dependents.push(fact.ownerName);
      reverseDependencies.set(dependencyName, dependents);
    }
  }

  const visited = new Set<string>();
  const queue = [...directlyAffectedViewNames];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (!visited.has(current)) {
      visited.add(current);
    }

    for (const dependentViewName of (reverseDependencies.get(current) || []).sort((left, right) =>
      left.localeCompare(right),
    )) {
      if (visited.has(dependentViewName)) {
        continue;
      }
      visited.add(dependentViewName);
      queue.push(dependentViewName);
    }
  }

  return [...visited].sort((left, right) => left.localeCompare(right));
}

function triggerDependencyNames(
  trigger: SqliteInspectedTrigger,
  candidateNames: string[],
  referencedTables: string[],
): string[] {
  const names = new Set<string>();
  names.add(trigger.onName);
  const referencedTableNames = new Set(referencedTables);

  for (const candidateName of candidateNames) {
    if (candidateName !== trigger.onName && referencedTableNames.has(candidateName.toLowerCase())) {
      names.add(candidateName);
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}
