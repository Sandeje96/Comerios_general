"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Phone, Mail, MapPin, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { NuevoProveedorModal } from "@/components/proveedores/nuevo-proveedor-modal";
import { NuevaCotizacionModal } from "@/components/proveedores/nueva-cotizacion-modal";
import { NuevoPagoModal } from "@/components/proveedores/nuevo-pago-modal";
import { CuentaCorrientePdfButton } from "@/components/proveedores/cuenta-corriente-pdf-button";
import { MovimientoCCItemResponse } from "@/services/proveedor.service";

interface CuentaCorrienteHeaderProps {
  proveedor: {
    id: string;
    nombre: string;
    cuit: string | null;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    observaciones: string | null;
  };
  metricasGlobales: {
    saldoActual: number;
    totalDebitos: number;
    totalCreditos: number;
    recibosPendientes: number;
  };
  metricasPeriodo: {
    totalDebitos: number;
    totalCreditos: number;
    cantidadMovimientos: number;
  };
  saldoAnterior: number;
  saldoFinal: number;
  rangoTexto: string;
  movimientos: MovimientoCCItemResponse[];
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function CuentaCorrienteHeader({
  proveedor,
  metricasGlobales,
  metricasPeriodo,
  saldoAnterior,
  saldoFinal,
  rangoTexto,
  movimientos,
}: CuentaCorrienteHeaderProps) {
  const { saldoActual, totalDebitos, totalCreditos, recibosPendientes } = metricasGlobales;

  return (
    <div className="space-y-5">
      {/* Barra superior de navegación y acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/proveedores"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al listado de proveedores</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {proveedor.nombre}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                {proveedor.cuit && <span>CUIT: {proveedor.cuit}</span>}
                {proveedor.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {proveedor.telefono}
                  </span>
                )}
                {proveedor.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {proveedor.email}
                  </span>
                )}
                {proveedor.direccion && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {proveedor.direccion}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2">
          <NuevoProveedorModal proveedor={proveedor} />
          <CuentaCorrientePdfButton
            proveedor={proveedor}
            movimientos={movimientos}
            rangoTexto={rangoTexto}
            saldoAnterior={saldoAnterior}
            saldoFinal={saldoFinal}
            totalDebitos={metricasPeriodo.totalDebitos}
            totalCreditos={metricasPeriodo.totalCreditos}
          />
          <NuevaCotizacionModal
            proveedorId={proveedor.id}
            proveedorNombre={proveedor.nombre}
          />
          <NuevoPagoModal
            proveedorId={proveedor.id}
            proveedorNombre={proveedor.nombre}
          />
        </div>
      </div>

      {/* Tarjetas de Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Actual */}
        <div
          className={`p-4 rounded-xl border shadow-xs ${
            saldoActual > 0
              ? "bg-rose-50/70 border-rose-200 text-rose-950"
              : saldoActual < 0
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
              : "bg-slate-50 border-slate-200 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Saldo Actual
            </span>
            {saldoActual > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-200/80 text-rose-800">
                Deuda pendiente
              </span>
            ) : saldoActual < 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/80 text-emerald-800">
                Saldo a favor
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                Al día
              </span>
            )}
          </div>
          <p className="text-2xl font-black mt-2 tracking-tight">
            {formatMoney(Math.abs(saldoActual))}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {saldoActual > 0
              ? "Importe que le debés actualmente a este proveedor."
              : saldoActual < 0
              ? "Tenés un crédito a tu favor para futuras compras."
              : "No tenés deudas con este proveedor."}
          </p>
        </div>

        {/* Total Débitos (Compras) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Débitos (Compras)
          </span>
          <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {formatMoney(totalDebitos)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Suma histórica de cotizaciones y remitos registrados.
          </p>
        </div>

        {/* Total Créditos (Pagos) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Créditos (Pagos)
          </span>
          <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {formatMoney(totalCreditos)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Total entregado en efectivo, transferencias y cheques.
          </p>
        </div>

        {/* Recibos Pendientes */}
        <div
          className={`p-4 rounded-xl border shadow-xs ${
            recibosPendientes > 0
              ? "bg-amber-50/70 border-amber-200 text-amber-950"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Control de Recibos
            </span>
            {recibosPendientes > 0 ? (
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <p className="text-2xl font-black mt-2 tracking-tight flex items-baseline gap-1">
            <span>{recibosPendientes}</span>
            <span className="text-xs font-normal text-slate-500">
              {recibosPendientes === 1 ? "recibo pendiente" : "recibos pendientes"}
            </span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {recibosPendientes > 0
              ? "Pagos realizados que aún no tienen el comprobante del proveedor."
              : "Todos los pagos cuentan con su recibo correspondiente."}
          </p>
        </div>
      </div>
    </div>
  );
}
