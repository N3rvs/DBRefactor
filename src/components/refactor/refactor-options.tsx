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
import { Settings2, HelpCircle } from 'lucide-react';
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
  const { useSynonyms, useViews, cqrs } = state.options;

  const handleOptionChange = (option: 'useSynonyms' | 'useViews' | 'cqrs', value: boolean) => {
    dispatch({ type: 'SET_REFACTOR_OPTION', payload: { key: option, value } });
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Label htmlFor="useSynonyms" className="font-semibold">
                Usar Sinónimos
              </Label>
              <InfoTooltip content="Crea sinónimos para las tablas/columnas renombradas para compatibilidad con versiones anteriores. Esto permite que el código antiguo funcione sin actualizaciones inmediatas." />
            </div>
            <Switch
              id="useSynonyms"
              checked={useSynonyms}
              onCheckedChange={(value) => handleOptionChange('useSynonyms', value)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Label htmlFor="useViews" className="font-semibold">
                Usar Vistas
              </Label>
              <InfoTooltip content="Genera vistas que imitan la estructura original de la tabla, asegurando que las consultas de lectura de los sistemas heredados continúen funcionando sin problemas." />
            </div>
            <Switch
              id="useViews"
              checked={useViews}
              onCheckedChange={(value) => handleOptionChange('useViews', value)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Label htmlFor="useCqrs" className="font-semibold">
                Usar Vistas CQRS
              </Label>
              <InfoTooltip content="Implementa la Segregación de Responsabilidad de Consulta y Comando (CQRS) creando vistas separadas para operaciones de lectura, aislándolas de las operaciones de escritura." />
            </div>
            <Switch
              id="useCqrs"
              checked={cqrs}
              onCheckedChange={(value) => handleOptionChange('cqrs', value)}
            />
          </div>
        </CardContent>
      </TooltipProvider>
    </Card>
  );
}
