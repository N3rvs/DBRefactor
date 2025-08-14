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
              <Label htmlFor="tableFrom">Table From</Label>
              <Input id="tableFrom" {...register('tableFrom', { required: true })} />
              {errors.tableFrom && <p className="text-destructive text-sm">This field is required</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tableTo">Table To</Label>
              <Input id="tableTo" {...register('tableTo', { required: true })} />
              {errors.tableTo && <p className="text-destructive text-sm">This field is required</p>}
            </div>
          </>
        );
      case 'column':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="tableFrom">Table</Label>
              <Input id="tableFrom" {...register('tableFrom', { required: true })} />
              {errors.tableFrom && <p className="text-destructive text-sm">This field is required</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="columnFrom">Column From</Label>
              <Input id="columnFrom" {...register('columnFrom', { required: true })} />
              {errors.columnFrom && <p className="text-destructive text-sm">This field is required</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="columnTo">Column To</Label>
              <Input id="columnTo" {...register('columnTo', { required: true })} />
              {errors.columnTo && <p className="text-destructive text-sm">This field is required</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type (if changing)</Label>
              <Input id="type" {...register('type')} placeholder="e.g., nvarchar(255)" />
            </div>
          </>
        );
      case 'add-column':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="tableFrom">Table</Label>
              <Input id="tableFrom" {...register('tableFrom', { required: true })} />
               {errors.tableFrom && <p className="text-destructive text-sm">This field is required</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="columnTo">New Column Name</Label>
              <Input id="columnTo" {...register('columnTo', { required: true })} />
              {errors.columnTo && <p className="text-destructive text-sm">This field is required</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Column Type</Label>
              <Input id="type" {...register('type', { required: true })} placeholder="e.g., int" />
              {errors.type && <p className="text-destructive text-sm">This field is required</p>}
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
            <DialogTitle>{operation ? 'Edit' : 'Add'} Operation</DialogTitle>
            <DialogDescription>
              Fill in the details for the refactoring operation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scope">Scope</Label>
              <Controller
                name="scope"
                control={control}
                defaultValue="table"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Rename Table</SelectItem>
                      <SelectItem value="column">Rename Column</SelectItem>
                      <SelectItem value="add-column">Add Column</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {renderFields()}
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea id="note" {...register('note')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
