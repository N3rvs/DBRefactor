'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  PlusCircle,
  Pencil,
  Trash2,
  ListOrdered,
  Loader2,
  Bot,
  Play,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RenameOp } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { AddOpDialog } from './add-op-dialog';
import { useToast } from '@/hooks/use-toast';
import { getAiRefactoringSuggestion } from '@/app/actions';
import * as api from '@/lib/api';
import { AISuggestionDialog } from './ai-suggestion-dialog';

export function PlanBuilder() {
  const { state, dispatch, dbSession } = useAppContext();
  const { sessionId } = dbSession;
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<RenameOp | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  const handleAddNew = () => {
    setEditingOp(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (op: RenameOp) => {
    setEditingOp(op);
    setIsDialogOpen(true);
  };

  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_OPERATION', payload: id });
  };
  
  const handleAction = async (apply: boolean, cleanup: boolean = false) => {
    if (!sessionId) {
      toast({ variant: 'destructive', title: 'No conectado', description: 'Por favor, conéctese a una base de datos primero.' });
      return;
    }
    if (state.plan.length === 0) {
      toast({ title: 'Plan Vacío', description: 'Agregue al menos una operación al plan.' });
      return;
    }

    dispatch({ type: 'SET_RESULTS_LOADING', payload: true });
    try {
      const plainRenames = state.plan.map(({ id, ...rest }) => rest);
      let response;
      const { rootKey, useSynonyms, useViews, cqrs } = state.options;

      if (cleanup) {
        response = await api.runCleanup({ sessionId, renames: plainRenames });
        dispatch({
          type: 'SET_RESULTS_SUCCESS',
          payload: {
            sql: response.sql,
            codefix: null,
            dbLog: response.log,
          },
        });
        toast({ title: 'Limpieza Completada', description: 'Los objetos de compatibilidad han sido eliminados.' });

      } else {
         response = await api.runRefactor({
          sessionId,
          plan: { renames: plainRenames },
          apply,
          rootKey,
          useSynonyms,
          useViews,
          cqrs
        });
        dispatch({
          type: 'SET_RESULTS_SUCCESS',
          payload: {
            sql: response.sql,
            codefix: response.codefix,
            dbLog: response.dbLog || null,
          },
        });
        toast({ title: apply ? 'Plan Aplicado' : 'Previsualización Generada', description: apply ? 'Los cambios han sido aplicados.' : 'Los resultados de la previsualización están listos.' });
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error desconocido';
      dispatch({ type: 'SET_RESULTS_ERROR', payload: errorMsg });
      toast({ variant: 'destructive', title: 'Operación Fallida', description: errorMsg });
    }
  };

  const handleSuggestOrder = async () => {
    if (!sessionId) {
      toast({ variant: 'destructive', title: 'No conectado', description: 'Por favor, conéctese a una base de datos primero.' });
      return;
    }
     if (state.plan.length < 2) {
      toast({ title: 'No hay suficientes operaciones', description: 'Agregue al menos dos operaciones para sugerir un orden.' });
      return;
    }
    setIsAiLoading(true);
    try {
      const schema = await api.analyzeSchemaBySession({ sessionId });
      const plainRenames = state.plan.map(({ id, ...rest }) => rest);
      
      const aiResult = await getAiRefactoringSuggestion({
        tables: schema.tables,
        renames: plainRenames,
      });

      const newOrderedPlan = aiResult.orderedRenames.map((op, index) => {
        const originalOp = state.plan.find(p => p.tableFrom === op.tableFrom && p.columnFrom === op.columnFrom && p.tableTo === op.tableTo && p.columnTo === op.columnTo);
        return {
          ...op,
          id: originalOp?.id || `${Date.now()}-${index}`,
        } as RenameOp;
      });

      dispatch({ type: 'SET_PLAN', payload: newOrderedPlan });
      setAiRationale(aiResult.rationale);

    } catch (err) {
      toast({ variant: 'destructive', title: 'Sugerencia de IA Fallida', description: err instanceof Error ? err.message : 'Ocurrió un error desconocido' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case 'table': return <Badge variant="secondary">Renombrar Tabla</Badge>;
      case 'column': return <Badge variant="secondary">Renombrar Columna</Badge>;
      case 'add-column': return <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">Añadir Columna</Badge>;
      case 'drop-column': return <Badge variant="destructive">Eliminar Columna</Badge>;
      case 'drop-table': return <Badge variant="destructive">Eliminar Tabla</Badge>;
      case 'drop-index': return <Badge variant="destructive">Eliminar Índice</Badge>;
      default: return <Badge variant="secondary">{scope}</Badge>;
    }
  }

  const renderFrom = (op: RenameOp) => {
    switch (op.scope) {
      case 'table':
      case 'drop-table':
        return op.tableFrom;
      case 'column':
      case 'drop-column':
        return `${op.tableFrom}.${op.columnFrom}`;
      case 'add-column':
        return op.tableFrom;
      case 'drop-index':
        return op.columnFrom; // Using columnFrom for index name
      default:
        return '-';
    }
  }

  const renderTo = (op: RenameOp) => {
     switch (op.scope) {
      case 'table':
        return op.tableTo;
      case 'column':
        return op.columnTo;
      case 'add-column':
        return `${op.columnTo} (${op.type})`;
      case 'drop-table':
      case 'drop-column':
      case 'drop-index':
        return <span className="text-destructive font-semibold">ELIMINAR</span>;
      default:
        return '-';
    }
  }


  return (
    <>
      <AddOpDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        operation={editingOp}
      />
      {aiRationale && <AISuggestionDialog isOpen={!!aiRationale} setIsOpen={() => setAiRationale(null)} rationale={aiRationale} />}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3">
                    <ListOrdered className="w-6 h-6 text-primary" />
                    <CardTitle>Plan de Refactorización</CardTitle>
                </div>
                <CardDescription>
                    Cree y ordene su lista de operaciones de refactorización.
                </CardDescription>
            </div>
            <Button onClick={handleAddNew} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Operación
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operación</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead>Hasta</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead className="w-[50px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.plan.length > 0 ? (
                  state.plan.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell>
                        {getScopeBadge(op.scope)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {renderFrom(op)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {renderTo(op)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{op.note || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(op)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemove(op.id)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Aún no se han añadido operaciones.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={handleSuggestOrder} disabled={isAiLoading || state.plan.length < 2 || state.results.isLoading}>
                {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
                Sugerir Orden (IA)
            </Button>
             <Button variant="outline" onClick={() => handleAction(false)} disabled={state.results.isLoading}>
                {state.results.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4"/>}
                Previsualizar Plan
            </Button>
            <Button onClick={() => handleAction(true)} disabled={state.results.isLoading}>
                 {state.results.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ClipboardCheck className="mr-2 h-4 w-4"/>}
                Aplicar Plan
            </Button>
            <Button variant="destructive" onClick={() => handleAction(false, true)} disabled={state.results.isLoading}>
                 {state.results.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                Limpiar
            </Button>
        </CardFooter>
      </Card>
    </>
  );
}
