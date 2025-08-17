// hooks/use-db-session.ts
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

  // Restaura sesión almacenada
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { sessionId?: string; expiresAtUtc?: string };
        if (new Date(saved.expiresAtUtc || 0) > new Date()) {
          setSessionId(saved.sessionId);
          setExpiresAtUtc(saved.expiresAtUtc);
        } else {
            localStorage.removeItem(LS_KEY);
        }
      }
    } catch {
      /* noop */
    }
  }, []);

  // Persiste cambios
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionId) {
      localStorage.setItem(LS_KEY, JSON.stringify({ sessionId, expiresAtUtc }));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }, [sessionId, expiresAtUtc]);

  const connect = useCallback(async (connectionString: string): Promise<ConnectResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      // ⚠️ El backend espera camelCase en el body
      const res = await connectSession({ connectionString: connectionString });

      // 🔸 El hook de API normaliza la respuesta a camelCase
      const sid = res.SessionId || (res as any).sessionId;
      const exp = res.ExpiresAtUtc || (res as any).expiresAtUtc;

      if (!sid) throw new Error('No se obtuvo SessionId de la API.');

      setSessionId(sid);
      setExpiresAtUtc(exp);

      return { SessionId: sid, ExpiresAtUtc: exp };
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
      await disconnectSession({ sessionId: sessionId }); // camelCase hacia el backend
      setSessionId(undefined);
      setExpiresAtUtc(undefined);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo desconectar.');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return { sessionId, expiresAtUtc, isLoading, error, connect, disconnect };
}
