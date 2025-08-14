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
          <CardTitle>Code Repository</CardTitle>
        </div>
        <CardDescription>
          Specify the root key for code analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            <Label htmlFor="rootKey">Root Key</Label>
            <Input 
                id="rootKey"
                placeholder="e.g., SOLUTION or FRONT"
                value={rootKey}
                onChange={(e) => setRootKey(e.target.value)}
            />
        </div>
      </CardContent>
    </Card>
  );
}
