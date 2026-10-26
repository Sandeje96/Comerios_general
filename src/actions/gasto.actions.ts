"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { registrarGasto, eliminarGasto } from "@/services/gasto.service";
import { gastoCreateSchema, GastoCreateInput } from "@/validators/gasto.schema";

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.comercioId || !session?.user?.id) {
    throw new Error("No autenticado. Por favor iniciá sesión.");
  }
  return session;
}

export async function createGastoAction(data: GastoCreateInput) {
  try {
    const session = await getSessionOrThrow();
    const validated = gastoCreateSchema.parse(data);

    await registrarGasto(session.user.comercioId, session.user.id, validated);

    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al registrar el gasto",
    };
  }
}

export async function deleteGastoAction(id: string) {
  try {
    const session = await getSessionOrThrow();
    await eliminarGasto(session.user.comercioId, id);

    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al eliminar el gasto",
    };
  }
}
