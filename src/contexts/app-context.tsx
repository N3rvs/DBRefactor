'use client';

import { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { RenameOp, CodeFixResult, SqlScripts, TableInfo } from '@/lib/types';
import { useDbSession, type DbSession } from '@/hooks/use-db-session';


interface AppState {
  plan: RenameOp[];
  results: {
    sql: SqlScripts | null;
    codefix: CodeFixResult | null;
    dbLog: string[] | null;
    isLoading: boolean;
    error: string | null;
  };
  schema: {
    tables: TableInfo[] | null;
    isLoading: boolean;
    error: string | null;
  };
}

const initialState: AppState = {
  plan: [],
  results: {
    sql: null,
    codefix: null,
    dbLog: null,
    isLoading: false,
    error: null,
  },
  schema: {
    tables: null,
    isLoading: false,
    error: null,
  }
};

type Action =
  | { type: 'ADD_OPERATION'; payload: RenameOp }
  | { type: 'UPDATE_OPERATION'; payload: RenameOp }
  | { type: 'REMOVE_OPERATION'; payload: string } // id
  | { type: 'SET_PLAN'; payload: RenameOp[] }
  | { type: 'SET_RESULTS_LOADING'; payload: boolean }
  | { type: 'SET_RESULTS_SUCCESS'; payload: { sql: SqlScripts | null; codefix: CodeFixResult | null; dbLog: string[] | null; } }
  | { type: 'SET_RESULTS_ERROR'; payload: string | null }
  | { type: 'CLEAR_RESULTS' }
  | { type: 'SET_SCHEMA_LOADING'; payload: boolean }
  | { type: 'SET_SCHEMA_SUCCESS'; payload: TableInfo[] }
  | { type: 'SET_SCHEMA_ERROR'; payload: string | null };

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_OPERATION':
      return { ...state, plan: [...state.plan, action.payload] };
    case 'UPDATE_OPERATION':
      return {
        ...state,
        plan: state.plan.map((op) =>
          op.id === action.payload.id ? action.payload : op
        ),
      };
    case 'REMOVE_OPERATION':
      return {
        ...state,
        plan: state.plan.filter((op) => op.id !== action.payload),
      };
    case 'SET_PLAN':
      return { ...state, plan: action.payload };
    case 'SET_RESULTS_LOADING':
      return { ...state, results: { ...state.results, isLoading: action.payload, error: null } };
    case 'SET_RESULTS_SUCCESS':
      return { ...state, results: { ...action.payload, isLoading: false, error: null } };
    case 'SET_RESULTS_ERROR':
      return { ...state, results: { ...state.results, isLoading: false, error: action.payload } };
    case 'CLEAR_RESULTS':
      return {...state, results: initialState.results };
    case 'SET_SCHEMA_LOADING':
      return { ...state, schema: { ...state.schema, isLoading: action.payload, error: null } };
    case 'SET_SCHEMA_SUCCESS':
      return { ...state, schema: { ...state.schema, tables: action.payload, isLoading: false, error: null } };
    case 'SET_SCHEMA_ERROR':
      return { ...state, schema: { ...state.schema, tables: null, isLoading: false, error: action.payload } };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  dbSession: DbSession & {
    connect: (connectionString: string, ttlSeconds?: number) => Promise<any>;
    disconnect: () => Promise<void>;
    clearError: () => void;
  };
} | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const dbSession = useDbSession();

  return (
    <AppContext.Provider value={{ state, dispatch, dbSession }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
