'use client';
import { ScrollArea } from '../ui/scroll-area';

interface LogPreviewTabProps {
  log: unknown; // Aceptar cualquier tipo de dato
}

export function LogPreviewTab({ log }: LogPreviewTabProps) {
  if (!log) return null;

  let logContent: string;

  if (Array.isArray(log)) {
    logContent = log.join('\n');
  } else if (typeof log === 'string') {
    logContent = log;
  } else if (typeof log === 'object' && log !== null) {
    // Si es un objeto (posiblemente un error), lo formateamos como JSON
    logContent = JSON.stringify(log, null, 2);
  } else {
    // Para cualquier otro tipo, lo convertimos a string
    logContent = String(log);
  }

  return (
    <ScrollArea className="h-80 w-full rounded-md border">
      <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
        {logContent || '// No log output.'}
      </pre>
    </ScrollArea>
  );
}

    