import { auth } from "@/lib/auth";
import { getDashboardMetrics } from "@/services/dashboard.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Gestión Comercial",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
}

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.comercioId) {
    return null; // El layout ya redirige al login si no hay sesión
  }

  // Cargar métricas reales desde la DB
  const metrics = await getDashboardMetrics(session.user.comercioId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Bienvenida y Acciones Rápidas */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
        <div className="mb-2">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Resumen de Actividad
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Revisa cómo le está yendo a tu negocio hoy.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a href="/ventas" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-5 py-2.5 rounded-lg shadow-sm font-medium flex items-center gap-2">
            🛒 Nueva Venta
          </a>
          <a href="/productos" className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors px-5 py-2.5 rounded-lg shadow-sm font-medium flex items-center gap-2">
            📦 Catálogo
          </a>
        </div>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-slate-500">Ventas Hoy</CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-800">{formatCurrency(metrics.ventasHoy.total)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">{metrics.ventasHoy.cantidad} tickets emitidos</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-slate-500">Esta Semana</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-800">{formatCurrency(metrics.ventasSemana.total)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">Total acumulado</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-slate-500">Este Mes</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-800">{formatCurrency(metrics.ventasMes.total)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">Total acumulado</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-slate-500">Catálogo</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-800">{metrics.cantidadProductos}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">Productos activos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Últimas Ventas */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg">Últimas Ventas</CardTitle>
              <CardDescription>Registro de las transacciones más recientes.</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.ultimasVentas.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Cajero</TableHead>
                      <TableHead>Artículos</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.ultimasVentas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell className="font-medium text-slate-700">
                          {format(new Date(venta.createdAt), "HH:mm", { locale: es })} hs
                        </TableCell>
                        <TableCell>{venta.usuario.nombre || "Usuario"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">{venta.detalles.length} items</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {formatCurrency(Number(venta.total))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Aún no hay ventas registradas.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alertas de Stock */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm h-full border-orange-200">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100 pb-4">
              <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                <span>⚠️</span> Stock Crítico
              </CardTitle>
              <CardDescription className="text-orange-600/80">Productos con 5 o menos unidades.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {metrics.productosStockBajo.length > 0 ? (
                <div className="space-y-4">
                  {metrics.productosStockBajo.map((prod) => (
                    <div key={prod.id} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{prod.nombre}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{prod.codigoInterno}</p>
                      </div>
                      <Badge variant="destructive" className="font-bold">
                        {prod.stockActual} u.
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-green-600 text-sm flex flex-col items-center">
                  <span className="text-2xl mb-2">✅</span>
                  No hay productos con stock bajo.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
