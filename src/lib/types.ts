// types.ts

// ---- Conexiones ----
export type ConnectionProps = {
  sessionId?: string;
  connectionKey?: string;
  connectionString?: string;
};

// ---- Entidades del Frontend (Estado Interno) ----
// Representa una operación en la UI. Se convierte a RenameOp antes de enviar a la API.
export type PlanOperation = {
  id: string; // ID de cliente para la UI
  Scope: 'table' | 'column' | 'add-column' | 'drop-column' | 'drop-table' | 'drop-index';
  Area?: 'write' | 'read' | 'both';
  TableFrom: string;
  TableTo?: string | null;
  ColumnFrom?: string | null;
  ColumnTo?: string | null;
  Type?: string | null;
  Note?: string | null;
  Default?: string | null;
  Nullable?: boolean | null;
  Length?: number | null;
  Precision?: number | null;
  Scale?: number | null;
  Computed?: boolean | null;
};


// ---- DTOs para la API (camelCase) ----
// DTO para una operación de renombrado/refactorización.
export type RenameOp = {
  scope: 'table' | 'column' | 'add-column' | 'drop-column' | 'drop-table' | 'drop-index';
  area?: 'write' | 'read' | 'both';
  tableFrom: string;
  tableTo?: string | null;
  columnFrom?: string | null;
  columnTo?: string | null;
  type?: string | null;
  note?: string | null;
};

// DTO para el plan de refactorización.
export type RefactorPlan = {
  renames: RenameOp[];
};

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

export type ChangedFile = { path: string; changed: boolean; };
export type CodeFixRunResult = {
  filesScanned?: number;
  filesChanged?: number;
  changes?: ChangedFile[];
};

// ---- Requests (camelCase para el body JSON) ----
export type ConnectRequest = { connectionString: string; ttlSeconds?: number; };
export type DisconnectRequest = { sessionId: string; };
export type AnalyzeSchemaRequest = { sessionId?: string; connectionKey?: string; connectionString?: string; };

export type RefactorRequest = {
  sessionId?: string;
  connectionKey?: string;
  connectionString?: string;
  plan: RefactorPlan;
  apply: boolean;
  rootKey: string;
  useSynonyms?: boolean;
  useViews?: boolean;
  cqrs?: boolean;
};

export type CleanupRequest = {
  sessionId?: string;
  connectionKey?: string;
  connectionString?: string;
  renames: RenameOp[];
  useSynonyms?: boolean;
  useViews?: boolean;
  cqrs?: boolean;
  allowDestructive?: boolean;
};

export type CodeFixRequest = {
  rootKey: string;
  apply: boolean;
  plan: RefactorPlan;
  includeGlobs?: string[];
  excludeGlobs?: string[];
};

export type PlanRequest = {
  renames: RenameOp[];
  useSynonyms?: boolean;
  useViews?: boolean;
  cqrs?: boolean;
};

// ---- Responses (se normalizan en el cliente si es necesario) ----
export type ConnectResponse = { sessionId: string; expiresAtUtc: string; };
export type AnalyzeSchemaResponse = { tables: TableInfo[] };

export type RefactorResponse = {
  ok?: boolean;
  apply?: boolean;
  sql?: SqlBundle;
  codefix?: CodeFixRunResult;
  dbLog?: string | string[];
};

export type CleanupResponse = {
  ok?: boolean;
  log?: string[];
  sql?: SqlBundle;
};

export type CodeFixResponse = CodeFixRunResult;
export type PlanResponse = { sql: SqlBundle, report: any };

export type ApiError = { message: string; error?: string; title?: string; detail?: string; };
