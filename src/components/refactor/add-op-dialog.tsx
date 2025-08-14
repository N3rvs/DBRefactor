'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import type { RenameOp } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { useEffect } from 'react';

interface AddOpDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  operation: RenameOp | null;
}

type FormData = Omit<RenameOp, 'id'>;

export function AddOpDialog({ isOpen, setIsOpen, operation }: AddOpDialogProps) {
  const { dispatch } = useAppContext();
  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormData>();
  const scope = watch('scope');

  useEffect(() => {
    if (operation) {
      reset(operation);
    } else {
      reset({
        scope: 'table',
        tableFrom: '',
        tableTo: '',
        columnFrom: '',
        columnTo: '',
        type: '',
        note: '',
      });
    }
  }, [operation, reset, isOpen]);

  const onSubmit = (data: FormData) => {
    if (operation) {
      dispatch({ type: 'UPDATE_OPERATION', payload: { ...data, id: operation.id } });
    } else {
      dispatch({ type: 'ADD_OPERATION', payload: { ...data, id: Date.now().toString() } });
    }
    setIsOpen(false);
  };

  const renderFields = () => {
    switch (scope) {
      case 'table':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="tableFrom">Tabla Original</Label>
              <Input id="tableFrom" {...register('tableFrom', { required: true })} />
              {errors.tableFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tableTo">Tabla Nueva</Label>
              <Input id="tableTo" {...register('tableTo', { required: true })} />
              {errors.tableTo && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
          </>
        );
      case 'column':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="tableFrom">Tabla</Label>
              <Input id="tableFrom" {...register('tableFrom', { required: true })} />
              {errors.tableFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="columnFrom">Columna Original</Label>
              <Input id="columnFrom" {...register('columnFrom', { required: true })} />
              {errors.columnFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="columnTo">Columna Nueva</Label>
              <Input id="columnTo" {...register('columnTo', { required: true })} />
              {errors.columnTo && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo (si cambia)</Label>
              <Input id="type" {...register('type')} placeholder="ej., nvarchar(255)" />
            </div>
          </>
        );
      case 'add-column':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="tableFrom">Tabla</Label>
              <Input id="tableFrom" {...register('tableFrom', { required: true })} />
               {errors.tableFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="columnTo">Nombre Nueva Columna</Label>
              <Input id="columnTo" {...register('columnTo', { required: true })} />
              {errors.columnTo && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Columna</Label>
              <Input id="type" {...register('type', { required: true })} placeholder="ej., int" />
              {errors.type && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{operation ? 'Editar' : 'Añadir'} Operación</DialogTitle>
            <DialogDescription>
              Complete los detalles para la operación de refactorización.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scope">Ámbito</Label>
              <Controller
                name="scope"
                control={control}
                defaultValue="table"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un ámbito" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Renombrar Tabla</SelectItem>
                      <SelectItem value="column">Renombrar Columna</SelectItem>
                      <SelectItem value="add-column">Añadir Columna</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {renderFields()}
            <div className="space-y-2">
              <Label htmlFor="note">Nota (Opcional)</Label>
              <Textarea id="note" {...register('note')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
