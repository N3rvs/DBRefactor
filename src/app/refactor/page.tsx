'use client';
import { ConnectionCard } from '@/components/refactor/connection-card';
import { PlanBuilder } from '@/components/refactor/plan-builder';
import { RefactorOptions } from '@/components/refactor/refactor-options';
import { RepoCard } from '@/components/refactor/repo-card';
import { ResultPanel } from '@/components/refactor/result-panel';
import { SchemaCard } from '@/components/refactor/schema-card';
import { SyncCard } from '@/components/refactor/sync-card';

export default function RefactorPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <aside className="lg:col-span-1 flex flex-col gap-8 sticky top-20">
          <ConnectionCard />
          <RepoCard />
          <SyncCard />
          <RefactorOptions />
        </aside>
        <main className="lg:col-span-2 flex flex-col gap-8">
          <SchemaCard />
          <PlanBuilder />
          <ResultPanel />
        </main>
      </div>
    </div>
  );
}
