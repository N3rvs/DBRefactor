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
    toast({ title: 'Copied!', description: `${name} script copied to clipboard.` });
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
        <code>{content || `// No ${title} script generated.`}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-7 w-7"
        onClick={() => handleCopy(content, title)}
        disabled={!content}
        aria-label={`Copy ${title} SQL`}
      >
        <ClipboardCopy className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Tabs defaultValue="rename" className="w-full">
      <TabsList>
        <TabsTrigger value="rename" disabled={!sql.renameSql}>Rename</TabsTrigger>
        <TabsTrigger value="compat" disabled={!sql.compatSql}>Compatibility</TabsTrigger>
        <TabsTrigger value="cleanup" disabled={!sql.cleanupSql}>Cleanup</TabsTrigger>
      </TabsList>
      <TabsContent value="rename">
        <CodeBlock content={sql.renameSql} title="Rename" />
      </TabsContent>
      <TabsContent value="compat">
        <CodeBlock content={sql.compatSql} title="Compatibility" />
      </TabsContent>
      <TabsContent value="cleanup">
        <CodeBlock content={sql.cleanupSql} title="Cleanup" />
      </TabsContent>
    </Tabs>
  );
}
