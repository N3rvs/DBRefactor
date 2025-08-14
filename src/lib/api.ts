'use client';
import type {
  AnalyzeSchemaRequest,
  AnalyzeSchemaResponse,
  ApiError,
  CleanupRequest,
  CleanupResponse,
  CodeFixRequest,
  CodeFixResponse,
  ConnectRequest,
  ConnectResponse,
  DisconnectRequest,
  RefactorRequest,
  RefactorResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_DBREFACTOR_API || 'http://localhost:7040';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 60000 // Aumentado a 60s para operaciones largas
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: 'no-store', // Siempre obtener datos frescos
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `Error HTTP: ${response.status}`, error: response.statusText };
      }
      throw new Error(errorData.message || 'Ocurrió un error desconocido en la API.');
    }

    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return null as T;
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`La solicitud excedió el tiempo de espera de ${timeoutMs / 1000} segundos.`);
    }
    throw error;
  }
}

export const connectSession = (body: ConnectRequest) => {
  return fetchApi<ConnectResponse>('/session/connect', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const disconnectSession = (body: DisconnectRequest) => {
  return fetchApi<void>('/session/disconnect', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const analyzeSchemaBySession = (body: AnalyzeSchemaRequest) => {
  return fetchApi<AnalyzeSchemaResponse>('/analyze/schema', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const runRefactor = (body: RefactorRequest) => {
  return fetchApi<RefactorResponse>('/refactor/run', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const runCleanup = (body: CleanupRequest) => {
  return fetchApi<CleanupResponse>('/apply/cleanup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const runCodeFix = (body: CodeFixRequest) => {
  return fetchApi<CodeFixResponse>('/codefix/run', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};
