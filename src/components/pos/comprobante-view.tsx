"use client";

import { VentaResult } from "@/types/pos.types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ComprobanteViewProps {
  result: VentaResult;
  onNuevaVenta: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
}

export function ComprobanteView({ result, onNuevaVenta }: ComprobanteViewProps) {
  const { snapshot } = result;

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Acciones (se ocultan al imprimir) */}
      <div className="print:hidden w-full max-w-md mb-4 flex gap-3">
        <Button
          id="btn-nueva-venta"
          onClick={onNuevaVenta}
          className="flex-1"
        >
          Nueva Venta
        </Button>
        <Button
          id="btn-imprimir"
          onClick={handlePrint}
          variant="outline"
          className="flex-1"
        >
          Imprimir Ticket
        </Button>
      </div>

      {/* Ticket */}
      <div
        id="comprobante"
        className="bg-white w-full max-w-md rounded-2xl shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none"
      >
        {/* Encabezado */}
        <div className="bg-slate-900 text-white px-6 py-5 text-center print:bg-black">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Comprobante N°</p>
          <p className="text-4xl font-bold">
            {String(snapshot.numeroComprobante).padStart(4, "0")}
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Empresa */}
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900">{snapshot.empresa.nombreFantasia}</p>
            <p className="text-sm text-slate-500">{snapshot.empresa.email}</p>
            {snapshot.empresa.celular && (
              <p className="text-sm text-slate-500">{snapshot.empresa.celular}</p>
            )}
          </div>

          <Separator />

          {/* Fecha y cajero */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Fecha</p>
              <p className="font-medium text-slate-700">{snapshot.dia}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Hora</p>
              <p className="font-medium text-slate-700">{snapshot.hora}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Atendido por</p>
              <p className="font-medium text-slate-700">{snapshot.comitente.nombre}</p>
            </div>
          </div>

          <Separator />

          {/* Tabla de productos */}
          <div>
            <div className="flex text-xs text-slate-400 uppercase tracking-wide mb-2 px-1">
              <span className="flex-1">Producto</span>
              <span className="w-12 text-center">Cant.</span>
              <span className="w-24 text-right">Subtotal</span>
            </div>
            <div className="space-y-2">
              {snapshot.items.map((item, idx) => (
                <div key={idx} className="flex items-start px-1 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 leading-tight">{item.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(item.precioUnitario)} c/u
                    </p>
                  </div>
                  <span className="w-12 text-center text-sm text-slate-600 pt-0.5">
                    x{item.cantidad}
                  </span>
                  <span className="w-24 text-right text-sm font-semibold text-slate-900 pt-0.5">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between py-1">
            <span className="text-base font-bold text-slate-700 uppercase tracking-wide">Total</span>
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(snapshot.total)}
            </span>
          </div>

          {/* Footer */}
          <div className="text-center pt-2 pb-1">
            <p className="text-xs text-slate-400">¡Gracias por su compra!</p>
            <p className="text-xs text-slate-300 mt-1">Comprobante interno — No válido como factura</p>
          </div>
        </div>
      </div>
    </div>
  );
}
