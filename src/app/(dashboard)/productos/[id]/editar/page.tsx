import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProductoById } from "@/repositories/producto-crud.repository";
import { EditProductoForm } from "@/components/productos/edit-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user?.comercioId) redirect("/login");

  const producto = await getProductoById(session.user.comercioId, resolvedParams.id);

  if (!producto) {
    redirect("/productos");
  }

  // Convert Decimal to number for the client component
  const productoData = {
    id: producto.id,
    codigoInterno: producto.codigoInterno,
    codigoBarras: producto.codigoBarras,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precioCosto: Number(producto.precioCosto),
    precioVenta: Number(producto.precioVenta),
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Producto</h1>
          <p className="text-sm text-slate-500">Modifica los detalles del producto</p>
        </div>
        <Link href="/productos">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <EditProductoForm producto={productoData} />
    </div>
  );
}
