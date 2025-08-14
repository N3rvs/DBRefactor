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
import { Separator } from '../ui/separator';

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
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="useSynonyms" className="font-semibold">Use Synonyms</Label>
            <Switch
              id="useSynonyms"
              checked={useSynonyms}
              onCheckedChange={setUseSynonyms}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Creates synonyms for renamed tables/columns for backward compatibility. This allows old code to function without immediate updates.
          </p>
        </div>
        <Separator />
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label htmlFor="useViews" className="font-semibold">Use Views</Label>
                <Switch id="useViews" checked={useViews} onCheckedChange={setUseViews} />
            </div>
            <p className="text-sm text-muted-foreground">
                Generates views that mimic the original table structure, ensuring that read queries from legacy systems continue to work seamlessly.
            </p>
        </div>
        <Separator />
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label htmlFor="useCqrs" className="font-semibold">Use CQRS Views</Label>
                <Switch id="useCqrs" checked={useCqrs} onCheckedChange={setUseCqrs} />
            </div>
            <p className="text-sm text-muted-foreground">
                Implements Command Query Responsibility Segregation by creating separate views for read operations, isolating them from write operations.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
