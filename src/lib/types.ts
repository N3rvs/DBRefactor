// types.ts

// ---- Conexiones ----
export type ConnectionProps = {
  SessionId?: string;
  ConnectionKey?: string;
  ConnectionString?: string;
};

// ---- Schemas OpenAPI ----
export type RenameOp = {
  id: string; // id solo en cliente
  Scope:
    | 'table'
    | 'column'
    | 'add-column'
    | 'drop-column'
    | 'drop-table'
    | 'drop-index'; // usamos ColumnFrom para el nombre del índice
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

export type RenameItemDto = Omit<RenameOp, 'id'>;

export type GenerateOptions = {
  UseSynonyms?: boolean;
  UseViews?: boolean;
  Cqrs?: boolean;
  AllowDestructive?: boolean;
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
  RenameSql?: string;
  CompatSql?: string;
  CleanupSql?: string;
};

export type ChangedFile = { Path: string; Changed: boolean; };
export type CodeFixRunResult = {
  FilesScanned?: number;
  FilesChanged?: number;
  Changes?: ChangedFile[];
};

// ---- Plan (/plan) ----
export type PlanRequest = GenerateOptions & { Renames: RenameItemDto[] };
export type PlanResponse = { sql?: SqlBundle; report?: unknown }; // PlanResponseDto en el backend

// ---- Requests ----
export type ConnectRequest = { ConnectionString: string; TtlSeconds?: number; };
export type DisconnectRequest = { SessionId: string; };
export type AnalyzeSchemaRequest = ConnectionProps;

// /refactor/run necesita el JSON del plan
export type RefactorRequest = ConnectionProps & GenerateOptions & {
  Plan: { renames: RenameItemDto[] }; // Clave `renames` en minúsculas
  Apply: boolean;
  RootKey?: string;
};

// /apply/cleanup: acepta misma resolución de conexión que el resto
export type CleanupRequest = ConnectionProps & GenerateOptions & {
  Renames: RenameItemDto[];
};

// Puede aceptar el plan completo de /plan o solo {Renames} según implementación
export type CodeFixRequest = {
  RootKey: string;
  Apply: boolean;
  Plan: PlanResponse | RefactorPlan;
  IncludeGlobs?: string[];
  ExcludeGlobs?: string[];
};

// ---- Responses ----
export type ConnectResponse = { SessionId: string; ExpiresAtUtc: string; };
export type AnalyzeSchemaResponse = DbSchema;

// El shape exacto de /refactor/run puede variar -> lo dejamos laxo
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

// /codefix/run devuelve CodeFixRunResult (sin "ok")
export type CodeFixResponse = CodeFixRunResult;

export type ApiError = { message: string; error?: string; title?: string; detail?: string; };

    