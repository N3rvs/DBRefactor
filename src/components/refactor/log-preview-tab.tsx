'use client';
import { ScrollArea } from '../ui/scroll-area';

interface LogPreviewTabProps {
  log: string[] | string | null;
}

export function LogPreviewTab({ log }: LogPreviewTabProps) {
  if (!log) return null;

  const logContent = Array.isArray(log)
    ? log.join('\n')
    : typeof log === 'string'
    ? log
    : '// No log output.';

  return (
    <ScrollArea className="h-80 w-full rounded-md border">
      <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
        {logContent || '// No log output.'}
      </pre>
    </ScrollArea>
  );
}
