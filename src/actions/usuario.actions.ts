"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { registrarNuevoUsuario } from "../services/usuario.service";
import { toggleActivoUsuario } from "../repositories/usuario.repository";
import { usuarioCreateSchema, UsuarioCreateInput } from "../validators/usuario.schema";

async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.comercioId || session.user.rol !== "ADMIN") {
    throw new Error("Permisos insuficientes. Solo un administrador puede realizar esta acción.");
  }
  return session;
}

export async function createUsuarioAction(data: UsuarioCreateInput) {
  try {
    const session = await getAdminSession();
    const validated = usuarioCreateSchema.parse(data);
    
    await registrarNuevoUsuario(session.user.comercioId, validated);
    
    revalidatePath("/usuarios");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear el usuario" };
  }
}

export async function toggleActivoUsuarioAction(id: string, activo: boolean) {
  try {
    const session = await getAdminSession();
    
    // Un admin no puede desactivarse a sí mismo
    if (session.user.id === id && !activo) {
      return { success: false, error: "No puedes desactivar tu propia cuenta" };
    }

    await toggleActivoUsuario(session.user.comercioId, id, activo);
    
    revalidatePath("/usuarios");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al cambiar estado" };
  }
}
