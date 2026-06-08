import { Prisma, TipoMovimientoStock } from "@prisma/client";
import { ComprobanteSnapshot } from "@/types/pos.types";

type TransactionClient = Prisma.TransactionClient;

// ─────────────────────────────────────────────
// STOCK
// ─────────────────────────────────────────────

/**
 * Decrementa el stock atómicamente a nivel de DB.
 * Retorna true si tuvo éxito, false si no había stock suficiente.
 * Esta operación es segura ante race conditions: si dos cajeros intentan
 * vender el mismo producto simultáneamente, solo uno tendrá éxito.
 */
export async function decrementarStock(
  tx: TransactionClient,
  comercioId: string,
  productoId: string,
  cantidad: number
): Promise<boolean> {
  const result = await tx.$executeRaw`
    UPDATE "Producto"
    SET "stockActual" = "stockActual" - ${cantidad},
        "updatedAt" = NOW()
    WHERE id = ${productoId}
      AND "comercioId" = ${comercioId}
      AND "stockActual" >= ${cantidad}
  `;

  return result > 0; // Si afectó 0 filas → no había stock suficiente
}

export async function incrementarStock(
  tx: TransactionClient,
  comercioId: string,
  productoId: string,
  cantidad: number
): Promise<void> {
  await tx.$executeRaw`
    UPDATE "Producto"
    SET "stockActual" = "stockActual" + ${cantidad},
        "updatedAt" = NOW()
    WHERE id = ${productoId}
      AND "comercioId" = ${comercioId}
  `;
}

// ─────────────────────────────────────────────
// VENTA + DETALLES
// ─────────────────────────────────────────────

interface CreateVentaParams {
  comercioId: string;
  usuarioId: string;
  total: number;
}

export async function createVenta(
  tx: TransactionClient,
  params: CreateVentaParams
) {
  return tx.venta.create({
    data: {
      comercioId: params.comercioId,
      usuarioId: params.usuarioId,
      total: params.total,
      estado: "COMPLETADA",
    },
  });
}

interface CreateVentaDetalleItem {
  comercioId: string;
  ventaId: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  precioCosto: number;
  subtotal: number;
}

export async function createVentaDetalles(
  tx: TransactionClient,
  items: CreateVentaDetalleItem[]
) {
  return tx.ventaDetalle.createMany({ data: items });
}

// ─────────────────────────────────────────────
// MOVIMIENTOS DE STOCK
// ─────────────────────────────────────────────

interface CreateMovimientoItem {
  comercioId: string;
  productoId: string;
  usuarioId: string;
  tipo: TipoMovimientoStock;
  cantidad: number;
  observaciones?: string;
}

export async function createMovimientosStock(
  tx: TransactionClient,
  movimientos: CreateMovimientoItem[]
) {
  return tx.movimientoStock.createMany({ data: movimientos });
}

// ─────────────────────────────────────────────
// COMPROBANTE
// ─────────────────────────────────────────────

/**
 * Obtiene el próximo número de comprobante para el comercio.
 * Se ejecuta DENTRO de la transacción para evitar números duplicados.
 */
export async function getNextNumeroComprobante(
  tx: TransactionClient,
  comercioId: string
): Promise<number> {
  const last = await tx.comprobante.findFirst({
    where: { comercioId },
    orderBy: { numeroComprobante: "desc" },
    select: { numeroComprobante: true },
  });

  return (last?.numeroComprobante ?? 0) + 1;
}

export async function createComprobante(
  tx: TransactionClient,
  data: {
    comercioId: string;
    ventaId: string;
    numeroComprobante: number;
    snapshotJSON: ComprobanteSnapshot;
  }
) {
  return tx.comprobante.create({
    data: {
      comercioId: data.comercioId,
      ventaId: data.ventaId,
      numeroComprobante: data.numeroComprobante,
      snapshotJSON: data.snapshotJSON as unknown as Prisma.InputJsonValue,
    },
  });
}

// ─────────────────────────────────────────────
// ANULACIÓN
// ─────────────────────────────────────────────

export async function getVentaConDetalles(
  comercioId: string,
  ventaId: string
) {
  const { prisma } = await import("@/repositories/prisma");
  return prisma.venta.findFirst({
    where: { id: ventaId, comercioId },
    include: { detalles: true, comprobante: true },
  });
}

export async function anularVenta(
  tx: TransactionClient,
  ventaId: string
) {
  return tx.venta.update({
    where: { id: ventaId },
    data: { estado: "ANULADA" },
  });
}
