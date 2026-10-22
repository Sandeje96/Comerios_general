"use client";

import { VentaHistorialItem } from "@/services/historial.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, X } from "lucide-react";

interface HistorialDetalleModalProps {
  venta: VentaHistorialItem | null;
  onClose: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
}

export function HistorialDetalleModal({
  venta,
  onClose,
}: HistorialDetalleModalProps) {
  if (!venta) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              Detalle de Venta
            </span>
            <h3 className="text-xl font-bold">
              {venta.numeroComprobante
                ? `Ticket #${String(venta.numeroComprobante).padStart(4, "0")}`
                : "Comprobante Interno"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido imprimible */}
        <div id="comprobante-historico" className="p-6 overflow-y-auto space-y-4">
          {/* Metadatos */}
          <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-medium">Fecha y Hora</p>
              <p className="font-semibold text-slate-800">{venta.fechaLegible}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Atendido por</p>
              <p className="font-semibold text-slate-800">{venta.cajero}</p>
            </div>
          </div>

          <Separator />

          {/* Desglose de Productos */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Productos / Ítems ({venta.cantidadArticulos})
            </h4>

            <div className="space-y-2">
              {venta.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-800">
                        {item.nombre}
                      </span>
                      {item.esLibre && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-700 bg-amber-50 border-amber-200">
                          Venta Libre
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {item.codigoInterno && (
                        <span className="mr-2">Cód: {item.codigoInterno}</span>
                      )}
                      {formatCurrency(item.precioUnitario)} x {item.cantidad}
                    </p>
                  </div>

                  <span className="font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-base font-bold text-slate-700 uppercase">
              Total Venta
            </span>
            <span className="text-2xl font-black text-slate-900">
              {formatCurrency(venta.total)}
            </span>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-end gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ticket
          </Button>
        </div>
      </div>
    </div>
  );
}
