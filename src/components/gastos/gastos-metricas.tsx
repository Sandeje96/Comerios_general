"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DesgloseCategoria } from "@/services/gasto.service";
import { TrendingUp, TrendingDown, DollarSign, Receipt, PieChart, ShoppingBag } from "lucide-react";

interface GastosMetricasProps {
  metricas: {
    totalGastos: number;
    totalVentas: number;
    balanceNeto: number;
    margenPorcentaje: number;
    cantidadGastos: number;
    cantidadVentas: number;
  };
  desglose: DesgloseCategoria[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
}

export function GastosMetricas({ metricas, desglose }: GastosMetricasProps) {
  const esGanancia = metricas.balanceNeto >= 0;

  return (
    <div className="space-y-4">
      {/* Tarjetas Superiores de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos por Ventas */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-xs font-semibold uppercase text-slate-500">
                Ingresos por Ventas
              </CardDescription>
              <CardTitle className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1">
                {formatCurrency(metricas.totalVentas)}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              {metricas.cantidadVentas} operaciones completadas
            </p>
          </CardContent>
        </Card>

        {/* Total Gastos */}
        <Card className="border-l-4 border-l-rose-500 shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-xs font-semibold uppercase text-slate-500">
                Total Gastos / Egresos
              </CardDescription>
              <CardTitle className="text-2xl lg:text-3xl font-extrabold text-rose-700 mt-1">
                {formatCurrency(metricas.totalGastos)}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              {metricas.cantidadGastos} registros de gastos
            </p>
          </CardContent>
        </Card>

        {/* Ganancia Neta / Balance */}
        <Card
          className={`border-l-4 shadow-sm bg-white ${
            esGanancia ? "border-l-emerald-500" : "border-l-red-500"
          }`}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-xs font-semibold uppercase text-slate-500">
                Ganancia Neta (Balance)
              </CardDescription>
              <CardTitle
                className={`text-2xl lg:text-3xl font-black mt-1 ${
                  esGanancia ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {formatCurrency(metricas.balanceNeto)}
              </CardTitle>
            </div>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                esGanancia
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {esGanancia ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              {esGanancia ? "Superávit neto en el período" : "Déficit en el período"}
            </p>
          </CardContent>
        </Card>

        {/* Margen de Rentabilidad */}
        <Card className="shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-xs font-semibold uppercase text-slate-500">
                Margen sobre Ventas
              </CardDescription>
              <CardTitle className="text-2xl lg:text-3xl font-bold text-slate-800 mt-1">
                {metricas.totalVentas > 0 ? `${metricas.margenPorcentaje}%` : "—"}
              </CardTitle>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              {metricas.totalVentas > 0
                ? "Ganancia porcentual de las ventas"
                : "Sin ventas en este período"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por Categoría de Gasto */}
      {desglose.length > 0 && (
        <Card className="shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>📊 Distribución de Gastos por Categoría</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Conocé en qué rubros se concentra el mayor porcentaje de tus gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {desglose.map((cat) => (
                <div
                  key={cat.categoria}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-slate-800 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(cat.porcentaje, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                    <span>{cat.cantidad} {cat.cantidad === 1 ? "pago" : "pagos"}</span>
                    <span className="font-semibold text-slate-700">{cat.porcentaje}% del total</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
