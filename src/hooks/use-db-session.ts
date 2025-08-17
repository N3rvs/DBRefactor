'use client';

import { useCallback, useEffect, useState } from 'react';
import { connectSession, disconnectSession } from '@/lib/api';
import type { ConnectResponse } from '@/lib/types';

const LS_KEY = 'dbrefactor.session';

export type DbSession = {
  sessionId?: string;       
  expiresAtUtc?: string;    
  isLoading: boolean;
  error: string | null;
 
  connect: (connectionString: string) => Promise<ConnectResponse>;
  disconnect: () => Promise<void>;
};

export function useDbSession(): DbSession {
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [expiresAtUtc, setExpiresAtUtc] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NOTA: Se elimina la persistencia en localStorage para evitar
  // que el usuario reutilice una cadena de conexión sensible.
  // La sesión ahora vivirá solo en memoria del estado de React.

  const connect = useCallback(async (connectionString: string): Promise<ConnectResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await connectSession(connectionString);
      if (!res.sessionId) throw new Error('No se obtuvo sessionId de la API.');
      setSessionId(res.sessionId);
      setExpiresAtUtc(res.expiresAtUtc);
      return res;
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo conectar.');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      await disconnectSession(sessionId);
      setSessionId(undefined);
      setExpiresAtUtc(undefined);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo desconectar.');
      // No lanzar excepción aquí para no molestar al usuario si falla la limpieza.
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return { sessionId, expiresAtUtc, isLoading, error, connect, disconnect };
}
