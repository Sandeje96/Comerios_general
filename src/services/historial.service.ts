import {
  startOfDayAR,
  endOfDayAR,
  startOfWeekAR,
  startOfMonthAR,
  parseStartOfDayAR,
  parseEndOfDayAR,
  formatDateTimeAR,
  formatTimeAR,
  formatDateAR,
  formatShortDateAR,
  formatFechaLargaAR,
  formatMesAnioAR,
  formatYMD_AR,
} from "@/lib/date-ar";
import { getVentasHistorial } from "@/repositories/historial.repository";

export type TipoFiltroHistorial = "hoy" | "semana" | "mes" | "custom";

export interface HistorialQueryParams {
  filtro?: string;
  desde?: string;
  hasta?: string;
}

export interface VentaItemHistorial {
  nombre: string;
  codigoInterno: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  esLibre: boolean;
}

export interface VentaHistorialItem {
  id: string;
  numeroComprobante: number | null;
  fechaISO: string;
  fechaLegible: string;
  horaLegible: string;
  cajero: string;
  total: number;
  cantidadArticulos: number;
  items: VentaItemHistorial[];
  snapshotJSON: any;
}

export interface HistorialResponse {
  filtroActivo: TipoFiltroHistorial;
  desdeStr: string;
  hastaStr: string;
  rangoTexto: string;
  metricas: {
    totalRecaudado: number;
    cantidadVentas: number;
    ticketPromedio: number;
    totalArticulosVendidos: number;
  };
  ventas: VentaHistorialItem[];
}

export async function getHistorialData(
  comercioId: string,
  params: HistorialQueryParams
): Promise<HistorialResponse> {
  const now = new Date();

  let filtro: TipoFiltroHistorial = "semana";
  if (
    params.filtro === "hoy" ||
    params.filtro === "semana" ||
    params.filtro === "mes" ||
    params.filtro === "custom"
  ) {
    filtro = params.filtro as TipoFiltroHistorial;
  } else if (params.desde || params.hasta) {
    filtro = "custom";
  }

  let desdeDate: Date;
  let hastaDate: Date;

  if (filtro === "hoy") {
    desdeDate = startOfDayAR(now);
    hastaDate = endOfDayAR(now);
  } else if (filtro === "mes") {
    desdeDate = startOfMonthAR(now);
    hastaDate = endOfDayAR(now);
  } else if (filtro === "custom") {
    if (params.desde) {
      const parsed = parseStartOfDayAR(params.desde);
      desdeDate = parsed ?? startOfWeekAR(now);
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
    // Default: 'semana'
    filtro = "semana";
    desdeDate = startOfWeekAR(now); // Lunes 00:00 hs Argentina
    hastaDate = endOfDayAR(now);
  }

  // Garantizar que desdeDate <= hastaDate
  if (desdeDate > hastaDate) {
    const temp = desdeDate;
    desdeDate = startOfDayAR(hastaDate);
    hastaDate = endOfDayAR(temp);
  }

  const ventasDb = await getVentasHistorial({
    comercioId,
    desde: desdeDate,
    hasta: hastaDate,
  });

  let totalRecaudado = 0;
  let totalArticulosVendidos = 0;

  const ventas: VentaHistorialItem[] = ventasDb.map((venta) => {
    const monto = Number(venta.total);
    totalRecaudado += monto;

    const items: VentaItemHistorial[] = venta.detalles.map((detalle) => {
      const cant = detalle.cantidad;
      totalArticulosVendidos += cant;

      return {
        nombre: detalle.nombreLibre || detalle.producto?.nombre || "Producto",
        codigoInterno: detalle.producto?.codigoInterno || null,
        cantidad: cant,
        precioUnitario: Number(detalle.precioUnitario),
        subtotal: Number(detalle.subtotal),
        esLibre: detalle.productoId === null,
      };
    });

    const cantidadArticulosEnVenta = items.reduce((acc, item) => acc + item.cantidad, 0);

    return {
      id: venta.id,
      numeroComprobante: venta.comprobante?.numeroComprobante ?? null,
      fechaISO: venta.createdAt.toISOString(),
      fechaLegible: formatDateTimeAR(venta.createdAt),
      horaLegible: formatTimeAR(venta.createdAt),
      cajero: venta.usuario?.nombre || venta.usuario?.email || "Cajero",
      total: monto,
      cantidadArticulos: cantidadArticulosEnVenta,
      items,
      snapshotJSON: venta.comprobante?.snapshotJSON ?? null,
    };
  });

  const cantidadVentas = ventas.length;
  const ticketPromedio = cantidadVentas > 0 ? totalRecaudado / cantidadVentas : 0;

  // Etiqueta legible del rango en horario de Argentina
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
      totalRecaudado,
      cantidadVentas,
      ticketPromedio,
      totalArticulosVendidos,
    },
    ventas,
  };
}
