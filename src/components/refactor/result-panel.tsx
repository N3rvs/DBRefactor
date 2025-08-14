'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { Skeleton } from '../ui/skeleton';
import { SqlPreviewTab } from './sql-preview-tab';
import { CodeFixPreviewTab } from './codefix-preview-tab';
import { LogPreviewTab } from './log-preview-tab';

export function ResultPanel() {
  const { state } = useAppContext();
  const { results } = state;

  const hasResults = results.sql || results.codefix || results.dbLog;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-6 h-6 text-primary" />
          <CardTitle>Results</CardTitle>
        </div>
        <CardDescription>
          Preview SQL, code changes, and execution logs here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {results.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : results.error ? (
          <div className="text-destructive p-4 border border-destructive/50 rounded-md">
            <h4 className="font-bold">Error</h4>
            <p>{results.error}</p>
          </div>
        ) : !hasResults ? (
          <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
            <p>Run a preview or apply changes to see results.</p>
          </div>
        ) : (
          <Tabs defaultValue="sql">
            <TabsList>
              <TabsTrigger value="sql" disabled={!results.sql}>SQL</TabsTrigger>
              <TabsTrigger value="codefix" disabled={!results.codefix}>CodeFix</TabsTrigger>
              <TabsTrigger value="log" disabled={!results.dbLog}>DB Log</TabsTrigger>
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
