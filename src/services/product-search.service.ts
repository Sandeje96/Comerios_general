import { searchProductos, getProductoById } from "@/repositories/product.repository";
import { ProductoSearchResult } from "@/types/pos.types";

export async function buscarProductos(
  comercioId: string,
  query: string
): Promise<ProductoSearchResult[]> {
  if (!query.trim()) return [];
  return searchProductos(comercioId, query.trim());
}

export async function obtenerProducto(
  comercioId: string,
  productoId: string
): Promise<ProductoSearchResult | null> {
  return getProductoById(comercioId, productoId);
}
