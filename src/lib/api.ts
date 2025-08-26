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
        ...((options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE') && options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    
    // DELETE puede no devolver contenido, y está bien.
    if (response.status === 204) {
      return null as T;
    }

    const responseText = await response.text();
    if (!responseText && response.ok) {
      return null as T;
    }

    if (!response.ok) {
        // Intenta parsear como JSON para obtener un mensaje de error estructurado
        try {
            const errorJson = JSON.parse(responseText);
            const errorMessage = errorJson?.error || errorJson?.message || errorJson?.title || `Error HTTP: ${response.status}`;
            throw new Error(errorMessage);
        } catch (e) {
            // Si no es JSON, usa el texto de la respuesta o el statusText
            throw new Error(responseText || `Error HTTP: ${response.status} - ${response.statusText}`);
        }
    }
    
    return JSON.parse(responseText) as T;

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
    body: JSON.stringify({ ConnectionString: connectionString, TtlSeconds: ttlSeconds }),
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
  fetchApi<void>('/session/disconnect', { 
    method: "POST",
    body: JSON.stringify({ SessionId: sessionId })
  });


/** 4) Ejecutar refactor con SessionId */
export const runRefactor = (req: RefactorRequest) => {
    const body = {
      SessionId: req.sessionId,
      Apply: req.apply,
      RootKey: req.rootKey,
      UseSynonyms: req.useSynonyms,
      UseViews: req.useViews,
      Cqrs: req.cqrs,
      Plan: {
        Renames: req.plan.renames.map(op => ({
          Scope: op.scope,
          Area: op.area,
          TableFrom: op.tableFrom,
          TableTo: op.tableTo,
          ColumnFrom: op.columnFrom,
          ColumnTo: op.columnTo,
          Type: op.type,
          Note: op.note
        }))
      }
    };
    return fetchApi<RefactorResponse>("/refactor/run", { method: "POST", body: JSON.stringify(body) });
}

export const runCleanup = (req: CleanupRequest) => {
  const body = {
      SessionId: req.sessionId,
      Renames: req.renames.map(op => ({
          Scope: op.scope,
          Area: op.area,
          TableFrom: op.tableFrom,
          TableTo: op.tableTo,
          ColumnFrom: op.columnFrom,
          ColumnTo: op.columnTo,
          Type: op.type,
          Note: op.note
      })),
      UseSynonyms: req.useSynonyms,
      UseViews: req.useViews,
      Cqrs: req.cqrs,
      AllowDestructive: req.allowDestructive
  };
  return fetchApi<CleanupResponse>("/apply/cleanup", { method: "POST", body: JSON.stringify(body) });
}

export const runCodeFix = (body: CodeFixRequest) => {
    const apiBody = {
      RootKey: body.rootKey,
      Apply: body.apply,
      Plan: {
        Renames: body.plan.renames.map(op => ({
          Scope: op.scope,
          Area: op.area,
          TableFrom: op.tableFrom,
          TableTo: op.tableTo,
          ColumnFrom: op.columnFrom,
          ColumnTo: op.columnTo,
          Type: op.type,
          Note: op.note
        }))
      },
      IncludeGlobs: body.includeGlobs,
      ExcludeGlobs: body.excludeGlobs,
    }
  return fetchApi<CodeFixResponse>("/codefix/run", { method: "POST", body: JSON.stringify(apiBody) });
}
