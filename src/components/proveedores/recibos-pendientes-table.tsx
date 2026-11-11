"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MarcarReciboModal } from "@/components/proveedores/marcar-recibo-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  Search,
  Building2,
  DollarSign,
  ArrowLeft,
  Filter,
} from "lucide-react";

interface ReciboPendienteItem {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  proveedorCuit?: string | null;
  fecha: Date | string;
  fechaLegible: string;
  monto: number;
  medioPago: string;
  medioPagoLabel: string;
  medioPagoIcon: string;
  referencia?: string | null;
  observaciones?: string | null;
  comprobantePagoUrl?: string | null;
  comprobantePagoNombre?: string | null;
  chequeNumero?: string | null;
  chequeBanco?: string | null;
  transferenciaBanco?: string | null;
  transferenciaOperacion?: string | null;
  diasTranscurridos: number;
  severidad: "normal" | "alerta" | "critica";
}

interface RecibosPendientesTableProps {
  items: ReciboPendienteItem[];
  metricas: {
    cantidadTotal: number;
    montoTotalPendiente: number;
  };
  proveedores: { id: string; nombre: string }[];
  proveedorIdFiltro?: string;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function RecibosPendientesTable({
  items,
  metricas,
  proveedores,
  proveedorIdFiltro = "",
}: RecibosPendientesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [busqueda, setBusqueda] = useState("");

  const handleProveedorFilter = (pId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pId) {
      params.set("proveedorId", pId);
    } else {
      params.delete("proveedorId");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const itemsFiltrados = items.filter((item) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      item.proveedorNombre.toLowerCase().includes(q) ||
      item.medioPagoLabel.toLowerCase().includes(q) ||
      (item.referencia && item.referencia.toLowerCase().includes(q)) ||
      (item.chequeNumero && item.chequeNumero.toLowerCase().includes(q)) ||
      (item.transferenciaOperacion && item.transferenciaOperacion.toLowerCase().includes(q)) ||
      item.monto.toString().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Encabezado y Métricas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/proveedores"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Cuentas Corrientes</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Control de Recibos Pendientes
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Seguimiento de pagos realizados que aún no cuentan con recibo del proveedor.
              </p>
            </div>
          </div>
        </div>

        {/* Resumen en Badge */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Monto sin respaldo
            </span>
            <span className="text-xl font-black text-amber-700">
              {formatMoney(metricas.montoTotalPendiente)}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-1"></div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Pagos Pendientes
            </span>
            <span className="text-xl font-black text-slate-900">
              {metricas.cantidadTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Filtro por Proveedor */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={proveedorIdFiltro}
            onChange={(e) => handleProveedorFilter(e.target.value)}
            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Todos los Proveedores ({proveedores.length})</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Buscador */}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por proveedor, referencia o monto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 text-xs h-9 bg-white"
          />
        </div>
      </div>

      {/* Tabla de Recibos Pendientes */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Fecha de Pago</th>
                <th className="py-3 px-4 text-center">Días Transcurridos</th>
                <th className="py-3 px-4 text-right">Importe Pagado</th>
                <th className="py-3 px-4">Medio de Pago</th>
                <th className="py-3 px-4">Comprobante de Pago</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="font-semibold text-slate-700">
                        ¡Excelente! No hay recibos pendientes de confirmación.
                      </p>
                      <p className="text-xs text-slate-400">
                        Todos los pagos a proveedores cuentan con su comprobante registrado.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Proveedor */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/proveedores/${item.proveedorId}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {item.proveedorNombre}
                        </Link>
                        {item.proveedorCuit && (
                          <span className="block text-[10px] text-slate-400">
                            CUIT: {item.proveedorCuit}
                          </span>
                        )}
                      </td>

                      {/* Fecha de Pago */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {item.fechaLegible}
                      </td>

                      {/* Días Transcurridos con Alerta */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.severidad === "critica"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : item.severidad === "alerta"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {item.severidad === "critica" ? (
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>
                            {item.diasTranscurridos === 0
                              ? "Hoy"
                              : item.diasTranscurridos === 1
                              ? "Ayer"
                              : `Hace ${item.diasTranscurridos} días`}
                          </span>
                        </span>
                      </td>

                      {/* Importe */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                        {formatMoney(item.monto)}
                      </td>

                      {/* Medio de Pago */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <span>{item.medioPagoIcon}</span>
                          <span>{item.medioPagoLabel}</span>
                        </div>
                        {item.transferenciaOperacion && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            Op: {item.transferenciaOperacion}
                          </span>
                        )}
                        {item.chequeNumero && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            Cheque: #{item.chequeNumero}
                          </span>
                        )}
                      </td>

                      {/* Comprobante de Pago propio */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.comprobantePagoUrl ? (
                          <a
                            href={item.comprobantePagoUrl}
                            download={item.comprobantePagoNombre || "comprobante-pago"}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>Ver Comprobante Bancario</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                          <span>⏳ Pendiente</span>
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <MarcarReciboModal
                          pagoId={item.id}
                          proveedorId={item.proveedorId}
                          proveedorNombre={item.proveedorNombre}
                          fechaLegible={item.fechaLegible}
                          monto={item.monto}
                          medioPagoLabel={item.medioPagoLabel}
                          reciboRecibidoActualmente={false}
                          trigger={
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marcar Recibido</span>
                            </Button>
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
