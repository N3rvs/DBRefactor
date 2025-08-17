'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, ServerCrash, Table2 } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { SchemaViewer } from '@/components/schema/schema-viewer';
import { AddOpDialog } from './add-op-dialog';
import type { PlanOperation } from '@/lib/types';

export function SchemaCard() {
  const { state, refreshSchema } = useAppContext();
  const { connectionString, schema } = state;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<PlanOperation | null>(null);

  useEffect(() => {
    if (!connectionString) return;
    refreshSchema().catch(err => console.error('Error al analizar esquema:', err));
  }, [connectionString, refreshSchema]);

  const handleAddOperation = (op: Partial<Omit<PlanOperation, 'id' | 'Note'>>) => {
    const newOperation: Partial<PlanOperation> = {
      ...op,
      TableTo: op.Scope === 'table' ? '' : undefined,
      ColumnFrom: op.Scope === 'column' ? op.ColumnFrom : undefined,
      ColumnTo: op.Scope?.includes('column') ? '' : undefined,
      Type: op.Scope === 'add-column' ? '' : undefined,
    };
    setEditingOp(newOperation as PlanOperation);
    setIsDialogOpen(true);
  };

  return (
    <>
      <AddOpDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} operation={editingOp} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-primary" />
            <CardTitle>Esquema de Base de Datos</CardTitle>
          </div>
          <CardDescription>Vea las tablas, columnas y claves de su base de datos conectada.</CardDescription>
        </CardHeader>

        <CardContent>
          {!connectionString ? (
            <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
              <p>Conéctese a una base de datos para ver su esquema.</p>
            </div>
          ) : schema.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : schema.error ? (
            <div className="text-center text-destructive p-8 border-dashed border-2 border-destructive/50 rounded-md">
              <ServerCrash className="mx-auto h-12 w-12 mb-4" />
              <p className="font-semibold">Error al cargar el esquema</p>
              <p className="text-sm">{schema.error}</p>
            </div>
          ) : schema.tables && schema.tables.length > 0 ? (
            <SchemaViewer tables={schema.tables} onAddOperation={handleAddOperation} />
          ) : (
            <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
              <Table2 className="mx-auto h-12 w-12 mb-4" />
              <p>No se encontraron tablas en la base de datos o el esquema está vacío.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
