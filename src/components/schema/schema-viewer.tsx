'use client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

const DetailTable = <T extends { Name: string;[key: string]: any }>({
  data,
  columns,
  caption,
  actions
}: {
  data: T[] | undefined;
  columns: { key: string, header: string }[];
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
            {actions && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.Name}>
                 {columns.map(col => <TableCell key={col.key} className="font-mono text-xs">{item[col.key]}</TableCell>)}
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

  const handleAddSimpleOperation = (op: Omit<RenameOp, 'id' | 'Note'>) => {
    dispatch({ type: 'ADD_OPERATION', payload: op as RenameOp });
  }
  
  const handleRenameTable = (table: TableInfo) => {
    onAddOperation({ Scope: 'table', TableFrom: table.Name, TableTo: '' });
  };

  const handleDropTable = (table: TableInfo) => {
    handleAddSimpleOperation({ Scope: 'drop-table', TableFrom: table.Name });
  };
  
  const handleAddColumn = (table: TableInfo) => {
    onAddOperation({ Scope: 'add-column', TableFrom: table.Name, ColumnTo: '', Type: '' });
  };

  const handleRenameColumn = (table: TableInfo, column: ColumnInfo) => {
    onAddOperation({ Scope: 'column', TableFrom: table.Name, ColumnFrom: column.Name, ColumnTo: '' });
  };

  const handleDropColumn = (table: TableInfo, column: ColumnInfo) => {
    handleAddSimpleOperation({ Scope: 'drop-column', TableFrom: table.Name, ColumnFrom: column.Name });
  };
  
  const handleDropIndex = (table: TableInfo, index: IndexInfo) => {
    // Usamos ColumnFrom para guardar el nombre del índice, ya que no hay campo para ello.
    // El backend debería saber cómo interpretar esto.
    handleAddSimpleOperation({ Scope: 'drop-index', TableFrom: table.Name, ColumnFrom: index.Name });
  };


  return (
    <Accordion type="single" collapsible className="w-full">
      {tables.map((table) => (
        <AccordionItem value={table.Name} key={table.Name}>
          <AccordionTrigger>
            <div className="flex items-center gap-4">
                <span className="font-semibold text-base">{table.Name}</span>
                <Badge variant="outline">{table.Schema}</Badge>
            </div>
            <div className="flex items-center gap-2 no-underline">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()} // Detener la propagación
                            >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
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
                    <DropdownMenuItem onClick={() => handleDropTable(table)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Tabla
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
                columns={[{key: 'Name', header: 'Nombre'}, {key: 'SqlType', header: 'Tipo'}]}
                caption="Columnas"
                actions={(column) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => handleRenameColumn(table, column)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Renombrar Columna
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleDropColumn(table, column)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
                  {key: 'Name', header: 'Nombre'}, 
                  {key: 'FromColumn', header: 'Columna Origen'},
                  {key: 'ToTable', header: 'Tabla Destino'},
                  {key: 'ToColumn', header: 'Columna Destino'},
                ]}
                caption="Claves Foráneas"
            />
             <DetailTable<IndexInfo> 
                data={table.Indexes}
                columns={[{key: 'Name', header: 'Nombre'}, {key: 'IsUnique', header: 'Único'}, {key: 'Columns', header: 'Columnas'}]}
                caption="Índices"
                actions={(index) => (
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => handleDropIndex(table, index)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Índice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
