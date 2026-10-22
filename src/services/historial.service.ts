import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  format,
  isValid,
} from "date-fns";
import { es } from "date-fns/locale";
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
  if (params.filtro === "hoy" || params.filtro === "semana" || params.filtro === "mes" || params.filtro === "custom") {
    filtro = params.filtro as TipoFiltroHistorial;
  } else if (params.desde || params.hasta) {
    filtro = "custom";
  }

  let desdeDate: Date;
  let hastaDate: Date;

  if (filtro === "hoy") {
    desdeDate = startOfDay(now);
    hastaDate = endOfDay(now);
  } else if (filtro === "mes") {
    desdeDate = startOfMonth(now);
    hastaDate = endOfDay(now);
  } else if (filtro === "custom") {
    if (params.desde) {
      const parsed = new Date(params.desde + "T00:00:00");
      desdeDate = isValid(parsed) ? startOfDay(parsed) : startOfWeek(now, { weekStartsOn: 1 });
    } else {
      desdeDate = startOfMonth(now);
    }

    if (params.hasta) {
      const parsed = new Date(params.hasta + "T23:59:59.999");
      hastaDate = isValid(parsed) ? endOfDay(parsed) : endOfDay(now);
    } else {
      hastaDate = endOfDay(now);
    }
  } else {
    // Default: 'semana'
    filtro = "semana";
    desdeDate = startOfWeek(now, { weekStartsOn: 1 }); // Lunes
    hastaDate = endOfDay(now);
  }

  // Garantizar que desdeDate <= hastaDate
  if (desdeDate > hastaDate) {
    const temp = desdeDate;
    desdeDate = startOfDay(hastaDate);
    hastaDate = endOfDay(temp);
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
      fechaLegible: format(venta.createdAt, "dd/MM/yyyy HH:mm", { locale: es }),
      horaLegible: format(venta.createdAt, "HH:mm", { locale: es }),
      cajero: venta.usuario?.nombre || venta.usuario?.email || "Cajero",
      total: monto,
      cantidadArticulos: cantidadArticulosEnVenta,
      items,
      snapshotJSON: venta.comprobante?.snapshotJSON ?? null,
    };
  });

  const cantidadVentas = ventas.length;
  const ticketPromedio = cantidadVentas > 0 ? totalRecaudado / cantidadVentas : 0;

  // Etiqueta legible del rango
  let rangoTexto = "";
  if (filtro === "hoy") {
    rangoTexto = `Hoy (${format(desdeDate, "dd 'de' MMMM yyyy", { locale: es })})`;
  } else if (filtro === "semana") {
    rangoTexto = `Esta semana (${format(desdeDate, "dd/MM")} al ${format(hastaDate, "dd/MM/yyyy")})`;
  } else if (filtro === "mes") {
    rangoTexto = `Este mes (${format(desdeDate, "MMMM yyyy", { locale: es })})`;
  } else {
    rangoTexto = `Del ${format(desdeDate, "dd/MM/yyyy")} al ${format(hastaDate, "dd/MM/yyyy")}`;
  }

  return {
    filtroActivo: filtro,
    desdeStr: format(desdeDate, "yyyy-MM-dd"),
    hastaStr: format(hastaDate, "yyyy-MM-dd"),
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
