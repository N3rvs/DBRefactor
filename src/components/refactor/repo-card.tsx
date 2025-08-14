'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FolderGit2 } from 'lucide-react';
import { Label } from '../ui/label';

export function RepoCard() {
    const [rootKey, setRootKey] = useState('SOLUTION');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FolderGit2 className="w-6 h-6 text-primary" />
          <CardTitle>Repositorio de Código</CardTitle>
        </div>
        <CardDescription>
          Especifique la clave raíz para el análisis de código.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            <Label htmlFor="rootKey">Clave Raíz</Label>
            <Input 
                id="rootKey"
                placeholder="ej., SOLUTION o FRONT"
                value={rootKey}
                onChange={(e) => setRootKey(e.target.value)}
            />
        </div>
      </CardContent>
    </Card>
  );
}
