'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2, HelpCircle, AlertTriangle } from 'lucide-react';
import { Separator } from '../ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppContext } from '@/contexts/app-context';

const InfoTooltip = ({ content }: { content: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button type="button" className="ml-2 text-muted-foreground hover:text-foreground">
        <HelpCircle className="h-4 w-4" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" align="center" className="max-w-xs">
      <p>{content}</p>
    </TooltipContent>
  </Tooltip>
);

export function RefactorOptions() {
  const { state, dispatch } = useAppContext();
  const { UseSynonyms, UseViews, Cqrs, AllowDestructive } = state.options;

  const handleOptionChange = (
    option: 'UseSynonyms' | 'UseViews' | 'Cqrs' | 'AllowDestructive',
    value: boolean
  ) => {
    dispatch({ type: 'SET_OPTION', payload: { key: option, value } });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Settings2 className="w-6 h-6 text-primary" />
          <CardTitle>Opciones de Refactorización</CardTitle>
        </div>
        <CardDescription>
          Configura las opciones de compatibilidad y limpieza.
        </CardDescription>
      </CardHeader>

      <TooltipProvider>
        <CardContent className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground">Compatibilidad</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Label htmlFor="useSynonyms">Usar Sinónimos</Label>
              <InfoTooltip content="Crea sinónimos para las tablas/columnas renombradas para compatibilidad con versiones anteriores. Esto permite que el código antiguo funcione sin actualizaciones inmediatas." />
            </div>
            <Switch
              id="useSynonyms"
              checked={!!UseSynonyms}
              onCheckedChange={(v) => handleOptionChange('UseSynonyms', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Label htmlFor="useViews">Usar Vistas</Label>
              <InfoTooltip content="Genera vistas que imitan la estructura original de la tabla, asegurando que las consultas de lectura de los sistemas heredados continúen funcionando sin problemas." />
            </div>
            <Switch
              id="useViews"
              checked={!!UseViews}
              onCheckedChange={(v) => handleOptionChange('UseViews', v)}
            />
          </div>

          {/* 🔹 CQRS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Label htmlFor="useCqrs">Usar CQRS</Label>
              <InfoTooltip content="Separa comandos (escritura) y consultas (lectura). El plan generará objetos SQL/compatibilidad pensados para dos rutas de acceso distintas." />
            </div>
            <Switch
              id="useCqrs"
              checked={!!Cqrs}
              onCheckedChange={(v) => handleOptionChange('Cqrs', v)}
            />
          </div>

          <Separator />

          <p className="text-sm font-semibold text-muted-foreground">Operaciones Destructivas</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Label htmlFor="allowDestructive" className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Permitir Eliminaciones
              </Label>
              <InfoTooltip content="Habilita la ejecución de operaciones DROP (eliminar tablas, columnas, etc.) durante la fase de limpieza. Esta acción es irreversible." />
            </div>
            <Switch
              id="allowDestructive"
              checked={!!AllowDestructive}
              onCheckedChange={(v) => handleOptionChange('AllowDestructive', v)}
            />
          </div>
        </CardContent>
      </TooltipProvider>
    </Card>
  );
}
