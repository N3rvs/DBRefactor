'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CodeFixRunResult } from '@/lib/types';
import { CheckCircle2, FileX2 } from 'lucide-react';

interface CodeFixPreviewTabProps {
  codefix: CodeFixRunResult | null;
}

export function CodeFixPreviewTab({ codefix }: CodeFixPreviewTabProps) {
  if (!codefix) return null;

  // Las claves ya vienen en camelCase desde la capa de API.
  const changedFiles = codefix.changes?.filter(f => f.Changed) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-md border bg-muted">
            <p className="text-sm text-muted-foreground">Archivos Escaneados</p>
            <p className="text-2xl font-bold">{codefix.filesScanned ?? 0}</p>
        </div>
        <div className="p-4 rounded-md border bg-muted">
            <p className="text-sm text-muted-foreground">Archivos Modificados</p>
            <p className="text-2xl font-bold text-primary">{codefix.filesChanged ?? 0}</p>
        </div>
      </div>
      
      <p className="text-sm font-medium">Archivos Modificados:</p>
      <ScrollArea className="h-72 w-full rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ruta</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {changedFiles.length > 0 ? (
                    changedFiles.map((file, index) => (
                    <TableRow key={index}>
                        <TableCell>
                            {file.Changed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <FileX2 className="h-5 w-5 text-muted-foreground" />
                            )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{file.Path}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                            No se modificaron archivos.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
