"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { registrarNuevoProducto, modificarProducto } from "../services/producto.service";
import { deleteProductoSoft } from "../repositories/producto-crud.repository";
import { productoCreateSchema, productoUpdateSchema, ProductoCreateInput, ProductoUpdateInput } from "../validators/producto.schema";

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.comercioId || !session?.user?.id) {
    throw new Error("No autenticado");
  }
  return session;
}

export async function createProductoAction(data: ProductoCreateInput) {
  try {
    const session = await getSessionOrThrow();
    const validated = productoCreateSchema.parse(data);
    
    await registrarNuevoProducto(session.user.comercioId, session.user.id, validated);
    
    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear el producto" };
  }
}

export async function updateProductoAction(id: string, data: ProductoUpdateInput) {
  try {
    const session = await getSessionOrThrow();
    const validated = productoUpdateSchema.parse(data);
    
    await modificarProducto(session.user.comercioId, id, validated, session.user.id);
    
    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar el producto" };
  }
}

export async function deleteProductoAction(id: string) {
  try {
    const session = await getSessionOrThrow();
    await deleteProductoSoft(session.user.comercioId, id);
    
    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar el producto" };
  }
}
