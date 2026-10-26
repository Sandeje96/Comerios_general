import { z } from "zod";

export const CATEGORIAS_GASTO = [
  "PROVEEDORES",
  "ALQUILER",
  "SERVICIOS",
  "INTERNET_TELEFONIA",
  "SUELDOS",
  "MANTENIMIENTO",
  "IMPUESTOS",
  "OTROS",
] as const;

export type TipoCategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

export const CATEGORIA_INFO: Record<
  TipoCategoriaGasto,
  { label: string; icon: string; color: string }
> = {
  PROVEEDORES: {
    label: "Pago a Proveedores",
    icon: "📦",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ALQUILER: {
    label: "Alquiler de Local",
    icon: "🏢",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  SERVICIOS: {
    label: "Boletas y Servicios (Luz/Agua/Gas)",
    icon: "💡",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  INTERNET_TELEFONIA: {
    label: "Internet y Telefonía",
    icon: "🌐",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  SUELDOS: {
    label: "Sueldos / Personal",
    icon: "👥",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  MANTENIMIENTO: {
    label: "Mantenimiento y Reparaciones",
    icon: "🔧",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  IMPUESTOS: {
    label: "Impuestos y Tasas",
    icon: "📑",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  OTROS: {
    label: "Otros Gastos",
    icon: "📌",
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

export const METODOS_PAGO = [
  "Efectivo",
  "Transferencia",
  "Débito",
  "Tarjeta de Crédito",
  "Mercado Pago",
  "Cheque",
  "Otro",
] as const;

export const gastoCreateSchema = z.object({
  categoria: z.enum(CATEGORIAS_GASTO, {
    error: "Seleccioná una categoría válida",
  }),
  descripcion: z
    .string()
    .min(2, "La descripción debe tener al menos 2 caracteres")
    .max(200, "La descripción es demasiado larga"),
  monto: z.coerce
    .number()
    .positive("El monto debe ser mayor a 0")
    .max(99999999.99, "El monto es excesivo"),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido")
    .optional(),
  metodoPago: z.string().max(50).optional(),
  comprobante: z.string().max(100).optional(),
});

export type GastoCreateInput = z.infer<typeof gastoCreateSchema>;
