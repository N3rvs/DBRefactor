'use client';
import type {
  AnalyzeSchemaResponse,
  CleanupRequest,
  CleanupResponse,
  CodeFixRequest,
  CodeFixResponse,
  ConnectResponse,
  RefactorRequest,
  RefactorResponse,
  TableInfo,
} from './types';

const API_BASE_URL = 'http://localhost:5066';

async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = 320000 
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: 'no-store',
      ...options,
      headers: {
        'Accept': 'application/json',
        ...((options.method === 'POST' || options.method === 'PUT') && options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    
    const responseText = await response.text();
    if (!responseText) {
      if (!response.ok) {
         throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }
      return null as T;
    }
    
    const json = JSON.parse(responseText);

    if (!response.ok) {
        const errorMessage = json?.error || json?.message || json?.title || `Error HTTP: ${response.status}`;
        throw new Error(errorMessage);
    }
    
    return json as T;

  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error) {
        if (error.name === 'AbortError') {
            throw new Error(`La solicitud excedió el tiempo de espera de ${timeoutMs / 1000} segundos.`);
        }
        throw error;
    }
    throw new Error('Ocurrió un error inesperado.');
  }
}

/** 1) Crear sesión: POST /session/connect */
export const connectSession = (connectionString: string, ttlSeconds = 1800) =>
  fetchApi<ConnectResponse>("/session/connect", {
    method: "POST",
    body: JSON.stringify({ connectionString, ttlSeconds }),
  });

/** 2) Analizar esquema usando SessionId (endpoint recomendado) */
export const analyzeSchema = (req: { sessionId: string }) => {
    return fetchApi<AnalyzeSchemaResponse>('/analyze/schema/session', { 
        method: "POST",
        body: JSON.stringify({ SessionId: req.sessionId })
    });
}

/** 3) Desconectar sesión (opcional) */
export const disconnectSession = (sessionId: string) =>
  fetchApi<void>(`/session/${sessionId}`, { method: "DELETE" });

/** 4) Ejecutar refactor con SessionId */
export const runRefactor = (req: RefactorRequest) =>
  fetchApi<RefactorResponse>("/refactor/run", { method: "POST", body: JSON.stringify(req) });

export const runCleanup = (req: CleanupRequest) =>
  fetchApi<CleanupResponse>("/apply/cleanup", { method: "POST", body: JSON.stringify(req) });

export const runCodeFix = (body: CodeFixRequest) =>
  fetchApi<CodeFixResponse>("/codefix/run", { method: "POST", body: JSON.stringify(body) });
