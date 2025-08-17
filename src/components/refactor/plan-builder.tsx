'use client';

import { useState, useMemo } from 'react';
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
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RenameOp, RenameItemDto } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { AddOpDialog } from './add-op-dialog';
import { useToast } from '@/hooks/use-toast';
import { getAiRefactoringSuggestion } from '@/app/actions';
import * as api from '@/lib/api';
import { AISuggestionDialog } from './ai-suggestion-dialog';

const stripSchemaPrefix = (tableName: string | undefined | null): string => {
  if (!tableName) return '';
  const name = String(tableName);
  return name.toLowerCase().startsWith('dbo.') ? name.substring(4) : name;
};

// Convierte el objeto de estado (PascalCase) a un DTO para la API (camelCase)
const toRenameItemDto = (op: RenameOp): RenameItemDto => {
  return {
    scope: op.Scope,
    area: op.Area || 'both',
    tableFrom: stripSchemaPrefix(op.TableFrom),
    tableTo: stripSchemaPrefix(op.TableTo) || null,
    columnFrom: op.ColumnFrom || null,
    columnTo: op.ColumnTo || null,
    type: op.Type || null,
    note: op.Note || null,
    default: op.Default || null,
    nullable: op.Nullable === undefined ? null : op.Nullable,
    length: op.Length === undefined ? null : op.Length,
    precision: op.Precision === undefined ? null : op.Precision,
    scale: op.Scale === undefined ? null : op.Scale,
    computed: op.Computed === undefined ? null : op.Computed,
  };
};

export function PlanBuilder() {
  const { state, dispatch, dbSession } = useAppContext();
  const { sessionId } = dbSession;
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<RenameOp | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  const hasDestructiveOps = useMemo(
    () => state.plan.some(op => op.Scope.startsWith('drop-')),
    [state.plan]
  );

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
  
  const handleAction = async (actionType: 'preview' | 'apply' | 'cleanup') => {
    if (!sessionId) {
      toast({ variant: 'destructive', title: 'No conectado', description: 'Por favor, conéctese a una base de datos primero.' });
      return;
    }
    if (state.plan.length === 0) {
      toast({ title: 'Plan Vacío', description: 'Agregue al menos una operación al plan.' });
      return;
    }

    dispatch({ type: 'SET_RESULTS_LOADING', payload: true });
    
    const renamesDto = state.plan.map(toRenameItemDto);
    const { rootKey, useSynonyms, useViews, cqrs, allowDestructive } = state.options;

    try {
      if (actionType === 'apply' || actionType === 'preview') {
        const isApply = actionType === 'apply';
        
        // Payload para /refactor/run, todo en camelCase
        const runPayload = {
          sessionId,
          apply: isApply,
          rootKey,
          useSynonyms,
          useViews,
          cqrs,
          allowDestructive,
          plan: {
            renames: renamesDto, // <--- Anidado aquí
          },
        };

        const response = await api.runRefactor(runPayload);
        dispatch({
          type: 'SET_RESULTS_SUCCESS',
          payload: {
            sql: response.sql || null,
            codefix: response.codefix || null,
            dbLog: response.dbLog || null,
          },
        });
        toast({ title: isApply ? 'Plan Aplicado' : 'Previsualización Generada', description: isApply ? 'Los cambios han sido aplicados.' : 'Los resultados de la previsualización están listos.' });
      
      } else if (actionType === 'cleanup') {
        // Payload para /apply/cleanup, todo en camelCase y plano
        const cleanupPayload = {
          sessionId,
          renames: renamesDto,
          useSynonyms,
          useViews,
          cqrs,
          allowDestructive,
        };
        const response = await api.runCleanup(cleanupPayload);
        dispatch({
          type: 'SET_RESULTS_SUCCESS',
          payload: {
            sql: response.sql || null,
            codefix: null,
            dbLog: response.log || null,
          },
        });
        toast({ title: 'Limpieza Completada', description: 'Los objetos de compatibilidad han sido procesados.' });
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
      if (!state.schema.tables) {
         toast({ variant: 'destructive', title: 'Esquema no cargado', description: 'No se puede sugerir un orden sin el esquema de la base de datos.' });
         return;
      }
      
      // La acción de IA espera las claves en PascalCase como en el estado
      const plainRenames = state.plan.map(({ id, ...rest }) => rest);
      
      const aiResult = await getAiRefactoringSuggestion({
        tables: state.schema.tables,
        renames: plainRenames,
      });

      const newOrderedPlan = aiResult.orderedRenames.map(op => {
        // La respuesta de la IA viene sin id, la añadimos en el reducer
        return op as RenameOp;
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
      case 'add-column': return <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">Añadir Columna</Badge>;
      case 'drop-column': return <Badge variant="destructive">Eliminar Columna</Badge>;
      case 'drop-table': return <Badge variant="destructive">Eliminar Tabla</Badge>;
      case 'drop-index': return <Badge variant="destructive">Eliminar Índice</Badge>;
      default: return <Badge variant="secondary">{scope}</Badge>;
    }
  }

  const renderFrom = (op: RenameOp) => {
    switch (op.Scope) {
      case 'table':
      case 'drop-table':
        return op.TableFrom;
      case 'column':
      case 'drop-column':
        return `${op.TableFrom}.${op.ColumnFrom}`;
      case 'add-column':
        return op.TableFrom;
      case 'drop-index':
        return op.ColumnFrom; // Usando columnFrom para el nombre del índice
      default:
        return '-';
    }
  }

  const renderTo = (op: RenameOp) => {
     switch (op.Scope) {
      case 'table':
        return op.TableTo;
      case 'column':
        return op.ColumnTo;
      case 'add-column':
        return `${op.ColumnTo} (${op.Type})`;
      case 'drop-table':
      case 'drop-column':
      case 'drop-index':
        return <span className="text-destructive font-semibold">ELIMINAR</span>;
      default:
        return '-';
    }
  }

  const applyButtonVariant = hasDestructiveOps ? "destructive" : "default";

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
                        {getScopeBadge(op.Scope)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {renderFrom(op)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {renderTo(op)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{op.Note || '-'}</TableCell>
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
          {hasDestructiveOps && (
            <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-semibold">El plan contiene operaciones destructivas.</p>
                <p className="text-xs">Asegúrese de que "Permitir Eliminaciones" esté habilitado en las opciones antes de aplicar.</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={handleSuggestOrder} disabled={isAiLoading || state.plan.length < 2 || state.results.isLoading}>
                {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
                Sugerir Orden (IA)
            </Button>
             <Button variant="outline" onClick={() => handleAction('preview')} disabled={state.results.isLoading || state.plan.length === 0}>
                {state.results.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                <Play className="mr-2 h-4 w-4"/>
                Previsualizar Plan
            </Button>
            <Button 
                onClick={() => handleAction('apply')}
                disabled={state.results.isLoading || state.plan.length === 0}
                variant={applyButtonVariant}
            >
                 {state.results.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                 <ClipboardCheck className="mr-2 h-4 w-4"/>
                Aplicar Plan
            </Button>
            <Button 
                variant={"outline"} 
                onClick={() => handleAction('cleanup')} 
                disabled={state.results.isLoading || state.plan.length === 0}
                title="Elimina objetos de compatibilidad (sinónimos, vistas) creados en el paso de 'Aplicar'."
            >
                 {state.results.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                 <Sparkles className="mr-2 h-4 w-4"/>
                Limpiar Objetos de Compatibilidad
            </Button>
        </CardFooter>
      </Card>
    </>
  );
}
