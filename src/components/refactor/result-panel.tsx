'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, Eraser } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { Skeleton } from '../ui/skeleton';
import { SqlPreviewTab } from './sql-preview-tab';
import { CodeFixPreviewTab } from './codefix-preview-tab';
import { LogPreviewTab } from './log-preview-tab';
import { Button } from '../ui/button';

export function ResultPanel() {
  const { state, dispatch } = useAppContext();
  const { results } = state;

  const hasResults = results.sql || results.codefix || results.dbLog || results.error;

  const handleClearResults = () => {
    dispatch({ type: 'CLEAR_RESULTS' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-primary" />
              <CardTitle>Resultados</CardTitle>
            </div>
            <CardDescription>
              Previsualice SQL, cambios de código y registros de ejecución aquí.
            </CardDescription>
          </div>
          <Button onClick={handleClearResults} size="sm" variant="outline" disabled={!hasResults || results.isLoading}>
            <Eraser className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {results.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : results.error ? (
          <div className="text-destructive p-4 border border-destructive/50 rounded-md bg-destructive/10">
            <h4 className="font-bold">Error</h4>
            <pre className="font-mono text-sm whitespace-pre-wrap">{results.error}</pre>
          </div>
        ) : !hasResults ? (
          <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
            <p>Ejecute una vista previa o aplique cambios para ver los resultados.</p>
          </div>
        ) : (
          <Tabs defaultValue="sql">
            <TabsList>
              <TabsTrigger value="sql" disabled={!results.sql}>SQL</TabsTrigger>
              <TabsTrigger value="codefix" disabled={!results.codefix}>Corrección de Código</TabsTrigger>
              <TabsTrigger value="log" disabled={!results.dbLog}>Registro BD</TabsTrigger>
            </TabsList>
            <TabsContent value="sql">
                <SqlPreviewTab sql={results.sql} />
            </TabsContent>
            <TabsContent value="codefix">
                <CodeFixPreviewTab codefix={results.codefix} />
            </TabsContent>
            <TabsContent value="log">
                <LogPreviewTab log={results.dbLog} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
