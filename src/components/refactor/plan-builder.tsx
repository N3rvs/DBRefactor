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
  AlertTriangle,
  Eraser,
  Database,
  KeyRound,
  Link,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PlanOperation, RenameOp } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { AddOpDialog } from './add-op-dialog';
import { useToast } from '@/hooks/use-toast';
import { getAiRefactoringSuggestion } from '@/app/actions';
import { AISuggestionDialog } from './ai-suggestion-dialog';
import { ScrollArea } from '../ui/scroll-area';


// --- Funciones de Sincronización ---

// Hash estable para una operación
function hashOp(op: PlanOperation): string {
  const { id, ...rest } = op; // Excluir ID de UI
  // Normalizar claves a un formato consistente (ej: camelCase) antes de hashear
  const normalizedOp: Record<string, any> = {};
  for (const key in rest) {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      normalizedOp[camelKey] = (rest as any)[key];
  }
  const ordered = JSON.stringify(
    normalizedOp,
    Object.keys(normalizedOp).sort()
  );
  let h = 0;
  for (let i = 0; i < ordered.length; i++) {
    h = (h * 31 + ordered.charCodeAt(i)) | 0;
  }
  return String(h);
}

const STORAGE_KEY = (repoKeyOrPath: string) => `dbrefactor.applied.${repoKeyOrPath}`;

function loadAppliedHashes(repo: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const raw = localStorage.getItem(STORAGE_KEY(repo));
  return new Set<string>(raw ? JSON.parse(raw) : []);
}

function saveAppliedHashes(repo: string, set: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY(repo), JSON.stringify([...set]));
}

// --- Componente ---

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
    extra: op.Extra,
  };
};

export function PlanBuilder() {
  const { state, dispatch, runRefactor, runCleanup } = useAppContext();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<PlanOperation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  
  const [isApplying, setIsApplying] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  const { rootKey } = state.options;
  const appliedHashes = useMemo(() => loadAppliedHashes(rootKey), [rootKey]);

  const pendingOperations = useMemo(
    () => state.plan.filter(op => !appliedHashes.has(hashOp(op))),
    [state.plan, appliedHashes]
  );
  
  const hasDestructiveOps = useMemo(
    () => state.plan.some(op => op && op.Scope && (op.Scope.startsWith('drop-') || op.Extra?.AllowDestructive)),
    [state.plan]
  );
  
  const handleAddNew = () => {
    setEditingOp(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (op: PlanOperation) => {
    setEditingOp(op);
    setIsDialogOpen(true);
  };

  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_OPERATION', payload: id });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    dispatch({ type: 'REORDER_OPERATION', payload: { index, direction } });
  };
  
  const handleClearPlan = () => {
    if (window.confirm('¿Está seguro de que desea eliminar todas las operaciones del plan?')) {
      dispatch({ type: 'SET_PLAN', payload: [] });
      toast({ title: 'Plan Limpiado', description: 'Se han eliminado todas las operaciones.' });
    }
  };

  const handlePreview = async () => {
    if (!state.sessionId) {
      toast({ variant: 'destructive', title: 'No conectado', description: 'Por favor, conéctese a una base de datos primero.' });
      return;
    }
    if (pendingOperations.length === 0) {
      toast({ title: 'Plan al día', description: 'No hay operaciones pendientes para previsualizar.' });
      return;
    }
    setIsPreviewing(true);
    dispatch({ type: 'SET_RESULTS_LOADING', payload: true });
    
    const renamesDto = pendingOperations.map(toRenameOp);
    const { useSynonyms, useViews, cqrs } = state.options;
    
    try {
      const response = await runRefactor({
        sessionId: state.sessionId,
        apply: false,
        rootKey,
        useSynonyms,
        useViews,
        cqrs,
        plan: { renames: renamesDto },
      });
      dispatch({
        type: 'SET_RESULTS_SUCCESS',
        payload: {
          sql: response.sql || null,
          codefix: response.codefix || null,
          dbLog: response.dbLog || null,
        },
      });
      toast({ title: 'Previsualización Generada', description: 'Los resultados de los cambios pendientes están listos.' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error desconocido';
      dispatch({ type: 'SET_RESULTS_ERROR', payload: errorMsg });
      toast({ variant: 'destructive', title: 'Operación Fallida', description: errorMsg });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApplyDb = async () => {
    if (!state.sessionId) {
      toast({ variant: 'destructive', title: 'No conectado', description: 'Por favor, conéctese a una base de datos primero.' });
      return;
    }
    if (pendingOperations.length === 0) {
      toast({ title: 'Plan al día', description: 'No hay cambios pendientes para aplicar.' });
      return;
    }
    setIsApplying(true);
    dispatch({ type: 'SET_RESULTS_LOADING', payload: true });

    const renamesDto = pendingOperations.map(toRenameOp);
    const { useSynonyms, useViews, cqrs } = state.options;

    try {
      const response = await runRefactor({
        sessionId: state.sessionId,
        apply: true,
        rootKey,
        useSynonyms,
        useViews,
        cqrs,
        plan: { renames: renamesDto },
      });
      dispatch({
        type: 'SET_RESULTS_SUCCESS',
        payload: {
          sql: response.sql || null,
          codefix: null, // Ignorar codefix en "Aplicar a BD"
          dbLog: response.dbLog || null,
        },
      });
      const newAppliedHashes = new Set(appliedHashes);
      for (const op of pendingOperations) {
        newAppliedHashes.add(hashOp(op));
      }
      saveAppliedHashes(rootKey, newAppliedHashes);
      toast({ title: 'Cambios Aplicados en BD', description: 'Los cambios pendientes han sido aplicados a la base de datos.' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error desconocido';
      dispatch({ type: 'SET_RESULTS_ERROR', payload: errorMsg });
      toast({ variant: 'destructive', title: 'Error al Aplicar en BD', description: errorMsg });
    } finally {
      setIsApplying(false);
    }
  };

  const handleCleanup = async () => {
    if (!state.sessionId) {
        toast({ variant: 'destructive', title: 'No conectado', description: 'Por favor, conéctese a una base de datos primero.' });
        return;
    }
    if (state.plan.length === 0) {
      toast({ title: 'Plan Vacío', description: 'No hay operaciones para limpiar.' });
      return;
    }

    if (hasDestructiveOps) {
        const confirmed = window.confirm(
            "ADVERTENCIA: Esta acción contiene operaciones DESTRUCTIVAS (DROP) y es IRREVERSIBLE.\n\n¿Está seguro de que desea continuar con la limpieza?"
        );
        if (!confirmed) return;
    }

    setIsCleaning(true);
    dispatch({ type: 'SET_RESULTS_LOADING', payload: true });

    const renamesDto = state.plan.map(toRenameOp);
    const { useSynonyms, useViews, cqrs, allowDestructive } = state.options;

    try {
      const response = await runCleanup({
        sessionId: state.sessionId,
        renames: renamesDto,
        useSynonyms,
        useViews,
        cqrs,
        allowDestructive,
      });

      dispatch({
        type: 'SET_RESULTS_SUCCESS',
        payload: {
          sql: response.sql || null,
          codefix: null,
          dbLog: response.log || null,
        },
      });
      toast({ title: 'Limpieza Completada', description: 'Se han eliminado los objetos de compatibilidad y los elementos obsoletos.' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error desconocido';
      dispatch({ type: 'SET_RESULTS_ERROR', payload: errorMsg });
      toast({ variant: 'destructive', title: 'Error en la Limpieza', description: errorMsg });
    } finally {
      setIsCleaning(false);
    }
  };

  const handleSuggestOrder = async () => {
    if (!state.sessionId) {
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
      
      const plainRenames = state.plan.map(({ id, ...rest }) => rest);
      
      const aiResult = await getAiRefactoringSuggestion({
        tables: state.schema.tables,
        renames: plainRenames.map(op => ({ ...op, scope: op.Scope, tableFrom: op.TableFrom, tableTo: op.TableTo, columnFrom: op.ColumnFrom, columnTo: op.ColumnTo, type: op.Type, note: op.Note }))
      });
      
      const newOrderedPlan = aiResult.orderedRenames.map(op => {
        return {
          Scope: op.scope,
          Area: op.area,
          TableFrom: op.tableFrom,
          TableTo: op.tableTo,
          ColumnFrom: op.columnFrom,
          ColumnTo: op.columnTo,
          Type: op.type,
          Note: op.note
        } as PlanOperation;
      });

      dispatch({ type: 'SET_PLAN', payload: newOrderedPlan });
      setAiRationale(aiResult.rationale);

    } catch (err) {
      toast({ variant: 'destructive', title: 'Sugerencia de IA Fallida', description: err instanceof Error ? err.message : 'Ocurrió un error desconocido' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const getScopeBadge = (scope: string, isApplied: boolean) => {
    const baseClasses = isApplied ? 'opacity-50' : '';
    switch (scope) {
      case 'table': return <Badge variant="secondary" className={baseClasses}>Renombrar Tabla</Badge>;
      case 'column': return <Badge variant="secondary" className={baseClasses}>Renombrar Columna</Badge>;
      case 'add-column': return <Badge variant="secondary" className={`${baseClasses} bg-blue-500/20 text-blue-300 border-blue-500/30`}>Añadir Columna</Badge>;
      case 'drop-column': return <Badge variant="destructive" className={baseClasses}>Eliminar Columna</Badge>;
      case 'drop-table': return <Badge variant="destructive" className={baseClasses}>Eliminar Tabla</Badge>;
      case 'drop-index': return <Badge variant="destructive" className={baseClasses}>Eliminar Índice</Badge>;
      case 'add-pk': return <Badge variant="outline" className={`${baseClasses} text-amber-300 border-amber-500/30`}><KeyRound className="mr-1 h-3 w-3" /> Añadir PK</Badge>;
      case 'drop-pk': return <Badge variant="destructive" className={baseClasses}><KeyRound className="mr-1 h-3 w-3" /> Eliminar PK</Badge>;
      case 'add-fk': return <Badge variant="outline" className={`${baseClasses} text-cyan-300 border-cyan-500/30`}><Link className="mr-1 h-3 w-3" /> Añadir FK</Badge>;
      case 'drop-fk': return <Badge variant="destructive" className={baseClasses}><Link className="mr-1 h-3 w-3" /> Eliminar FK</Badge>;
      case 'reorder-column': return <Badge variant="outline" className={`${baseClasses} text-purple-300 border-purple-500/30`}><ChevronsUpDown className="mr-1 h-3 w-3" />Reordenar Col.</Badge>;
      default: return <Badge variant="secondary" className={baseClasses}>{scope}</Badge>;
    }
  }

  const renderFrom = (op: PlanOperation) => {
    const tableFromName = op.TableFrom || '';
    switch (op.Scope) {
      case 'table':
      case 'drop-table':
        return tableFromName;
      case 'column':
      case 'drop-column':
      case 'reorder-column':
        return `${tableFromName}.${op.ColumnFrom}`;
      case 'add-column':
      case 'add-pk':
      case 'drop-pk':
      case 'drop-fk':
        return tableFromName;
      case 'add-fk':
        return `${tableFromName}.${op.ColumnFrom}`;
      case 'drop-index':
        return op.ColumnFrom;
      default:
        return '-';
    }
  }

  const renderTo = (op: PlanOperation) => {
     switch (op.Scope) {
      case 'table':
        return op.TableTo;
      case 'column':
        return op.ColumnTo;
      case 'add-column':
        return `${op.ColumnTo} (${op.Type})`;
      case 'add-pk':
        return `${op.Extra?.Name} (${op.Extra?.Columns})`;
      case 'add-fk':
        return `(${op.Extra?.Name}) → ${op.Extra?.RefTable}.${op.Extra?.RefColumn}`;
      case 'reorder-column':
        return `Pos: ${op.Extra?.Position} (después de ${op.Extra?.After || 'FIRST'})`;
      case 'drop-pk':
      case 'drop-fk':
        return op.Extra?.Name;
      case 'drop-table':
      case 'drop-column':
      case 'drop-index':
        return <span className="text-destructive font-semibold">ELIMINAR</span>;
      default:
        return '-';
    }
  }
  
  const isLoading = state.results.isLoading || isApplying || isCleaning || isAiLoading || isPreviewing;

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
                    Cree y ordene su lista de operaciones. Solo los cambios no aplicados se sincronizarán.
                </CardDescription>
            </div>
             <div className="flex gap-2">
              <Button onClick={handleClearPlan} size="sm" variant="outline" disabled={isLoading || state.plan.length === 0}>
                  <Eraser className="mr-2 h-4 w-4" />
                  Limpiar Plan
              </Button>
              <Button onClick={handleAddNew} size="sm" disabled={isLoading}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Operación
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full pr-4">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Operación</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead>Hasta / Detalles</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead className="w-[50px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.plan.length > 0 ? (
                    state.plan.map((op, index) => {
                      const isApplied = appliedHashes.has(hashOp(op));
                      return (
                      <TableRow key={op.id} className={isApplied ? 'bg-muted/30 text-muted-foreground' : ''}>
                        <TableCell>
                          {getScopeBadge(op.Scope, isApplied)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {renderFrom(op)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {renderTo(op)}
                        </TableCell>
                        <TableCell className="text-sm">{op.Note || '-'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(op)} disabled={isLoading}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemove(op.id)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                disabled={isLoading}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleMove(index, 'up')} disabled={isLoading || index === 0}>
                                <ArrowUp className="mr-2 h-4 w-4" />
                                Mover Arriba
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMove(index, 'down')} disabled={isLoading || index === state.plan.length - 1}>
                                <ArrowDown className="mr-2 h-4 w-4" />
                                Mover Abajo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )})
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
          </ScrollArea>
           {pendingOperations.length === 0 && state.plan.length > 0 && (
             <div className="mt-4 p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5" />
                <p>¡Todo sincronizado! No hay cambios pendientes.</p>
             </div>
           )}
          {hasDestructiveOps && (
            <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-semibold">El plan contiene operaciones destructivas.</p>
                <p className="text-xs">La limpieza de estas operaciones requiere habilitar "Permitir Eliminaciones" en las opciones.</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={handleSuggestOrder} disabled={isLoading || state.plan.length < 2}>
                {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
                Sugerir Orden (IA)
            </Button>
             <Button variant="outline" onClick={handlePreview} disabled={isLoading || pendingOperations.length === 0}>
                {isPreviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4"/>}
                Previsualizar ({pendingOperations.length})
            </Button>
             <Button 
                onClick={handleApplyDb}
                disabled={isLoading || pendingOperations.length === 0}
                title="Aplica los cambios pendientes solo en la base de datos."
            >
                 {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Database className="mr-2 h-4 w-4"/>}
                Aplicar a BD ({pendingOperations.length})
            </Button>
            <Button 
                onClick={handleCleanup}
                disabled={isLoading || state.plan.length === 0 || (hasDestructiveOps && !state.options.allowDestructive)}
                variant="destructive"
                title="Ejecuta la limpieza de objetos de compatibilidad y operaciones destructivas. ¡Esta acción es irreversible!"
            >
                 {isCleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Eraser className="mr-2 h-4 w-4"/>}
                Limpiar
            </Button>
        </CardFooter>
      </Card>
    </>
  );
}
