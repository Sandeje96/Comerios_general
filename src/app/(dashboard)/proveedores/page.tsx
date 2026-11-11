import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProveedoresList } from "@/services/proveedor.service";
import { ProveedoresTable } from "@/components/proveedores/proveedores-table";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Proveedores y Cuentas Corrientes | Gestión Comercial",
};

export default async function ProveedoresPage() {
  const session = await auth();

  if (!session?.user?.comercioId) {
    redirect("/login");
  }

  const { proveedores, metricas } = await getProveedoresList(session.user.comercioId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Cuentas Corrientes de Proveedores
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Administrá las compras a proveedores, controlá las deudas pendientes, pagos realizados y el estado de los recibos.
        </p>
      </div>

      {/* Tabla y Métricas */}
      <ProveedoresTable proveedores={proveedores} metricas={metricas} />
    </div>
  );
}
