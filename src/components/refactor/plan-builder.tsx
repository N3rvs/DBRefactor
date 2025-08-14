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
  Bot
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
                    Cree su lista de operaciones de refactorización.
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
                  <TableHead>Ámbito</TableHead>
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
                        <Badge variant="secondary">{op.scope}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {op.scope.includes('column')
                          ? `${op.tableFrom}.${op.columnFrom}`
                          : op.tableFrom}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {op.scope.includes('column')
                          ? op.columnTo
                          : op.tableTo}
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
                              className="text-destructive"
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
            <Button variant="outline" onClick={handleSuggestOrder} disabled={isAiLoading || state.plan.length < 2}>
                {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4"/>}
                Sugerir Orden (IA)
            </Button>
            {/* Other action buttons will be added here */}
        </CardFooter>
      </Card>
    </>
  );
}
