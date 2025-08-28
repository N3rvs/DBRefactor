'use client';

import React, { createContext, useCallback, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type {
  PlanOperation,
  CodeFixRunResult,
  SqlBundle,
  TableInfo,
  RefactorRequest,
  CleanupRequest,
  RefactorResponse,
  CleanupResponse,
  CodeFixRequest,
  CodeFixResponse,
} from '@/lib/types';
import * as api from '@/lib/api';
import { normalizeDbSchema } from '@/lib/normalize-db-schema';

// Opciones de generación, separadas de las de UI
interface GenerationOptions {
  useSynonyms: boolean;
  useViews: boolean;
  cqrs: boolean;
  allowDestructive: boolean;
}

// ---------- STATE ----------
export interface AppState {
  plan: PlanOperation[];
  results: {
    sql: SqlBundle | null;
    codefix: CodeFixRunResult | null;
    dbLog: string | string[] | null;
    isLoading: boolean;
    error: string | null;
  };
  schema: {
    tables: TableInfo[] | null;
    isLoading: boolean;
    error: string | null;
  };
  options: GenerationOptions & { rootKey: string };
  sessionId: string | null;
  sessionExpiresAt: string | null;
  sessionIsLoading: boolean;
  sessionError: string | null;
}

const initialState: AppState = {
  plan: [],
  results: { sql: null, codefix: null, dbLog: null, isLoading: false, error: null },
  schema: { tables: null, isLoading: false, error: null },
  options: { rootKey: 'SOLUTION', useSynonyms: true, useViews: true, cqrs: false, allowDestructive: false },
  sessionId: null,
  sessionExpiresAt: null,
  sessionIsLoading: false,
  sessionError: null,
};

// ---------- ACTIONS ----------
type Action =
  | { type: 'ADD_OPERATION'; payload: PlanOperation }
  | { type: 'UPDATE_OPERATION'; payload: PlanOperation }
  | { type: 'REMOVE_OPERATION'; payload: string } // id
  | { type: 'SET_PLAN'; payload: PlanOperation[] }
  | { type: 'REORDER_OPERATION'; payload: { index: number; direction: 'up' | 'down' } }
  | { type: 'SET_RESULTS_LOADING'; payload: boolean }
  | { type: 'SET_RESULTS_SUCCESS'; payload: { sql: SqlBundle | null; codefix: CodeFixRunResult | null; dbLog: string | string[] | null } }
  | { type: 'SET_RESULTS_ERROR'; payload: string | null }
  | { type: 'CLEAR_RESULTS' }
  | { type: 'SET_SCHEMA_LOADING'; payload: boolean }
  | { type: 'SET_SCHEMA_SUCCESS'; payload: TableInfo[] }
  | { type: 'SET_SCHEMA_ERROR'; payload: string | null }
  | { type: 'SET_OPTION'; payload: { key: keyof AppState['options']; value: any } }
  | { type: 'SESSION_START' }
  | { type: 'SESSION_SUCCESS'; payload: { sessionId: string; expiresAtUtc: string } }
  | { type: 'SESSION_ERROR'; payload: string }
  | { type: 'SESSION_END' };

// ---------- REDUCER ----------
const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_OPERATION':
      return { ...state, plan: [...state.plan, { ...action.payload, id: Date.now().toString() }] };
    case 'UPDATE_OPERATION':
      return { ...state, plan: state.plan.map(op => (op.id === action.payload.id ? action.payload : op)) };
    case 'REMOVE_OPERATION':
      return { ...state, plan: state.plan.filter(op => op.id !== action.payload) };
    case 'SET_PLAN': {
      const planWithIds = action.payload.map((op, i) => (op.id ? op : { ...op, id: `${Date.now()}-${i}` }));
      return { ...state, plan: planWithIds };
    }
    case 'REORDER_OPERATION': {
      const { index, direction } = action.payload;
      const newPlan = [...state.plan];
      const [movedItem] = newPlan.splice(index, 1);
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      newPlan.splice(newIndex, 0, movedItem);
      return { ...state, plan: newPlan };
    }
    case 'SET_RESULTS_LOADING':
      return { ...state, results: { ...initialState.results, isLoading: action.payload } };
    case 'SET_RESULTS_SUCCESS':
      return { ...state, results: { ...action.payload, isLoading: false, error: null } };
    case 'SET_RESULTS_ERROR':
      return { ...state, results: { ...initialState.results, isLoading: false, error: action.payload } };
    case 'CLEAR_RESULTS':
      return { ...state, results: initialState.results };
    case 'SET_SCHEMA_LOADING':
      return { ...state, schema: { ...state.schema, isLoading: action.payload, error: null } };
    case 'SET_SCHEMA_SUCCESS':
        return { ...state, schema: { tables: action.payload, isLoading: false, error: null } };
    case 'SET_SCHEMA_ERROR':
      return { ...state, schema: { tables: null, isLoading: false, error: action.payload } };
    case 'SET_OPTION':
      return { ...state, options: { ...state.options, [action.payload.key]: action.payload.value } };
    case 'SESSION_START':
      return { ...state, sessionIsLoading: true, sessionError: null };
    case 'SESSION_SUCCESS':
      return {
        ...state,
        sessionIsLoading: false,
        sessionId: action.payload.sessionId,
        sessionExpiresAt: action.payload.expiresAtUtc,
      };
    case 'SESSION_ERROR':
      return {
        ...state,
        sessionIsLoading: false,
        sessionError: action.payload,
        sessionId: null,
        sessionExpiresAt: null,
      };
    case 'SESSION_END':
      return {
        ...state,
        sessionIsLoading: false,
        sessionError: null,
        sessionId: null,
        sessionExpiresAt: null,
        schema: initialState.schema, // Limpiar esquema al desconectar
        plan: initialState.plan,       // Limpiar plan al desconectar
        results: initialState.results, // Limpiar resultados al desconectar
      };
    default:
      return state;
  }
};

// ---------- CONTEXTO ----------
type AppContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  connect: (connectionString: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshSchema: () => Promise<void>;
  runRefactor: (req: RefactorRequest) => Promise<RefactorResponse>;
  runCodeFix: (req: CodeFixRequest) => Promise<CodeFixResponse>;
  runCleanup: (req: CleanupRequest) => Promise<CleanupResponse>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ---------- PROVIDER ----------
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  const refreshSchema = useCallback(async () => {
    if (!state.sessionId) {
      // No intentar refrescar si no hay sesión
      return;
    }
    dispatch({ type: 'SET_SCHEMA_LOADING', payload: true });
    try {
      // Usar el sessionId del estado actual
      const data = await api.analyzeSchema({ sessionId: state.sessionId });
      const tables = normalizeDbSchema(data);
      dispatch({ type: 'SET_SCHEMA_SUCCESS', payload: tables });
    } catch (err: any) {
      dispatch({ type: 'SET_SCHEMA_ERROR', payload: err?.message ?? 'Error al analizar esquema' });
    } finally {
      // Ya no es necesario poner el loading en false aquí, porque SET_SCHEMA_SUCCESS/ERROR lo hacen
    }
  }, [state.sessionId]);
  
  const connect = useCallback(async (connectionString: string) => {
    dispatch({ type: 'SESSION_START' });
    try {
      const res = await api.connectSession(connectionString);
      if (!res.sessionId) throw new Error('No se obtuvo SessionId de la API.');
      
      dispatch({ type: 'SESSION_SUCCESS', payload: { sessionId: res.sessionId, expiresAtUtc: res.expiresAtUtc } });

      // Cargar esquema después de una conexión exitosa
      dispatch({ type: 'SET_SCHEMA_LOADING', payload: true });
      try {
        const data = await api.analyzeSchema({ sessionId: res.sessionId });
        const tables = normalizeDbSchema(data);
        dispatch({ type: 'SET_SCHEMA_SUCCESS', payload: tables });
      } catch (schemaErr: any) {
        dispatch({ type: 'SET_SCHEMA_ERROR', payload: schemaErr?.message ?? 'Error al analizar esquema' });
      }

    } catch (e: any) {
      dispatch({ type: 'SESSION_ERROR', payload: e?.message ?? 'No se pudo conectar.' });
      throw e;
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!state.sessionId) return;
    dispatch({ type: 'SESSION_START' });
    try {
      await api.disconnectSession(state.sessionId);
    } catch (e: any) {
       console.error(e?.message ?? 'No se pudo desconectar.');
    } finally {
       dispatch({ type: 'SESSION_END' });
    }
  }, [state.sessionId]);

  const runRefactorCb = useCallback(async (req: RefactorRequest) => {
    return api.runRefactor(req);
  }, []);

  const runCodeFixCb = useCallback(async (req: CodeFixRequest) => {
    return api.runCodeFix(req);
  }, []);
  
  const runCleanupCb = useCallback(async (req: CleanupRequest) => {
    return api.runCleanup(req);
  }, []);


  return (
    <AppContext.Provider value={{ state, dispatch, connect, disconnect, refreshSchema, runRefactor: runRefactorCb, runCodeFix: runCodeFixCb, runCleanup: runCleanupCb }}>
      {children}
    </AppContext.Provider>
  );
}

// ---------- HOOK ----------
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext debe ser usado dentro de un AppProvider');
  return ctx;
}
