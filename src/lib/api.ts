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
  RenameOp,
} from './types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_DBREFACTOR_API || 'http://localhost:7040').replace(/\/+$/,"");

async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = 120000 // 2 minutos para operaciones largas
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
    
    const responseText = await response.text();
    const json = responseText ? JSON.parse(responseText) : null;

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


export const connectSession = (connectionString: string, ttlSeconds = 1800) =>
  fetchApi<ConnectResponse>("/session/connect", {
    method: "POST",
    body: JSON.stringify({ connectionString, ttlSeconds }),
  });

export const disconnectSession = (sessionId: string) =>
  fetchApi<void>("/session/disconnect", { method: "POST", body: JSON.stringify({ sessionId }) });

export const analyzeSchema = (body: AnalyzeSchemaRequest) =>
  fetchApi<AnalyzeSchemaResponse>("/analyze/schema", { method: "POST", body: JSON.stringify(body) });

export const generatePlan = (body: PlanRequest) =>
  fetchApi<PlanResponse>("/plan", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const runRefactor = (req: RefactorRequest) =>
  fetchApi<RefactorResponse>("/refactor/run", { method: "POST", body: JSON.stringify(req) });

export const runCleanup = (req: CleanupRequest) =>
  fetchApi<CleanupResponse>("/apply/cleanup", { method: "POST", body: JSON.stringify(req) });

export const runCodeFix = (body: CodeFixRequest) =>
  fetchApi<CodeFixResponse>("/codefix/run", { method: "POST", body: JSON.stringify(body) });
