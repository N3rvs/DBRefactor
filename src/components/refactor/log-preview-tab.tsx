'use client';
import { ScrollArea } from '../ui/scroll-area';

interface LogPreviewTabProps {
  log: string[] | null;
}

export function LogPreviewTab({ log }: LogPreviewTabProps) {
  if (!log) return null;

  return (
    <ScrollArea className="h-80 w-full rounded-md border">
      <pre className="p-4 text-xs font-mono">
        {log.length > 0 ? log.join('\n') : '// No log output.'}
      </pre>
    </ScrollArea>
  );
}
