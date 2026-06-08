import prisma from "@/repositories/prisma";
import { ProductoSearchResult } from "@/types/pos.types";

/**
 * Busca productos activos de un comercio por nombre, código interno o código de barras.
 * Case-insensitive. Máximo 20 resultados para mantener el buscador ágil.
 */
export async function searchProductos(
  comercioId: string,
  query: string
): Promise<ProductoSearchResult[]> {
  const productos = await prisma.producto.findMany({
    where: {
      comercioId,
      activo: true,
      OR: [
        { nombre: { contains: query, mode: "insensitive" } },
        { codigoInterno: { contains: query, mode: "insensitive" } },
        { codigoBarras: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      codigoInterno: true,
      codigoBarras: true,
      nombre: true,
      descripcion: true,
      precioVenta: true,
      precioCosto: true,
      stockActual: true,
    },
    take: 20,
    orderBy: { nombre: "asc" },
  });

  return productos.map((p) => ({
    id: p.id,
    codigoInterno: p.codigoInterno,
    codigoBarras: p.codigoBarras,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precioVenta: Number(p.precioVenta),
    precioCosto: Number(p.precioCosto),
    stockActual: p.stockActual,
  }));
}

/**
 * Obtiene un producto por ID validando que pertenece al comercio (multi-tenant).
 */
export async function getProductoById(
  comercioId: string,
  productoId: string
): Promise<ProductoSearchResult | null> {
  const producto = await prisma.producto.findFirst({
    where: { id: productoId, comercioId, activo: true },
    select: {
      id: true,
      codigoInterno: true,
      codigoBarras: true,
      nombre: true,
      descripcion: true,
      precioVenta: true,
      precioCosto: true,
      stockActual: true,
    },
  });

  if (!producto) return null;

  return {
    id: producto.id,
    codigoInterno: producto.codigoInterno,
    codigoBarras: producto.codigoBarras,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precioVenta: Number(producto.precioVenta),
    precioCosto: Number(producto.precioCosto),
    stockActual: producto.stockActual,
  };
}
