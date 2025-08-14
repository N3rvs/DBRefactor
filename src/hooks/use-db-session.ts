'use client';

import { useState, useCallback } from 'react';
import * as api from '@/lib/api';

export interface DbSession {
  sessionId: string | null;
  expiresAtUtc: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useDbSession = () => {
  const [session, setSession] = useState<DbSession>({
    sessionId: null,
    expiresAtUtc: null,
    isLoading: false,
    error: null,
  });

  const connect = useCallback(async (connectionString: string, ttlSeconds?: number) => {
    setSession((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const response = await api.connectSession({ connectionString, ttlSeconds });
      setSession({
        sessionId: response.sessionId,
        expiresAtUtc: response.expiresAtUtc,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to connect';
      setSession({ sessionId: null, expiresAtUtc: null, isLoading: false, error });
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!session.sessionId) return;
    setSession((s) => ({ ...s, isLoading: true, error: null }));
    try {
      await api.disconnectSession({ sessionId: session.sessionId });
      setSession({ sessionId: null, expiresAtUtc: null, isLoading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to disconnect';
      // Still clear session on client even if disconnect fails
      setSession({ sessionId: null, expiresAtUtc: null, isLoading: false, error });
      throw err;
    }
  }, [session.sessionId]);

  const clearError = useCallback(() => {
    setSession(s => ({ ...s, error: null }));
  }, []);

  return {
    ...session,
    connect,
    disconnect,
    clearError,
  };
};
