import { z } from "zod";

export const ventaItemSchema = z.object({
  productoId: z.string().uuid({ message: "ID de producto inválido" }),
  cantidad: z
    .number()
    .int({ message: "La cantidad debe ser un número entero" })
    .min(1, { message: "La cantidad mínima es 1" })
    .max(9999, { message: "La cantidad máxima es 9999" }),
});

export const ventaPayloadSchema = z.object({
  items: z
    .array(ventaItemSchema)
    .min(1, { message: "El carrito debe tener al menos un producto" })
    .max(100, { message: "El carrito no puede tener más de 100 ítems distintos" }),
});

export const busquedaProductoSchema = z.object({
  query: z
    .string()
    .min(1, { message: "Ingresá al menos 1 caracter" })
    .max(100, { message: "Búsqueda demasiado larga" })
    .trim(),
});

export type VentaPayloadInput = z.infer<typeof ventaPayloadSchema>;
export type BusquedaProductoInput = z.infer<typeof busquedaProductoSchema>;
