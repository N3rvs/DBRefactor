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
import type { TableInfo, ColumnInfo, FKInfo, IndexInfo, RenameOp } from '@/lib/types';
import { Button } from '../ui/button';
import { MoreHorizontal, Pencil, Plus, Trash2, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useAppContext } from '@/contexts/app-context';

interface SchemaViewerProps {
  tables: TableInfo[];
  onAddOperation: (op: Omit<RenameOp, 'id' | 'note'>) => void;
}

const DetailTable = <T extends { name: string;[key: string]: any }>({
  data,
  columns,
  caption,
  actions
}: {
  data: T[] | undefined;
  columns: { key: keyof T, header: string }[];
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
            {columns.map(col => <TableHead key={String(col.key)}>{col.header}</TableHead>)}
            {actions && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.name}>
                 {columns.map(col => <TableCell key={String(col.key)} className="font-mono text-xs">{item[col.key]}</TableCell>)}
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

  const handleAddSimpleOperation = (op: Omit<RenameOp, 'id' | 'note'>) => {
    dispatch({ type: 'ADD_OPERATION', payload: { ...op, id: Date.now().toString() } });
  }
  
  const handleRenameTable = (table: TableInfo) => {
    onAddOperation({ scope: 'table', tableFrom: table.name, tableTo: '' });
  };

  const handleDropTable = (table: TableInfo) => {
    handleAddSimpleOperation({ scope: 'drop-table', tableFrom: table.name });
  };
  
  const handleAddColumn = (table: TableInfo) => {
    onAddOperation({ scope: 'add-column', tableFrom: table.name, columnTo: '', type: '' });
  };

  const handleRenameColumn = (table: TableInfo, column: ColumnInfo) => {
    onAddOperation({ scope: 'column', tableFrom: table.name, columnFrom: column.name, columnTo: '' });
  };

  const handleDropColumn = (table: TableInfo, column: ColumnInfo) => {
    handleAddSimpleOperation({ scope: 'drop-column', tableFrom: table.name, columnFrom: column.name });
  };
  
  const handleDropIndex = (table: TableInfo, index: IndexInfo) => {
    // We use columnFrom to store the index name for simplicity
    handleAddSimpleOperation({ scope: 'drop-index', tableFrom: table.name, columnFrom: index.name });
  };


  return (
    <Accordion type="single" collapsible className="w-full">
      {tables.map((table) => (
        <AccordionItem value={table.name} key={table.name}>
          <AccordionTrigger>
             <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-base">{table.name}</span>
                    <Badge variant="outline">{table.schema}</Badge>
                </div>
                <div className="flex items-center gap-2 no-underline">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
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
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-muted/30 p-4 rounded-md">
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div><span className="font-semibold">Columnas:</span> {table.columns.length}</div>
                <div><span className="font-semibold">Claves Foráneas:</span> {table.foreignKeys.length}</div>
                <div><span className="font-semibold">Índices:</span> {table.indexes.length}</div>
            </div>

            <DetailTable<ColumnInfo> 
                data={table.columns}
                columns={[{key: 'name', header: 'Nombre'}, {key: 'type', header: 'Tipo'}]}
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
            <DetailTable<FKInfo> 
                data={table.foreignKeys}
                columns={[{key: 'name', header: 'Nombre'}]}
                caption="Claves Foráneas"
            />
             <DetailTable<IndexInfo> 
                data={table.indexes}
                columns={[{key: 'name', header: 'Nombre'}]}
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
