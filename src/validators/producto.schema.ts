import { z } from "zod";

export const productoCreateSchema = z.object({
  codigoInterno: z.string().min(1, "El código es obligatorio").max(50),
  codigoBarras: z.string().max(50).optional().or(z.literal('')),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  descripcion: z.string().max(255).optional().or(z.literal('')),
  precioCosto: z.coerce.number().min(0, "El costo no puede ser negativo"),
  precioVenta: z.coerce.number().min(0, "El precio de venta no puede ser negativo"),
  stockInicial: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
});

export const productoUpdateSchema = z.object({
  codigoInterno: z.string().min(1, "El código es obligatorio").max(50),
  codigoBarras: z.string().max(50).optional().or(z.literal('')),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  descripcion: z.string().max(255).optional().or(z.literal('')),
  precioCosto: z.coerce.number().min(0, "El costo no puede ser negativo"),
  precioVenta: z.coerce.number().min(0, "El precio de venta no puede ser negativo"),
  stockActual: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
});

export type ProductoCreateInput = z.infer<typeof productoCreateSchema>;
export type ProductoUpdateInput = z.infer<typeof productoUpdateSchema>;
