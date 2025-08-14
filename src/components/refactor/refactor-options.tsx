'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2 } from 'lucide-react';
import { Separator } from '../ui/separator';

export function RefactorOptions() {
  const [useSynonyms, setUseSynonyms] = useState(true);
  const [useViews, setUseViews] = useState(true);
  const [useCqrs, setUseCqrs] = useState(true);

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
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="useSynonyms" className="font-semibold">Usar Sinónimos</Label>
            <Switch
              id="useSynonyms"
              checked={useSynonyms}
              onCheckedChange={setUseSynonyms}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Crea sinónimos para las tablas/columnas renombradas para compatibilidad con versiones anteriores. Esto permite que el código antiguo funcione sin actualizaciones inmediatas.
          </p>
        </div>
        <Separator />
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label htmlFor="useViews" className="font-semibold">Usar Vistas</Label>
                <Switch id="useViews" checked={useViews} onCheckedChange={setUseViews} />
            </div>
            <p className="text-sm text-muted-foreground">
                Genera vistas que imitan la estructura original de la tabla, asegurando que las consultas de lectura de los sistemas heredados continúen funcionando sin problemas.
            </p>
        </div>
        <Separator />
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label htmlFor="useCqrs" className="font-semibold">Usar Vistas CQRS</Label>
                <Switch id="useCqrs" checked={useCqrs} onCheckedChange={setUseCqrs} />
            </div>
            <p className="text-sm text-muted-foreground">
                Implementa la Segregación de Responsabilidad de Consulta y Comando (CQRS) creando vistas separadas para operaciones de lectura, aislándolas de las operaciones de escritura.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
