'use client';

import type { FC, ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/contexts/app-context';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <AppProvider>
      {children}
      <Toaster />
    </AppProvider>
  );
};
