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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller } from 'react-hook-form';
import type { RenameOp, RenameItemDto } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { useEffect, useState } from 'react';

interface AddOpDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  operation: RenameOp | null;
}

// Usamos el DTO para el formulario, ya que el 'id' es del lado del cliente.
type FormData = RenameItemDto;

// Tipos de datos SQL comunes para el selector
const sqlDataTypes = [
  'int', 'bigint', 'smallint', 'tinyint', 'decimal(18, 2)', 'numeric(18, 2)', 'money',
  'float', 'real',
  'date', 'datetime', 'datetime2', 'smalldatetime', 'time',
  'char(10)', 'varchar(50)', 'varchar(255)', 'varchar(max)', 'text',
  'nchar(10)', 'nvarchar(50)', 'nvarchar(255)', 'nvarchar(max)', 'ntext',
  'binary(50)', 'varbinary(50)', 'varbinary(max)', 'image',
  'bit', 'uniqueidentifier', 'xml',
  'Personalizado'
];

export function AddOpDialog({ isOpen, setIsOpen, operation }: AddOpDialogProps) {
  const { dispatch, state: { schema } } = useAppContext();
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<FormData>();
  
  const scope = watch('Scope');
  const typeSelection = watch('Type');
  const [isCustomType, setIsCustomType] = useState(false);
  const [isForeignKey, setIsForeignKey] = useState(false);

  useEffect(() => {
    if (operation) {
      const { id, ...dto } = operation; // Excluir id del cliente
      reset(dto);
    } else {
      reset({
        Scope: 'table',
        TableFrom: '',
        TableTo: '',
        ColumnFrom: '',
        ColumnTo: '',
        Type: sqlDataTypes[0],
        Note: '',
      });
    }
    setIsForeignKey(false);
    setIsCustomType(false);
  }, [operation, reset, isOpen]);

  useEffect(() => {
    if (typeSelection === 'Personalizado') {
      setIsCustomType(true);
      setValue('Type', ''); // Limpiar para que el usuario escriba
    } else {
      setIsCustomType(false);
    }
  }, [typeSelection, setValue]);
  
  const onSubmit = (data: FormData) => {
    // Si es un tipo personalizado vacío, no se envía
    if (data.Scope === 'add-column' && isCustomType && !data.Type) {
        // Opcional: mostrar error
        return;
    }
      
    if (operation && operation.id) {
      // Es una actualización
      dispatch({ type: 'UPDATE_OPERATION', payload: { ...data, id: operation.id } });
    } else {
      // Es una nueva operación
      dispatch({ type: 'ADD_OPERATION', payload: data as RenameOp });
    }
    setIsOpen(false);
  };

  const renderFields = () => {
    switch (scope) {
      case 'table':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="TableFrom">Tabla Original</Label>
              <Input id="TableFrom" {...register('TableFrom', { required: true })} />
              {errors.TableFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="TableTo">Tabla Nueva</Label>
              <Input id="TableTo" {...register('TableTo', { required: true })} />
              {errors.TableTo && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
          </>
        );
      case 'column':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="TableFrom">Tabla</Label>
              <Input id="TableFrom" {...register('TableFrom', { required: true })} />
              {errors.TableFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ColumnFrom">Columna Original</Label>
              <Input id="ColumnFrom" {...register('ColumnFrom', { required: true })} />
              {errors.ColumnFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ColumnTo">Columna Nueva</Label>
              <Input id="ColumnTo" {...register('ColumnTo', { required: true })} />
              {errors.ColumnTo && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="Type">Tipo (si cambia)</Label>
              <Input id="Type" {...register('Type')} placeholder="ej., nvarchar(255)" />
            </div>
          </>
        );
      case 'add-column':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="TableFrom">Tabla</Label>
              <Input id="TableFrom" {...register('TableFrom', { required: true })} />
               {errors.TableFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ColumnTo">Nombre Nueva Columna</Label>
              <Input id="ColumnTo" {...register('ColumnTo', { required: true })} />
              {errors.ColumnTo && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="Type">Tipo de Columna</Label>
              <Controller
                name="Type"
                control={control}
                rules={{ required: !isCustomType }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {sqlDataTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {isCustomType && (
                <Input
                  {...register('Type', { required: true })}
                  placeholder="Especifique el tipo, ej: nvarchar(max)"
                  className="mt-2"
                />
              )}
               {errors.Type && <p className="text-destructive text-sm">Este campo es requerido</p>}
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
              <Label htmlFor="Scope">Ámbito</Label>
              <Controller
                name="Scope"
                control={control}
                defaultValue="table"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
              <Label htmlFor="Note">Nota (Opcional)</Label>
              <Textarea id="Note" {...register('Note')} />
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
