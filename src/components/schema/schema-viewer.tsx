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
import { MoreHorizontal, Pencil, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

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
  
  const handleRenameTable = (table: TableInfo) => {
    onAddOperation({ scope: 'table', tableFrom: table.name, tableTo: '' });
  };
  
  const handleAddColumn = (table: TableInfo) => {
    onAddOperation({ scope: 'add-column', tableFrom: table.name, columnTo: '', type: '' });
  };

  const handleRenameColumn = (table: TableInfo, column: ColumnInfo) => {
    onAddOperation({ scope: 'column', tableFrom: table.name, columnFrom: column.name, columnTo: '' });
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
               <div onClick={(e) => e.stopPropagation()} className="mr-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRenameTable(table)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Renombrar Tabla
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handleAddColumn(table)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir Columna
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRenameColumn(table, column)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Renombrar Columna
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
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
