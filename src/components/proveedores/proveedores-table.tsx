"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NuevoProveedorModal } from "@/components/proveedores/nuevo-proveedor-modal";
import { NuevaCotizacionModal } from "@/components/proveedores/nueva-cotizacion-modal";
import { NuevoPagoModal } from "@/components/proveedores/nuevo-pago-modal";
import {
  Search,
  Building2,
  Phone,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  Edit2,
} from "lucide-react";

interface ProveedorResumen {
  id: string;
  nombre: string;
  cuit: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  observaciones: string | null;
  totalDebitos: number;
  totalCreditos: number;
  saldoActual: number;
  recibosPendientes: number;
  createdAt: Date;
}

interface ProveedoresTableProps {
  proveedores: ProveedorResumen[];
  metricas: {
    totalProveedores: number;
    proveedoresConDeuda: number;
    deudaTotal: number;
    saldoAFavorTotal: number;
    totalRecibosPendientes: number;
  };
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ProveedoresTable({
  proveedores,
  metricas,
}: ProveedoresTableProps) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "TODOS" | "CON_DEUDA" | "A_FAVOR" | "AL_DIA" | "RECIBOS_PENDIENTES"
  >("TODOS");

  const proveedoresFiltrados = proveedores.filter((p) => {
    // Filtro por estado financiero
    if (filtroEstado === "CON_DEUDA" && p.saldoActual <= 0) return false;
    if (filtroEstado === "A_FAVOR" && p.saldoActual >= 0) return false;
    if (filtroEstado === "AL_DIA" && p.saldoActual !== 0) return false;
    if (filtroEstado === "RECIBOS_PENDIENTES" && p.recibosPendientes === 0) return false;

    // Filtro por texto
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      (p.cuit && p.cuit.toLowerCase().includes(q)) ||
      (p.telefono && p.telefono.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.direccion && p.direccion.toLowerCase().includes(q))
    );
  });

  const proveedoresOptions = proveedores.map((p) => ({
    id: p.id,
    nombre: p.nombre,
  }));

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Deuda Total */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
              Deuda Total a Proveedores
            </span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-950 mt-2 tracking-tight">
            {formatMoney(metricas.deudaTotal)}
          </p>
          <p className="text-[11px] text-rose-700 mt-1">
            En {metricas.proveedoresConDeuda}{" "}
            {metricas.proveedoresConDeuda === 1 ? "proveedor" : "proveedores"} con saldo pendiente.
          </p>
        </div>

        {/* Saldo a Favor */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Saldo a Favor
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-2 tracking-tight">
            {formatMoney(metricas.saldoAFavorTotal)}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">
            Crédito disponible para futuras compras.
          </p>
        </div>

        {/* Total Proveedores */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Proveedores Activos
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {metricas.totalProveedores}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Empresas y distribuidoras dadas de alta.
          </p>
        </div>

        {/* Control de Recibos Pendientes */}
        <Link
          href="/proveedores/recibos-pendientes"
          className="p-4 rounded-xl border border-amber-200 bg-amber-50/80 shadow-xs hover:border-amber-400 transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
              Recibos Pendientes
            </span>
            <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-2 tracking-tight flex items-baseline gap-1">
            <span>{metricas.totalRecibosPendientes}</span>
            <span className="text-xs font-normal text-amber-800">pagos sin recibo</span>
          </p>
          <p className="text-[11px] text-amber-700 mt-1 font-semibold group-hover:underline flex items-center gap-1">
            <span>Ver panel de recibos pendientes</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>
      </div>

      {/* Barra de Filtros, Búsqueda y Creación */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
        {/* Pills de Filtrado */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFiltroEstado("TODOS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filtroEstado === "TODOS"
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Todos ({proveedores.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("CON_DEUDA")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filtroEstado === "CON_DEUDA"
                ? "bg-rose-700 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Con Deuda ({proveedores.filter((p) => p.saldoActual > 0).length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("A_FAVOR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filtroEstado === "A_FAVOR"
                ? "bg-emerald-700 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            A Favor ({proveedores.filter((p) => p.saldoActual < 0).length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("AL_DIA")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filtroEstado === "AL_DIA"
                ? "bg-blue-700 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Al Día ({proveedores.filter((p) => p.saldoActual === 0).length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("RECIBOS_PENDIENTES")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filtroEstado === "RECIBOS_PENDIENTES"
                ? "bg-amber-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            ⏳ Con Recibos Pendientes (
            {proveedores.filter((p) => p.recibosPendientes > 0).length})
          </button>
        </div>

        {/* Buscador y Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Buscar proveedor o CUIT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 text-xs h-9 bg-white"
            />
          </div>
          <NuevaCotizacionModal proveedoresDisponibles={proveedoresOptions} />
          <NuevoPagoModal proveedoresDisponibles={proveedoresOptions} />
          <NuevoProveedorModal />
        </div>
      </div>

      {/* Tabla de Proveedores */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4 text-right">Saldo Actual</th>
                <th className="py-3 px-4 text-right">Total Débitos</th>
                <th className="py-3 px-4 text-right">Total Créditos</th>
                <th className="py-3 px-4 text-center">Recibos Pendientes</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron proveedores que coincidan con la búsqueda o filtro seleccionado.
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Proveedor */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/proveedores/${p.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm"
                        >
                          {p.nombre}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          {p.cuit && <span>CUIT: {p.cuit}</span>}
                          {p.telefono && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="w-3 h-3" /> {p.telefono}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Saldo Actual */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-black text-sm ${
                              p.saldoActual > 0
                                ? "text-rose-700"
                                : p.saldoActual < 0
                                ? "text-emerald-700"
                                : "text-slate-600"
                            }`}
                          >
                            {formatMoney(Math.abs(p.saldoActual))}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {p.saldoActual > 0
                              ? "Deuda con proveedor"
                              : p.saldoActual < 0
                              ? "Saldo a favor"
                              : "Al día"}
                          </span>
                        </div>
                      </td>

                      {/* Total Débitos */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-700">
                        {formatMoney(p.totalDebitos)}
                      </td>

                      {/* Total Créditos */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-700">
                        {formatMoney(p.totalCreditos)}
                      </td>

                      {/* Recibos Pendientes */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {p.recibosPendientes > 0 ? (
                          <Link
                            href={`/proveedores/recibos-pendientes?proveedorId=${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>
                              {p.recibosPendientes}{" "}
                              {p.recibosPendientes === 1 ? "pendiente" : "pendientes"}
                            </span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Al día</span>
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <NuevoProveedorModal
                            proveedor={p}
                            trigger={
                              <button
                                type="button"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                title="Editar proveedor"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            }
                          />

                          <NuevaCotizacionModal
                            proveedorId={p.id}
                            proveedorNombre={p.nombre}
                            trigger={
                              <button
                                type="button"
                                className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                              >
                                + Cotización
                              </button>
                            }
                          />

                          <NuevoPagoModal
                            proveedorId={p.id}
                            proveedorNombre={p.nombre}
                            trigger={
                              <button
                                type="button"
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                              >
                                + Pago
                              </button>
                            }
                          />

                          <Link href={`/proveedores/${p.id}`}>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1"
                            >
                              <span>Ver Cuenta</span>
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
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
