'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useDbSession } from '@/hooks/use-db-session';
import { Database, Loader2 } from 'lucide-react';
import * as api from '@/lib/api';
import { useAppContext } from '@/contexts/app-context';
import { SchemaViewer } from '@/components/schema/schema-viewer';
import { Skeleton } from '@/components/ui/skeleton';

export default function SchemaPage() {
  const { toast } = useToast();
  const { sessionId } = useDbSession();
  const { state, dispatch } = useAppContext();
  const { schema } = state;

  const handleAnalyze = async () => {
    if (!sessionId) {
      toast({ variant: 'destructive', title: 'No Conectado', description: 'Por favor, conéctese primero a una base de datos en la página de Refactorización.' });
      return;
    }
    dispatch({ type: 'SET_SCHEMA_LOADING', payload: true });
    try {
      const response = await api.analyzeSchemaBySession({ sessionId });
      dispatch({ type: 'SET_SCHEMA_SUCCESS', payload: response.tables });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al analizar el esquema.';
      dispatch({ type: 'SET_SCHEMA_ERROR', payload: errorMsg });
      toast({ variant: 'destructive', title: 'Análisis Fallido', description: errorMsg });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-primary" />
                <CardTitle>Analizador de Esquema</CardTitle>
              </div>
              <CardDescription>
                Vea las tablas, columnas y claves de su base de datos conectada.
              </CardDescription>
            </div>
            <Button onClick={handleAnalyze} disabled={schema.isLoading || !sessionId}>
              {schema.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analizar Esquema
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {schema.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : schema.error ? (
             <div className="text-center text-destructive p-8 border-dashed border-2 border-destructive/50 rounded-md">
                <p className="font-semibold">Error al cargar el esquema</p>
                <p className="text-sm">{schema.error}</p>
            </div>
          ) : schema.tables ? (
            <SchemaViewer tables={schema.tables} />
          ) : (
            <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
              <p>Haga clic en "Analizar Esquema" para ver la estructura de su base de datos.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
