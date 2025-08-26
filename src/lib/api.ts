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
  RenameOp,
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

    // DELETE puede no devolver contenido
    if (response.status === 204 && options.method === 'DELETE') {
      return null as T;
    }

    const responseText = await response.text();
    // Algunas respuestas OK pueden no tener cuerpo
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

/** 2) Analizar esquema usando GET y connectionString (endpoint recomendado por la guía) */
export const analyzeSchema = (connectionString: string) => {
  const url = new URL(`${API_BASE_URL}/analyze/schema`);
  url.searchParams.set('connectionString', connectionString);
  return fetchApi<AnalyzeSchemaResponse>(url.pathname + url.search);
};

/** 3) Desconectar sesión (opcional) */
export const disconnectSession = (sessionId: string) =>
  fetchApi<void>(`/session/${sessionId}`, {
    method: 'DELETE',
  });

/** 4) Ejecutar refactor con SessionId */
export const runRefactor = (req: RefactorRequest) => {
  const body = {
    sessionId: req.sessionId,
    apply: req.apply,
    rootKey: req.rootKey,
    useSynonyms: req.useSynonyms,
    useViews: req.useViews,
    cqrs: req.cqrs,
    plan: {
      renames: req.plan.renames.map((op: RenameOp) => ({
        scope: op.scope,
        area: op.area,
        tableFrom: op.tableFrom,
        tableTo: op.tableTo,
        columnFrom: op.columnFrom,
        columnTo: op.columnTo,
        type: op.type,
        note: op.note,
      })),
    },
  };
  return fetchApi<RefactorResponse>('/refactor/run', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const runCleanup = (req: CleanupRequest) => {
  const body = {
    sessionId: req.sessionId,
    renames: req.renames.map((op: RenameOp) => ({
      scope: op.scope,
      area: op.area,
      tableFrom: op.tableFrom,
      tableTo: op.tableTo,
      columnFrom: op.columnFrom,
      columnTo: op.columnTo,
      type: op.type,
      note: op.note,
    })),
    useSynonyms: req.useSynonyms,
    useViews: req.useViews,
    cqrs: req.cqrs,
    allowDestructive: req.allowDestructive,
  };
  return fetchApi<CleanupResponse>('/apply/cleanup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const runCodeFix = (body: CodeFixRequest) => {
  const apiBody = {
    rootKey: body.rootKey,
    apply: body.apply,
    plan: {
      renames: body.plan.renames.map((op: RenameOp) => ({
        scope: op.scope,
        area: op.area,
        tableFrom: op.tableFrom,
        tableTo: op.tableTo,
        columnFrom: op.columnFrom,
        columnTo: op.columnTo,
        type: op.type,
        note: op.note,
      })),
    },
    includeGlobs: body.includeGlobs,
    excludeGlobs: body.excludeGlobs,
  };
  return fetchApi<CodeFixResponse>('/codefix/run', {
    method: 'POST',
    body: JSON.stringify(apiBody),
  });
};
