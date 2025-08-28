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
import type { PlanOperation } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { useEffect, useState } from 'react';
import { Switch } from '../ui/switch';

interface AddOpDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  operation: PlanOperation | null;
}

type FormData = Omit<PlanOperation, 'id'>;

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

const fkOnDeleteActions = ['NO ACTION', 'CASCADE', 'SET NULL', 'SET DEFAULT'];

const stripSchemaPrefix = (tableName: string | undefined | null): string | undefined | null => {
  if (!tableName) return tableName;
  const prefix = 'dbo.';
  if (tableName.toLowerCase().startsWith(prefix)) {
    return tableName.substring(prefix.length);
  }
  return tableName;
};

export function AddOpDialog({ isOpen, setIsOpen, operation }: AddOpDialogProps) {
  const { dispatch } = useAppContext();
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<FormData>();
  
  const scope = watch('Scope');
  const typeSelection = watch('Type');
  const [isCustomType, setIsCustomType] = useState(false);

  const isEditing = !!operation;

  useEffect(() => {
    if (operation) {
      const { id, ...dto } = operation;
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
        Extra: {},
      });
    }
    setIsCustomType(false);
  }, [operation, reset, isOpen]);

  useEffect(() => {
    if (typeSelection === 'Personalizado') {
      setIsCustomType(true);
      setValue('Type', '');
    } else if (typeSelection) { // solo si no es undefined/null
      setIsCustomType(false);
    }
  }, [typeSelection, setValue]);
  
  const onSubmit = (data: FormData) => {
    if (data.Scope === 'add-column' && isCustomType && !data.Type) {
        return;
    }
      
    const cleanedData: PlanOperation = {
      ...(operation || { id: '' }), // Mantener id si se está editando
      ...data,
      TableFrom: stripSchemaPrefix(data.TableFrom) || '',
      TableTo: stripSchemaPrefix(data.TableTo),
    };

    if (operation && operation.id) {
      dispatch({ type: 'UPDATE_OPERATION', payload: cleanedData });
    } else {
      dispatch({ type: 'ADD_OPERATION', payload: cleanedData as any }); // 'id' se añade en el reducer
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
              <Input id="TableFrom" {...register('TableFrom', { required: true })} placeholder="Ej: Brands" disabled={isEditing} />
              {errors.TableFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="TableTo">Tabla Nueva</Label>
              <Input id="TableTo" {...register('TableTo', { required: true })} placeholder="Ej: NewBrands"/>
              {errors.TableTo && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
          </>
        );
      case 'column':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="TableFrom">Tabla</Label>
              <Input id="TableFrom" {...register('TableFrom', { required: true })} placeholder="Ej: Brands" disabled={isEditing} />
              {errors.TableFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ColumnFrom">Columna Original</Label>
              <Input id="ColumnFrom" {...register('ColumnFrom', { required: true })} disabled={isEditing} />
              {errors.ColumnFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ColumnTo">Columna Nueva</Label>
              <Input id="ColumnTo" {...register('ColumnTo', { required: true })} />
              {errors.ColumnTo && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="Type">Tipo (si cambia)</Label>
               <Controller
                name="Type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={(value) => { field.onChange(value); if (value === 'Personalizado') setIsCustomType(true); else setIsCustomType(false); }} value={field.value ?? undefined}>
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
            </div>
          </>
        );
      case 'add-column':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="TableFrom">Tabla</Label>
              <Input id="TableFrom" {...register('TableFrom', { required: true })} placeholder="Ej: Brands" disabled={isEditing} />
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
                  <Select onValueChange={(value) => { field.onChange(value); if (value === 'Personalizado') setIsCustomType(true); else setIsCustomType(false); }} value={field.value ?? undefined}>
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
      case 'add-pk':
        return <>
            <div className="space-y-2">
                <Label htmlFor="TableFrom">Tabla</Label>
                <Input id="TableFrom" {...register('TableFrom', { required: true })} placeholder="Ej: Products" disabled={isEditing} />
                {errors.TableFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="Extra.Name">Nombre de la PK</Label>
                <Input id="Extra.Name" {...register('Extra.Name', { required: true })} placeholder="Ej: PK_Products"/>
                 {errors.Extra?.Name && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="Extra.Columns">Columnas (separadas por coma)</Label>
                <Input id="Extra.Columns" {...register('Extra.Columns', { required: true })} placeholder="Ej: ProductID,StoreID"/>
                 {errors.Extra?.Columns && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
             <div className="flex items-center space-x-2">
                <Controller name="Extra.Clustered" control={control} render={({ field }) => <Switch id="Extra.Clustered" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="Extra.Clustered">Agrupado (Clustered)</Label>
            </div>
        </>;
    case 'add-fk':
        return <>
            <div className="space-y-2">
                <Label htmlFor="TableFrom">Tabla de Origen (Desde)</Label>
                <Input id="TableFrom" {...register('TableFrom', { required: true })} placeholder="Ej: OrderDetails" disabled={isEditing} />
                {errors.TableFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="ColumnFrom">Columna de Origen (Desde)</Label>
                <Input id="ColumnFrom" {...register('ColumnFrom', { required: true })} placeholder="Ej: ProductID" disabled={isEditing} />
                {errors.ColumnFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="Extra.Name">Nombre de la FK</Label>
                <Input id="Extra.Name" {...register('Extra.Name', { required: true })} placeholder="Ej: FK_OrderDetails_Products"/>
                {errors.Extra?.Name && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="Extra.RefTable">Tabla de Referencia (Hacia)</Label>
                <Input id="Extra.RefTable" {...register('Extra.RefTable', { required: true })} placeholder="Ej: Products"/>
                {errors.Extra?.RefTable && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="Extra.RefColumn">Columna de Referencia (Hacia)</Label>
                <Input id="Extra.RefColumn" {...register('Extra.RefColumn', { required: true })} placeholder="Ej: ProductID"/>
                {errors.Extra?.RefColumn && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="Extra.OnDelete">Acción al Eliminar (OnDelete)</Label>
              <Controller
                name="Extra.OnDelete"
                control={control}
                defaultValue="NO ACTION"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fkOnDeleteActions.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
        </>;
    case 'drop-pk':
    case 'drop-fk':
        return <>
            <div className="space-y-2">
                <Label htmlFor="TableFrom">Tabla</Label>
                <Input id="TableFrom" {...register('TableFrom', { required: true })} placeholder="Ej: Products" disabled={isEditing} />
                {errors.TableFrom && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="Extra.Name">Nombre de la Restricción (PK o FK)</Label>
                <Input id="Extra.Name" {...register('Extra.Name', { required: true })} placeholder="Ej: PK_Products" disabled={isEditing} />
                {errors.Extra?.Name && <p className="text-destructive text-sm">Este campo es requerido</p>}
            </div>
        </>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{operation ? 'Editar' : 'Añadir'} Operación</DialogTitle>
            <DialogDescription>
              Complete los detalles para la operación de refactorización.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="Scope">Ámbito</Label>
              <Controller
                name="Scope"
                control={control}
                defaultValue="table"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un ámbito" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Renombrar Tabla</SelectItem>
                      <SelectItem value="column">Renombrar Columna</SelectItem>
                      <SelectItem value="add-column">Añadir Columna</SelectItem>
                      <SelectItem value="add-pk">Añadir PK</SelectItem>
                      <SelectItem value="drop-pk">Eliminar PK</SelectItem>
                      <SelectItem value="add-fk">Añadir FK</SelectItem>
                      <SelectItem value="drop-fk">Eliminar FK</SelectItem>
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
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
