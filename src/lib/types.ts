// Conexiones: exactamente una
export type WithSessionId        = { sessionId: string;    connectionKey?: never; connectionString?: never };
export type WithConnectionKey    = { connectionKey: string; sessionId?: never;   connectionString?: never };
export type WithConnectionString = { connectionString: string; sessionId?: never; connectionKey?: never };
export type ConnectionProps = WithSessionId | WithConnectionKey | WithConnectionString;

// Tipos base
// El `id` es solo para el cliente
export type RenameOp = {
  id: string;
  scope: "table" | "column" | "add-column" | "drop-column" | "drop-table" | "drop-index";
  area?: "write" | "read" | "both";
  tableFrom: string;
  tableTo?: string | null;
  columnFrom?: string | null;
  columnTo?: string | null;
  type?: string | null;      // requerido en add-column y en "column" con cambio de tipo
  note?: string | null;
};

export type GenerateOptions = {
  useSynonyms?: boolean;     // compat para rename table
  useViews?: boolean;        // compat para rename column
  cqrs?: boolean;            // reservado
  allowDestructive?: boolean;// habilita drop-*
};

export type RefactorPlan = { renames: Omit<RenameOp, 'id'>[] };

// Resumen de schema
export type ColumnInfo = { name: string; type: string; isNullable?: boolean };
export type ForeignKeyInfo = { name: string; fromTable?: string; fromColumn?: string; toTable?: string; toColumn?: string };
export type IndexInfo = { name: string; isUnique?: boolean; columns?: string[] };
export type TableInfo = { schema: string; name: string; columns: ColumnInfo[]; foreignKeys: ForeignKeyInfo[]; indexes: IndexInfo[] };


// Payloads de Request
export type ConnectRequest = {
  connectionString: string;
  ttlSeconds?: number;
};

export type DisconnectRequest = {
  sessionId: string;
};

export type AnalyzeSchemaRequest = ConnectionProps;

export type RefactorRequest = ConnectionProps & GenerateOptions & {
  plan: RefactorPlan;
  apply: boolean;
  rootKey?: string;
};

export type CleanupRequest = ConnectionProps & GenerateOptions & {
  renames: Omit<RenameOp, 'id'>[];
};

export type CodeFixRequest = {
  rootKey: string;
  apply: boolean;
  plan: RefactorPlan;
  includeGlobs?: string[];
  excludeGlobs?: string[];
};

// Payloads de Response
export type ConnectResponse = {
  sessionId: string;
  expiresAtUtc: string;
};

export type AnalyzeSchemaResponse = {
  tables: TableInfo[];
};

export type SqlScripts = {
  renameSql?: string;
  compatSql?: string;
  cleanupSql?: string;
};

export type CodeFixResult = {
  scanned: number;
  changed: number;
  files: { path: string; changed: boolean }[];
};

export type RefactorResponse = {
  ok: boolean;
  apply: boolean;
  sql: SqlScripts;
  codefix: CodeFixResult;
  dbLog?: string[];
};

export type CleanupResponse = {
  ok: boolean;
  log: string[];
  sql: SqlScripts;
};

export type CodeFixResponse = CodeFixResult & {
  ok: boolean;
};

export type ApiError = {
  message: string;
  error?: string;
};
