import { auth } from "@/lib/auth";
import { getGastosDashboardData } from "@/services/gasto.service";
import { GastosFiltros } from "@/components/gastos/gastos-filtros";
import { GastosMetricas } from "@/components/gastos/gastos-metricas";
import { GastosTable } from "@/components/gastos/gastos-table";
import { GastosPdfButton } from "@/components/gastos/gastos-pdf-button";
import { NuevoGastoModal } from "@/components/gastos/nuevo-gasto-modal";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gastos y Rentabilidad | Gestión Comercial",
};

interface GastosPageProps {
  searchParams: Promise<{
    filtro?: string;
    desde?: string;
    hasta?: string;
  }>;
}

export default async function GastosPage({ searchParams }: GastosPageProps) {
  const session = await auth();

  if (!session?.user?.comercioId) {
    return null;
  }

  const resolvedParams = await searchParams;
  const data = await getGastosDashboardData(session.user.comercioId, resolvedParams);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado y Acciones Principales */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Control de Gastos y Rentabilidad
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Registrá tus egresos del local y calculá tu ganancia neta real:{" "}
            <span className="font-semibold text-slate-700">{data.rangoTexto}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GastosPdfButton
            gastos={data.gastos}
            rangoTexto={data.rangoTexto}
            totalGastos={data.metricas.totalGastos}
            totalVentas={data.metricas.totalVentas}
            balanceNeto={data.metricas.balanceNeto}
            desglose={data.desgloseCategorias}
          />
          <NuevoGastoModal />
        </div>
      </div>

      {/* Barra de Filtros de Período */}
      <GastosFiltros
        filtroActivo={data.filtroActivo}
        desdeDefault={data.desdeStr}
        hastaDefault={data.hastaStr}
      />

      {/* Métricas Financieras y Desglose de Gastos */}
      <GastosMetricas
        metricas={data.metricas}
        desglose={data.desgloseCategorias}
      />

      {/* Listado de Gastos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            Registro Detallado de Egresos
          </h3>
          <span className="text-xs text-slate-400">
            Podés buscar por proveedor, factura o medio de pago
          </span>
        </div>

        <GastosTable gastos={data.gastos} />
      </div>
    </div>
  );
}
