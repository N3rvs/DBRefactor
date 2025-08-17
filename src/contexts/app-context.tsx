'use client';

import React, { createContext, useCallback, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type {
  PlanOperation,
  CodeFixRunResult,
  SqlBundle,
  TableInfo,
  CleanupRequest,
  RefactorRequest
} from '@/lib/types';
import { useDbSession, type DbSession } from '@/hooks/use-db-session';
import { analyzeSchema } from '@/lib/api';
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
  connectionString: string | null; // Guardar la cadena de conexión en el estado
}

const initialState: AppState = {
  plan: [],
  results: { sql: null, codefix: null, dbLog: null, isLoading: false, error: null },
  schema: { tables: null, isLoading: false, error: null },
  options: { rootKey: 'SOLUTION', useSynonyms: true, useViews: true, cqrs: false, allowDestructive: false },
  connectionString: null,
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
  | { type: 'SET_CONNECTION_STRING'; payload: string | null };

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
    case 'SET_CONNECTION_STRING':
      return { ...state, connectionString: action.payload };
    default:
      return state;
  }
};

// ---------- CONTEXTO ----------
type AppContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  dbSession: DbSession;
  refreshSchema: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ---------- PROVIDER ----------
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const dbSession = useDbSession();

  const refreshSchema = useCallback(
    async () => {
      const cs = state.connectionString;
      if (!cs) {
        dispatch({ type: 'SET_SCHEMA_ERROR', payload: 'No hay cadena de conexión para analizar.' });
        return;
      }
      dispatch({ type: 'SET_SCHEMA_LOADING', payload: true });
      try {
        const data = await analyzeSchema({ connectionString: cs });
        const tables = normalizeDbSchema(data); 
        dispatch({ type: 'SET_SCHEMA_SUCCESS', payload: tables });
      } catch (err: any) {
        dispatch({ type: 'SET_SCHEMA_ERROR', payload: err?.message ?? 'Error al analizar esquema' });
      }
    },
    [state.connectionString]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, dbSession, refreshSchema }}>
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
