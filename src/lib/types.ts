// types.ts

// ---- Conexiones ----
// Se mantiene PascalCase para la compatibilidad con el hook useDbSession y el schema,
// pero se transformará a camelCase en la llamada a la API.
export type ConnectionProps = {
  sessionId?: string;
  connectionKey?: string;
  connectionString?: string;
};

// ---- Schemas OpenAPI ----
// Este es el tipo de datos del ESTADO INTERNO. Usa PascalCase.
// Se convertirá a DTO en camelCase antes de enviarse.
export type RenameOp = {
  id: string; // id solo en cliente
  Scope:
    | 'table'
    | 'column'
    | 'add-column'
    | 'drop-column'
    | 'drop-table'
    | 'drop-index';
  TableFrom: string;
  TableTo?: string | null;
  ColumnFrom?: string | null;
  ColumnTo?: string | null;
  Type?: string | null;
  Area?: 'write' | 'read' | 'both' | null;
  Note?: string | null;
  Default?: string | null;
  Nullable?: boolean | null;
  Length?: number | null;
  Precision?: number | null;
  Scale?: number | null;
  Computed?: boolean | null;
};

// Este es el DTO que se envía a la API. Usa camelCase.
export type RenameItemDto = {
  scope:
    | 'table'
    | 'column'
    | 'add-column'
    | 'drop-column'
    | 'drop-table'
    | 'drop-index';
  tableFrom: string;
  tableTo?: string | null;
  columnFrom?: string | null;
  columnTo?: string | null;
  type?: string | null;
  area?: 'write' | 'read' | 'both' | null;
  note?: string | null;
  default?: string | null;
  nullable?: boolean | null;
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
  computed?: boolean | null;
};

export type GenerateOptions = {
  useSynonyms?: boolean;
  useViews?: boolean;
  cqrs?: boolean;
  allowDestructive?: boolean;
};

export type RefactorPlan = { renames: RenameItemDto[] };

// ---- Esquema ----
export interface ColumnInfo { Name: string; SqlType: string; IsNullable: boolean; }
export interface ForeignKeyInfo { Name: string; FromTable: string; FromColumn: string; ToTable: string; ToColumn: string; }
export interface IndexInfo { Name: string; IsUnique: boolean; Columns: string[]; }
export interface TableInfo { Schema: string; Name: string; Columns: ColumnInfo[]; ForeignKeys: ForeignKeyInfo[]; Indexes: IndexInfo[]; }
export type DbSchema = { Tables: TableInfo[]; };

// ---- SQL / CodeFix ----
export type SqlBundle = {
  renameSql?: string;
  compatSql?: string;
  cleanupSql?: string;
};

export type ChangedFile = { path: string; changed: boolean; }; // path, changed
export type CodeFixRunResult = {
  filesScanned?: number;
  filesChanged?: number;
  changes?: ChangedFile[];
};

// ---- Plan (/plan) ----
export type PlanRequest = GenerateOptions & { renames: RenameItemDto[] };
export type PlanResponse = { sql?: SqlBundle; report?: unknown };

// ---- Requests (camelCase para el body JSON) ----
export type ConnectRequest = { connectionString: string; ttlSeconds?: number; };
export type DisconnectRequest = { sessionId: string; };
export type AnalyzeSchemaRequest = { sessionId?: string; connectionKey?: string; connectionString?: string; };

export type RefactorRequest = {
  sessionId?: string;
  connectionKey?: string;
  connectionString?: string;
  apply: boolean;
  rootKey?: string;
  useSynonyms?: boolean;
  useViews?: boolean;
  cqrs?: boolean;
  allowDestructive?: boolean;
  plan: RefactorPlan;
};

export type CleanupRequest = {
  sessionId?: string;
  connectionKey?: string;
  connectionString?: string;
  renames: RenameItemDto[];
  useSynonyms?: boolean;
  useViews?: boolean;
  cqrs?: boolean;
  allowDestructive?: boolean;
};

export type CodeFixRequest = {
  rootKey: string;
  apply: boolean;
  plan: PlanResponse | { renames: RenameItemDto[] };
  includeGlobs?: string[];
  excludeGlobs?: string[];
};

// ---- Responses (se normalizan en el cliente) ----
export type ConnectResponse = { SessionId: string; ExpiresAtUtc: string; }; // El hook ya maneja esto
export type AnalyzeSchemaResponse = DbSchema;

export type RefactorResponse = {
  ok?: boolean;
  apply?: boolean;
  sql?: SqlBundle;
  codefix?: CodeFixRunResult;
  dbLog?: string[];
};

export type CleanupResponse = {
  ok?: boolean;
  log?: string[];
  sql?: SqlBundle;
};

export type CodeFixResponse = CodeFixRunResult;

export type ApiError = { message: string; error?: string; title?: string; detail?: string; };
