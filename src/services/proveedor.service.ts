import {
  startOfDayAR,
  endOfDayAR,
  startOfWeekAR,
  startOfMonthAR,
  parseStartOfDayAR,
  parseEndOfDayAR,
  parseNoonAR,
  formatDateAR,
  formatTimeAR,
  formatShortDateAR,
  formatFechaLargaAR,
  formatMesAnioAR,
  formatYMD_AR,
  getArgentinaParts,
} from "@/lib/date-ar";
import {
  getProveedoresWithSummary,
  getProveedorById,
  createProveedor,
  updateProveedor,
  getCotizacionesPendientesByProveedor,
  getSaldoAnteriorProveedor,
  getMovimientosByProveedor,
  getTotalesProveedor,
  createCotizacionTransaccional,
  createPagoTransaccional,
  updateReciboEstado,
  getRecibosPendientesGlobal,
  anularMovimientoTransaccional,
} from "@/repositories/proveedor.repository";
import {
  ProveedorInput,
  CotizacionCreateInput,
  PagoCreateInput,
  ToggleReciboInput,
  AnularMovimientoInput,
  TipoMedioPagoProveedor,
  MEDIO_PAGO_INFO,
} from "@/validators/proveedor.schema";

export type TipoFiltroCC = "mes" | "semana" | "hoy" | "historico" | "custom";

export interface CCQueryParams {
  filtro?: string;
  desde?: string;
  hasta?: string;
}

export interface MovimientoCCItemResponse {
  id: string;
  fechaISO: string;
  fechaLegible: string;
  horaLegible: string;
  tipo: "DEBITO" | "CREDITO";
  concepto: string;
  comprobante: string | null;
  debito: number;
  credito: number;
  saldoAcumulado: number;
  anulado: boolean;
  anuladoMotivo: string | null;
  anuladoAt: string | null;

  // Datos específicos de cotización
  cotizacionId: string | null;
  cotizacionArchivoUrl: string | null;
  cotizacionArchivoNombre: string | null;

  // Datos específicos de pago
  pagoId: string | null;
  medioPago: TipoMedioPagoProveedor | null;
  medioPagoLabel: string | null;
  medioPagoIcon: string | null;
  referencia: string | null;
  observaciones: string | null;
  comprobantePagoUrl: string | null;
  comprobantePagoNombre: string | null;

  // Control de recibo del proveedor
  reciboRecibido: boolean;
  reciboNumero: string | null;
  reciboFecha: string | null;
  reciboFechaLegible: string | null;
  reciboArchivoUrl: string | null;
  reciboArchivoNombre: string | null;

  // Transferencia / Cheque
  transferenciaBanco: string | null;
  transferenciaOperacion: string | null;
  chequeNumero: string | null;
  chequeBanco: string | null;
  chequeFechaCobro: string | null;

  // Cotizaciones asociadas
  cotizacionesAsociadas: { id: string; numeroComprobante: string; montoAsignado: number }[];

  usuario: string;
}

export async function getProveedoresList(comercioId: string) {
  const proveedores = await getProveedoresWithSummary(comercioId);

  let deudaTotal = 0;
  let saldoAFavorTotal = 0;
  let totalRecibosPendientes = 0;
  let proveedoresConDeuda = 0;

  for (const p of proveedores) {
    if (p.saldoActual > 0) {
      deudaTotal += p.saldoActual;
      proveedoresConDeuda++;
    } else if (p.saldoActual < 0) {
      saldoAFavorTotal += Math.abs(p.saldoActual);
    }
    totalRecibosPendientes += p.recibosPendientes;
  }

  return {
    proveedores,
    metricas: {
      totalProveedores: proveedores.length,
      proveedoresConDeuda,
      deudaTotal,
      saldoAFavorTotal,
      totalRecibosPendientes,
    },
  };
}

export async function getCuentaCorrienteDetalle(
  comercioId: string,
  proveedorId: string,
  params: CCQueryParams
) {
  const proveedor = await getProveedorById(comercioId, proveedorId);
  if (!proveedor) {
    throw new Error("Proveedor no encontrado");
  }

  const now = new Date();
  let filtro: TipoFiltroCC = "mes";

  if (
    params.filtro === "hoy" ||
    params.filtro === "semana" ||
    params.filtro === "mes" ||
    params.filtro === "historico" ||
    params.filtro === "custom"
  ) {
    filtro = params.filtro as TipoFiltroCC;
  } else if (params.desde || params.hasta) {
    filtro = "custom";
  }

  let desdeDate: Date | undefined;
  let hastaDate: Date | undefined;
  let rangoTexto = "";

  if (filtro === "hoy") {
    desdeDate = startOfDayAR(now);
    hastaDate = endOfDayAR(now);
    rangoTexto = `Hoy (${formatFechaLargaAR(desdeDate)})`;
  } else if (filtro === "semana") {
    desdeDate = startOfWeekAR(now);
    hastaDate = endOfDayAR(now);
    rangoTexto = `Esta semana (${formatShortDateAR(desdeDate)} al ${formatDateAR(hastaDate)})`;
  } else if (filtro === "mes") {
    desdeDate = startOfMonthAR(now);
    hastaDate = endOfDayAR(now);
    rangoTexto = `Este mes (${formatMesAnioAR(desdeDate)})`;
  } else if (filtro === "custom") {
    if (params.desde) {
      desdeDate = parseStartOfDayAR(params.desde) ?? startOfMonthAR(now);
    } else {
      desdeDate = startOfMonthAR(now);
    }

    if (params.hasta) {
      hastaDate = parseEndOfDayAR(params.hasta) ?? endOfDayAR(now);
    } else {
      hastaDate = endOfDayAR(now);
    }

    if (desdeDate > hastaDate) {
      const temp = desdeDate;
      desdeDate = startOfDayAR(hastaDate);
      hastaDate = endOfDayAR(temp);
    }

    rangoTexto = `Del ${formatDateAR(desdeDate)} al ${formatDateAR(hastaDate)}`;
  } else {
    // "historico"
    filtro = "historico";
    desdeDate = undefined;
    hastaDate = undefined;
    rangoTexto = "Histórico Completo";
  }

  // 1. Calcular saldo anterior si hay fecha inicial
  let saldoAnterior = 0;
  if (desdeDate) {
    saldoAnterior = await getSaldoAnteriorProveedor(comercioId, proveedorId, desdeDate);
  }

  // 2. Traer movimientos del período
  const [movimientosDb, totalesGlobales] = await Promise.all([
    getMovimientosByProveedor(comercioId, proveedorId, desdeDate, hastaDate),
    getTotalesProveedor(comercioId, proveedorId),
  ]);

  // 3. Procesar movimientos y calcular saldo acumulado fila a fila
  let runningBalance = saldoAnterior;
  let totalDebitosPeriodo = 0;
  let totalCreditosPeriodo = 0;

  const movimientos: MovimientoCCItemResponse[] = movimientosDb.map((m) => {
    const monto = Number(m.monto);
    const debito = m.tipo === "DEBITO" ? monto : 0;
    const credito = m.tipo === "CREDITO" ? monto : 0;

    if (!m.anulado) {
      if (m.tipo === "DEBITO") {
        runningBalance += monto;
        totalDebitosPeriodo += monto;
      } else {
        runningBalance -= monto;
        totalCreditosPeriodo += monto;
      }
    }

    const medioPago = (m.pago?.medioPago as TipoMedioPagoProveedor) || null;
    const medioInfo = medioPago ? MEDIO_PAGO_INFO[medioPago] : null;

    const cotizacionesAsociadas =
      m.pago?.cotizacionesAsociadas.map((c) => ({
        id: c.cotizacion.id,
        numeroComprobante: c.cotizacion.numeroComprobante,
        montoAsignado: Number(c.montoAsignado),
      })) || [];

    return {
      id: m.id,
      fechaISO: m.fecha.toISOString(),
      fechaLegible: formatDateAR(m.fecha),
      horaLegible: formatTimeAR(m.fecha),
      tipo: m.tipo,
      concepto: m.concepto,
      comprobante: m.comprobante,
      debito,
      credito,
      saldoAcumulado: runningBalance,
      anulado: m.anulado,
      anuladoMotivo: m.anuladoMotivo,
      anuladoAt: m.anuladoAt ? formatDateAR(m.anuladoAt) : null,

      cotizacionId: m.cotizacionId,
      cotizacionArchivoUrl: m.cotizacion?.archivoUrl || null,
      cotizacionArchivoNombre: m.cotizacion?.archivoNombre || null,

      pagoId: m.pagoId,
      medioPago,
      medioPagoLabel: medioInfo?.label || null,
      medioPagoIcon: medioInfo?.icon || null,
      referencia: m.pago?.referencia || null,
      observaciones: m.pago?.observaciones || null,
      comprobantePagoUrl: m.pago?.comprobantePagoUrl || null,
      comprobantePagoNombre: m.pago?.comprobantePagoNombre || null,

      reciboRecibido: m.pago?.reciboRecibido || false,
      reciboNumero: m.pago?.reciboNumero || null,
      reciboFecha: m.pago?.reciboFecha ? m.pago.reciboFecha.toISOString() : null,
      reciboFechaLegible: m.pago?.reciboFecha ? formatDateAR(m.pago.reciboFecha) : null,
      reciboArchivoUrl: m.pago?.reciboArchivoUrl || null,
      reciboArchivoNombre: m.pago?.reciboArchivoNombre || null,

      transferenciaBanco: m.pago?.transferenciaBanco || null,
      transferenciaOperacion: m.pago?.transferenciaOperacion || null,
      chequeNumero: m.pago?.chequeNumero || null,
      chequeBanco: m.pago?.chequeBanco || null,
      chequeFechaCobro: m.pago?.chequeFechaCobro ? formatDateAR(m.pago.chequeFechaCobro) : null,

      cotizacionesAsociadas,
      usuario: m.usuario?.nombre || m.usuario?.email || "Usuario",
    };
  });

  return {
    proveedor: {
      id: proveedor.id,
      nombre: proveedor.nombre,
      cuit: proveedor.cuit,
      telefono: proveedor.telefono,
      email: proveedor.email,
      direccion: proveedor.direccion,
      observaciones: proveedor.observaciones,
    },
    filtroActivo: filtro,
    desdeStr: desdeDate ? formatYMD_AR(desdeDate) : "",
    hastaStr: hastaDate ? formatYMD_AR(hastaDate) : "",
    rangoTexto,
    saldoAnterior,
    saldoFinal: runningBalance,
    metricasPeriodo: {
      totalDebitos: totalDebitosPeriodo,
      totalCreditos: totalCreditosPeriodo,
      cantidadMovimientos: movimientos.length,
    },
    metricasGlobales: {
      saldoActual: totalesGlobales.saldoActual,
      totalDebitos: totalesGlobales.totalDebitos,
      totalCreditos: totalesGlobales.totalCreditos,
      recibosPendientes: totalesGlobales.recibosPendientes,
    },
    movimientos,
  };
}

export async function getRecibosPendientesDashboard(
  comercioId: string,
  proveedorId?: string
) {
  const recibosDb = await getRecibosPendientesGlobal(comercioId, proveedorId);
  const nowParts = getArgentinaParts(new Date());
  const todayUTC = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);

  let montoTotalPendiente = 0;

  const items = recibosDb.map((p) => {
    const pagoParts = getArgentinaParts(p.fecha);
    const pagoUTC = Date.UTC(pagoParts.year, pagoParts.month - 1, pagoParts.day);
    const diffMs = todayUTC - pagoUTC;
    const diasTranscurridos = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    montoTotalPendiente += p.monto;
    const medioInfo = MEDIO_PAGO_INFO[p.medioPago as TipoMedioPagoProveedor] || MEDIO_PAGO_INFO.OTRO;

    let severidad: "normal" | "alerta" | "critica" = "normal";
    if (diasTranscurridos > 15) {
      severidad = "critica";
    } else if (diasTranscurridos > 7) {
      severidad = "alerta";
    }

    return {
      ...p,
      fechaLegible: formatDateAR(p.fecha),
      diasTranscurridos,
      severidad,
      medioPagoLabel: medioInfo.label,
      medioPagoIcon: medioInfo.icon,
    };
  });

  return {
    items,
    metricas: {
      cantidadTotal: items.length,
      montoTotalPendiente,
    },
  };
}

// Servicios de Mutación
export async function registrarProveedor(comercioId: string, input: ProveedorInput) {
  return await createProveedor(comercioId, input);
}

export async function actualizarProveedor(
  comercioId: string,
  id: string,
  input: ProveedorInput
) {
  return await updateProveedor(comercioId, id, input);
}

export async function registrarCotizacion(
  comercioId: string,
  usuarioId: string,
  input: CotizacionCreateInput
) {
  let fechaParsed = new Date();
  if (input.fecha) {
    const p = parseNoonAR(input.fecha);
    if (p) fechaParsed = p;
  }

  return await createCotizacionTransaccional({
    comercioId,
    proveedorId: input.proveedorId,
    usuarioId,
    fecha: fechaParsed,
    numeroComprobante: input.numeroComprobante,
    montoTotal: input.montoTotal,
    observaciones: input.observaciones,
    archivoUrl: input.archivoUrl,
    archivoNombre: input.archivoNombre,
  });
}

export async function registrarPago(
  comercioId: string,
  usuarioId: string,
  input: PagoCreateInput
) {
  let fechaParsed = new Date();
  if (input.fecha) {
    const p = parseNoonAR(input.fecha);
    if (p) fechaParsed = p;
  }

  let transferenciaFechaParsed: Date | undefined;
  if (input.transferenciaFecha) {
    const p = parseNoonAR(input.transferenciaFecha);
    if (p) transferenciaFechaParsed = p;
  }

  let chequeFechaEmisionParsed: Date | undefined;
  if (input.chequeFechaEmision) {
    const p = parseNoonAR(input.chequeFechaEmision);
    if (p) chequeFechaEmisionParsed = p;
  }

  let chequeFechaCobroParsed: Date | undefined;
  if (input.chequeFechaCobro) {
    const p = parseNoonAR(input.chequeFechaCobro);
    if (p) chequeFechaCobroParsed = p;
  }

  return await createPagoTransaccional({
    comercioId,
    proveedorId: input.proveedorId,
    usuarioId,
    fecha: fechaParsed,
    monto: input.monto,
    medioPago: input.medioPago,
    referencia: input.referencia,
    observaciones: input.observaciones,
    comprobantePagoUrl: input.comprobantePagoUrl,
    comprobantePagoNombre: input.comprobantePagoNombre,
    reciboRecibido: input.reciboRecibido,
    reciboNumero: input.reciboNumero,
    reciboArchivoUrl: input.reciboArchivoUrl,
    reciboArchivoNombre: input.reciboArchivoNombre,
    transferenciaBanco: input.transferenciaBanco,
    transferenciaOperacion: input.transferenciaOperacion,
    transferenciaFecha: transferenciaFechaParsed,
    chequeNumero: input.chequeNumero,
    chequeBanco: input.chequeBanco,
    chequeFechaEmision: chequeFechaEmisionParsed,
    chequeFechaCobro: chequeFechaCobroParsed,
    chequeEstado: input.chequeEstado,
    cotizaciones: input.cotizaciones,
  });
}

export async function toggleRecibo(
  comercioId: string,
  input: ToggleReciboInput
) {
  return await updateReciboEstado(comercioId, input.pagoId, {
    reciboRecibido: input.reciboRecibido,
    reciboNumero: input.reciboNumero,
    reciboFecha: input.reciboRecibido ? new Date() : undefined,
    reciboArchivoUrl: input.reciboArchivoUrl,
    reciboArchivoNombre: input.reciboArchivoNombre,
  });
}

export async function anularMovimiento(
  comercioId: string,
  usuarioId: string,
  input: AnularMovimientoInput
) {
  return await anularMovimientoTransaccional({
    comercioId,
    usuarioId,
    movimientoId: input.movimientoId,
    motivo: input.motivo,
  });
}

export async function getCotizacionesPendientes(
  comercioId: string,
  proveedorId: string
) {
  return await getCotizacionesPendientesByProveedor(comercioId, proveedorId);
}
