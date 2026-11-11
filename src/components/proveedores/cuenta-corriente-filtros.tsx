"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TipoFiltroCC } from "@/services/proveedor.service";
import { Calendar, Filter, RotateCcw } from "lucide-react";

interface CuentaCorrienteFiltrosProps {
  filtroActivo: TipoFiltroCC;
  desdeDefault?: string;
  hastaDefault?: string;
}

export function CuentaCorrienteFiltros({
  filtroActivo,
  desdeDefault = "",
  hastaDefault = "",
}: CuentaCorrienteFiltrosProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mostrarCustom, setMostrarCustom] = useState(filtroActivo === "custom");
  const [desde, setDesde] = useState(desdeDefault);
  const [hasta, setHasta] = useState(hastaDefault);

  const setFiltroRapido = (tipo: TipoFiltroCC) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filtro", tipo);
    params.delete("desde");
    params.delete("hasta");
    setMostrarCustom(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  const aplicarRangoCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("filtro", "custom");
    if (desde) params.set("desde", desde);
    else params.delete("desde");
    if (hasta) params.set("hasta", hasta);
    else params.delete("hasta");
    router.push(`${pathname}?${params.toString()}`);
  };

  const limpiarFiltros = () => {
    router.push(pathname);
    setMostrarCustom(false);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Selector de Períodos Rápidos */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Período:
          </span>

          <Button
            type="button"
            variant={filtroActivo === "mes" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroRapido("mes")}
            className="text-xs h-8"
          >
            Este Mes
          </Button>

          <Button
            type="button"
            variant={filtroActivo === "semana" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroRapido("semana")}
            className="text-xs h-8"
          >
            Esta Semana
          </Button>

          <Button
            type="button"
            variant={filtroActivo === "hoy" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroRapido("hoy")}
            className="text-xs h-8"
          >
            Hoy
          </Button>

          <Button
            type="button"
            variant={filtroActivo === "historico" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroRapido("historico")}
            className="text-xs h-8"
          >
            Histórico Completo
          </Button>

          <Button
            type="button"
            variant={mostrarCustom || filtroActivo === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setMostrarCustom(!mostrarCustom)}
            className="text-xs h-8"
          >
            Personalizado
          </Button>
        </div>

        {/* Botón de limpiar filtros si no es histórico */}
        {(filtroActivo !== "historico" || searchParams.toString().length > 0) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={limpiarFiltros}
            className="text-xs h-8 text-slate-500 hover:text-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restablecer
          </Button>
        )}
      </div>

      {/* Rango Personalizado Desplegable */}
      {mostrarCustom && (
        <form
          onSubmit={aplicarRangoCustom}
          className="pt-3 border-t border-slate-100 flex flex-wrap items-end gap-3"
        >
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Desde</label>
            <Input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Hasta</label>
            <Input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>

          <Button
            type="submit"
            size="sm"
            className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800"
          >
            <Filter className="w-3.5 h-3.5 mr-1" /> Aplicar Rango
          </Button>
        </form>
      )}
    </div>
  );
}
