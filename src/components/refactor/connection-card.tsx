'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Database, Loader2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppContext } from '@/contexts/app-context';
import * as api from '@/lib/api';


export function ConnectionCard() {
  const [connectionString, setConnectionString] = useState('');
  const { toast } = useToast();
  const { state, dispatch, dbSession } = useAppContext();
  const { connect, disconnect, isLoading, sessionId, expiresAtUtc, error } = dbSession;

  const handleConnect = async () => {
    const trimmedConnectionString = connectionString.trim();
    if (!trimmedConnectionString) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La cadena de conexión no puede estar vacía.',
      });
      return;
    }
    try {
      const connection = await connect(trimmedConnectionString);
      toast({
        title: 'Éxito',
        description: 'Conectado a la base de datos con éxito.',
      });
      setConnectionString('');

      if(connection.SessionId) {
        // Automatically analyze schema on successful connection
        dispatch({ type: 'SET_SCHEMA_LOADING', payload: true });
        try {
          const response = await api.analyzeSchemaBySession({ SessionId: connection.SessionId });
          dispatch({ type: 'SET_SCHEMA_SUCCESS', payload: response.Tables });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Error al analizar el esquema.';
          dispatch({ type: 'SET_SCHEMA_ERROR', payload: errorMsg });
          toast({ variant: 'destructive', title: 'Análisis Automático Fallido', description: errorMsg });
        }
      }

    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Conexión Fallida',
        description: err instanceof Error ? err.message : 'Ocurrió un error desconocido.',
      });
    }
  };

  const handleDisconnect = async () => {
    if (!sessionId) return;
    try {
      await disconnect();
      toast({
        title: 'Éxito',
        description: 'Desconectado de la base de datos.',
      });
      dispatch({ type: 'SET_SCHEMA_SUCCESS', payload: [] }); // Clear schema on disconnect
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Desconexión Fallida',
        description: err instanceof Error ? err.message : 'Ocurrió un error desconocido.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-primary" />
          <CardTitle>Conexión de Base de Datos</CardTitle>
        </div>
        <CardDescription>
          Conéctese a su base de datos para comenzar a refactorizar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessionId ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Conectado</p>
                <p className="text-xs text-muted-foreground">
                  ID de Sesión: <span className="font-mono">{sessionId.substring(0, 8)}...</span>
                </p>
              </div>
            </div>
             {expiresAtUtc && (
              <p className="text-sm text-muted-foreground">
                La sesión expira {formatDistanceToNow(new Date(expiresAtUtc), { addSuffix: true, locale: es })}.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              placeholder="Ingrese su cadena de conexión a la base de datos..."
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
              autoComplete="off"
              data-lpignore="true"
              inputMode="none"
              aria-label="Cadena de Conexión de la Base de Datos"
            />
             {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <XCircle className="w-4 h-4"/>
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {sessionId ? (
          <Button
            onClick={handleDisconnect}
            disabled={isLoading}
            variant="destructive"
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Desconectar
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={isLoading || state.schema.isLoading} className="w-full">
            {(isLoading || state.schema.isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Conectar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
