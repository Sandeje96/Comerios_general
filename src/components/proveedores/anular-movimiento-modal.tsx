"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { anularMovimientoAction } from "@/actions/proveedor.actions";
import { AlertTriangle, X } from "lucide-react";

interface AnularMovimientoModalProps {
  movimientoId: string;
  proveedorId?: string;
  concepto: string;
  fechaLegible: string;
  monto: number;
  tipo: "DEBITO" | "CREDITO";
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AnularMovimientoModal({
  movimientoId,
  proveedorId,
  concepto,
  fechaLegible,
  monto,
  tipo,
  trigger,
  onSuccess,
}: AnularMovimientoModalProps) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    setMotivo("");
    setError(null);
    setOpen(false);
  };

  const handleAnular = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (motivo.trim().length < 3) {
      setError("Ingresá un motivo descriptivo para la anulación (mínimo 3 caracteres)");
      return;
    }

    startTransition(async () => {
      const res = await anularMovimientoAction(
        {
          movimientoId,
          motivo: motivo.trim(),
        },
        proveedorId
      );

      if (res.success) {
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo anular el movimiento");
      }
    });
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
        >
          Anular
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold">Anulación de Movimiento</h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-rose-200 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAnular} className="p-5 space-y-4">
              {error && (
                <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg text-xs space-y-1.5">
                <p className="font-semibold text-rose-950">
                  ¿Estás seguro de anular esta operación?
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
                <p className="text-[11px] text-rose-700 pt-1 border-t border-rose-200">
                  El movimiento se conservará con estado <b>ANULADO</b> para trazabilidad contable y el saldo acumulado se recalculará automáticamente.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="motivoAnulacion" className="text-xs font-semibold text-slate-700">
                  Motivo de la Anulación *
                </Label>
                <Input
                  id="motivoAnulacion"
                  placeholder="Ej: Error de carga de importe / Comprobante duplicado"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  className="text-xs"
                  autoFocus
                />
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
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  {isPending ? "Anulando..." : "Confirmar Anulación"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
