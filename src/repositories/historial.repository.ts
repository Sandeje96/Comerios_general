import prisma from "@/repositories/prisma";

export interface HistorialFiltroRango {
  comercioId: string;
  desde: Date;
  hasta: Date;
}

export async function getVentasHistorial(filtro: HistorialFiltroRango) {
  const { comercioId, desde, hasta } = filtro;

  return await prisma.venta.findMany({
    where: {
      comercioId,
      estado: "COMPLETADA",
      createdAt: {
        gte: desde,
        lte: hasta,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
      comprobante: {
        select: {
          numeroComprobante: true,
          snapshotJSON: true,
        },
      },
      detalles: {
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              codigoInterno: true,
            },
          },
        },
      },
    },
  });
}
