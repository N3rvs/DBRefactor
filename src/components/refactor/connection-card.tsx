'use client';
import { useState } from 'react';
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
import { useDbSession } from '@/hooks/use-db-session';
import { formatDistanceToNow } from 'date-fns';

export function ConnectionCard() {
  const [connectionString, setConnectionString] = useState('');
  const { toast } = useToast();
  const { connect, disconnect, isLoading, sessionId, expiresAtUtc, error } = useDbSession();

  const handleConnect = async () => {
    if (!connectionString) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Connection string cannot be empty.',
      });
      return;
    }
    try {
      await connect(connectionString);
      toast({
        title: 'Success',
        description: 'Connected to database successfully.',
      });
      setConnectionString('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: err instanceof Error ? err.message : 'An unknown error occurred.',
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: 'Success',
        description: 'Disconnected from database.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Disconnect Failed',
        description: err instanceof Error ? err.message : 'An unknown error occurred.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-primary" />
          <CardTitle>Database Connection</CardTitle>
        </div>
        <CardDescription>
          Connect to your database to begin refactoring.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessionId ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Connected</p>
                <p className="text-xs text-muted-foreground">
                  Session ID: <span className="font-mono">{sessionId.substring(0, 8)}...</span>
                </p>
              </div>
            </div>
             {expiresAtUtc && (
              <p className="text-sm text-muted-foreground">
                Session expires {formatDistanceToNow(new Date(expiresAtUtc), { addSuffix: true })}.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your database connection string..."
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
              autoComplete="off"
              data-lpignore="true"
              inputMode="none"
              aria-label="Database Connection String"
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
            Disconnect
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
