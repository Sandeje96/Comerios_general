import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProductosByComercio } from "@/repositories/producto-crud.repository";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteProductoButton } from "@/components/productos/delete-button";
import Link from "next/link";

function formatCurrency(value: number | any): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(Number(value));
}

export default async function ProductosPage() {
  const session = await auth();
  if (!session?.user?.comercioId) redirect("/login");

  const productos = await getProductosByComercio(session.user.comercioId);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de Productos</h1>
          <p className="text-sm text-slate-500">Administra tus productos y precios</p>
        </div>
        <Link 
          href="/productos/nuevo"
          className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Nuevo Producto
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio Costo</TableHead>
              <TableHead>Precio Venta</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((prod) => (
              <TableRow key={prod.id}>
                <TableCell className="font-mono text-xs">{prod.codigoInterno}</TableCell>
                <TableCell className="font-medium">{prod.nombre}</TableCell>
                <TableCell>{formatCurrency(prod.precioCosto)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(prod.precioVenta)}</TableCell>
                <TableCell>
                  <Badge variant={prod.stockActual <= 5 ? "destructive" : "secondary"}>
                    {prod.stockActual} u.
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DeleteProductoButton id={prod.id} />
                </TableCell>
              </TableRow>
            ))}
            {productos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                  No hay productos registrados. ¡Crea el primero!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
