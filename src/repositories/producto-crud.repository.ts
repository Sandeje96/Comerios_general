import prisma from "./prisma";
import { Prisma } from "@prisma/client";

export async function getProductosByComercio(comercioId: string) {
  return prisma.producto.findMany({
    where: { comercioId, activo: true },
    orderBy: { nombre: "asc" },
  });
}

export async function findProductoByCodigo(comercioId: string, codigoInterno: string) {
  return prisma.producto.findUnique({
    where: {
      comercioId_codigoInterno: { comercioId, codigoInterno },
    },
    select: { id: true },
  });
}

export async function createProductoWithStock(
  data: Prisma.ProductoUncheckedCreateInput,
  stockInicial: number,
  usuarioId: string
) {
  return prisma.$transaction(async (tx) => {
    // 1. Crear el producto con el stock inicial seteado
    const producto = await tx.producto.create({
      data: {
        ...data,
        stockActual: stockInicial,
      },
    });

    // 2. Si el stock inicial es mayor a 0, registrar el movimiento
    if (stockInicial > 0) {
      await tx.movimientoStock.create({
        data: {
          comercioId: producto.comercioId,
          productoId: producto.id,
          usuarioId,
          tipo: "INGRESO",
          cantidad: stockInicial,
          observaciones: "Stock inicial por alta de producto",
        },
      });
    }

    return producto;
  });
}

export async function updateProducto(
  comercioId: string,
  id: string,
  data: Prisma.ProductoUncheckedUpdateInput
) {
  return prisma.producto.update({
    where: { id, comercioId },
    data,
  });
}

export async function deleteProductoSoft(comercioId: string, id: string) {
  return prisma.producto.update({
    where: { id, comercioId },
    data: { activo: false },
  });
}
