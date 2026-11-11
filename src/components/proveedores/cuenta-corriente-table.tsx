"use client";

import { useState } from "react";
import { MovimientoCCItemResponse } from "@/services/proveedor.service";
import { MarcarReciboModal } from "@/components/proveedores/marcar-recibo-modal";
import { AnularMovimientoModal } from "@/components/proveedores/anular-movimiento-modal";
import { Input } from "@/components/ui/input";
import {
  Search,
  Paperclip,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  X,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface CuentaCorrienteTableProps {
  movimientos: MovimientoCCItemResponse[];
  saldoAnterior: number;
  proveedorId: string;
  proveedorNombre: string;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function CuentaCorrienteTable({
  movimientos,
  saldoAnterior,
  proveedorId,
  proveedorNombre,
}: CuentaCorrienteTableProps) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | "DEBITO" | "CREDITO" | "PENDIENTES_RECIBO">("TODOS");
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<MovimientoCCItemResponse | null>(null);

  // Filtrado en memoria
  const movimientosFiltrados = movimientos.filter((m) => {
    // Filtro por tipo o recibo
    if (filtroTipo === "DEBITO" && m.tipo !== "DEBITO") return false;
    if (filtroTipo === "CREDITO" && m.tipo !== "CREDITO") return false;
    if (filtroTipo === "PENDIENTES_RECIBO" && (m.tipo !== "CREDITO" || m.reciboRecibido || m.anulado)) return false;

    // Filtro de búsqueda
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      m.concepto.toLowerCase().includes(q) ||
      (m.comprobante && m.comprobante.toLowerCase().includes(q)) ||
      (m.observaciones && m.observaciones.toLowerCase().includes(q)) ||
      (m.reciboNumero && m.reciboNumero.toLowerCase().includes(q)) ||
      (m.referencia && m.referencia.toLowerCase().includes(q)) ||
      (m.medioPagoLabel && m.medioPagoLabel.toLowerCase().includes(q)) ||
      m.debito.toString().includes(q) ||
      m.credito.toString().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Pills de Tipo */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFiltroTipo("TODOS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filtroTipo === "TODOS"
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Todos ({movimientos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("DEBITO")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filtroTipo === "DEBITO"
                ? "bg-amber-700 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Solo Cotizaciones (Débitos)
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("CREDITO")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filtroTipo === "CREDITO"
                ? "bg-emerald-700 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Solo Pagos (Créditos)
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo("PENDIENTES_RECIBO")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filtroTipo === "PENDIENTES_RECIBO"
                ? "bg-orange-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            ⏳ Recibos Pendientes
          </button>
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar comprobante, concepto o importe..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 text-xs h-9 bg-white"
          />
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Comprobante / Concepto</th>
                <th className="py-3 px-3 text-right text-amber-300">Débito (+)</th>
                <th className="py-3 px-3 text-right text-emerald-300">Crédito (-)</th>
                <th className="py-3 px-3 text-right">Saldo Acumulado</th>
                <th className="py-3 px-3 text-center">Recibo Proveedor</th>
                <th className="py-3 px-3">Observaciones</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Fila Inicial de Saldo Anterior */}
              {saldoAnterior !== 0 && (
                <tr className="bg-slate-50 font-medium text-slate-700 italic border-b border-slate-200">
                  <td className="py-2.5 px-3">-</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-900">
                      Saldo Anterior al período seleccionado
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">-</td>
                  <td className="py-2.5 px-3 text-right">-</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatMoney(saldoAnterior)}
                  </td>
                  <td className="py-2.5 px-3 text-center">-</td>
                  <td className="py-2.5 px-3">-</td>
                  <td className="py-2.5 px-3 text-center">-</td>
                </tr>
              )}

              {movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron movimientos registrados para este período o criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((m) => {
                  const isDebito = m.tipo === "DEBITO";
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        m.anulado ? "opacity-45 bg-rose-50/20 line-through text-slate-400" : ""
                      }`}
                    >
                      {/* Fecha */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-medium text-slate-900">{m.fechaLegible}</span>
                        <span className="block text-[10px] text-slate-400">{m.horaLegible} hs</span>
                      </td>

                      {/* Comprobante / Concepto */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded-md shrink-0 ${
                              isDebito
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isDebito ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">
                              {m.concepto}
                            </p>
                            {m.comprobante && (
                              <p className="text-[11px] text-slate-500 font-mono">
                                Comp: {m.comprobante}
                              </p>
                            )}
                            {m.anulado && (
                              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 no-underline mt-0.5">
                                ANULADO: {m.anuladoMotivo}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Adjuntos rápidos si existen */}
                        <div className="flex items-center gap-2 mt-1">
                          {m.cotizacionArchivoUrl && (
                            <a
                              href={m.cotizacionArchivoUrl}
                              download={m.cotizacionArchivoNombre || "cotizacion"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>{m.cotizacionArchivoNombre || "Ver Cotización"}</span>
                            </a>
                          )}
                          {m.comprobantePagoUrl && (
                            <a
                              href={m.comprobantePagoUrl}
                              download={m.comprobantePagoNombre || "comprobante-pago"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>{m.comprobantePagoNombre || "Comprobante Transferencia"}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Débito */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {m.debito > 0 ? (
                          <span className="font-bold text-amber-700">
                            {formatMoney(m.debito)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Crédito */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {m.credito > 0 ? (
                          <div>
                            <span className="font-bold text-emerald-700">
                              {formatMoney(m.credito)}
                            </span>
                            {m.medioPagoLabel && (
                              <span className="block text-[10px] text-slate-500">
                                {m.medioPagoIcon} {m.medioPagoLabel}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Saldo Acumulado */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-black">
                        {m.anulado ? (
                          <span className="text-slate-300 italic">-</span>
                        ) : (
                          <span
                            className={
                              m.saldoAcumulado > 0
                                ? "text-rose-700"
                                : m.saldoAcumulado < 0
                                ? "text-emerald-700"
                                : "text-slate-600"
                            }
                          >
                            {formatMoney(m.saldoAcumulado)}
                          </span>
                        )}
                      </td>

                      {/* Recibo del Proveedor */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isDebito ? (
                          <span className="text-slate-300">-</span>
                        ) : m.anulado ? (
                          <span className="text-slate-300">-</span>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <MarcarReciboModal
                              pagoId={m.pagoId!}
                              proveedorId={proveedorId}
                              proveedorNombre={proveedorNombre}
                              fechaLegible={m.fechaLegible}
                              monto={m.credito}
                              medioPagoLabel={m.medioPagoLabel || "Pago"}
                              reciboRecibidoActualmente={m.reciboRecibido}
                              reciboNumeroActual={m.reciboNumero}
                              reciboArchivoUrlActual={m.reciboArchivoUrl}
                              reciboArchivoNombreActual={m.reciboArchivoNombre}
                            />
                            {m.reciboRecibido && m.reciboNumero && (
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                #{m.reciboNumero}
                              </span>
                            )}
                            {m.reciboArchivoUrl && (
                              <a
                                href={m.reciboArchivoUrl}
                                download={m.reciboArchivoNombre || "recibo"}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 underline mt-0.5 hover:text-emerald-900"
                              >
                                <span>Ver Recibo</span>
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Observaciones */}
                      <td className="py-3 px-3 max-w-xs truncate text-slate-600">
                        {m.observaciones || m.referencia || "-"}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setMovimientoSeleccionado(m)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                            title="Ver detalle completo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!m.anulado && (
                            <AnularMovimientoModal
                              movimientoId={m.id}
                              proveedorId={proveedorId}
                              concepto={m.concepto}
                              fechaLegible={m.fechaLegible}
                              monto={m.debito > 0 ? m.debito : m.credito}
                              tipo={m.tipo}
                            />
                          )}
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

      {/* Modal de Detalle Completo de Movimiento */}
      {movimientoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <h3 className="text-base font-bold">Detalle de Operación</h3>
              </div>
              <button
                type="button"
                onClick={() => setMovimientoSeleccionado(null)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tipo de Movimiento:</span>
                <span className="font-bold text-slate-900">
                  {movimientoSeleccionado.tipo === "DEBITO"
                    ? "DÉBITO (Cotización / Deuda)"
                    : "CRÉDITO (Pago realizado)"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Fecha y Hora:</span>
                <span className="font-semibold text-slate-800">
                  {movimientoSeleccionado.fechaLegible} a las {movimientoSeleccionado.horaLegible} hs
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Concepto:</span>
                <span className="font-semibold text-slate-800">
                  {movimientoSeleccionado.concepto}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Importe:</span>
                <span className="text-base font-bold text-slate-900">
                  {formatMoney(
                    movimientoSeleccionado.debito > 0
                      ? movimientoSeleccionado.debito
                      : movimientoSeleccionado.credito
                  )}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Saldo Acumulado Posterior:</span>
                <span className="font-bold text-slate-900">
                  {formatMoney(movimientoSeleccionado.saldoAcumulado)}
                </span>
              </div>

              {movimientoSeleccionado.medioPagoLabel && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Medio de Pago:</span>
                  <span className="font-semibold text-slate-800">
                    {movimientoSeleccionado.medioPagoIcon} {movimientoSeleccionado.medioPagoLabel}
                  </span>
                </div>
              )}

              {movimientoSeleccionado.transferenciaBanco && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Banco / Ref Transferencia:</span>
                  <span className="font-semibold text-slate-800">
                    {movimientoSeleccionado.transferenciaBanco} (Op: {movimientoSeleccionado.transferenciaOperacion || "-"})
                  </span>
                </div>
              )}

              {movimientoSeleccionado.chequeNumero && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Datos del Cheque:</span>
                  <span className="font-semibold text-slate-800">
                    #{movimientoSeleccionado.chequeNumero} - {movimientoSeleccionado.chequeBanco || "Banco"}
                  </span>
                </div>
              )}

              {movimientoSeleccionado.tipo === "CREDITO" && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Estado del Recibo del Proveedor:</span>
                  <span
                    className={`font-bold ${
                      movimientoSeleccionado.reciboRecibido ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {movimientoSeleccionado.reciboRecibido
                      ? `✅ Recibido ${
                          movimientoSeleccionado.reciboNumero
                            ? `(#${movimientoSeleccionado.reciboNumero})`
                            : ""
                        }`
                      : "⏳ Pendiente de entrega por el proveedor"}
                  </span>
                </div>
              )}

              {movimientoSeleccionado.observaciones && (
                <div className="py-1 border-b border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Observaciones:</span>
                  <p className="p-2 bg-slate-50 rounded text-slate-800">
                    {movimientoSeleccionado.observaciones}
                  </p>
                </div>
              )}

              {/* Cotizaciones Asociadas */}
              {movimientoSeleccionado.cotizacionesAsociadas.length > 0 && (
                <div className="py-1">
                  <span className="text-slate-500 block mb-1">Cotizaciones Imputadas:</span>
                  <div className="space-y-1">
                    {movimientoSeleccionado.cotizacionesAsociadas.map((c) => (
                      <div
                        key={c.id}
                        className="p-1.5 bg-slate-50 rounded flex justify-between text-[11px]"
                      >
                        <span className="font-medium text-slate-800">
                          Cotización #{c.numeroComprobante}
                        </span>
                        <span className="font-bold text-emerald-700">
                          {formatMoney(c.montoAsignado)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between py-1 text-slate-400 text-[10px]">
                <span>Registrado por:</span>
                <span>{movimientoSeleccionado.usuario}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setMovimientoSeleccionado(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
