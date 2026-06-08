"use server";

import { signIn, signOut } from "@/lib/auth";
import { registerComercio } from "@/services/auth.service";
import { loginSchema, registerSchema, LoginInput, RegisterInput } from "@/validators/auth.schema";
import { AuthError } from "next-auth";

export async function loginAction(data: LoginInput) {
  try {
    const validated = loginSchema.parse(data);
    
    await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirect: false,
    });
    
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Credenciales inválidas." };
        default:
          return { error: "Error al iniciar sesión." };
      }
    }
    return { error: "Ocurrió un error inesperado." };
  }
}

export async function registerAction(data: RegisterInput) {
  try {
    const validated = registerSchema.parse(data);
    await registerComercio(validated);
    
    // Auto login después del registro
    await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirect: false,
    });
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Error al registrar el comercio" };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
