import prisma from "@/repositories/prisma";
import {
  ProveedorInput,
  CotizacionCreateInput,
  PagoCreateInput,
  TipoMedioPagoProveedor,
  TipoEstadoCheque,
} from "@/validators/proveedor.schema";
import { Prisma } from "@prisma/client";

let tablasVerificadas = false;

export async function ensureProveedorTables() {
  if (tablasVerificadas) return;

  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM "Proveedor" LIMIT 1;');
    tablasVerificadas = true;
  } catch {
    try {
      console.log("Asegurando tablas de Cuenta Corriente de Proveedores en PostgreSQL...");
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoCotizacion') THEN
            CREATE TYPE "EstadoCotizacion" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'ANULADA');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MedioPagoProveedor') THEN
            CREATE TYPE "MedioPagoProveedor" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'DEBITO', 'CREDITO', 'OTRO');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoCheque') THEN
            CREATE TYPE "EstadoCheque" AS ENUM ('PENDIENTE', 'ACREDITADO', 'RECHAZADO');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoPagoProveedor') THEN
            CREATE TYPE "EstadoPagoProveedor" AS ENUM ('CONFIRMADO', 'ANULADO');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipoMovimientoCC') THEN
            CREATE TYPE "TipoMovimientoCC" AS ENUM ('DEBITO', 'CREDITO');
          END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS "Proveedor" (
          "id" TEXT NOT NULL,
          "comercioId" TEXT NOT NULL,
          "nombre" TEXT NOT NULL,
          "cuit" TEXT,
          "telefono" TEXT,
          "email" TEXT,
          "direccion" TEXT,
          "observaciones" TEXT,
          "activo" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
        );

        CREATE TABLE IF NOT EXISTS "CotizacionProveedor" (
          "id" TEXT NOT NULL,
          "comercioId" TEXT NOT NULL,
          "proveedorId" TEXT NOT NULL,
          "usuarioId" TEXT,
          "numeroComprobante" TEXT NOT NULL,
          "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "montoTotal" DECIMAL(12,2) NOT NULL,
          "montoPagado" DECIMAL(12,2) NOT NULL DEFAULT 0,
          "estado" "EstadoCotizacion" NOT NULL DEFAULT 'PENDIENTE',
          "observaciones" TEXT,
          "archivoUrl" TEXT,
          "archivoNombre" TEXT,
          "anulado" BOOLEAN NOT NULL DEFAULT false,
          "anuladoMotivo" TEXT,
          "anuladoAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "CotizacionProveedor_pkey" PRIMARY KEY ("id")
        );

        CREATE TABLE IF NOT EXISTS "PagoProveedor" (
          "id" TEXT NOT NULL,
          "comercioId" TEXT NOT NULL,
          "proveedorId" TEXT NOT NULL,
          "usuarioId" TEXT,
          "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "monto" DECIMAL(12,2) NOT NULL,
          "medioPago" "MedioPagoProveedor" NOT NULL DEFAULT 'EFECTIVO',
          "referencia" TEXT,
          "observaciones" TEXT,
          "comprobantePagoUrl" TEXT,
          "comprobantePagoNombre" TEXT,
          "reciboRecibido" BOOLEAN NOT NULL DEFAULT false,
          "reciboNumero" TEXT,
          "reciboFecha" TIMESTAMP(3),
          "reciboArchivoUrl" TEXT,
          "reciboArchivoNombre" TEXT,
          "transferenciaBanco" TEXT,
          "transferenciaOperacion" TEXT,
          "transferenciaFecha" TIMESTAMP(3),
          "chequeNumero" TEXT,
          "chequeBanco" TEXT,
          "chequeFechaEmision" TIMESTAMP(3),
          "chequeFechaCobro" TIMESTAMP(3),
          "chequeEstado" "EstadoCheque",
          "estado" "EstadoPagoProveedor" NOT NULL DEFAULT 'CONFIRMADO',
          "anuladoMotivo" TEXT,
          "anuladoAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PagoProveedor_pkey" PRIMARY KEY ("id")
        );

        CREATE TABLE IF NOT EXISTS "PagoCotizacion" (
          "id" TEXT NOT NULL,
          "pagoId" TEXT NOT NULL,
          "cotizacionId" TEXT NOT NULL,
          "montoAsignado" DECIMAL(12,2) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PagoCotizacion_pkey" PRIMARY KEY ("id")
        );

        CREATE TABLE IF NOT EXISTS "MovimientoCuentaCorriente" (
          "id" TEXT NOT NULL,
          "comercioId" TEXT NOT NULL,
          "proveedorId" TEXT NOT NULL,
          "usuarioId" TEXT,
          "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "tipo" "TipoMovimientoCC" NOT NULL,
          "concepto" TEXT NOT NULL,
          "comprobante" TEXT,
          "monto" DECIMAL(12,2) NOT NULL,
          "saldoResultante" DECIMAL(12,2),
          "cotizacionId" TEXT,
          "pagoId" TEXT,
          "anulado" BOOLEAN NOT NULL DEFAULT false,
          "anuladoMotivo" TEXT,
          "anuladoAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MovimientoCuentaCorriente_pkey" PRIMARY KEY ("id")
        );

        CREATE INDEX IF NOT EXISTS "Proveedor_comercioId_idx" ON "Proveedor"("comercioId");
        CREATE INDEX IF NOT EXISTS "Proveedor_comercioId_activo_idx" ON "Proveedor"("comercioId", "activo");

        CREATE INDEX IF NOT EXISTS "CotizacionProveedor_comercioId_proveedorId_idx" ON "CotizacionProveedor"("comercioId", "proveedorId");
        CREATE INDEX IF NOT EXISTS "CotizacionProveedor_comercioId_fecha_idx" ON "CotizacionProveedor"("comercioId", "fecha");

        CREATE INDEX IF NOT EXISTS "PagoProveedor_comercioId_proveedorId_idx" ON "PagoProveedor"("comercioId", "proveedorId");
        CREATE INDEX IF NOT EXISTS "PagoProveedor_comercioId_reciboRecibido_idx" ON "PagoProveedor"("comercioId", "reciboRecibido");
        CREATE INDEX IF NOT EXISTS "PagoProveedor_comercioId_fecha_idx" ON "PagoProveedor"("comercioId", "fecha");

        CREATE INDEX IF NOT EXISTS "PagoCotizacion_pagoId_idx" ON "PagoCotizacion"("pagoId");
        CREATE INDEX IF NOT EXISTS "PagoCotizacion_cotizacionId_idx" ON "PagoCotizacion"("cotizacionId");

        CREATE UNIQUE INDEX IF NOT EXISTS "MovimientoCuentaCorriente_cotizacionId_key" ON "MovimientoCuentaCorriente"("cotizacionId");
        CREATE UNIQUE INDEX IF NOT EXISTS "MovimientoCuentaCorriente_pagoId_key" ON "MovimientoCuentaCorriente"("pagoId");
        CREATE INDEX IF NOT EXISTS "MovimientoCuentaCorriente_comercioId_proveedorId_idx" ON "MovimientoCuentaCorriente"("comercioId", "proveedorId");
        CREATE INDEX IF NOT EXISTS "MovimientoCuentaCorriente_comercioId_proveedorId_fecha_idx" ON "MovimientoCuentaCorriente"("comercioId", "proveedorId", "fecha");

        DO $$ BEGIN
          ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "CotizacionProveedor" ADD CONSTRAINT "CotizacionProveedor_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "CotizacionProveedor" ADD CONSTRAINT "CotizacionProveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "CotizacionProveedor" ADD CONSTRAINT "CotizacionProveedor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "PagoCotizacion" ADD CONSTRAINT "PagoCotizacion_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "PagoProveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "PagoCotizacion" ADD CONSTRAINT "PagoCotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "CotizacionProveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "CotizacionProveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "PagoProveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      tablasVerificadas = true;
      console.log("Tablas de Cuenta Corriente creadas exitosamente.");
    } catch (createErr) {
      console.error("Error al asegurar tablas de Cuenta Corriente:", createErr);
    }
  }
}

export async function getProveedoresWithSummary(comercioId: string) {
  await ensureProveedorTables();
  const proveedores = await prisma.proveedor.findMany({
    where: {
      comercioId,
      activo: true,
    },
    orderBy: {
      nombre: "asc",
    },
    include: {
      movimientos: {
        where: {
          anulado: false,
        },
        select: {
          tipo: true,
          monto: true,
        },
      },
      pagos: {
        where: {
          estado: "CONFIRMADO",
          reciboRecibido: false,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return proveedores.map((p) => {
    let totalDebitos = 0;
    let totalCreditos = 0;

    for (const mov of p.movimientos) {
      const monto = Number(mov.monto);
      if (mov.tipo === "DEBITO") {
        totalDebitos += monto;
      } else if (mov.tipo === "CREDITO") {
        totalCreditos += monto;
      }
    }

    const saldoActual = totalDebitos - totalCreditos;
    const recibosPendientes = p.pagos.length;

    return {
      id: p.id,
      nombre: p.nombre,
      cuit: p.cuit,
      telefono: p.telefono,
      email: p.email,
      direccion: p.direccion,
      observaciones: p.observaciones,
      totalDebitos,
      totalCreditos,
      saldoActual,
      recibosPendientes,
      createdAt: p.createdAt,
    };
  });
}

export async function getProveedorById(comercioId: string, id: string) {
  await ensureProveedorTables();
  return await prisma.proveedor.findFirst({
    where: {
      id,
      comercioId,
      activo: true,
    },
  });
}

export async function createProveedor(comercioId: string, data: ProveedorInput) {
  return await prisma.proveedor.create({
    data: {
      comercioId,
      nombre: data.nombre.trim(),
      cuit: data.cuit?.trim() || null,
      telefono: data.telefono?.trim() || null,
      email: data.email?.trim() || null,
      direccion: data.direccion?.trim() || null,
      observaciones: data.observaciones?.trim() || null,
    },
  });
}

export async function updateProveedor(
  comercioId: string,
  id: string,
  data: ProveedorInput
) {
  return await prisma.proveedor.update({
    where: {
      id,
      comercioId,
    },
    data: {
      nombre: data.nombre.trim(),
      cuit: data.cuit?.trim() || null,
      telefono: data.telefono?.trim() || null,
      email: data.email?.trim() || null,
      direccion: data.direccion?.trim() || null,
      observaciones: data.observaciones?.trim() || null,
    },
  });
}

export async function getCotizacionesPendientesByProveedor(
  comercioId: string,
  proveedorId: string
) {
  const cotizaciones = await prisma.cotizacionProveedor.findMany({
    where: {
      comercioId,
      proveedorId,
      anulado: false,
      estado: {
        in: ["PENDIENTE", "PARCIAL"],
      },
    },
    orderBy: {
      fecha: "asc",
    },
  });

  return cotizaciones.map((c) => ({
    id: c.id,
    numeroComprobante: c.numeroComprobante,
    fecha: c.fecha,
    montoTotal: Number(c.montoTotal),
    montoPagado: Number(c.montoPagado),
    saldoPendiente: Number(c.montoTotal) - Number(c.montoPagado),
    estado: c.estado,
    observaciones: c.observaciones,
  }));
}

export async function getSaldoAnteriorProveedor(
  comercioId: string,
  proveedorId: string,
  antesDe: Date
): Promise<number> {
  const movimientosAnteriores = await prisma.movimientoCuentaCorriente.findMany({
    where: {
      comercioId,
      proveedorId,
      anulado: false,
      fecha: {
        lt: antesDe,
      },
    },
    select: {
      tipo: true,
      monto: true,
    },
  });

  let saldo = 0;
  for (const m of movimientosAnteriores) {
    const val = Number(m.monto);
    if (m.tipo === "DEBITO") {
      saldo += val;
    } else {
      saldo -= val;
    }
  }

  return saldo;
}

export async function getMovimientosByProveedor(
  comercioId: string,
  proveedorId: string,
  desde?: Date,
  hasta?: Date
) {
  const whereClause: Prisma.MovimientoCuentaCorrienteWhereInput = {
    comercioId,
    proveedorId,
  };

  if (desde || hasta) {
    whereClause.fecha = {};
    if (desde) whereClause.fecha.gte = desde;
    if (hasta) whereClause.fecha.lte = hasta;
  }

  return await prisma.movimientoCuentaCorriente.findMany({
    where: whereClause,
    orderBy: [
      { fecha: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      cotizacion: {
        select: {
          id: true,
          numeroComprobante: true,
          archivoUrl: true,
          archivoNombre: true,
          estado: true,
          montoTotal: true,
          montoPagado: true,
        },
      },
      pago: {
        include: {
          cotizacionesAsociadas: {
            include: {
              cotizacion: {
                select: {
                  id: true,
                  numeroComprobante: true,
                },
              },
            },
          },
        },
      },
      usuario: {
        select: {
          nombre: true,
          email: true,
        },
      },
    },
  });
}

export async function getTotalesProveedor(comercioId: string, proveedorId: string) {
  const movimientos = await prisma.movimientoCuentaCorriente.findMany({
    where: {
      comercioId,
      proveedorId,
      anulado: false,
    },
    select: {
      tipo: true,
      monto: true,
    },
  });

  let totalDebitos = 0;
  let totalCreditos = 0;

  for (const m of movimientos) {
    const val = Number(m.monto);
    if (m.tipo === "DEBITO") {
      totalDebitos += val;
    } else {
      totalCreditos += val;
    }
  }

  const recibosPendientes = await prisma.pagoProveedor.count({
    where: {
      comercioId,
      proveedorId,
      estado: "CONFIRMADO",
      reciboRecibido: false,
    },
  });

  return {
    totalDebitos,
    totalCreditos,
    saldoActual: totalDebitos - totalCreditos,
    recibosPendientes,
  };
}

export async function createCotizacionTransaccional(params: {
  comercioId: string;
  proveedorId: string;
  usuarioId: string;
  fecha: Date;
  numeroComprobante: string;
  montoTotal: number;
  observaciones?: string;
  archivoUrl?: string;
  archivoNombre?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Crear cotización
    const cotizacion = await tx.cotizacionProveedor.create({
      data: {
        comercioId: params.comercioId,
        proveedorId: params.proveedorId,
        usuarioId: params.usuarioId,
        fecha: params.fecha,
        numeroComprobante: params.numeroComprobante.trim(),
        montoTotal: params.montoTotal,
        montoPagado: 0,
        estado: "PENDIENTE",
        observaciones: params.observaciones?.trim() || null,
        archivoUrl: params.archivoUrl || null,
        archivoNombre: params.archivoNombre || null,
      },
    });

    // 2. Crear movimiento de débito en cuenta corriente
    const concepto = `Cotización / Comprobante #${params.numeroComprobante.trim()}`;
    const movimiento = await tx.movimientoCuentaCorriente.create({
      data: {
        comercioId: params.comercioId,
        proveedorId: params.proveedorId,
        usuarioId: params.usuarioId,
        fecha: params.fecha,
        tipo: "DEBITO",
        concepto,
        comprobante: params.numeroComprobante.trim(),
        monto: params.montoTotal,
        cotizacionId: cotizacion.id,
      },
    });

    return { cotizacion, movimiento };
  });
}

export async function createPagoTransaccional(params: {
  comercioId: string;
  proveedorId: string;
  usuarioId: string;
  fecha: Date;
  monto: number;
  medioPago: TipoMedioPagoProveedor;
  referencia?: string;
  observaciones?: string;
  comprobantePagoUrl?: string;
  comprobantePagoNombre?: string;
  reciboRecibido: boolean;
  reciboNumero?: string;
  reciboFecha?: Date;
  reciboArchivoUrl?: string;
  reciboArchivoNombre?: string;
  transferenciaBanco?: string;
  transferenciaOperacion?: string;
  transferenciaFecha?: Date;
  chequeNumero?: string;
  chequeBanco?: string;
  chequeFechaEmision?: Date;
  chequeFechaCobro?: Date;
  chequeEstado?: TipoEstadoCheque;
  cotizaciones?: { cotizacionId: string; montoAsignado: number }[];
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Crear el pago
    const pago = await tx.pagoProveedor.create({
      data: {
        comercioId: params.comercioId,
        proveedorId: params.proveedorId,
        usuarioId: params.usuarioId,
        fecha: params.fecha,
        monto: params.monto,
        medioPago: params.medioPago,
        referencia: params.referencia?.trim() || null,
        observaciones: params.observaciones?.trim() || null,
        comprobantePagoUrl: params.comprobantePagoUrl || null,
        comprobantePagoNombre: params.comprobantePagoNombre || null,
        reciboRecibido: params.reciboRecibido,
        reciboNumero: params.reciboNumero?.trim() || null,
        reciboFecha: params.reciboFecha || (params.reciboRecibido ? new Date() : null),
        reciboArchivoUrl: params.reciboArchivoUrl || null,
        reciboArchivoNombre: params.reciboArchivoNombre || null,
        transferenciaBanco: params.transferenciaBanco?.trim() || null,
        transferenciaOperacion: params.transferenciaOperacion?.trim() || null,
        transferenciaFecha: params.transferenciaFecha || null,
        chequeNumero: params.chequeNumero?.trim() || null,
        chequeBanco: params.chequeBanco?.trim() || null,
        chequeFechaEmision: params.chequeFechaEmision || null,
        chequeFechaCobro: params.chequeFechaCobro || null,
        chequeEstado: params.chequeEstado || (params.medioPago === "CHEQUE" ? "PENDIENTE" : null),
        estado: "CONFIRMADO",
      },
    });

    // 2. Crear el movimiento de CRÉDITO único en la cuenta corriente
    let concepto = `Pago (${params.medioPago})`;
    if (params.referencia) {
      concepto += ` - Ref: ${params.referencia.trim()}`;
    } else if (params.chequeNumero) {
      concepto += ` - Cheque #${params.chequeNumero.trim()}`;
    } else if (params.transferenciaOperacion) {
      concepto += ` - Op #${params.transferenciaOperacion.trim()}`;
    }

    const movimiento = await tx.movimientoCuentaCorriente.create({
      data: {
        comercioId: params.comercioId,
        proveedorId: params.proveedorId,
        usuarioId: params.usuarioId,
        fecha: params.fecha,
        tipo: "CREDITO",
        concepto,
        comprobante: params.reciboNumero || params.referencia || null,
        monto: params.monto,
        pagoId: pago.id,
      },
    });

    // 3. Imputar cotizaciones si se especificaron
    if (params.cotizaciones && params.cotizaciones.length > 0) {
      for (const cot of params.cotizaciones) {
        if (cot.montoAsignado > 0) {
          // Crear asignación
          await tx.pagoCotizacion.create({
            data: {
              pagoId: pago.id,
              cotizacionId: cot.cotizacionId,
              montoAsignado: cot.montoAsignado,
            },
          });

          // Actualizar montoPagado y estado en CotizacionProveedor
          const cotDb = await tx.cotizacionProveedor.findUnique({
            where: { id: cot.cotizacionId },
          });

          if (cotDb) {
            const nuevoMontoPagado = Number(cotDb.montoPagado) + cot.montoAsignado;
            const montoTotal = Number(cotDb.montoTotal);
            const nuevoEstado = nuevoMontoPagado >= montoTotal ? "PAGADA" : "PARCIAL";

            await tx.cotizacionProveedor.update({
              where: { id: cot.cotizacionId },
              data: {
                montoPagado: nuevoMontoPagado,
                estado: nuevoEstado,
              },
            });
          }
        }
      }
    }

    return { pago, movimiento };
  });
}

export async function updateReciboEstado(
  comercioId: string,
  pagoId: string,
  data: {
    reciboRecibido: boolean;
    reciboNumero?: string;
    reciboFecha?: Date;
    reciboArchivoUrl?: string;
    reciboArchivoNombre?: string;
  }
) {
  const updateData: Prisma.PagoProveedorUpdateInput = {
    reciboRecibido: data.reciboRecibido,
    reciboFecha: data.reciboRecibido
      ? data.reciboFecha || new Date()
      : null,
  };

  if (data.reciboNumero !== undefined) {
    updateData.reciboNumero = data.reciboNumero ? data.reciboNumero.trim() : null;
  }

  if (data.reciboArchivoUrl !== undefined) {
    updateData.reciboArchivoUrl = data.reciboArchivoUrl || null;
    updateData.reciboArchivoNombre = data.reciboArchivoNombre || null;
  }

  return await prisma.pagoProveedor.update({
    where: {
      id: pagoId,
      comercioId,
    },
    data: updateData,
  });
}

export async function getRecibosPendientesGlobal(
  comercioId: string,
  proveedorId?: string
) {
  const whereClause: Prisma.PagoProveedorWhereInput = {
    comercioId,
    reciboRecibido: false,
    estado: "CONFIRMADO",
  };

  if (proveedorId) {
    whereClause.proveedorId = proveedorId;
  }

  const pagos = await prisma.pagoProveedor.findMany({
    where: whereClause,
    orderBy: {
      fecha: "asc",
    },
    include: {
      proveedor: {
        select: {
          id: true,
          nombre: true,
          cuit: true,
          telefono: true,
        },
      },
    },
  });

  return pagos.map((p) => ({
    id: p.id,
    proveedorId: p.proveedorId,
    proveedorNombre: p.proveedor.nombre,
    proveedorCuit: p.proveedor.cuit,
    fecha: p.fecha,
    monto: Number(p.monto),
    medioPago: p.medioPago,
    referencia: p.referencia,
    observaciones: p.observaciones,
    comprobantePagoUrl: p.comprobantePagoUrl,
    comprobantePagoNombre: p.comprobantePagoNombre,
    chequeNumero: p.chequeNumero,
    chequeBanco: p.chequeBanco,
    transferenciaBanco: p.transferenciaBanco,
    transferenciaOperacion: p.transferenciaOperacion,
  }));
}

export async function anularMovimientoTransaccional(params: {
  comercioId: string;
  usuarioId: string;
  movimientoId: string;
  motivo: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const mov = await tx.movimientoCuentaCorriente.findFirst({
      where: {
        id: params.movimientoId,
        comercioId: params.comercioId,
      },
      include: {
        cotizacion: true,
        pago: {
          include: {
            cotizacionesAsociadas: true,
          },
        },
      },
    });

    if (!mov) {
      throw new Error("Movimiento no encontrado");
    }

    if (mov.anulado) {
      throw new Error("El movimiento ya se encuentra anulado");
    }

    const now = new Date();

    // 1. Marcar movimiento como anulado
    await tx.movimientoCuentaCorriente.update({
      where: { id: mov.id },
      data: {
        anulado: true,
        anuladoMotivo: params.motivo.trim(),
        anuladoAt: now,
      },
    });

    // 2. Si estaba vinculado a cotización, anular cotización
    if (mov.cotizacionId) {
      await tx.cotizacionProveedor.update({
        where: { id: mov.cotizacionId },
        data: {
          anulado: true,
          estado: "ANULADA",
          anuladoMotivo: params.motivo.trim(),
          anuladoAt: now,
        },
      });
    }

    // 3. Si estaba vinculado a pago, anular pago y revertir imputaciones
    if (mov.pagoId && mov.pago) {
      await tx.pagoProveedor.update({
        where: { id: mov.pagoId },
        data: {
          estado: "ANULADO",
          anuladoMotivo: params.motivo.trim(),
          anuladoAt: now,
        },
      });

      // Revertir imputaciones en cotizaciones
      for (const asoc of mov.pago.cotizacionesAsociadas) {
        const cotDb = await tx.cotizacionProveedor.findUnique({
          where: { id: asoc.cotizacionId },
        });

        if (cotDb) {
          const montoRevertir = Number(asoc.montoAsignado);
          const nuevoMontoPagado = Math.max(0, Number(cotDb.montoPagado) - montoRevertir);
          const nuevoEstado = nuevoMontoPagado === 0 ? "PENDIENTE" : "PARCIAL";

          await tx.cotizacionProveedor.update({
            where: { id: cotDb.id },
            data: {
              montoPagado: nuevoMontoPagado,
              estado: nuevoEstado,
            },
          });
        }
      }
    }

    return { success: true };
  });
}
