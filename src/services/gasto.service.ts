import {
  startOfDayAR,
  endOfDayAR,
  startOfWeekAR,
  startOfMonthAR,
  parseStartOfDayAR,
  parseEndOfDayAR,
  parseNoonAR,
  formatDateAR,
  formatShortDateAR,
  formatFechaLargaAR,
  formatMesAnioAR,
  formatYMD_AR,
} from "@/lib/date-ar";
import {
  getGastosByRango,
  getVentasTotalByRango,
  createGasto,
  deleteGasto,
  CreateGastoParams,
} from "@/repositories/gasto.repository";
import {
  TipoCategoriaGasto,
  CATEGORIAS_GASTO,
  CATEGORIA_INFO,
  GastoCreateInput,
} from "@/validators/gasto.schema";

export type TipoFiltroGastos = "mes" | "semana" | "hoy" | "custom";

export interface GastosQueryParams {
  filtro?: string;
  desde?: string;
  hasta?: string;
}

export interface GastoItemResponse {
  id: string;
  categoria: TipoCategoriaGasto;
  categoriaLabel: string;
  categoriaIcon: string;
  categoriaColor: string;
  descripcion: string;
  monto: number;
  fechaISO: string;
  fechaLegible: string;
  metodoPago: string | null;
  comprobante: string | null;
  usuario: string;
}

export interface DesgloseCategoria {
  categoria: TipoCategoriaGasto;
  label: string;
  icon: string;
  color: string;
  total: number;
  porcentaje: number;
  cantidad: number;
}

export interface GastosDashboardResponse {
  filtroActivo: TipoFiltroGastos;
  desdeStr: string;
  hastaStr: string;
  rangoTexto: string;
  metricas: {
    totalGastos: number;
    totalVentas: number;
    balanceNeto: number; // Ventas - Gastos
    margenPorcentaje: number; // Rentabilidad %
    cantidadGastos: number;
    cantidadVentas: number;
  };
  desgloseCategorias: DesgloseCategoria[];
  gastos: GastoItemResponse[];
}

export async function getGastosDashboardData(
  comercioId: string,
  params: GastosQueryParams
): Promise<GastosDashboardResponse> {
  const now = new Date();

  let filtro: TipoFiltroGastos = "mes";
  if (
    params.filtro === "hoy" ||
    params.filtro === "semana" ||
    params.filtro === "mes" ||
    params.filtro === "custom"
  ) {
    filtro = params.filtro as TipoFiltroGastos;
  } else if (params.desde || params.hasta) {
    filtro = "custom";
  }

  let desdeDate: Date;
  let hastaDate: Date;

  if (filtro === "hoy") {
    desdeDate = startOfDayAR(now);
    hastaDate = endOfDayAR(now);
  } else if (filtro === "semana") {
    desdeDate = startOfWeekAR(now);
    hastaDate = endOfDayAR(now);
  } else if (filtro === "custom") {
    if (params.desde) {
      const parsed = parseStartOfDayAR(params.desde);
      desdeDate = parsed ?? startOfMonthAR(now);
    } else {
      desdeDate = startOfMonthAR(now);
    }

    if (params.hasta) {
      const parsed = parseEndOfDayAR(params.hasta);
      hastaDate = parsed ?? endOfDayAR(now);
    } else {
      hastaDate = endOfDayAR(now);
    }
  } else {
    // Default para gastos: "mes"
    filtro = "mes";
    desdeDate = startOfMonthAR(now);
    hastaDate = endOfDayAR(now);
  }

  if (desdeDate > hastaDate) {
    const temp = desdeDate;
    desdeDate = startOfDayAR(hastaDate);
    hastaDate = endOfDayAR(temp);
  }

  // Traer gastos y ventas en paralelo
  const [gastosDb, ventasInfo] = await Promise.all([
    getGastosByRango(comercioId, desdeDate, hastaDate),
    getVentasTotalByRango(comercioId, desdeDate, hastaDate),
  ]);

  let totalGastos = 0;
  const desgloseMap: Record<
    TipoCategoriaGasto,
    { total: number; cantidad: number }
  > = {
    PROVEEDORES: { total: 0, cantidad: 0 },
    ALQUILER: { total: 0, cantidad: 0 },
    SERVICIOS: { total: 0, cantidad: 0 },
    INTERNET_TELEFONIA: { total: 0, cantidad: 0 },
    SUELDOS: { total: 0, cantidad: 0 },
    MANTENIMIENTO: { total: 0, cantidad: 0 },
    IMPUESTOS: { total: 0, cantidad: 0 },
    OTROS: { total: 0, cantidad: 0 },
  };

  const gastos: GastoItemResponse[] = gastosDb.map((g) => {
    const monto = Number(g.monto);
    totalGastos += monto;

    const cat = g.categoria as TipoCategoriaGasto;
    if (desgloseMap[cat]) {
      desgloseMap[cat].total += monto;
      desgloseMap[cat].cantidad += 1;
    }

    const info = CATEGORIA_INFO[cat] || CATEGORIA_INFO.OTROS;

    return {
      id: g.id,
      categoria: cat,
      categoriaLabel: info.label,
      categoriaIcon: info.icon,
      categoriaColor: info.color,
      descripcion: g.descripcion,
      monto,
      fechaISO: g.fecha.toISOString(),
      fechaLegible: formatDateAR(g.fecha),
      metodoPago: g.metodoPago,
      comprobante: g.comprobante,
      usuario: g.usuario?.nombre || g.usuario?.email || "Cajero",
    };
  });

  // Calcular desglose de categorías ordenadas por monto descendente
  const desgloseCategorias: DesgloseCategoria[] = CATEGORIAS_GASTO.map(
    (cat) => {
      const data = desgloseMap[cat];
      const info = CATEGORIA_INFO[cat];
      const pct = totalGastos > 0 ? (data.total / totalGastos) * 100 : 0;
      return {
        categoria: cat,
        label: info.label,
        icon: info.icon,
        color: info.color,
        total: data.total,
        porcentaje: Math.round(pct * 10) / 10,
        cantidad: data.cantidad,
      };
    }
  )
    .filter((c) => c.cantidad > 0)
    .sort((a, b) => b.total - a.total);

  const totalVentas = ventasInfo.totalVentas;
  const balanceNeto = totalVentas - totalGastos;
  const margenPorcentaje =
    totalVentas > 0
      ? Math.round(((totalVentas - totalGastos) / totalVentas) * 1000) / 10
      : 0;

  // Texto del rango en horario de Argentina
  let rangoTexto = "";
  if (filtro === "hoy") {
    rangoTexto = `Hoy (${formatFechaLargaAR(desdeDate)})`;
  } else if (filtro === "semana") {
    rangoTexto = `Esta semana (${formatShortDateAR(desdeDate)} al ${formatDateAR(hastaDate)})`;
  } else if (filtro === "mes") {
    rangoTexto = `Este mes (${formatMesAnioAR(desdeDate)})`;
  } else {
    rangoTexto = `Del ${formatDateAR(desdeDate)} al ${formatDateAR(hastaDate)}`;
  }

  return {
    filtroActivo: filtro,
    desdeStr: formatYMD_AR(desdeDate),
    hastaStr: formatYMD_AR(hastaDate),
    rangoTexto,
    metricas: {
      totalGastos,
      totalVentas,
      balanceNeto,
      margenPorcentaje,
      cantidadGastos: gastos.length,
      cantidadVentas: ventasInfo.cantidadVentas,
    },
    desgloseCategorias,
    gastos,
  };
}

export async function registrarGasto(
  comercioId: string,
  usuarioId: string | undefined,
  input: GastoCreateInput
) {
  let fechaParsed: Date | undefined = undefined;
  if (input.fecha) {
    const p = parseNoonAR(input.fecha);
    if (p) fechaParsed = p;
  }

  const params: CreateGastoParams = {
    comercioId,
    usuarioId,
    categoria: input.categoria,
    descripcion: input.descripcion.trim(),
    monto: input.monto,
    fecha: fechaParsed,
    metodoPago: input.metodoPago?.trim() || undefined,
    comprobante: input.comprobante?.trim() || undefined,
  };

  return await createGasto(params);
}

export async function eliminarGasto(comercioId: string, id: string) {
  return await deleteGasto(comercioId, id);
}
