"use server";

import { auth } from "@/lib/auth";
import { ventaPayloadSchema, busquedaProductoSchema } from "@/validators/pos.schema";
import { procesarVenta, anularVentaService } from "@/services/pos.service";
import { buscarProductos } from "@/services/product-search.service";
import { ActionResult, VentaResult, ProductoSearchResult } from "@/types/pos.types";
import { VentaPayload } from "@/types/pos.types";

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.comercioId || !session?.user?.id) {
    throw new Error("No autenticado");
  }
  return session;
}

/**
 * Busca productos en tiempo real para el buscador del POS.
 */
export async function searchProductosAction(
  query: string
): Promise<ActionResult<ProductoSearchResult[]>> {
  try {
    const session = await getSessionOrThrow();
    const validated = busquedaProductoSchema.parse({ query });
    const productos = await buscarProductos(session.user.comercioId, validated.query);
    return { success: true, data: productos };
  } catch (error: any) {
    return { success: false, error: error.message ?? "Error al buscar productos" };
  }
}

/**
 * Confirma y procesa una venta completa con transacción atómica.
 * Este es el Server Action más crítico del sistema.
 */
export async function confirmarVentaAction(
  payload: VentaPayload
): Promise<ActionResult<VentaResult>> {
  try {
    const session = await getSessionOrThrow();
    const validated = ventaPayloadSchema.parse(payload);

    const result = await procesarVenta({
      comercioId: session.user.comercioId,
      usuarioId: session.user.id,
      usuarioNombre: session.user.name ?? "Usuario",
      usuarioEmail: session.user.email ?? "",
      payload: validated,
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message ?? "Error al procesar la venta" };
  }
}

/**
 * Anula una venta. Solo para usuarios con rol ADMIN.
 */
export async function anularVentaAction(
  ventaId: string
): Promise<ActionResult<void>> {
  try {
    const session = await getSessionOrThrow();
    if (session.user.rol !== "ADMIN") {
      return { success: false, error: "Sin permisos para anular ventas" };
    }
    await anularVentaService(
      session.user.comercioId,
      session.user.id,
      ventaId
    );
    return { success: true, data: undefined };
  } catch (error: any) {
    return { success: false, error: error.message ?? "Error al anular la venta" };
  }
}
