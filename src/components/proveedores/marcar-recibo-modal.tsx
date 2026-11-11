"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toggleReciboAction } from "@/actions/proveedor.actions";
import { X, CheckCircle2, Clock, Upload, Paperclip, FileCheck2 } from "lucide-react";

interface MarcarReciboModalProps {
  pagoId: string;
  proveedorId?: string;
  proveedorNombre?: string;
  fechaLegible: string;
  monto: number;
  medioPagoLabel: string;
  reciboRecibidoActualmente: boolean;
  reciboNumeroActual?: string | null;
  reciboArchivoUrlActual?: string | null;
  reciboArchivoNombreActual?: string | null;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function MarcarReciboModal({
  pagoId,
  proveedorId,
  proveedorNombre,
  fechaLegible,
  monto,
  medioPagoLabel,
  reciboRecibidoActualmente,
  reciboNumeroActual,
  reciboArchivoUrlActual,
  reciboArchivoNombreActual,
  trigger,
  onSuccess,
}: MarcarReciboModalProps) {
  const [open, setOpen] = useState(false);
  const [reciboRecibido, setReciboRecibido] = useState(reciboRecibidoActualmente);
  const [reciboNumero, setReciboNumero] = useState(reciboNumeroActual || "");
  const [reciboArchivoUrl, setReciboArchivoUrl] = useState<string | undefined>(
    reciboArchivoUrlActual || undefined
  );
  const [reciboArchivoNombre, setReciboArchivoNombre] = useState<string | undefined>(
    reciboArchivoNombreActual || undefined
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("El archivo del recibo no debe superar los 4MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReciboArchivoUrl(reader.result as string);
      setReciboArchivoNombre(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    setError(null);
    setOpen(false);
  };

  const handleSubmit = (nuevoEstado: boolean) => {
    setError(null);
    startTransition(async () => {
      const res = await toggleReciboAction(
        {
          pagoId,
          reciboRecibido: nuevoEstado,
          reciboNumero: nuevoEstado ? reciboNumero.trim() || undefined : undefined,
          reciboArchivoUrl: nuevoEstado ? reciboArchivoUrl : undefined,
          reciboArchivoNombre: nuevoEstado ? reciboArchivoNombre : undefined,
        },
        proveedorId
      );

      if (res.success) {
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo actualizar el recibo");
      }
    });
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : reciboRecibidoActualmente ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Recibido</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-xs"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>⏳ Pendiente</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Control de Recibo del Proveedor</h3>
                  {proveedorNombre && (
                    <p className="text-xs text-slate-300">{proveedorNombre}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-white transition-colors p-1"
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

              {/* Resumen del pago */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha del pago:</span>
                  <span className="font-semibold text-slate-900">{fechaLegible}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Importe pagado:</span>
                  <span className="font-bold text-slate-900">
                    ${monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Medio de pago:</span>
                  <span className="font-medium text-slate-700">{medioPagoLabel}</span>
                </div>
              </div>

              {/* Formulario */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="numRecibo" className="text-xs font-semibold text-slate-700">
                    Número de Recibo Oficial (Opcional)
                  </Label>
                  <Input
                    id="numRecibo"
                    placeholder="Ej: REC-0001-0009841"
                    value={reciboNumero}
                    onChange={(e) => setReciboNumero(e.target.value)}
                    className="text-xs"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" /> Adjuntar Recibo (PDF o Imagen)
                  </Label>
                  {reciboArchivoNombre ? (
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md border border-slate-200 text-xs">
                      <span className="truncate font-medium text-slate-700">{reciboArchivoNombre}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReciboArchivoUrl(undefined);
                          setReciboArchivoNombre(undefined);
                        }}
                        className="text-red-500 hover:text-red-700 font-semibold ml-2"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 text-xs text-slate-600">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span>Subir archivo PDF o imagen</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  💡 Este cambio es puramente documental y no afecta saldos ni movimientos contables.
                </p>
              </div>

              {/* Botones */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {reciboRecibidoActualmente ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSubmit(false)}
                    disabled={isPending}
                    className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                  >
                    Marcar como Pendiente
                  </Button>
                ) : (
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
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSubmit(true)}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  {isPending ? "Guardando..." : "Confirmar Recibo Recibido"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
