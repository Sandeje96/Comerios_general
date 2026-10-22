"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Filter, RotateCcw } from "lucide-react";
import { TipoFiltroHistorial } from "@/services/historial.service";

interface HistorialFiltrosProps {
  filtroActivo: TipoFiltroHistorial;
  desdeDefault: string;
  hastaDefault: string;
}

export function HistorialFiltros({
  filtroActivo,
  desdeDefault,
  hastaDefault,
}: HistorialFiltrosProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [modo, setModo] = useState<TipoFiltroHistorial>(filtroActivo);
  const [desde, setDesde] = useState(desdeDefault);
  const [hasta, setHasta] = useState(hastaDefault);

  const aplicarFiltroRapido = (nuevoFiltro: "hoy" | "semana" | "mes") => {
    setModo(nuevoFiltro);
    startTransition(() => {
      router.push(`/historial?filtro=${nuevoFiltro}`);
    });
  };

  const aplicarFiltroPersonalizado = (e: React.FormEvent) => {
    e.preventDefault();
    setModo("custom");
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("filtro", "custom");
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      router.push(`/historial?${params.toString()}`);
    });
  };

  const resetear = () => {
    aplicarFiltroRapido("semana");
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Botones rápidos de período */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Período:
          </span>
          <Button
            type="button"
            variant={modo === "hoy" ? "default" : "outline"}
            size="sm"
            onClick={() => aplicarFiltroRapido("hoy")}
            disabled={isPending}
            className="text-xs h-8"
          >
            Hoy
          </Button>
          <Button
            type="button"
            variant={modo === "semana" ? "default" : "outline"}
            size="sm"
            onClick={() => aplicarFiltroRapido("semana")}
            disabled={isPending}
            className="text-xs h-8"
          >
            Esta Semana
          </Button>
          <Button
            type="button"
            variant={modo === "mes" ? "default" : "outline"}
            size="sm"
            onClick={() => aplicarFiltroRapido("mes")}
            disabled={isPending}
            className="text-xs h-8"
          >
            Este Mes
          </Button>
          <Button
            type="button"
            variant={modo === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setModo("custom")}
            disabled={isPending}
            className="text-xs h-8"
          >
            Personalizado
          </Button>
        </div>

        {modo !== "semana" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetear}
            className="text-xs text-slate-500 hover:text-slate-900 h-8 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reestablecer
          </Button>
        )}
      </div>

      {/* Selector de Rango Personalizado */}
      <form
        onSubmit={aplicarFiltroPersonalizado}
        className={`flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100 ${
          modo === "custom" ? "block" : "hidden sm:flex opacity-75"
        }`}
      >
        <div className="space-y-1">
          <Label htmlFor="desde" className="text-xs text-slate-600 font-medium">
            Fecha Desde
          </Label>
          <Input
            id="desde"
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setModo("custom");
            }}
            className="h-8 text-xs w-36 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="hasta" className="text-xs text-slate-600 font-medium">
            Fecha Hasta
          </Label>
          <Input
            id="hasta"
            type="date"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setModo("custom");
            }}
            className="h-8 text-xs w-36 bg-slate-50 focus:bg-white"
          />
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="h-8 text-xs flex items-center gap-1.5"
        >
          <Filter className="w-3.5 h-3.5" />
          {isPending ? "Filtrando..." : "Filtrar por Rango"}
        </Button>
      </form>
    </div>
  );
}
