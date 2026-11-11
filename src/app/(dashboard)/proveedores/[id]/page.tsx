import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCuentaCorrienteDetalle } from "@/services/proveedor.service";
import { CuentaCorrienteHeader } from "@/components/proveedores/cuenta-corriente-header";
import { CuentaCorrienteFiltros } from "@/components/proveedores/cuenta-corriente-filtros";
import { CuentaCorrienteTable } from "@/components/proveedores/cuenta-corriente-table";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cuenta Corriente Proveedor | Gestión Comercial",
};

interface ProveedorDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    filtro?: string;
    desde?: string;
    hasta?: string;
  }>;
}

export default async function ProveedorDetailPage({
  params,
  searchParams,
}: ProveedorDetailPageProps) {
  const session = await auth();

  if (!session?.user?.comercioId) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  let data;
  try {
    data = await getCuentaCorrienteDetalle(
      session.user.comercioId,
      resolvedParams.id,
      resolvedSearchParams
    );
  } catch (err) {
    redirect("/proveedores");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado con datos del proveedor y métricas */}
      <CuentaCorrienteHeader
        proveedor={data.proveedor}
        metricasGlobales={data.metricasGlobales}
        metricasPeriodo={data.metricasPeriodo}
        saldoAnterior={data.saldoAnterior}
        saldoFinal={data.saldoFinal}
        rangoTexto={data.rangoTexto}
        movimientos={data.movimientos}
      />

      {/* Filtros de Período y Fechas */}
      <CuentaCorrienteFiltros
        filtroActivo={data.filtroActivo}
        desdeDefault={data.desdeStr}
        hastaDefault={data.hastaStr}
      />

      {/* Tabla Cronológica con Saldo Acumulado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            Libro Mayor de Cuenta Corriente
          </h3>
          <span className="text-xs text-slate-400">
            Período: <b className="text-slate-600">{data.rangoTexto}</b>
          </span>
        </div>

        <CuentaCorrienteTable
          movimientos={data.movimientos}
          saldoAnterior={data.saldoAnterior}
          proveedorId={data.proveedor.id}
          proveedorNombre={data.proveedor.nombre}
        />
      </div>
    </div>
  );
}
