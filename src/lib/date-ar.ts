/**
 * Utilidades de fecha y hora fijadas a la zona horaria de Argentina
 * (America/Argentina/Buenos_Aires, UTC-03:00 permanente).
 *
 * Garantiza que tanto en servidores en la nube (Vercel, Render, Railway, Docker en UTC)
 * como en el navegador del cliente, los cortes de día ("Hoy", "Esta semana", "Este mes",
 * filtros personalizados) y los formatos visibles usen siempre el horario de Argentina.
 */

export const ARGENTINA_TZ = "America/Argentina/Buenos_Aires";
export const ARGENTINA_OFFSET = "-03:00";

const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const MESES_LARGO = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MESES_MINUS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

export interface ArgentinaDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
  ymd: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 (Dom) - 6 (Sáb)
}

const arFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ARGENTINA_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/**
 * Extrae las partes de fecha y hora en horario de Argentina (UTC-3)
 * para cualquier instante `Date`.
 */
export function getArgentinaParts(date: Date | string | number = new Date()): ArgentinaDateParts {
  const d = toDate(date);
  const parts = arFormatter.formatToParts(d);

  let year = 1970;
  let month = 1;
  let day = 1;
  let hour = 0;
  let minute = 0;
  let second = 0;

  for (const p of parts) {
    switch (p.type) {
      case "year":
        year = Number(p.value);
        break;
      case "month":
        month = Number(p.value);
        break;
      case "day":
        day = Number(p.value);
        break;
      case "hour":
        hour = Number(p.value);
        if (hour === 24) hour = 0;
        break;
      case "minute":
        minute = Number(p.value);
        break;
      case "second":
        second = Number(p.value);
        break;
    }
  }

  const ymd = `${year}-${pad2(month)}-${pad2(day)}`;
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return { year, month, day, hour, minute, second, ymd, dayOfWeek };
}

/**
 * Inicio del día en Argentina (00:00:00.000-03:00 -> 03:00:00.000Z).
 */
export function startOfDayAR(date: Date | string | number = new Date()): Date {
  const { ymd } = getArgentinaParts(date);
  return new Date(`${ymd}T00:00:00.000${ARGENTINA_OFFSET}`);
}

/**
 * Fin del día en Argentina (23:59:59.999-03:00 -> 02:59:59.999Z del día siguiente UTC).
 */
export function endOfDayAR(date: Date | string | number = new Date()): Date {
  const { ymd } = getArgentinaParts(date);
  return new Date(`${ymd}T23:59:59.999${ARGENTINA_OFFSET}`);
}

/**
 * Inicio de la semana en Argentina (Lunes 00:00:00.000-03:00).
 */
export function startOfWeekAR(date: Date | string | number = new Date()): Date {
  const { year, month, day, dayOfWeek } = getArgentinaParts(date);
  // Lunes = 1 ... Domingo = 0 (retrocede 6 días si es domingo)
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayUTC = new Date(Date.UTC(year, month - 1, day - diffToMonday));
  const y = mondayUTC.getUTCFullYear();
  const m = pad2(mondayUTC.getUTCMonth() + 1);
  const d = pad2(mondayUTC.getUTCDate());
  return new Date(`${y}-${m}-${d}T00:00:00.000${ARGENTINA_OFFSET}`);
}

/**
 * Inicio del mes en Argentina (Día 01 a las 00:00:00.000-03:00).
 */
export function startOfMonthAR(date: Date | string | number = new Date()): Date {
  const { year, month } = getArgentinaParts(date);
  return new Date(`${year}-${pad2(month)}-01T00:00:00.000${ARGENTINA_OFFSET}`);
}

/**
 * Parsea un string "YYYY-MM-DD" como el inicio de ese día en Argentina (00:00:00.000-03:00).
 */
export function parseStartOfDayAR(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T00:00:00.000${ARGENTINA_OFFSET}`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parsea un string "YYYY-MM-DD" como el fin de ese día en Argentina (23:59:59.999-03:00).
 */
export function parseEndOfDayAR(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T23:59:59.999${ARGENTINA_OFFSET}`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parsea un string "YYYY-MM-DD" al mediodía de Argentina (12:00:00.000-03:00),
 * ideal para guardar fechas de gastos sin riesgo de desfase de día.
 */
export function parseNoonAR(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T12:00:00.000${ARGENTINA_OFFSET}`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Devuelve "YYYY-MM-DD" en zona horaria de Argentina.
 */
export function formatYMD_AR(date: Date | string | number = new Date()): string {
  return getArgentinaParts(date).ymd;
}

/**
 * Devuelve "dd/MM/yyyy" en zona horaria de Argentina.
 */
export function formatDateAR(date: Date | string | number = new Date()): string {
  const { day, month, year } = getArgentinaParts(date);
  return `${pad2(day)}/${pad2(month)}/${year}`;
}

/**
 * Devuelve "dd/MM" en zona horaria de Argentina.
 */
export function formatShortDateAR(date: Date | string | number = new Date()): string {
  const { day, month } = getArgentinaParts(date);
  return `${pad2(day)}/${pad2(month)}`;
}

/**
 * Devuelve "HH:mm" (24 hs) en zona horaria de Argentina.
 */
export function formatTimeAR(date: Date | string | number = new Date()): string {
  const { hour, minute } = getArgentinaParts(date);
  return `${pad2(hour)}:${pad2(minute)}`;
}

/**
 * Devuelve "dd/MM/yyyy HH:mm" en zona horaria de Argentina.
 */
export function formatDateTimeAR(date: Date | string | number = new Date()): string {
  const { day, month, year, hour, minute } = getArgentinaParts(date);
  return `${pad2(day)}/${pad2(month)}/${year} ${pad2(hour)}:${pad2(minute)}`;
}

/**
 * Devuelve "Lunes 27 de Octubre de 2026" en zona horaria de Argentina (para comprobantes).
 */
export function formatDiaComprobanteAR(date: Date | string | number = new Date()): string {
  const { day, month, year, dayOfWeek } = getArgentinaParts(date);
  const nombreDia = DIAS_SEMANA[dayOfWeek];
  const nombreMes = MESES_LARGO[month - 1];
  return `${nombreDia} ${pad2(day)} de ${nombreMes} de ${year}`;
}

/**
 * Devuelve "27 de octubre 2026" en zona horaria de Argentina.
 */
export function formatFechaLargaAR(date: Date | string | number = new Date()): string {
  const { day, month, year } = getArgentinaParts(date);
  return `${pad2(day)} de ${MESES_MINUS[month - 1]} ${year}`;
}

/**
 * Devuelve "octubre 2026" en zona horaria de Argentina.
 */
export function formatMesAnioAR(date: Date | string | number = new Date()): string {
  const { month, year } = getArgentinaParts(date);
  return `${MESES_MINUS[month - 1]} ${year}`;
}

/**
 * Formatea fecha/hora amigable para la tabla "Últimas Ventas" del Dashboard en Argentina:
 * - Si es de hoy en Argentina: "Hoy 18:30 hs"
 * - Si es de ayer en Argentina: "Ayer 18:30 hs"
 * - Si es anterior: "25/10 18:30 hs"
 */
export function formatUltimaVentaAR(
  date: Date | string | number,
  now: Date = new Date()
): string {
  const ventaParts = getArgentinaParts(date);
  const hoyParts = getArgentinaParts(now);
  const ayerDate = new Date(Date.UTC(hoyParts.year, hoyParts.month - 1, hoyParts.day - 1));
  const ayerYmd = `${ayerDate.getUTCFullYear()}-${pad2(ayerDate.getUTCMonth() + 1)}-${pad2(ayerDate.getUTCDate())}`;

  const horaStr = `${pad2(ventaParts.hour)}:${pad2(ventaParts.minute)} hs`;

  if (ventaParts.ymd === hoyParts.ymd) {
    return `Hoy ${horaStr}`;
  }
  if (ventaParts.ymd === ayerYmd) {
    return `Ayer ${horaStr}`;
  }
  return `${pad2(ventaParts.day)}/${pad2(ventaParts.month)} ${horaStr}`;
}
