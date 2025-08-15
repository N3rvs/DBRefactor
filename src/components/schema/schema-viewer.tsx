'use client';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { TableInfo, ColumnInfo, ForeignKeyInfo, IndexInfo, RenameOp } from '@/lib/types';
import { Button } from '../ui/button';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useAppContext } from '@/contexts/app-context';

interface SchemaViewerProps {
  tables: TableInfo[];
  onAddOperation: (op: Partial<Omit<RenameOp, 'id'>>) => void;
}

const fq = (t: TableInfo) => `${t.Schema}.${t.Name}`;

const DetailTable = <T extends { Name: string; [key: string]: any }>({
  data, columns, caption, actions,
}: {
  data: T[] | undefined;
  columns: { key: string; header: string; className?: string }[];
  caption: string;
  actions?: (item: T) => React.ReactNode;
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="my-4">
        <h4 className="font-semibold text-base mb-2">{caption}</h4>
        <p className="text-sm text-muted-foreground mt-2 px-2">No se encontraron {caption.toLowerCase()}.</p>
      </div>
    )
  }
  return (
    <div className="my-4">
      <h4 className="font-semibold text-base mb-2">{caption}</h4>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => <TableHead key={col.key} className={col.className}>{col.header}</TableHead>)}
              {actions && <TableHead className="w-[50px] text-right" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.Name}>
                {columns.map(col => (
                  <TableCell key={col.key} className="font-mono text-xs">
                    {Array.isArray(item[col.key]) ? (item[col.key] as any[]).join(', ')
                      : typeof item[col.key] === 'boolean' ? (item[col.key] ? 'Sí' : 'No')
                      : item[col.key]}
                  </TableCell>
                ))}
                {actions && <TableCell className="text-right">{actions(item)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export function SchemaViewer({ tables, onAddOperation }: SchemaViewerProps) {
  const { dispatch } = useAppContext();

  const handleAddSimpleOperation = (op: Omit<RenameOp, 'id' | 'Note'>) => {
    dispatch({ type: 'ADD_OPERATION', payload: op as RenameOp });
  };

  const handleRenameTable = (table: TableInfo) => {
    onAddOperation({ Scope: 'table', TableFrom: fq(table), TableTo: '' });
  };

  const handleDropTable = (table: TableInfo) => {
    handleAddSimpleOperation({ Scope: 'drop-table', TableFrom: fq(table) });
  };

  const handleAddColumn = (table: TableInfo) => {
    onAddOperation({ Scope: 'add-column', TableFrom: fq(table), ColumnTo: '', Type: '' });
  };

  const handleRenameColumn = (table: TableInfo, column: ColumnInfo) => {
    onAddOperation({ Scope: 'column', TableFrom: fq(table), ColumnFrom: column.Name, ColumnTo: '' });
  };

  const handleDropColumn = (table: TableInfo, column: ColumnInfo) => {
    handleAddSimpleOperation({ Scope: 'drop-column', TableFrom: fq(table), ColumnFrom: column.Name });
  };

  // helpers para evitar que el click del menú dispare el toggle del acordeón
  const stopToggle = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent?.preventDefault?.();
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      {tables.map((table) => (
        <AccordionItem value={fq(table)} key={fq(table)} className="border-b">
          <AccordionTrigger className="flex w-full items-center justify-between py-4 font-medium hover:underline [&[data-state=open]>svg]:rotate-180">
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-base">{fq(table)}</span>
                <Badge variant="outline">{table.Schema}</Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={stopToggle}
                    onPointerDown={stopToggle}
                    onKeyDown={stopToggle}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted no-underline"
                    aria-label="Acciones de tabla"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
            </div>
          </AccordionTrigger>

          <AccordionContent className="bg-muted/20 p-4 rounded-md border">
            <div className="grid grid-cols-3 gap-4 text-sm mb-4 border-b pb-4">
              <div><span className="font-semibold text-muted-foreground">Columnas:</span> {table.Columns.length}</div>
              <div><span className="font-semibold text-muted-foreground">Claves Foráneas:</span> {table.ForeignKeys.length}</div>
              <div><span className="font-semibold text-muted-foreground">Índices:</span> {table.Indexes.length}</div>
            </div>

            <DetailTable<ColumnInfo>
              data={table.Columns}
              columns={[
                { key: 'Name', header: 'Nombre', className: 'w-[40%]' },
                { key: 'SqlType', header: 'Tipo', className: 'w-[40%]' }
              ]}
              caption="Columnas"
              actions={(column) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                      aria-label="Acciones de columna"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
