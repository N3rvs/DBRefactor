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
  PlanRequest,
  PlanResponse,
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
            // El backend puede devolver 'error' o 'title'
            errorData.message = errorData.message || errorData.error || errorData.title || errorData.detail || 'Error en la respuesta de la API.';
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
    if (responseText) {
      // Intentamos normalizar las claves de respuesta a camelCase si es un objeto
      const parsed = JSON.parse(responseText);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const camelCasedResponse: { [key: string]: any } = {};
        for (const key in parsed) {
          if (Object.prototype.hasOwnProperty.call(parsed, key)) {
            camelCasedResponse[key.charAt(0).toLowerCase() + key.slice(1)] = parsed[key];
          }
        }
        return camelCasedResponse as T;
      }
      return parsed;
    }
    return { ok: true } as T;

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
  // El backend espera connectionString, no ConnectionString
  return fetchApi<ConnectResponse>('/session/connect', {
    method: 'POST',
    body: JSON.stringify({ connectionString: body.connectionString }),
  });
};

export const disconnectSession = (body: DisconnectRequest) => {
  return fetchApi<void>('/session/disconnect', {
    method: 'POST',
    body: JSON.stringify(body), // sessionId ya es camelCase
  });
};

export const analyzeSchemaBySession = (body: AnalyzeSchemaRequest) => {
    // El hook se encarga de pasar el sessionId.
    const payload = { sessionId: body.sessionId };
    return fetchApi<AnalyzeSchemaResponse>('/analyze/schema', {
        method: 'POST',
        body: JSON.stringify(payload),
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

export const createPlan = (body: PlanRequest) => {
  return fetchApi<PlanResponse>('/plan', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};
