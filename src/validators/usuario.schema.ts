import { z } from "zod";

export const usuarioCreateSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Debe ser un correo electrónico válido").trim().toLowerCase(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol: z.enum(["CAJERO", "ADMIN"], {
    invalid_type_error: "Rol inválido",
    required_error: "El rol es obligatorio",
  }),
});

export const usuarioUpdateSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  rol: z.enum(["CAJERO", "ADMIN"]),
});

export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;
export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>;
