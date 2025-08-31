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
  AnalyzeSchemaRequest,
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
        Accept: 'application/json',
        ...((options.method === 'POST' || options.method === 'PUT') && options.body
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 204) {
      return null as T;
    }

    const responseText = await response.text();
    if (!responseText && response.ok) {
      return null as T;
    }

    if (!response.ok) {
      try {
        const errorJson = JSON.parse(responseText);
        const errorMessage =
          errorJson?.error ||
          errorJson?.message ||
          errorJson?.title ||
          errorJson?.detail || // Añadir "detail" que a veces usan las APIs .NET
          `Error HTTP: ${response.status}`;
        throw new Error(errorMessage);
      } catch (e) {
        throw new Error(
          responseText || `Error HTTP: ${response.status} - ${response.statusText}`
        );
      }
    }

    return JSON.parse(responseText) as T;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          `La solicitud excedió el tiempo de espera de ${timeoutMs / 1000} segundos.`
        );
      }
      throw error;
    }
    throw new Error('Ocurrió un error inesperado.');
  }
}

/** 1) Crear sesión: POST /session/connect */
export const connectSession = (connectionString: string, ttlSeconds = 1800) =>
  fetchApi<ConnectResponse>('/session/connect', {
    method: 'POST',
    body: JSON.stringify({ connectionString, ttlSeconds }),
  });

/** 2) Analizar esquema usando GET con SessionID (según guía) */
export const analyzeSchema = (req: AnalyzeSchemaRequest) => {
  // El backend siempre espera la connectionString para esta llamada en particular
  if (req.connectionString) {
    const url = new URL(`${API_BASE_URL}/analyze/schema`);
    url.searchParams.set('connectionString', req.connectionString);
     // Estamos usando una URL completa, por lo que el path es solo la parte después del host
    return fetchApi<AnalyzeSchemaResponse>(`${url.pathname}${url.search}`);
  }
  
  if (req.sessionId) {
    // Esta ruta puede que no sea la esperada por el backend actual, pero la mantenemos por si acaso.
    return fetchApi<AnalyzeSchemaResponse>(
      `/analyze/schema?sessionId=${encodeURIComponent(req.sessionId)}`
    );
  }

  throw new Error('Se requiere sessionId o connectionString para analizar el esquema.');
};


/** 3) Desconectar sesión (opción recomendada: DELETE) */
export const disconnectSession = (sessionId: string) =>
  fetchApi<void>(`/session/${sessionId}`, {
    method: 'DELETE',
  });

/** 4) Ejecutar refactor con SessionId (o los otros métodos) */
export const runRefactor = (req: RefactorRequest) => {
  // Construimos el body explícitamente para que coincida con la clase RunRequest del backend
  const body = {
    sessionId: req.sessionId,
    plan: req.plan,
    apply: req.apply,
    rootKey: req.rootKey,
    useSynonyms: req.useSynonyms,
    useViews: req.useViews,
    cqrs: req.cqrs,
    // No enviamos connectionKey ni connectionString si son nulos/undefined, 
    // ya que el backend los tomará como opcionales.
    connectionKey: req.connectionKey, 
    connectionString: req.connectionString,
  };

  return fetchApi<RefactorResponse>('/refactor/run', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};


/** 5) Ejecutar limpieza de compatibilidad */
export const runCleanup = (req: CleanupRequest) => {
  return fetchApi<CleanupResponse>('/apply/cleanup', {
    method: 'POST',
    body: JSON.stringify(req),
  });
};

/** 6) Ejecutar CodeFix sobre el repositorio */
export const runCodeFix = (req: CodeFixRequest) => {
  return fetchApi<CodeFixResponse>('/codefix/run', {
    method: 'POST',
    body: JSON.stringify(req),
  });
};
