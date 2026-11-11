"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProveedorAction, updateProveedorAction } from "@/actions/proveedor.actions";
import { PlusCircle, X, Building2, Phone, Mail, MapPin, FileText, Edit2 } from "lucide-react";

interface ProveedorData {
  id: string;
  nombre: string;
  cuit: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  observaciones: string | null;
}

interface NuevoProveedorModalProps {
  proveedor?: ProveedorData;
  trigger?: React.ReactNode;
  onSuccess?: (proveedorId?: string) => void;
}

export function NuevoProveedorModal({
  proveedor,
  trigger,
  onSuccess,
}: NuevoProveedorModalProps) {
  const isEditing = !!proveedor;
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(proveedor?.nombre || "");
  const [cuit, setCuit] = useState(proveedor?.cuit || "");
  const [telefono, setTelefono] = useState(proveedor?.telefono || "");
  const [email, setEmail] = useState(proveedor?.email || "");
  const [direccion, setDireccion] = useState(proveedor?.direccion || "");
  const [observaciones, setObservaciones] = useState(proveedor?.observaciones || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    if (proveedor) {
      setNombre(proveedor.nombre);
      setCuit(proveedor.cuit || "");
      setTelefono(proveedor.telefono || "");
      setEmail(proveedor.email || "");
      setDireccion(proveedor.direccion || "");
      setObservaciones(proveedor.observaciones || "");
    } else {
      setNombre("");
      setCuit("");
      setTelefono("");
      setEmail("");
      setDireccion("");
      setObservaciones("");
    }
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("Ingresá el nombre o razón social del proveedor");
      return;
    }

    startTransition(async () => {
      const payload = {
        nombre: nombre.trim(),
        cuit: cuit.trim() || undefined,
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        direccion: direccion.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      };

      let res;
      if (isEditing) {
        res = await updateProveedorAction(proveedor.id, payload);
      } else {
        res = await createProveedorAction(payload);
      }

      if (res.success) {
        handleClose();
        if (onSuccess) {
          const pId = "proveedorId" in res && typeof res.proveedorId === "string" ? res.proveedorId : undefined;
          onSuccess(pId);
        }
      } else {
        setError(res.error || "No se pudo guardar el proveedor");
      }
    });
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : isEditing ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs h-9"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Editar Datos</span>
        </Button>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Proveedor</span>
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  {isEditing ? "Modificar" : "Alta de Proveedor"}
                </span>
                <h3 className="text-lg font-bold">
                  {isEditing ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}
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

              {/* Nombre y CUIT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="nombre" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Razón Social / Nombre *
                  </Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Distribuidora Norte SRL"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="text-sm font-medium"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cuit" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> CUIT / Identificación
                  </Label>
                  <Input
                    id="cuit"
                    placeholder="Ej: 30-71234567-8"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Teléfono y Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="telefono" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Teléfono / WhatsApp
                  </Label>
                  <Input
                    id="telefono"
                    placeholder="Ej: 11-4567-8901"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@proveedor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-1">
                <Label htmlFor="direccion" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Dirección / Localidad
                </Label>
                <Input
                  id="direccion"
                  placeholder="Ej: Av. San Martín 1234, CABA"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Observaciones */}
              <div className="space-y-1">
                <Label htmlFor="observaciones" className="text-xs font-semibold text-slate-700">
                  Notas u Observaciones
                </Label>
                <Input
                  id="observaciones"
                  placeholder="Ej: Días de entrega: Martes y Jueves. Descuento 5% por transferencia."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="text-sm"
                />
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
                  {isPending ? "Guardando..." : isEditing ? "Actualizar Proveedor" : "Crear Proveedor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
