'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, GitMerge } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import * as api from '@/lib/api';
import type { PlanOperation, RenameOp } from '@/lib/types';

// --- Funciones de Sincronización (duplicadas de PlanBuilder para independencia) ---

function hashOp(op: PlanOperation): string {
  const { id, ...rest } = op; // Excluir ID de UI
  const ordered = JSON.stringify(rest, Object.keys(rest).sort());
  let h = 0;
  for (let i = 0; i < ordered.length; i++) {
    h = (h * 31 + ordered.charCodeAt(i)) | 0;
  }
  return String(h);
}

const STORAGE_KEY = (repoKeyOrPath: string) =>
  `dbrefactor.applied.${repoKeyOrPath}`;

function loadAppliedHashes(repo: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const raw = localStorage.getItem(STORAGE_KEY(repo));
  return new Set<string>(raw ? JSON.parse(raw) : []);
}

function saveAppliedHashes(repo: string, set: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY(repo), JSON.stringify([...set]));
}

const toRenameOp = (op: PlanOperation): RenameOp => {
    return {
      scope: op.Scope,
      area: op.Area,
      tableFrom: op.TableFrom,
      tableTo: op.TableTo,
      columnFrom: op.ColumnFrom,
      columnTo: op.ColumnTo,
      type: op.Type,
      note: op.Note,
    };
  };

export function SyncCard() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const { rootKey } = state.options;
  const appliedHashes = useMemo(() => loadAppliedHashes(rootKey), [rootKey]);

  const pendingOperations = useMemo(
    () => state.plan.filter((op) => !appliedHashes.has(hashOp(op))),
    [state.plan, appliedHashes]
  );
  
  const handleSyncAll = async () => {
    if (!state.sessionId) {
      toast({ variant: 'destructive', title: 'No conectado', description: 'Por favor, conéctese a una base de datos primero.' });
      return;
    }
    if (pendingOperations.length === 0) {
      toast({ title: 'Plan al día', description: 'No hay cambios pendientes para sincronizar.' });
      return;
    }
    setIsSyncing(true);
    dispatch({ type: 'SET_RESULTS_LOADING', payload: true });

    const renamesDto = pendingOperations.map(toRenameOp);
    const { useSynonyms, useViews, cqrs } = state.options;
    const plan = { renames: renamesDto };

    try {
      // 1. Aplicar en BD
      const dbResponse = await api.runRefactor({
        sessionId: state.sessionId,
        apply: true,
        rootKey,
        useSynonyms,
        useViews,
        cqrs,
        plan,
      });

      // 2. Aplicar en Código
      const codeFixResponse = await api.runCodeFix({
        rootKey,
        apply: true,
        plan,
      });
      
      dispatch({
        type: 'SET_RESULTS_SUCCESS',
        payload: {
          sql: dbResponse.sql || null,
          codefix: codeFixResponse || null,
          dbLog: dbResponse.dbLog || null,
        },
      });
      
      const newAppliedHashes = new Set(appliedHashes);
      for (const op of pendingOperations) {
        newAppliedHashes.add(hashOp(op));
      }
      saveAppliedHashes(rootKey, newAppliedHashes);

      toast({ title: 'Sincronización Completa', description: 'Los cambios pendientes han sido aplicados en BD y código.' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error desconocido';
      dispatch({ type: 'SET_RESULTS_ERROR', payload: errorMsg });
      toast({ variant: 'destructive', title: 'Error al Sincronizar', description: errorMsg });
    } finally {
      setIsSyncing(false);
    }
  };

  const isLoading = state.results.isLoading || isSyncing;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <GitMerge className="w-6 h-6 text-primary" />
          <CardTitle>Sincronización</CardTitle>
        </div>
        <CardDescription>
          Aplique los cambios pendientes en la base de datos y el repositorio de código.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleSyncAll}
          disabled={isLoading || pendingOperations.length === 0}
          className="w-full"
          title="Aplica los cambios pendientes en la base de datos y en el repositorio de código."
        >
          {isSyncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Sincronizar Cambios ({pendingOperations.length})
        </Button>
      </CardContent>
    </Card>
  );
}
