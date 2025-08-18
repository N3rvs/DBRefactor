// src/lib/normalize-db-schema.ts
import type {
  TableInfo,
  ColumnInfo,
  ForeignKeyInfo,
  IndexInfo,
} from '@/lib/types';

type AnyRec = Record<string, any>;
const pick = (o: AnyRec, ...keys: string[]) => {
  for (const k of keys) if (o && o[k] !== undefined) return o[k];
  return undefined;
};

const normalizeColumn = (c: AnyRec): ColumnInfo => ({
  Name: pick(c, 'Name', 'name'),
  SqlType: pick(c, 'SqlType', 'sqlType', 'type'),
  IsNullable: Boolean(pick(c, 'IsNullable', 'isNullable')),
});

const normalizeFk = (f: AnyRec): ForeignKeyInfo => ({
  Name: pick(f, 'Name', 'name'),
  FromTable: pick(f, 'FromTable', 'fromTable'),
  FromColumn: pick(f, 'FromColumn', 'fromColumn'),
  ToTable: pick(f, 'ToTable', 'toTable'),
  ToColumn: pick(f, 'ToColumn', 'toColumn'),
});

const normalizeIndex = (i: AnyRec): IndexInfo => ({
  Name: pick(i, 'Name', 'name'),
  IsUnique: Boolean(pick(i, 'IsUnique', 'isUnique')),
  Columns: (pick(i, 'Columns', 'columns') ?? []) as string[],
});

const normalizeTable = (t: AnyRec): TableInfo => ({
  Schema: pick(t, 'Schema', 'schema'),
  Name: pick(t, 'Name', 'name'),
  Columns: ((pick(t, 'Columns', 'columns') ?? []) as AnyRec[]).map(normalizeColumn),
  ForeignKeys: ((pick(t, 'ForeignKeys', 'foreignKeys') ?? []) as AnyRec[]).map(normalizeFk),
  Indexes: ((pick(t, 'Indexes', 'indexes') ?? []) as AnyRec[]).map(normalizeIndex),
});

/** Normaliza la respuesta del backend (camelCase o PascalCase) al shape de TableInfo */
export function normalizeDbSchema(raw: unknown): TableInfo[] {
  if (Array.isArray(raw)) {
    // Si la API devuelve un array de tablas directamente
    return raw.map(normalizeTable);
  }
  // Si la API devuelve un objeto { tables: [...] }
  const obj = raw as AnyRec;
  const tables = (pick(obj, 'Tables', 'tables') ?? []) as AnyRec[];
  return tables.map(normalizeTable);
}

// también como default por si te resulta cómodo
export default normalizeDbSchema;
