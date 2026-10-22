import { auth } from "@/lib/auth";
import { getHistorialData } from "@/services/historial.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HistorialFiltros } from "@/components/historial/historial-filtros";
import { HistorialTable } from "@/components/historial/historial-table";
import { HistorialPdfButton } from "@/components/historial/historial-pdf-button";
import { DollarSign, ShoppingBag, Receipt, PackageCheck } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Historial de Ventas | Gestión Comercial",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
}

interface HistorialPageProps {
  searchParams: Promise<{
    filtro?: string;
    desde?: string;
    hasta?: string;
  }>;
}

export default async function HistorialPage({ searchParams }: HistorialPageProps) {
  const session = await auth();

  if (!session?.user?.comercioId) {
    return null;
  }

  const resolvedParams = await searchParams;
  const data = await getHistorialData(session.user.comercioId, resolvedParams);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Historial de Ventas
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Analizá tus ingresos y consultá los comprobantes emitidos:{" "}
            <span className="font-semibold text-slate-700">{data.rangoTexto}</span>
          </p>
        </div>

        <HistorialPdfButton
          ventas={data.ventas}
          rangoTexto={data.rangoTexto}
          totalRecaudado={data.metricas.totalRecaudado}
          cantidadVentas={data.metricas.cantidadVentas}
        />
      </div>

      {/* Barra de Filtros */}
      <HistorialFiltros
        filtroActivo={data.filtroActivo}
        desdeDefault={data.desdeStr}
        hastaDefault={data.hastaStr}
      />

      {/* Tarjetas de Métricas del Período Seleccionado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facturado */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-xs font-semibold uppercase text-slate-500">
                Total Facturado
              </CardDescription>
              <CardTitle className="text-2xl lg:text-3xl font-black text-slate-900 mt-1">
                {formatCurrency(data.metricas.totalRecaudado)}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              En el período seleccionado
            </p>
          </CardContent>
        </Card>

        {/* Cantidad de Ventas */}
        <Card className="shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-xs font-semibold uppercase text-slate-500">
                Operaciones
              </CardDescription>
              <CardTitle className="text-2xl lg:text-3xl font-bold text-slate-800 mt-1">
                {data.metricas.cantidadVentas}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              Tickets y comprobantes
            </p>
          </CardContent>
        </Card>

        {/* Ticket Promedio */}
        <Card className="shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-xs font-semibold uppercase text-slate-500">
                Ticket Promedio
              </CardDescription>
              <CardTitle className="text-2xl lg:text-3xl font-bold text-slate-800 mt-1">
                {formatCurrency(data.metricas.ticketPromedio)}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              Monto promedio por compra
            </p>
          </CardContent>
        </Card>

        {/* Artículos Vendidos */}
        <Card className="shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-xs font-semibold uppercase text-slate-500">
                Artículos Vendidos
              </CardDescription>
              <CardTitle className="text-2xl lg:text-3xl font-bold text-slate-800 mt-1">
                {data.metricas.totalArticulosVendidos}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              Unidades despachadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Listado y Detalle de Ventas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            Listado de Comprobantes
          </h3>
          <span className="text-xs text-slate-400">
            Hacé click en cualquier fila para ver el ticket detallado
          </span>
        </div>

        <HistorialTable ventas={data.ventas} />
      </div>
    </div>
  );
}
