'use client';

import React, { createContext, useCallback, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type {
  PlanOperation,
  CodeFixRunResult,
  SqlBundle,
  TableInfo,
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
  refreshSchema: (connectionString?: string) => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ---------- PROVIDER ----------
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const refreshSchema = useCallback(
    async (connectionString?: string) => {
      const cs = connectionString;
      if (!cs) {
        dispatch({ type: 'SET_SCHEMA_ERROR', payload: 'No hay cadena de conexión para analizar.' });
        return;
      }
      dispatch({ type: 'SET_SCHEMA_LOADING', payload: true });
      try {
        const data = await api.analyzeSchema(cs);
        const tables = normalizeDbSchema(data); 
        dispatch({ type: 'SET_SCHEMA_SUCCESS', payload: tables });
      } catch (err: any) {
        dispatch({ type: 'SET_SCHEMA_ERROR', payload: err?.message ?? 'Error al analizar esquema' });
      } finally {
        dispatch({ type: 'SET_SCHEMA_LOADING', payload: false });
      }
    },
    []
  );

  const connect = useCallback(async (connectionString: string) => {
    dispatch({ type: 'SESSION_START' });
    try {
      // 1. Guardamos la CS para usarla en analyzeSchema
      const cs = connectionString;
      // 2. Creamos la sesión y obtenemos el sessionId
      const res = await api.connectSession(cs);
      if (!res.sessionId) throw new Error('No se obtuvo SessionId de la API.');
      dispatch({ type: 'SESSION_SUCCESS', payload: { sessionId: res.sessionId, expiresAtUtc: res.expiresAtUtc } });
      // 3. Analizamos el esquema usando la CS original
      await refreshSchema(cs);
    } catch (e: any) {
      dispatch({ type: 'SESSION_ERROR', payload: e?.message ?? 'No se pudo conectar.' });
      throw e;
    }
  }, [refreshSchema]);

  const disconnect = useCallback(async () => {
    if (!state.sessionId) return;
    dispatch({ type: 'SESSION_START' });
    try {
      await api.disconnectSession(state.sessionId);
      dispatch({ type: 'SESSION_END' });
    } catch (e: any) {
      dispatch({ type: 'SESSION_END' });
       console.error(e?.message ?? 'No se pudo desconectar.');
    }
  }, [state.sessionId]);
  
  const refreshSchemaCb = useCallback(async () => {
    // Esta función ahora no tiene sentido si la CS solo está disponible al conectar.
    // La mantenemos por si se decide cachear la CS en el estado en un futuro.
  }, []);


  return (
    <AppContext.Provider value={{ state, dispatch, connect, disconnect, refreshSchema: refreshSchemaCb }}>
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
