'use client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Database, Loader2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppContext } from '@/contexts/app-context';

export function ConnectionCard() {
  const [localConnectionString, setLocalConnectionString] = useState('');
  const { toast } = useToast();
  const { state, connect, disconnect } = useAppContext();
  const { sessionId, sessionExpiresAt, sessionIsLoading, sessionError } = state;

  const handleConnect = async () => {
    const trimmed = localConnectionString.trim();
    if (!trimmed) {
      toast({ variant: 'destructive', title: 'Error', description: 'La cadena de conexión no puede estar vacía.' });
      return;
    }
    try {
      await connect(trimmed);
      toast({ title: 'Éxito', description: 'Conectado a la base de datos con éxito.' });
      setLocalConnectionString(''); // Limpiar la cadena de conexión de la UI
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Conexión Fallida',
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
        <CardDescription>Conéctese a su base de datos para comenzar a refactorizar.</CardDescription>
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
            {sessionExpiresAt && (
              <p className="text-sm text-muted-foreground">
                La sesión expira {formatDistanceToNow(new Date(sessionExpiresAt), { addSuffix: true, locale: es })}.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              placeholder="Ingrese su cadena de conexión a la base de datos..."
              value={localConnectionString}
              onChange={(e) => setLocalConnectionString(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
              autoComplete="off"
              data-lpignore="true"
              inputMode="none"
              aria-label="Cadena de Conexión de la Base de Datos"
            />
            {sessionError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <XCircle className="w-4 h-4" />
                <span>{sessionError}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        {sessionId ? (
          <Button onClick={disconnect} disabled={sessionIsLoading} variant="destructive" className="w-full">
            {sessionIsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Desconectar
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={sessionIsLoading || state.schema.isLoading} className="w-full">
            {(sessionIsLoading || state.schema.isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Conectar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
