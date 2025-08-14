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
import { useEffect, useState } from 'react';
import { Checkbox } from '../ui/checkbox';

interface AddOpDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  operation: RenameOp | null;
}

type FormData = Omit<RenameOp, 'id'>;

const commonSqlTypes = [
  'varchar(255)', 'int', 'bigint', 'decimal(18, 2)', 'bit', 
  'datetime', 'date', 'text', 'nvarchar(max)', 'uniqueidentifier'
];


export function AddOpDialog({ isOpen, setIsOpen, operation }: AddOpDialogProps) {
  const { state, dispatch } = useAppContext();
  const { schema } = state;
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<FormData>();
  const scope = watch('scope');
  const isForeignKey = watch('foreignKey.isForeignKey');
  const referencedTable = watch('foreignKey.referencesTable');
  
  const [customType, setCustomType] = useState('');
  const columnType = watch('type');

  useEffect(() => {
    if (operation) {
      reset(operation);
       if (operation.type && !commonSqlTypes.includes(operation.type)) {
        setValue('type', 'custom');
        setCustomType(operation.type);
      }
    } else {
      reset({
        scope: 'table',
        tableFrom: '',
        tableTo: '',
        columnFrom: '',
        columnTo: '',
        type: '',
        note: '',
        foreignKey: {
          isForeignKey: false,
          referencesTable: '',
          referencesColumn: ''
        }
      });
      setCustomType('');
    }
  }, [operation, reset, isOpen, setValue]);
  
  useEffect(() => {
    if (columnType === 'custom') {
      setValue('type', customType);
    }
  }, [customType, columnType, setValue])


  const onSubmit = (data: FormData) => {
    let finalData = { ...data };
    if (data.type === 'custom') {
      finalData.type = customType;
    }
     if (!finalData.foreignKey?.isForeignKey) {
      finalData.foreignKey = undefined;
    }

    if (operation) {
      dispatch({ type: 'UPDATE_OPERATION', payload: { ...finalData, id: operation.id } });
    } else {
      dispatch({ type: 'ADD_OPERATION', payload: { ...finalData, id: Date.now().toString() } });
    }
    setIsOpen(false);
  };
  
  const referencedColumns = schema.tables?.find(t => t.name === referencedTable)?.columns || [];

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
              <Controller
                name="type"
                control={control}
                rules={{ required: "Este campo es requerido" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonSqlTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      <SelectItem value="custom">Personalizado...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {columnType === 'custom' && (
                <Input 
                  className="mt-2"
                  placeholder="Escriba el tipo personalizado"
                  value={customType}
                  onChange={e => setCustomType(e.target.value)}
                  required
                />
              )}
              {errors.type && <p className="text-destructive text-sm">{errors.type.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Controller
                    name="foreignKey.isForeignKey"
                    control={control}
                    render={({ field }) => (
                      <Checkbox id="isForeignKey" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                />
                <Label htmlFor="isForeignKey">Es Clave Foránea</Label>
              </div>
            </div>

            {isForeignKey && (
              <>
                <div className="space-y-2 pl-6 border-l-2 ml-2">
                  <Label htmlFor="referencesTable">Tabla Referenciada</Label>
                   <Controller
                    name="foreignKey.referencesTable"
                    control={control}
                    rules={{ required: isForeignKey ? 'Este campo es requerido' : false }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una tabla" />
                        </SelectTrigger>
                        <SelectContent>
                          {schema.tables?.map(table => (
                            <SelectItem key={table.name} value={table.name}>{table.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.foreignKey?.referencesTable && <p className="text-destructive text-sm">{errors.foreignKey.referencesTable.message}</p>}

                  {referencedTable && (
                     <div className="space-y-2 pt-2">
                        <Label htmlFor="referencesColumn">Columna Referenciada</Label>
                        <Controller
                            name="foreignKey.referencesColumn"
                            control={control}
                            rules={{ required: isForeignKey ? 'Este campo es requerido' : false }}
                            render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                <SelectValue placeholder="Seleccione una columna" />
                                </SelectTrigger>
                                <SelectContent>
                                {referencedColumns.map(col => (
                                    <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            )}
                        />
                        {errors.foreignKey?.referencesColumn && <p className="text-destructive text-sm">{errors.foreignKey.referencesColumn.message}</p>}
                     </div>
                  )}
                </div>
              </>
            )}
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
