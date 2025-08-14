'use client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SqlScripts } from '@/lib/types';
import { ClipboardCopy } from 'lucide-react';

interface SqlPreviewTabProps {
  sql: SqlScripts | null;
}

export function SqlPreviewTab({ sql }: SqlPreviewTabProps) {
  const { toast } = useToast();

  if (!sql) return null;

  const handleCopy = (text: string | undefined, name: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: '¡Copiado!', description: `Script de ${name} copiado al portapapeles.` });
  };

  const CodeBlock = ({
    content,
    title,
  }: {
    content: string | undefined;
    title: string;
  }) => (
    <div className="relative">
      <pre className="bg-muted/50 p-4 rounded-md border text-sm overflow-x-auto max-h-80">
        <code>{content || `// No se generó ningún script de ${title}.`}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-7 w-7"
        onClick={() => handleCopy(content, title)}
        disabled={!content}
        aria-label={`Copiar SQL de ${title}`}
      >
        <ClipboardCopy className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Tabs defaultValue="rename" className="w-full">
      <TabsList>
        <TabsTrigger value="rename" disabled={!sql.renameSql}>Renombrar</TabsTrigger>
        <TabsTrigger value="compat" disabled={!sql.compatSql}>Compatibilidad</TabsTrigger>
        <TabsTrigger value="cleanup" disabled={!sql.cleanupSql}>Limpieza</TabsTrigger>
      </TabsList>
      <TabsContent value="rename">
        <CodeBlock content={sql.renameSql} title="Renombrar" />
      </TabsContent>
      <TabsContent value="compat">
        <CodeBlock content={sql.compatSql} title="Compatibilidad" />
      </TabsContent>
      <TabsContent value="cleanup">
        <CodeBlock content={sql.cleanupSql} title="Limpieza" />
      </TabsContent>
    </Tabs>
  );
}
