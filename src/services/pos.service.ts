import prisma from "@/repositories/prisma";
import {
  createVenta,
  createVentaDetalles,
  createMovimientosStock,
  decrementarStock,
  incrementarStock,
  getNextNumeroComprobante,
  createComprobante,
  getVentaConDetalles,
  anularVenta,
} from "@/repositories/pos.repository";
import { buildSnapshotJSON } from "@/services/comprobante.service";
import { VentaPayload, VentaResult } from "@/types/pos.types";

interface ProcesarVentaParams {
  comercioId: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  payload: VentaPayload;
}

/**
 * Procesa una venta completa en una transacción atómica de PostgreSQL.
 * Si cualquier paso falla (stock insuficiente, producto no encontrado),
 * toda la transacción se revierte y no quedan registros parciales.
 * Los ítems libres (sin productoId) no afectan el stock y se registran
 * solo en el comprobante con su nombre y precio manual.
 */
export async function procesarVenta(
  params: ProcesarVentaParams
): Promise<VentaResult> {
  const { comercioId, usuarioId, usuarioNombre, usuarioEmail, payload } = params;
  const itemsLibres = payload.itemsLibres ?? [];

  // Obtener datos del comercio para el snapshot
  const comercio = await prisma.comercio.findUniqueOrThrow({
    where: { id: comercioId },
    select: { nombreFantasia: true, email: true, celular: true },
  });

  // Obtener datos completos de productos en stock (solo los no-libres)
  const productoIds = payload.items.map((i) => i.productoId);
  const productos = productoIds.length > 0
    ? await prisma.producto.findMany({
        where: { id: { in: productoIds }, comercioId, activo: true },
        select: {
          id: true,
          nombre: true,
          codigoInterno: true,
          precioVenta: true,
          precioCosto: true,
          stockActual: true,
        },
      })
    : [];

  // Validar que todos los productos de stock existen y pertenecen al comercio
  if (productos.length !== payload.items.length) {
    throw new Error("Uno o más productos no fueron encontrados o no pertenecen al comercio");
  }

  // Calcular total (productos en stock + ítems libres)
  const totalStock = payload.items.reduce((acc, item) => {
    const producto = productos.find((p) => p.id === item.productoId)!;
    return acc + Number(producto.precioVenta) * item.cantidad;
  }, 0);
  const totalLibres = itemsLibres.reduce(
    (acc, item) => acc + item.precioUnitario * item.cantidad,
    0
  );
  const total = totalStock + totalLibres;

  return await prisma.$transaction(async (tx) => {
    // ── 1. Decrementar stock atómicamente (solo ítems de stock) ──
    for (const item of payload.items) {
      const ok = await decrementarStock(tx, comercioId, item.productoId, item.cantidad);
      if (!ok) {
        const producto = productos.find((p) => p.id === item.productoId);
        throw new Error(
          `Stock insuficiente para "${producto?.nombre ?? item.productoId}". ` +
          `Disponible: ${producto?.stockActual ?? 0}, solicitado: ${item.cantidad}`
        );
      }
    }

    // ── 2. Crear cabecera de venta ──
    const venta = await createVenta(tx, { comercioId, usuarioId, total });

    // ── 3. Crear detalles de productos en stock ──
    const detallesStockData = payload.items.map((item) => {
      const producto = productos.find((p) => p.id === item.productoId)!;
      const precioUnitario = Number(producto.precioVenta);
      return {
        comercioId,
        ventaId: venta.id,
        productoId: producto.id,
        nombreLibre: null,
        cantidad: item.cantidad,
        precioUnitario,
        precioCosto: producto.precioCosto ? Number(producto.precioCosto) : null,
        subtotal: precioUnitario * item.cantidad,
      };
    });

    // ── 4. Crear detalles de ítems libres (sin productoId ni movimiento de stock) ──
    const detallesLibresData = itemsLibres.map((item) => ({
      comercioId,
      ventaId: venta.id,
      productoId: null,
      nombreLibre: item.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      precioCosto: null,
      subtotal: item.precioUnitario * item.cantidad,
    }));

    const todosLosDetalles = [...detallesStockData, ...detallesLibresData];
    await createVentaDetalles(tx, todosLosDetalles);

    // ── 5. Crear movimientos de stock (solo ítems de stock) ──
    if (payload.items.length > 0) {
      const movimientosData = payload.items.map((item) => ({
        comercioId,
        productoId: item.productoId,
        usuarioId,
        tipo: "VENTA" as const,
        cantidad: -item.cantidad,
        observaciones: `Venta ID: ${venta.id}`,
      }));
      await createMovimientosStock(tx, movimientosData);
    }

    // ── 6. Obtener número de comprobante (dentro de la transacción) ──
    const numeroComprobante = await getNextNumeroComprobante(tx, comercioId);

    // ── 7. Construir snapshot JSON del ticket (incluye todos los ítems) ──
    const snapshotItemsStock = detallesStockData.map((d) => {
      const producto = productos.find((p) => p.id === d.productoId)!;
      return {
        nombre: producto.nombre,
        codigoInterno: producto.codigoInterno,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subtotal: d.subtotal,
      };
    });

    const snapshotItemsLibres = detallesLibresData.map((d) => ({
      nombre: d.nombreLibre!,
      codigoInterno: "(libre)",
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      subtotal: d.subtotal,
    }));

    const snapshot = buildSnapshotJSON({
      numeroComprobante,
      empresa: {
        nombreFantasia: comercio.nombreFantasia,
        email: comercio.email,
        celular: comercio.celular ?? null,
      },
      comitente: { nombre: usuarioNombre, email: usuarioEmail },
      items: [...snapshotItemsStock, ...snapshotItemsLibres],
      total,
    });

    // ── 8. Crear comprobante ──
    const comprobante = await createComprobante(tx, {
      comercioId,
      ventaId: venta.id,
      numeroComprobante,
      snapshotJSON: snapshot,
    });

    return {
      ventaId: venta.id,
      comprobanteId: comprobante.id,
      numeroComprobante,
      snapshot,
    };
  });
}

/**
 * Anula una venta y devuelve el stock a cada producto.
 * Solo disponible para usuarios con rol ADMIN.
 */
export async function anularVentaService(
  comercioId: string,
  usuarioId: string,
  ventaId: string
): Promise<void> {
  const venta = await getVentaConDetalles(comercioId, ventaId);

  if (!venta) throw new Error("Venta no encontrada");
  if (venta.estado === "ANULADA") throw new Error("La venta ya está anulada");

  await prisma.$transaction(async (tx) => {
    // Solo los detalles con producto en stock (los ítems libres no tienen stock que devolver)
    const detallesConStock = venta.detalles.filter((d) => d.productoId !== null);

    // Devolver stock por cada ítem con producto
    for (const detalle of detallesConStock) {
      await incrementarStock(tx, comercioId, detalle.productoId!, detalle.cantidad);
    }

    // Crear movimientos de devolución (solo ítems con stock)
    const movimientos = detallesConStock.map((d) => ({
      comercioId,
      productoId: d.productoId!,
      usuarioId,
      tipo: "AJUSTE_POSITIVO" as const,
      cantidad: d.cantidad,
      observaciones: `Anulación de venta ID: ${ventaId}`,
    }));
    if (movimientos.length > 0) {
      await createMovimientosStock(tx, movimientos);
    }

    // Marcar venta como anulada
    await anularVenta(tx, ventaId);
  });
}
