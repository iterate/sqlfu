/*
 * SQLite-specific schemadiff types.
 * These types describe SQLite inspection output and SQLite planner operations; other dialects should define their own sibling models.
 */
import type {Client} from '../../core/types.js';

export type SqliteInspectedDatabase = {
  readonly tables: Record<string, SqliteInspectedTable>;
  readonly views: Record<string, SqliteInspectedView>;
  readonly triggers: Record<string, SqliteInspectedTrigger>;
};

export type SqliteInspectedTable = {
  readonly name: string;
  readonly createSql: string;
  readonly columns: readonly SqliteInspectedColumn[];
  readonly primaryKey: readonly string[];
  readonly uniqueConstraints: readonly SqliteUniqueConstraint[];
  readonly indexes: Record<string, SqliteInspectedIndex>;
  readonly foreignKeys: readonly SqliteForeignKey[];
};

export type SqliteInspectedColumn = {
  readonly name: string;
  readonly declaredType: string;
  readonly collation: string | null;
  readonly notNull: boolean;
  readonly defaultSql: string | null;
  readonly primaryKeyPosition: number;
  readonly hidden: number;
  readonly generated: boolean;
};

export type SqliteUniqueConstraint = {
  readonly columns: readonly string[];
};

export type SqliteInspectedIndex = {
  readonly name: string;
  readonly createSql: string;
  readonly unique: boolean;
  readonly origin: string;
  readonly columns: readonly string[];
  readonly where: string | null;
};

export type SqliteForeignKey = {
  readonly columns: readonly string[];
  readonly referencedTable: string;
  readonly referencedColumns: readonly string[];
  readonly onUpdate: string;
  readonly onDelete: string;
  readonly match: string;
};

export type SqliteInspectedView = {
  readonly name: string;
  readonly createSql: string;
  readonly definition: string;
};

export type SqliteInspectedTrigger = {
  readonly name: string;
  readonly onName: string;
  readonly createSql: string;
  readonly normalizedSql: string;
};

export type DisposableClient = {
  readonly client: Client;
  [Symbol.asyncDispose](): Promise<void>;
};

export type SchemadiffOperationKind =
  | 'drop-index'
  | 'drop-column'
  | 'create-index'
  | 'drop-view'
  | 'create-view'
  | 'drop-trigger'
  | 'create-trigger';

export type SchemadiffOperation = {
  readonly id: string;
  readonly kind: SchemadiffOperationKind;
  readonly sql: string;
  readonly dependencies: readonly string[];
};

export type SqliteDependencyFactKind = 'view-dependency' | 'trigger-dependency';

export type SqliteDependencyFact = {
  readonly kind: SqliteDependencyFactKind;
  readonly ownerId: string;
  readonly ownerName: string;
  readonly dependsOnNames: readonly string[];
  readonly referencedColumnNames: readonly string[];
};

export type SqliteExternalBlockerKind = 'index' | 'view' | 'trigger';

export type SqliteExternalBlockerRecord = {
  readonly kind: SqliteExternalBlockerKind;
  readonly objectId: string;
  readonly objectName: string;
  readonly tableName: string;
  readonly referencedColumnNames: readonly string[];
  readonly dependencyNames: readonly string[];
};

export type SqliteColumnDropDependencyAnalysis = {
  readonly tableName: string;
  readonly removedColumnNames: readonly string[];
  readonly viewDependencyFacts: readonly SqliteDependencyFact[];
  readonly triggerDependencyFacts: readonly SqliteDependencyFact[];
  readonly affectedViewNames: readonly string[];
  readonly affectedTriggerNames: readonly string[];
  readonly externalBlockers: readonly SqliteExternalBlockerRecord[];
};
