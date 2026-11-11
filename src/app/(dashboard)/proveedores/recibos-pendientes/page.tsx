import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRecibosPendientesDashboard } from "@/services/proveedor.service";
import { getProveedoresWithSummary } from "@/repositories/proveedor.repository";
import { RecibosPendientesTable } from "@/components/proveedores/recibos-pendientes-table";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recibos Pendientes | Gestión Comercial",
};

interface RecibosPendientesPageProps {
  searchParams: Promise<{
    proveedorId?: string;
  }>;
}

export default async function RecibosPendientesPage({
  searchParams,
}: RecibosPendientesPageProps) {
  const session = await auth();

  if (!session?.user?.comercioId) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;

  const [dashboardData, proveedores] = await Promise.all([
    getRecibosPendientesDashboard(
      session.user.comercioId,
      resolvedSearchParams.proveedorId
    ),
    getProveedoresWithSummary(session.user.comercioId),
  ]);

  const proveedoresOptions = proveedores.map((p) => ({
    id: p.id,
    nombre: p.nombre,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <RecibosPendientesTable
        items={dashboardData.items}
        metricas={dashboardData.metricas}
        proveedores={proveedoresOptions}
        proveedorIdFiltro={resolvedSearchParams.proveedorId}
      />
    </div>
  );
}
