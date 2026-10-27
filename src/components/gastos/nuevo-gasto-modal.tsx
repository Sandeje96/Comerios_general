"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CATEGORIAS_GASTO,
  CATEGORIA_INFO,
  METODOS_PAGO,
  TipoCategoriaGasto,
} from "@/validators/gasto.schema";
import { createGastoAction } from "@/actions/gasto.actions";
import { formatYMD_AR } from "@/lib/date-ar";
import { PlusCircle, X, DollarSign, Tag, Calendar, CreditCard, FileText } from "lucide-react";

export function NuevoGastoModal() {
  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState<TipoCategoriaGasto>("PROVEEDORES");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() => formatYMD_AR());
  const [metodoPago, setMetodoPago] = useState<string>("Efectivo");
  const [comprobante, setComprobante] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setCategoria("PROVEEDORES");
    setDescripcion("");
    setMonto("");
    setFecha(formatYMD_AR());
    setMetodoPago("Efectivo");
    setComprobante("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresá un monto válido mayor a 0");
      return;
    }

    if (!descripcion.trim()) {
      setError("Ingresá una descripción o concepto del gasto");
      return;
    }

    startTransition(async () => {
      const res = await createGastoAction({
        categoria,
        descripcion: descripcion.trim(),
        monto: montoNum,
        fecha,
        metodoPago,
        comprobante: comprobante.trim() || undefined,
      });

      if (res.success) {
        handleClose();
      } else {
        setError(res.error || "No se pudo registrar el gasto");
      }
    });
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Registrar Gasto</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Nuevo Egreso
                </span>
                <h3 className="text-lg font-bold">Registrar Gasto del Local</h3>
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

              {/* Categoría Selector con Chips / Iconos */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Categoría de Gasto
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {CATEGORIAS_GASTO.map((cat) => {
                    const info = CATEGORIA_INFO[cat];
                    const selected = categoria === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoria(cat)}
                        className={`text-left p-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="text-sm">{info.icon}</span>
                        <span className="truncate">{info.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500">
                  Seleccionado: <b>{CATEGORIA_INFO[categoria].label}</b>
                </p>
              </div>

              {/* Monto y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="monto" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Monto ($) *
                  </Label>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 45000.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                    className="text-sm font-semibold"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fecha" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Fecha del Gasto
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

              {/* Descripción */}
              <div className="space-y-1">
                <Label htmlFor="descripcion" className="text-xs font-semibold text-slate-700">
                  Concepto / Descripción *
                </Label>
                <Input
                  id="descripcion"
                  placeholder="Ej: Alquiler del local mes Octubre, Pago factura de Luz, Proveedor Envases"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>

              {/* Método de Pago y N° Comprobante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="metodoPago" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Medio de Pago
                  </Label>
                  <select
                    id="metodoPago"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {METODOS_PAGO.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="comprobante" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> N° Factura / Referencia (Opcional)
                  </Label>
                  <Input
                    id="comprobante"
                    placeholder="Ej: FAC-A-0001-1234, Boleta 4892"
                    value={comprobante}
                    onChange={(e) => setComprobante(e.target.value)}
                    className="text-sm"
                  />
                </div>
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
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isPending ? "Guardando..." : "Guardar Gasto"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
