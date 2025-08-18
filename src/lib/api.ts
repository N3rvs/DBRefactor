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
} from './types';

const pickDefaultBase = () => {
  // Si el front corre en https, intenta https:7040 (evita mixed content)
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return "https://localhost:7040";
  }
  // El puerto por defecto para el backend de DBRefactor
  return "http://localhost:5066"; 
};

const API_BASE_URL = process.env.NEXT_PUBLIC_DBREFACTOR_API ?? pickDefaultBase();

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
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    
    // Si la respuesta no tiene contenido (ej. 204 No Content), devolver null.
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
        body: JSON.stringify(req)
    });
}

/** 3) Desconectar sesión (opcional) */
export const disconnectSession = (sessionId: string) =>
  fetchApi<void>("/session/disconnect", { method: "POST", body: JSON.stringify({ sessionId }) });

/** 4) Ejecutar refactor con SessionId */
export const runRefactor = (req: RefactorRequest) =>
  fetchApi<RefactorResponse>("/refactor/run", { method: "POST", body: JSON.stringify(req) });

export const runCleanup = (req: CleanupRequest) =>
  fetchApi<CleanupResponse>("/apply/cleanup", { method: "POST", body: JSON.stringify(req) });

export const runCodeFix = (body: CodeFixRequest) =>
  fetchApi<CodeFixResponse>("/codefix/run", { method: "POST", body: JSON.stringify(body) });
