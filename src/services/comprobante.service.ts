import { ComprobanteSnapshot, ComprobanteItem } from "@/types/pos.types";
import { formatDiaComprobanteAR, formatTimeAR } from "@/lib/date-ar";

interface BuildSnapshotParams {
  numeroComprobante: number;
  empresa: { nombreFantasia: string; email: string; celular: string | null };
  comitente: { nombre: string; email: string };
  items: ComprobanteItem[];
  total: number;
  fecha?: Date;
}

export function buildSnapshotJSON(params: BuildSnapshotParams): ComprobanteSnapshot {
  const now = params.fecha ?? new Date();

  return {
    numeroComprobante: params.numeroComprobante,
    fecha: now.toISOString(),
    dia: formatDiaComprobanteAR(now),
    hora: formatTimeAR(now),
    empresa: params.empresa,
    comitente: params.comitente,
    items: params.items,
    total: params.total,
  };
}
