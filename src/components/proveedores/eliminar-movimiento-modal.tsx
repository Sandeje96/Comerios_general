"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteMovimientoAction } from "@/actions/proveedor.actions";
import { Trash2, AlertTriangle, X } from "lucide-react";

interface EliminarMovimientoModalProps {
  movimientoId: string;
  proveedorId?: string;
  concepto: string;
  fechaLegible: string;
  monto: number;
  tipo: "DEBITO" | "CREDITO";
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function EliminarMovimientoModal({
  movimientoId,
  proveedorId,
  concepto,
  fechaLegible,
  monto,
  tipo,
  trigger,
  onSuccess,
}: EliminarMovimientoModalProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    setError(null);
    setOpen(false);
  };

  const handleEliminar = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteMovimientoAction(movimientoId, proveedorId);

      if (res.success) {
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo eliminar el movimiento");
      }
    });
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
          title="Eliminar movimiento"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-red-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-red-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold">Eliminar Movimiento</h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-red-200 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {error && (
                <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-xs space-y-1.5">
                <p className="font-semibold text-red-950">
                  ¿Estás seguro de que querés eliminar esta operación definitivamente?
                </p>
                <div className="text-slate-700 space-y-0.5">
                  <p>
                    <b>Concepto:</b> {concepto}
                  </p>
                  <p>
                    <b>Fecha:</b> {fechaLegible}
                  </p>
                  <p>
                    <b>Importe:</b> ${monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })} (
                    {tipo === "DEBITO" ? "Débito" : "Crédito"})
                  </p>
                </div>
                <p className="text-[11px] text-red-700 pt-1 border-t border-red-200 font-medium">
                  ⚠️ Esta acción borrará el registro de la cuenta corriente de forma directa (no quedará marcado como anulado) y recalculará el saldo deudor inmediatamente.
                </p>
              </div>

              {/* Botones */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isPending}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleEliminar}
                  disabled={isPending}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isPending ? "Eliminando..." : "Eliminar Definitivamente"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
