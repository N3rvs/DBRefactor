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
import { Bot } from 'lucide-react';

interface AISuggestionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  rationale: string;
}

export function AISuggestionDialog({ isOpen, setIsOpen, rationale }: AISuggestionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <Bot className="w-6 h-6 text-primary" />
              <DialogTitle>Justificación de la IA</DialogTitle>
            </div>
            <DialogDescription>
              La IA ha sugerido un orden óptimo para su plan de refactorización basado en la siguiente justificación:
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert bg-muted/50 p-4 rounded-md border max-h-60 overflow-y-auto">
            <p>{rationale}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Cerrar</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
