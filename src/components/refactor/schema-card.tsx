'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/app-context';
import { SchemaViewer } from '@/components/schema/schema-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, ServerCrash, Table2 } from 'lucide-react';
import { useDbSession } from '@/hooks/use-db-session';


export function SchemaCard() {
  const { state } = useAppContext();
  const { sessionId } = useDbSession();
  const { schema } = state;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-primary" />
          <CardTitle>Esquema de Base de Datos</CardTitle>
        </div>
        <CardDescription>
            Vea las tablas, columnas y claves de su base de datos conectada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!sessionId ? (
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
          <SchemaViewer tables={schema.tables} />
        ) : (
          <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
            <Table2 className="mx-auto h-12 w-12 mb-4" />
            <p>No se encontraron tablas en la base de datos o el esquema está vacío.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
