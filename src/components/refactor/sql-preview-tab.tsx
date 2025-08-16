'use client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SqlBundle } from '@/lib/types';
import { ClipboardCopy } from 'lucide-react';

interface SqlPreviewTabProps {
  sql: SqlBundle | null;
}

export function SqlPreviewTab({ sql }: SqlPreviewTabProps) {
  const { toast } = useToast();

  if (!sql) return null;

  // El backend devuelve las claves en PascalCase, nos aseguramos de leerlas así.
  const renameSql = (sql as any).renameSql || sql.RenameSql;
  const compatSql = (sql as any).compatSql || sql.CompatSql;
  const cleanupSql = (sql as any).cleanupSql || sql.CleanupSql;

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
        <TabsTrigger value="rename" disabled={!renameSql}>Renombrar</TabsTrigger>
        <TabsTrigger value="compat" disabled={!compatSql}>Compatibilidad</TabsTrigger>
        <TabsTrigger value="cleanup" disabled={!cleanupSql}>Limpieza</TabsTrigger>
      </TabsList>
      <TabsContent value="rename">
        <CodeBlock content={renameSql} title="Renombrar" />
      </TabsContent>
      <TabsContent value="compat">
        <CodeBlock content={compatSql} title="Compatibilidad" />
      </TabsContent>
      <TabsContent value="cleanup">
        <CodeBlock content={cleanupSql} title="Limpieza" />
      </TabsContent>
    </Tabs>
  );
}
