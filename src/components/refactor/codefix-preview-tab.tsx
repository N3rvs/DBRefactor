'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CodeFixResult } from '@/lib/types';
import { CheckCircle2, File, FileX2 } from 'lucide-react';

interface CodeFixPreviewTabProps {
  codefix: CodeFixResult | null;
}

export function CodeFixPreviewTab({ codefix }: CodeFixPreviewTabProps) {
  if (!codefix) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-md border bg-muted">
            <p className="text-sm text-muted-foreground">Files Scanned</p>
            <p className="text-2xl font-bold">{codefix.scanned}</p>
        </div>
        <div className="p-4 rounded-md border bg-muted">
            <p className="text-sm text-muted-foreground">Files Changed</p>
            <p className="text-2xl font-bold text-primary">{codefix.changed}</p>
        </div>
      </div>
      
      <p className="text-sm font-medium">Changed Files:</p>
      <ScrollArea className="h-72 w-full rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Path</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {codefix.files.filter(f => f.changed).length > 0 ? (
                    codefix.files.filter(f => f.changed).map((file, index) => (
                    <TableRow key={index}>
                        <TableCell>
                            {file.changed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <FileX2 className="h-5 w-5 text-muted-foreground" />
                            )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{file.path}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                            No files were changed.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
