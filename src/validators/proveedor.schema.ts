import { z } from "zod";

export const MEDIOS_PAGO_PROVEEDOR = [
  "EFECTIVO",
  "TRANSFERENCIA",
  "CHEQUE",
  "DEBITO",
  "CREDITO",
  "OTRO",
] as const;

export type TipoMedioPagoProveedor = (typeof MEDIOS_PAGO_PROVEEDOR)[number];

export const MEDIO_PAGO_INFO: Record<
  TipoMedioPagoProveedor,
  { label: string; icon: string; color: string }
> = {
  EFECTIVO: { label: "Efectivo", icon: "💵", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  TRANSFERENCIA: { label: "Transferencia Bancaria", icon: "🏦", color: "text-blue-700 bg-blue-50 border-blue-200" },
  CHEQUE: { label: "Cheque", icon: "🧾", color: "text-amber-700 bg-amber-50 border-amber-200" },
  DEBITO: { label: "Tarjeta de Débito", icon: "💳", color: "text-purple-700 bg-purple-50 border-purple-200" },
  CREDITO: { label: "Tarjeta de Crédito", icon: "💳", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  OTRO: { label: "Otro Medio", icon: "📑", color: "text-slate-700 bg-slate-50 border-slate-200" },
};

export const ESTADOS_CHEQUE = ["PENDIENTE", "ACREDITADO", "RECHAZADO"] as const;
export type TipoEstadoCheque = (typeof ESTADOS_CHEQUE)[number];

export const ESTADO_CHEQUE_INFO: Record<
  TipoEstadoCheque,
  { label: string; color: string }
> = {
  PENDIENTE: { label: "Pendiente", color: "text-amber-700 bg-amber-50 border-amber-200" },
  ACREDITADO: { label: "Acreditado", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  RECHAZADO: { label: "Rechazado", color: "text-rose-700 bg-rose-50 border-rose-200" },
};

// Schema Proveedor
export const proveedorSchema = z.object({
  nombre: z.string().min(1, "El nombre del proveedor es obligatorio").max(100),
  cuit: z.string().max(20).optional().or(z.literal("")),
  telefono: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().max(200).optional().or(z.literal("")),
  observaciones: z.string().max(500).optional().or(z.literal("")),
});

export type ProveedorInput = z.infer<typeof proveedorSchema>;

// Schema Registrar Cotización (Débito)
export const cotizacionCreateSchema = z.object({
  proveedorId: z.string().min(1, "Seleccioná un proveedor"),
  fecha: z.string().optional(), // YYYY-MM-DD
  numeroComprobante: z.string().min(1, "Ingresá el número de comprobante o cotización"),
  montoTotal: z.number().positive("El importe debe ser mayor a 0"),
  observaciones: z.string().max(500).optional(),
  archivoUrl: z.string().optional(),
  archivoNombre: z.string().optional(),
});

export type CotizacionCreateInput = z.infer<typeof cotizacionCreateSchema>;

// Schema Imputación de Cotización
export const imputacionCotizacionSchema = z.object({
  cotizacionId: z.string().min(1),
  montoAsignado: z.number().positive(),
});

// Schema Registrar Pago (Crédito)
export const pagoCreateSchema = z.object({
  proveedorId: z.string().min(1, "Seleccioná un proveedor"),
  fecha: z.string().optional(), // YYYY-MM-DD
  monto: z.number().positive("El importe del pago debe ser mayor a 0"),
  medioPago: z.enum(MEDIOS_PAGO_PROVEEDOR),
  referencia: z.string().max(200).optional(),
  observaciones: z.string().max(500).optional(),

  // Comprobante de pago propio (transferencia bancaria, etc.)
  comprobantePagoUrl: z.string().optional(),
  comprobantePagoNombre: z.string().optional(),

  // Control de recibo del proveedor
  reciboRecibido: z.boolean().default(false),
  reciboNumero: z.string().max(100).optional(),
  reciboArchivoUrl: z.string().optional(),
  reciboArchivoNombre: z.string().optional(),

  // Datos de Transferencia
  transferenciaBanco: z.string().max(100).optional(),
  transferenciaOperacion: z.string().max(100).optional(),
  transferenciaFecha: z.string().optional(),

  // Datos de Cheque
  chequeNumero: z.string().max(100).optional(),
  chequeBanco: z.string().max(100).optional(),
  chequeFechaEmision: z.string().optional(),
  chequeFechaCobro: z.string().optional(),
  chequeEstado: z.enum(ESTADOS_CHEQUE).optional(),

  // Cotizaciones imputadas (opcional)
  cotizaciones: z.array(imputacionCotizacionSchema).optional(),
});

export type PagoCreateInput = z.infer<typeof pagoCreateSchema>;

// Schema Marcar Recibo como Recibido
export const toggleReciboSchema = z.object({
  pagoId: z.string().min(1, "ID de pago inválido"),
  reciboRecibido: z.boolean(),
  reciboNumero: z.string().max(100).optional(),
  reciboArchivoUrl: z.string().optional(),
  reciboArchivoNombre: z.string().optional(),
});

export type ToggleReciboInput = z.infer<typeof toggleReciboSchema>;

// Schema Anular Movimiento
export const anularMovimientoSchema = z.object({
  movimientoId: z.string().min(1, "ID de movimiento inválido"),
  motivo: z.string().min(3, "Ingresá un motivo de anulación (mínimo 3 caracteres)").max(300),
});

export type AnularMovimientoInput = z.infer<typeof anularMovimientoSchema>;
