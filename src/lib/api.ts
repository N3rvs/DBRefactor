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
  timeoutMs: number = 120000 // 2 minutos para operaciones largas
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let errorData: ApiError;
      try {
        const responseText = await response.text();
        // Intentar parsear como JSON, si falla, usar el texto plano.
        try {
          errorData = JSON.parse(responseText);
          if (typeof errorData === 'object' && errorData !== null) {
            errorData.message = errorData.message || errorData.title || errorData.detail || 'Error en la respuesta de la API.';
          } else {
             errorData = { message: responseText || 'Error en la respuesta de la API.' };
          }
        } catch (e) {
          errorData = { message: responseText || `Error HTTP: ${response.status}` };
        }
      } catch (e) {
        errorData = { message: `Error HTTP: ${response.status}`, error: response.statusText };
      }
      throw new Error(errorData.message);
    }
    
    // El backend puede devolver 204 No Content para disconnect
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return { ok: true } as T;
    }
    
    // Para otras respuestas OK, intentar parsear JSON
    const responseText = await response.text();
    return JSON.parse(responseText);

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
