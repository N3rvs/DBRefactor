'use client';

import React, { createContext, useCallback, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type {
  RenameOp,
  CodeFixRunResult,
  SqlBundle,
  TableInfo,
  GenerateOptions,
} from '@/lib/types';
import { useDbSession, type DbSession } from '@/hooks/use-db-session';
import { analyzeSchemaBySession } from '@/lib/api';
import { normalizeDbSchema } from '@/lib/normalize-db-schema';

// ---------- STATE ----------
export interface AppState {
  plan: RenameOp[];
  results: {
    sql: SqlBundle | null;
    codefix: CodeFixRunResult | null;
    dbLog: string[] | null;
    isLoading: boolean;
    error: string | null;
  };
  schema: {
    tables: TableInfo[] | null;
    isLoading: boolean;
    error: string | null;
  };
  options: GenerateOptions & { rootKey: string };
}

const initialState: AppState = {
  plan: [],
  results: { sql: null, codefix: null, dbLog: null, isLoading: false, error: null },
  schema: { tables: null, isLoading: false, error: null },
  options: { rootKey: 'SOLUTION', useSynonyms: true, useViews: true, cqrs: false, allowDestructive: false },
};

// ---------- ACTIONS ----------
type Action =
  | { type: 'ADD_OPERATION'; payload: RenameOp }
  | { type: 'UPDATE_OPERATION'; payload: RenameOp }
  | { type: 'REMOVE_OPERATION'; payload: string } // id
  | { type: 'SET_PLAN'; payload: RenameOp[] }
  | { type: 'SET_RESULTS_LOADING'; payload: boolean }
  | { type: 'SET_RESULTS_SUCCESS'; payload: { sql: SqlBundle | null; codefix: CodeFixRunResult | null; dbLog: string[] | null } }
  | { type: 'SET_RESULTS_ERROR'; payload: string | null }
  | { type: 'CLEAR_RESULTS' }
  | { type: 'SET_SCHEMA_LOADING'; payload: boolean }
  | { type: 'SET_SCHEMA_SUCCESS'; payload: TableInfo[] }
  | { type: 'SET_SCHEMA_ERROR'; payload: string | null }
  | { type: 'SET_OPTION'; payload: { key: keyof AppState['options']; value: any } };

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
    default:
      return state;
  }
};

// ---------- CONTEXTO ----------
type AppContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  dbSession: DbSession;                              // connect(), disconnect(), sessionId, etc.
  refreshSchema: (sidOverride?: string) => Promise<void>; // acepta SessionId opcional
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ---------- PROVIDER ----------
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const dbSession = useDbSession();

  const refreshSchema = useCallback(
    async (sidOverride?: string) => {
      const sid = sidOverride ?? dbSession.sessionId;
      if (!sid) {
        dispatch({ type: 'SET_SCHEMA_ERROR', payload: 'No hay SessionId para analizar.' });
        return;
      }
      dispatch({ type: 'SET_SCHEMA_LOADING', payload: true });
      try {
        const data = await analyzeSchemaBySession({ sessionId: sid }); // camelCase
        const tables = normalizeDbSchema(data);
        dispatch({ type: 'SET_SCHEMA_SUCCESS', payload: tables });
      } catch (err: any) {
        dispatch({ type: 'SET_SCHEMA_ERROR', payload: err?.message ?? 'Error al analizar esquema' });
      }
    },
    [dbSession.sessionId]
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
