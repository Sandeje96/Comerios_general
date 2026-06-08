"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUsuarioAction } from "@/actions/usuario.actions";

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get("nombre") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      rol: formData.get("rol") as "CAJERO" | "ADMIN",
    };

    startTransition(async () => {
      const result = await createUsuarioAction(data);
      if (result.success) {
        router.push("/usuarios");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Usuario</h1>
          <p className="text-sm text-slate-500">Agrega un nuevo empleado al sistema</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/usuarios")}>
          Volver
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre completo</label>
            <Input name="nombre" required placeholder="Ej: Juan Pérez" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input name="email" type="email" required placeholder="juan@ejemplo.com" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contraseña</label>
            <Input name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rol</label>
            <select
              name="rol"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="CAJERO">Cajero (Solo ventas)</option>
              <option value="ADMIN">Administrador (Acceso total)</option>
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creando..." : "Crear Usuario"}
          </Button>
        </form>
      </div>
    </div>
  );
}
