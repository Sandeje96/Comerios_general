import prisma from "@/repositories/prisma";
import { startOfDay, startOfWeek, startOfMonth, endOfDay } from "date-fns";

export async function getDashboardMetrics(comercioId: string) {
  const now = new Date();
  
  const inicioDia = startOfDay(now);
  const finDia = endOfDay(now);
  const inicioSemana = startOfWeek(now, { weekStartsOn: 1 }); // Lunes
  const inicioMes = startOfMonth(now);

  // 1. Ventas de Hoy
  const ventasHoyResult = await prisma.venta.aggregate({
    where: {
      comercioId,
      estado: "COMPLETADA",
      createdAt: {
        gte: inicioDia,
        lte: finDia,
      },
    },
    _sum: { total: true },
    _count: { id: true },
  });

  // 2. Ventas de la Semana
  const ventasSemanaResult = await prisma.venta.aggregate({
    where: {
      comercioId,
      estado: "COMPLETADA",
      createdAt: {
        gte: inicioSemana,
      },
    },
    _sum: { total: true },
  });

  // 3. Ventas del Mes
  const ventasMesResult = await prisma.venta.aggregate({
    where: {
      comercioId,
      estado: "COMPLETADA",
      createdAt: {
        gte: inicioMes,
      },
    },
    _sum: { total: true },
  });

  // 4. Cantidad Total de Productos
  const cantidadProductos = await prisma.producto.count({
    where: { comercioId, activo: true },
  });

  // 5. Últimas 5 Ventas
  const ultimasVentas = await prisma.venta.findMany({
    where: { comercioId, estado: "COMPLETADA" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      usuario: { select: { nombre: true } },
      detalles: { select: { id: true } }, // Para saber cantidad de items
    },
  });

  // 6. Productos con Stock Bajo (<= 5)
  const productosStockBajo = await prisma.producto.findMany({
    where: { comercioId, activo: true, stockActual: { lte: 5 } },
    orderBy: { stockActual: "asc" },
    take: 5,
    select: {
      id: true,
      nombre: true,
      codigoInterno: true,
      stockActual: true,
    },
  });

  return {
    ventasHoy: {
      total: Number(ventasHoyResult._sum.total || 0),
      cantidad: ventasHoyResult._count.id,
    },
    ventasSemana: {
      total: Number(ventasSemanaResult._sum.total || 0),
    },
    ventasMes: {
      total: Number(ventasMesResult._sum.total || 0),
    },
    cantidadProductos,
    ultimasVentas,
    productosStockBajo,
  };
}
