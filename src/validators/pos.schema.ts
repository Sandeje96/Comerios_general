import { z } from "zod";

export const ventaItemSchema = z.object({
  productoId: z.string().uuid({ message: "ID de producto inválido" }),
  cantidad: z
    .number()
    .int({ message: "La cantidad debe ser un número entero" })
    .min(1, { message: "La cantidad mínima es 1" })
    .max(9999, { message: "La cantidad máxima es 9999" }),
});

export const ventaItemLibreSchema = z.object({
  nombre: z
    .string()
    .min(1, { message: "El nombre del producto es obligatorio" })
    .max(200, { message: "El nombre no puede superar 200 caracteres" })
    .trim(),
  precioUnitario: z
    .number()
    .positive({ message: "El precio debe ser mayor a cero" })
    .max(99999999, { message: "Precio demasiado alto" }),
  cantidad: z
    .number()
    .int({ message: "La cantidad debe ser un número entero" })
    .min(1, { message: "La cantidad mínima es 1" })
    .max(9999, { message: "La cantidad máxima es 9999" }),
});

export const ventaPayloadSchema = z.object({
  items: z
    .array(ventaItemSchema)
    .max(100, { message: "El carrito no puede tener más de 100 ítems distintos" }),
  itemsLibres: z
    .array(ventaItemLibreSchema)
    .max(100, { message: "No se pueden agregar más de 100 ítems libres" })
    .optional(),
}).refine(
  (data) => (data.items.length + (data.itemsLibres?.length ?? 0)) >= 1,
  { message: "El carrito debe tener al menos un producto" }
);

export const busquedaProductoSchema = z.object({
  query: z
    .string()
    .min(1, { message: "Ingresá al menos 1 caracter" })
    .max(100, { message: "Búsqueda demasiado larga" })
    .trim(),
});

export type VentaPayloadInput = z.infer<typeof ventaPayloadSchema>;
export type BusquedaProductoInput = z.infer<typeof busquedaProductoSchema>;
