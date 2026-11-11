import prisma from "@/repositories/prisma";
import {
  ProveedorInput,
  CotizacionCreateInput,
  PagoCreateInput,
  TipoMedioPagoProveedor,
  TipoEstadoCheque,
} from "@/validators/proveedor.schema";
import { Prisma } from "@prisma/client";

export async function getProveedoresWithSummary(comercioId: string) {
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
