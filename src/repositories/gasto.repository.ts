import prisma from "@/repositories/prisma";
import { TipoCategoriaGasto } from "@/validators/gasto.schema";

let tableEnsured = false;

export async function ensureGastoTable() {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoriagasto' OR typname = 'CategoriaGasto') THEN
          CREATE TYPE "CategoriaGasto" AS ENUM (
            'PROVEEDORES', 'ALQUILER', 'SERVICIOS', 'INTERNET_TELEFONIA', 
            'SUELDOS', 'MANTENIMIENTO', 'IMPUESTOS', 'OTROS'
          );
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS "Gasto" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "comercioId" TEXT NOT NULL,
        "usuarioId" TEXT,
        "categoria" "CategoriaGasto" NOT NULL DEFAULT 'OTROS',
        "descripcion" TEXT NOT NULL,
        "monto" DECIMAL(12,2) NOT NULL,
        "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "metodoPago" TEXT,
        "comprobante" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "Gasto_comercioId_idx" ON "Gasto"("comercioId");
      CREATE INDEX IF NOT EXISTS "Gasto_comercioId_fecha_idx" ON "Gasto"("comercioId", "fecha");
    `);
    tableEnsured = true;
  } catch (err) {
    console.error("Error asegurando tabla Gasto:", err);
  }
}

export interface CreateGastoParams {
  comercioId: string;
  usuarioId?: string;
  categoria: TipoCategoriaGasto;
  descripcion: string;
  monto: number;
  fecha?: Date;
  metodoPago?: string;
  comprobante?: string;
}

export async function createGasto(params: CreateGastoParams) {
  await ensureGastoTable();
  return await prisma.gasto.create({
    data: {
      comercioId: params.comercioId,
      usuarioId: params.usuarioId || null,
      categoria: params.categoria,
      descripcion: params.descripcion,
      monto: params.monto,
      fecha: params.fecha || new Date(),
      metodoPago: params.metodoPago || null,
      comprobante: params.comprobante || null,
    },
    include: {
      usuario: {
        select: {
          nombre: true,
          email: true,
        },
      },
    },
  });
}

export async function deleteGasto(comercioId: string, id: string) {
  await ensureGastoTable();
  return await prisma.gasto.delete({
    where: {
      id,
      comercioId,
    },
  });
}

export async function getGastosByRango(
  comercioId: string,
  desde: Date,
  hasta: Date
) {
  await ensureGastoTable();
  return await prisma.gasto.findMany({
    where: {
      comercioId,
      fecha: {
        gte: desde,
        lte: hasta,
      },
    },
    orderBy: {
      fecha: "desc",
    },
    include: {
      usuario: {
        select: {
          nombre: true,
          email: true,
        },
      },
    },
  });
}

export async function getVentasTotalByRango(
  comercioId: string,
  desde: Date,
  hasta: Date
) {
  const result = await prisma.venta.aggregate({
    where: {
      comercioId,
      estado: "COMPLETADA",
      createdAt: {
        gte: desde,
        lte: hasta,
      },
    },
    _sum: {
      total: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    totalVentas: Number(result._sum.total || 0),
    cantidadVentas: result._count.id,
  };
}
