import { ComprobanteSnapshot, ComprobanteItem } from "@/types/pos.types";

const DIAS = [
  "Domingo", "Lunes", "Martes", "Miércoles",
  "Jueves", "Viernes", "Sábado",
];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatDia(date: Date): string {
  const dia = DIAS[date.getDay()];
  const num = date.getDate().toString().padStart(2, "0");
  const mes = MESES[date.getMonth()];
  const anio = date.getFullYear();
  return `${dia} ${num} de ${mes} de ${anio}`;
}

function formatHora(date: Date): string {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

interface BuildSnapshotParams {
  numeroComprobante: number;
  empresa: { nombreFantasia: string; email: string; celular: string | null };
  comitente: { nombre: string; email: string };
  items: ComprobanteItem[];
  total: number;
}

export function buildSnapshotJSON(params: BuildSnapshotParams): ComprobanteSnapshot {
  const now = new Date();

  return {
    numeroComprobante: params.numeroComprobante,
    fecha: now.toISOString(),
    dia: formatDia(now),
    hora: formatHora(now),
    empresa: params.empresa,
    comitente: params.comitente,
    items: params.items,
    total: params.total,
  };
}
