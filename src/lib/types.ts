// Using `never` to enforce that only one of the connection properties can be present.
export type WithSessionId        = { sessionId: string;    connectionKey?: never; connectionString?: never };
export type WithConnectionKey    = { connectionKey: string; sessionId?: never;   connectionString?: never };
export type WithConnectionString = { connectionString: string; sessionId?: never; connectionKey?: never };
export type ConnectionProps = WithSessionId | WithConnectionKey | WithConnectionString;

// Operation and Plan types
// Added a client-side `id` for easier state management in React.
export type RenameOp = {
  id: string; 
  scope: "table" | "column" | "add-column" | string;
  area?: "write" | "read" | "both";
  tableFrom: string;
  tableTo?: string | null;
  columnFrom?: string | null;
  columnTo?: string | null;
  type?: string | null; // Required for 'add-column' and type-changing 'rename-column'
  note?: string | null;
};

// The plan sent to the API should not include the client-side `id`.
export type RefactorPlan = {
  renames: Omit<RenameOp, 'id'>[];
};

// API Request Body Types
export type ConnectRequest = {
  connectionString: string;
  ttlSeconds?: number;
};

export type DisconnectRequest = {
  sessionId: string;
};

export type AnalyzeSchemaRequest = ConnectionProps;

export type GeneratePlanRequest = {
  renames: Omit<RenameOp, 'id'>[];
  useSynonyms?: boolean;
  useViews?: boolean;
  cqrs?: boolean;
} & ConnectionProps;

export type RefactorRequest = ConnectionProps & {
  plan: RefactorPlan;
  apply: boolean;
  rootKey?: "SOLUTION" | "FRONT" | (string & {});
  useSynonyms?: boolean;
  useViews?: boolean;
  cqrs?: boolean;
};

export type CleanupRequest = ConnectionProps & {
  renames: Omit<RenameOp, 'id'>[];
  useSynonyms?: boolean;
  useViews?: boolean;
  cqrs?: boolean;
};

export type CodeFixRequest = {
  rootKey: string;
  apply: boolean;
  plan: RefactorPlan;
  includeGlobs?: string[];
  excludeGlobs?: string[];
};

// API Response Types
export type ConnectResponse = {
  sessionId: string;
  expiresAtUtc: string;
};

export type ColumnInfo = {
  name: string;
  type: string;
};

export type FKInfo = {
  name: string;
  // Other properties can be added here as needed.
};

export type IndexInfo = {
  name: string;
  // Other properties can be added here as needed.
};

export type TableInfo = {
  schema: string;
  name: string;
  columns: ColumnInfo[];
  foreignKeys: FKInfo[];
  indexes: IndexInfo[];
};

export type AnalyzeSchemaResponse = {
  tables: TableInfo[];
};

export type SqlScripts = {
  renameSql?: string;
  compatSql?: string;
  cleanupSql?: string;
};

export type GeneratePlanResponse = {
  sql: SqlScripts;
  report?: any;
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
  sql: { cleanupSql?: string };
};

export type CodeFixResponse = CodeFixResult & {
  ok: boolean;
};

export type ApiError = {
  message: string;
  error?: string;
};
