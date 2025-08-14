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
import type { TableInfo, ColumnInfo, FKInfo, IndexInfo } from '@/lib/types';

interface SchemaViewerProps {
  tables: TableInfo[];
}

const DetailTable = <T extends { name: string;[key: string]: any }>({
  data,
  columns,
  caption,
}: {
  data: T[] | undefined;
  columns: { key: keyof T, header: string }[];
  caption: string;
}) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground mt-2">{caption} not found.</p>;
  }
  return (
    <div className="my-4">
      <h4 className="font-semibold text-sm mb-2">{caption}</h4>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => <TableHead key={String(col.key)}>{col.header}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.name}>
                 {columns.map(col => <TableCell key={String(col.key)} className="font-mono text-xs">{item[col.key]}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export function SchemaViewer({ tables }: SchemaViewerProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {tables.map((table) => (
        <AccordionItem value={table.name} key={table.name}>
          <AccordionTrigger>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-base">{table.name}</span>
              <Badge variant="outline">{table.schema}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-muted/30 p-4 rounded-md">
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div><span className="font-semibold">Columns:</span> {table.columns.length}</div>
                <div><span className="font-semibold">Foreign Keys:</span> {table.foreignKeys.length}</div>
                <div><span className="font-semibold">Indexes:</span> {table.indexes.length}</div>
            </div>

            <DetailTable<ColumnInfo> 
                data={table.columns}
                columns={[{key: 'name', header: 'Name'}, {key: 'type', header: 'Type'}]}
                caption="Columns"
            />
            <DetailTable<FKInfo> 
                data={table.foreignKeys}
                columns={[{key: 'name', header: 'Name'}]}
                caption="Foreign Keys"
            />
             <DetailTable<IndexInfo> 
                data={table.indexes}
                columns={[{key: 'name', header: 'Name'}]}
                caption="Indexes"
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
