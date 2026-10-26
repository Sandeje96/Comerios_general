"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Filter, RotateCcw } from "lucide-react";
import { TipoFiltroGastos } from "@/services/gasto.service";

interface GastosFiltrosProps {
  filtroActivo: TipoFiltroGastos;
  desdeDefault: string;
  hastaDefault: string;
}

export function GastosFiltros({
  filtroActivo,
  desdeDefault,
  hastaDefault,
}: GastosFiltrosProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modo, setModo] = useState<TipoFiltroGastos>(filtroActivo);
  const [desde, setDesde] = useState(desdeDefault);
  const [hasta, setHasta] = useState(hastaDefault);

  const aplicarFiltroRapido = (nuevoFiltro: "mes" | "semana" | "hoy") => {
    setModo(nuevoFiltro);
    startTransition(() => {
      router.push(`/gastos?filtro=${nuevoFiltro}`);
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
      router.push(`/gastos?${params.toString()}`);
    });
  };

  const resetear = () => {
    aplicarFiltroRapido("mes");
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Botones de selección rápida */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Período:
          </span>
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
            variant={modo === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setModo("custom")}
            disabled={isPending}
            className="text-xs h-8"
          >
            Personalizado
          </Button>
        </div>

        {modo !== "mes" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetear}
            className="text-xs text-slate-500 hover:text-slate-900 h-8 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reestablecer a Este Mes
          </Button>
        )}
      </div>

      {/* Rango de fechas personalizado */}
      <form
        onSubmit={aplicarFiltroPersonalizado}
        className={`flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100 ${
          modo === "custom" ? "block" : "hidden sm:flex opacity-75"
        }`}
      >
        <div className="space-y-1">
          <Label htmlFor="desde-gasto" className="text-xs text-slate-600 font-medium">
            Fecha Desde
          </Label>
          <Input
            id="desde-gasto"
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
          <Label htmlFor="hasta-gasto" className="text-xs text-slate-600 font-medium">
            Fecha Hasta
          </Label>
          <Input
            id="hasta-gasto"
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
