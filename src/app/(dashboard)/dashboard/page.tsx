import { auth } from "@/lib/auth";
import { logoutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Gestión Comercial",
};

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="p-6">
      {/* Bienvenida */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          ¡Bienvenido de vuelta!
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Tu sistema está listo. Pronto podrás gestionar productos, stock y ventas desde aquí.
        </p>
      </div>

      {/* Acciones Rápidas */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Acciones Rápidas</h3>
        <div className="flex flex-wrap gap-4">
          <a href="/ventas" className="flex-1 min-w-[250px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors p-6 rounded-2xl shadow-sm border border-primary/10 flex items-center gap-4 group">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🛒
            </div>
            <div>
              <h4 className="font-bold text-lg">Nueva Venta</h4>
              <p className="text-primary-foreground/80 text-sm">Abrir terminal de punto de venta (POS)</p>
            </div>
          </a>
          <a href="/productos" className="flex-1 min-w-[250px] bg-white hover:bg-slate-50 transition-colors p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 group">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📦
            </div>
            <div>
              <h4 className="font-bold text-lg text-slate-900">Productos</h4>
              <p className="text-slate-500 text-sm">Gestionar catálogo y stock (Próximamente)</p>
            </div>
          </a>
        </div>
      </div>

      {/* Cards de estado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Ventas hoy", value: "—", desc: "Próximamente" },
          { label: "Ventas del mes", value: "—", desc: "Próximamente" },
          { label: "Productos", value: "—", desc: "Próximamente" },
          { label: "Stock bajo", value: "—", desc: "Próximamente" },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">{item.label}</CardDescription>
              <CardTitle className="text-3xl font-bold text-slate-400">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info de sesión (temporal para testing) */}
      <Card className="border-dashed border-slate-300 bg-slate-100/50">
        <CardHeader>
          <CardTitle className="text-sm text-slate-600">Información de sesión activa</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-500 space-y-1 font-mono">
          <p><span className="font-semibold">Usuario ID:</span> {session?.user?.id}</p>
          <p><span className="font-semibold">Comercio ID:</span> {session?.user?.comercioId}</p>
          <p><span className="font-semibold">Rol:</span> {session?.user?.rol}</p>
        </CardContent>
      </Card>
    </div>
  );
}
