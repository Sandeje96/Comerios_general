"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProductoAction } from "@/actions/producto.actions";

type ProductoData = {
  id: string;
  codigoInterno: string;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  precioCosto: number;
  precioVenta: number;
  stockActual: number;
};

export function EditProductoForm({ producto }: { producto: ProductoData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      codigoInterno: formData.get("codigoInterno") as string,
      codigoBarras: (formData.get("codigoBarras") as string) || "",
      nombre: formData.get("nombre") as string,
      descripcion: (formData.get("descripcion") as string) || "",
      precioCosto: Number(formData.get("precioCosto")),
      precioVenta: Number(formData.get("precioVenta")),
      stockActual: Number(formData.get("stockActual")),
    };

    startTransition(async () => {
      const result = await updateProductoAction(producto.id, data);
      if (result.success) {
        router.push("/productos");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre del producto *</label>
            <Input name="nombre" required defaultValue={producto.nombre} placeholder="Ej: Detergente 1L" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Código Interno *</label>
            <Input name="codigoInterno" required defaultValue={producto.codigoInterno} placeholder="Ej: DET-001" className="font-mono" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Código de Barras</label>
            <Input name="codigoBarras" defaultValue={producto.codigoBarras || ""} placeholder="Opcional" className="font-mono" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Stock Actual *</label>
            <Input name="stockActual" type="number" min={0} required defaultValue={producto.stockActual} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Precio de Costo ($) *</label>
            <Input name="precioCosto" type="number" step="0.01" min={0} required defaultValue={Number(producto.precioCosto)} placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Precio de Venta ($) *</label>
            <Input name="precioVenta" type="number" step="0.01" min={0} required defaultValue={Number(producto.precioVenta)} placeholder="0.00" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Descripción</label>
          <Input name="descripcion" defaultValue={producto.descripcion || ""} placeholder="Opcional" />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando cambios..." : "Guardar Cambios"}
        </Button>
      </form>
    </div>
  );
}
