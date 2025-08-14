'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2 } from 'lucide-react';

export function RefactorOptions() {
  const [useSynonyms, setUseSynonyms] = useState(true);
  const [useViews, setUseViews] = useState(true);
  const [useCqrs, setUseCqrs] = useState(true);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Settings2 className="w-6 h-6 text-primary" />
          <CardTitle>Refactor Options</CardTitle>
        </div>
        <CardDescription>
          Configure compatibility and cleanup options.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="useSynonyms">Use Synonyms</Label>
          <Switch
            id="useSynonyms"
            checked={useSynonyms}
            onCheckedChange={setUseSynonyms}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="useViews">Use Views</Label>
          <Switch id="useViews" checked={useViews} onCheckedChange={setUseViews} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="useCqrs">Use CQRS Views</Label>
          <Switch id="useCqrs" checked={useCqrs} onCheckedChange={setUseCqrs} />
        </div>
      </CardContent>
    </Card>
  );
}
