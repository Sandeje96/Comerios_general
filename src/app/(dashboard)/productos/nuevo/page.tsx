"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProductoAction } from "@/actions/producto.actions";

export default function NuevoProductoPage() {
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
      stockInicial: Number(formData.get("stockInicial")),
    };

    startTransition(async () => {
      const result = await createProductoAction(data);
      if (result.success) {
        router.push("/productos");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Producto</h1>
          <p className="text-sm text-slate-500">Agrega un producto al catálogo</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/productos")}>
          Volver
        </Button>
      </div>

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
              <Input name="nombre" required placeholder="Ej: Detergente 1L" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Código Interno *</label>
              <Input name="codigoInterno" required placeholder="Ej: DET-001" className="font-mono" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Código de Barras</label>
              <Input name="codigoBarras" placeholder="Opcional" className="font-mono" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Inicial *</label>
              <Input name="stockInicial" type="number" min={0} defaultValue={0} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Precio de Costo ($) *</label>
              <Input name="precioCosto" type="number" step="0.01" min={0} required placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Precio de Venta ($) *</label>
              <Input name="precioVenta" type="number" step="0.01" min={0} required placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <Input name="descripcion" placeholder="Opcional" />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar Producto"}
          </Button>
        </form>
      </div>
    </div>
  );
}
