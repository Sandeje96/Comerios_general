import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export const registerSchema = z.object({
  nombreResponsable: z.string().min(2, { message: "Requerido" }),
  apellidoResponsable: z.string().min(2, { message: "Requerido" }),
  nombreFantasia: z.string().min(2, { message: "Requerido" }),
  celular: z.string().optional(),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
