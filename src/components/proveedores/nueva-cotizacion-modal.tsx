"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCotizacionAction } from "@/actions/proveedor.actions";
import { formatYMD_AR } from "@/lib/date-ar";
import { PlusCircle, X, DollarSign, Calendar, FileText, Upload, Paperclip } from "lucide-react";

interface ProveedorSimple {
  id: string;
  nombre: string;
}

interface NuevaCotizacionModalProps {
  proveedorId?: string;
  proveedorNombre?: string;
  proveedoresDisponibles?: ProveedorSimple[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function NuevaCotizacionModal({
  proveedorId: defaultProveedorId,
  proveedorNombre,
  proveedoresDisponibles = [],
  trigger,
  onSuccess,
}: NuevaCotizacionModalProps) {
  const [open, setOpen] = useState(false);
  const [proveedorId, setProveedorId] = useState(defaultProveedorId || "");
  const [fecha, setFecha] = useState(() => formatYMD_AR());
  const [numeroComprobante, setNumeroComprobante] = useState("");
  const [montoTotal, setMontoTotal] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Manejo de archivo adjunto
  const [archivoUrl, setArchivoUrl] = useState<string | undefined>(undefined);
  const [archivoNombre, setArchivoNombre] = useState<string | undefined>(undefined);
  const [fileError, setFileError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tamaño (máximo 4MB para base64)
    if (file.size > 4 * 1024 * 1024) {
      setFileError("El archivo no debe superar los 4MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setArchivoUrl(reader.result as string);
      setArchivoNombre(file.name);
    };
    reader.onerror = () => {
      setFileError("Error al leer el archivo adjunto");
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setArchivoUrl(undefined);
    setArchivoNombre(undefined);
    setFileError(null);
  };

  const resetForm = () => {
    setProveedorId(defaultProveedorId || "");
    setFecha(formatYMD_AR());
    setNumeroComprobante("");
    setMontoTotal("");
    setObservaciones("");
    setArchivoUrl(undefined);
    setArchivoNombre(undefined);
    setError(null);
    setFileError(null);
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const selectedProveedor = defaultProveedorId || proveedorId;
    if (!selectedProveedor) {
      setError("Seleccioná un proveedor");
      return;
    }

    const montoNum = parseFloat(montoTotal);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresá un importe válido mayor a 0");
      return;
    }

    if (!numeroComprobante.trim()) {
      setError("Ingresá el número de comprobante o cotización");
      return;
    }

    startTransition(async () => {
      const res = await createCotizacionAction({
        proveedorId: selectedProveedor,
        fecha,
        numeroComprobante: numeroComprobante.trim(),
        montoTotal: montoNum,
        observaciones: observaciones.trim() || undefined,
        archivoUrl,
        archivoNombre,
      });

      if (res.success) {
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo registrar la cotización");
      }
    });
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Cotización</span>
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
                  Débito / Deuda con Proveedor
                </span>
                <h3 className="text-lg font-bold">
                  {proveedorNombre
                    ? `Registrar Cotización - ${proveedorNombre}`
                    : "Registrar Nueva Cotización"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              {/* Selector de Proveedor (si no viene fijo) */}
              {!defaultProveedorId && (
                <div className="space-y-1">
                  <Label htmlFor="proveedorSelect" className="text-xs font-semibold text-slate-700">
                    Proveedor *
                  </Label>
                  <select
                    id="proveedorSelect"
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                    required
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">-- Seleccionar Proveedor --</option>
                    {proveedoresDisponibles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Número de Comprobante y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="numeroComprobante" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> N° Cotización / Remito *
                  </Label>
                  <Input
                    id="numeroComprobante"
                    placeholder="Ej: COT-001452, Remito 8841"
                    value={numeroComprobante}
                    onChange={(e) => setNumeroComprobante(e.target.value)}
                    required
                    className="text-sm font-medium"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fecha" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Fecha
                  </Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Importe Total */}
              <div className="space-y-1">
                <Label htmlFor="montoTotal" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Importe Total ($) *
                </Label>
                <Input
                  id="montoTotal"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 250000.00"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)}
                  required
                  className="text-base font-bold text-slate-900"
                />
                <p className="text-[11px] text-slate-500">
                  Aumentará tu saldo adeudado con el proveedor por este importe.
                </p>
              </div>

              {/* Observaciones */}
              <div className="space-y-1">
                <Label htmlFor="observaciones" className="text-xs font-semibold text-slate-700">
                  Detalle / Observaciones (Opcional)
                </Label>
                <Input
                  id="observaciones"
                  placeholder="Ej: Pedido semanal de cloro, bidones y detergente"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Archivo Adjunto (Opcional) */}
              <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5" /> Adjuntar Cotización o Remito (PDF o Imagen)
                </Label>

                {archivoNombre ? (
                  <div className="flex items-center justify-between p-2 bg-white rounded-md border border-slate-200 text-xs">
                    <span className="truncate font-medium text-slate-700">{archivoNombre}</span>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700 font-semibold ml-2"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-white hover:border-slate-400 transition-colors text-xs text-slate-600">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span>Subir archivo PDF o imagen</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {fileError && <p className="text-[11px] text-red-600 mt-1">{fileError}</p>}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isPending ? "Registrando..." : "Guardar Cotización"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
