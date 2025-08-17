'use client';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { TableInfo, ColumnInfo, ForeignKeyInfo, IndexInfo, PlanOperation } from '@/lib/types';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useAppContext } from '@/contexts/app-context';
import { Button } from '../ui/button';

interface SchemaViewerProps {
  tables: TableInfo[];
  onAddOperation: (op: Partial<Omit<PlanOperation, 'id'>>) => void;
}

const fq = (t: TableInfo) => `${t.Schema}.${t.Name}`;
const justTable = (t: TableInfo) => t.Name;

const DetailTable = <T extends { Name: string; [key: string]: any }>({
  data, columns, caption, actions,
}: {
  data: T[] | undefined;
  columns: { key: string; header: string }[];
  caption: string;
  actions?: (item: T) => React.ReactNode;
}) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground mt-2">{caption} no encontrados.</p>;
  }
  return (
    <div className="my-4">
      <h4 className="font-semibold text-sm mb-2">{caption}</h4>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => <TableHead key={col.key}>{col.header}</TableHead>)}
            {actions && <TableHead className="w-[50px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.Name}>
              {columns.map(col => (
                <TableCell key={col.key} className="font-mono text-xs">
                  {Array.isArray(item[col.key])
                    ? (item[col.key] as any[]).join(', ')
                    : typeof item[col.key] === 'boolean'
                      ? (item[col.key] ? 'Sí' : 'No')
                      : item[col.key]}
                </TableCell>
              ))}
              {actions && <TableCell className="text-right">{actions(item)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export function SchemaViewer({ tables, onAddOperation }: SchemaViewerProps) {
  const { dispatch } = useAppContext();

  const handleAddSimpleOperation = (op: Omit<PlanOperation, 'id' | 'Note'>) => {
    dispatch({ type: 'ADD_OPERATION', payload: op as PlanOperation });
  };

  const handleRenameTable = (table: TableInfo) => {
    onAddOperation({ Scope: 'table', TableFrom: justTable(table), TableTo: '' });
  };

  const handleDropTable = (table: TableInfo) => {
    handleAddSimpleOperation({ Scope: 'drop-table', TableFrom: justTable(table) });
  };

  const handleAddColumn = (table: TableInfo) => {
    onAddOperation({ Scope: 'add-column', TableFrom: justTable(table), ColumnTo: '', Type: '' });
  };

  const handleRenameColumn = (table: TableInfo, column: ColumnInfo) => {
    onAddOperation({ Scope: 'column', TableFrom: justTable(table), ColumnFrom: column.Name, ColumnTo: '' });
  };

  const handleDropColumn = (table: TableInfo, column: ColumnInfo) => {
    handleAddSimpleOperation({ Scope: 'drop-column', TableFrom: justTable(table), ColumnFrom: column.Name });
  };

  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <Accordion type="single" collapsible className="w-full">
      {tables.map((table) => (
        <AccordionItem value={fq(table)} key={fq(table)} className="border-b">
          <AccordionTrigger asChild>
            <div className="flex w-full items-center justify-between gap-2 py-4 font-medium transition-all hover:underline">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-base">{fq(table)}</span>
                <Badge variant="outline">{table.Schema}</Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stopPropagation}>
                     <MoreHorizontal className="h-4 w-4" />
                     <span className="sr-only">Table Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={stopPropagation}>
                  <DropdownMenuItem onClick={() => handleRenameTable(table)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Renombrar Tabla
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddColumn(table)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Columna
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDropTable(table)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Tabla
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </div>
          </AccordionTrigger>

          <AccordionContent className="bg-muted/30 p-4 rounded-md">
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div><span className="font-semibold">Columnas:</span> {table.Columns.length}</div>
              <div><span className="font-semibold">Claves Foráneas:</span> {table.ForeignKeys.length}</div>
              <div><span className="font-semibold">Índices:</span> {table.Indexes.length}</div>
            </div>

            <DetailTable<ColumnInfo>
              data={table.Columns}
              columns={[{ key: 'Name', header: 'Nombre' }, { key: 'SqlType', header: 'Tipo' }]}
              caption="Columnas"
              actions={(column) => (
                <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Column Actions</span>
                      </Button>
                   </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRenameColumn(table, column)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Renombrar Columna
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDropColumn(table, column)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar Columna
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />

            <DetailTable<ForeignKeyInfo>
              data={table.ForeignKeys}
              columns={[
                { key: 'Name', header: 'Nombre' },
                { key: 'FromColumn', header: 'Columna Origen' },
                { key: 'ToTable', header: 'Tabla Destino' },
                { key: 'ToColumn', header: 'Columna Destino' },
              ]}
              caption="Claves Foráneas"
            />

            <DetailTable<IndexInfo>
              data={table.Indexes}
              columns={[
                { key: 'Name', header: 'Nombre' },
                { key: 'IsUnique', header: 'Único' },
                { key: 'Columns', header: 'Columnas' },
              ]}
              caption="Índices"
              actions={undefined}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
