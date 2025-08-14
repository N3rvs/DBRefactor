// types.ts

// Conexiones
export type ConnectionProps = {
  SessionId?: string;
  ConnectionKey?: string;
  ConnectionString?: string;
};

// ---- Schemas OpenAPI ----

export type RenameOp = {
  id: string; // id es solo para el cliente
  Scope: 'table' | 'column' | 'add-column' | 'drop-column' | 'drop-table' | 'drop-index';
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

export type RefactorPlan = { Renames: RenameItemDto[] };

export interface ColumnInfo {
  Name: string;
  SqlType: string;
  IsNullable: boolean;
}

export interface ForeignKeyInfo {
  Name: string;
  FromTable: string;
  FromColumn: string;
  ToTable: string;
  ToColumn: string;
}

export interface IndexInfo {
  Name: string;
  IsUnique: boolean;
  Columns: string[];
}

export interface TableInfo {
  Schema: string;
  Name: string;
  Columns: ColumnInfo[];
  ForeignKeys: ForeignKeyInfo[];
  Indexes: IndexInfo[];
}

export type DbSchema = {
  Tables: TableInfo[];
};

export type SqlBundle = {
  RenameSql?: string;
  CompatSql?: string;
  CleanupSql?: string;
};

export type ChangedFile = {
  Path: string;
  Changed: boolean;
};

export type CodeFixRunResult = {
  FilesScanned: number;
  FilesChanged: number;
  Changes: ChangedFile[];
};

// ---- Payloads de Request ----

export type ConnectRequest = {
  ConnectionString: string;
  TtlSeconds?: number;
};

export type DisconnectRequest = {
  SessionId: string;
};

export type AnalyzeSchemaRequest = ConnectionProps;

export type RefactorRequest = ConnectionProps & GenerateOptions & {
  Plan: RefactorPlan;
  Apply: boolean;
  RootKey?: string;
};

export type CleanupRequest = ConnectionProps & GenerateOptions & {
  Renames: RenameItemDto[];
};

export type CodeFixRequest = {
  RootKey: string;
  Apply: boolean;
  Plan: RefactorPlan;
  IncludeGlobs?: string[];
  ExcludeGlobs?: string[];
};

// ---- Payloads de Response ----

export type ConnectResponse = {
  SessionId: string;
  ExpiresAtUtc: string;
};

export type AnalyzeSchemaResponse = DbSchema;

export type RefactorResponse = {
  ok: boolean;
  apply: boolean;
  sql: SqlBundle;
  codefix: CodeFixRunResult;
  dbLog?: string[];
};

export type CleanupResponse = {
  ok: boolean;
  log: string[];
  sql: SqlBundle;
};

export type CodeFixResponse = CodeFixRunResult & {
  ok: boolean;
};

export type ApiError = {
  message: string;
  error?: string;
  title?: string;
  detail?: string;
};
