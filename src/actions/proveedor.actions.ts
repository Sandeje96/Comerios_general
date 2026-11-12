"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  registrarProveedor,
  actualizarProveedor,
  registrarCotizacion,
  registrarPago,
  toggleRecibo,
  anularMovimiento,
  eliminarMovimiento,
  getCotizacionesPendientes,
} from "@/services/proveedor.service";
import {
  proveedorSchema,
  cotizacionCreateSchema,
  pagoCreateSchema,
  toggleReciboSchema,
  anularMovimientoSchema,
  ProveedorInput,
  CotizacionCreateInput,
  PagoCreateInput,
  ToggleReciboInput,
  AnularMovimientoInput,
} from "@/validators/proveedor.schema";

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.comercioId || !session?.user?.id) {
    throw new Error("No autenticado. Por favor iniciá sesión.");
  }
  return session;
}

export async function createProveedorAction(data: ProveedorInput) {
  try {
    const session = await getSessionOrThrow();
    const validated = proveedorSchema.parse(data);

    const proveedor = await registrarProveedor(session.user.comercioId, validated);

    revalidatePath("/proveedores");
    return { success: true, proveedorId: proveedor.id };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al crear el proveedor",
    };
  }
}

export async function updateProveedorAction(id: string, data: ProveedorInput) {
  try {
    const session = await getSessionOrThrow();
    const validated = proveedorSchema.parse(data);

    await actualizarProveedor(session.user.comercioId, id, validated);

    revalidatePath("/proveedores");
    revalidatePath(`/proveedores/${id}`);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al actualizar el proveedor",
    };
  }
}

export async function createCotizacionAction(data: CotizacionCreateInput) {
  try {
    const session = await getSessionOrThrow();
    const validated = cotizacionCreateSchema.parse(data);

    await registrarCotizacion(
      session.user.comercioId,
      session.user.id,
      validated
    );

    revalidatePath("/proveedores");
    revalidatePath(`/proveedores/${validated.proveedorId}`);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al registrar la cotización",
    };
  }
}

export async function createPagoAction(data: PagoCreateInput) {
  try {
    const session = await getSessionOrThrow();
    const validated = pagoCreateSchema.parse(data);

    await registrarPago(session.user.comercioId, session.user.id, validated);

    revalidatePath("/proveedores");
    revalidatePath(`/proveedores/${validated.proveedorId}`);
    revalidatePath("/proveedores/recibos-pendientes");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al registrar el pago",
    };
  }
}

export async function toggleReciboAction(
  data: ToggleReciboInput,
  proveedorId?: string
) {
  try {
    const session = await getSessionOrThrow();
    const validated = toggleReciboSchema.parse(data);

    await toggleRecibo(session.user.comercioId, validated);

    revalidatePath("/proveedores");
    if (proveedorId) {
      revalidatePath(`/proveedores/${proveedorId}`);
    }
    revalidatePath("/proveedores/recibos-pendientes");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al actualizar el estado del recibo",
    };
  }
}

export async function anularMovimientoAction(
  data: AnularMovimientoInput,
  proveedorId?: string
) {
  try {
    const session = await getSessionOrThrow();
    const validated = anularMovimientoSchema.parse(data);

    await anularMovimiento(session.user.comercioId, session.user.id, validated);

    revalidatePath("/proveedores");
    if (proveedorId) {
      revalidatePath(`/proveedores/${proveedorId}`);
    }
    revalidatePath("/proveedores/recibos-pendientes");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al anular el movimiento",
    };
  }
}

export async function getCotizacionesPendientesAction(proveedorId: string) {
  try {
    const session = await getSessionOrThrow();
    const cotizaciones = await getCotizacionesPendientes(
      session.user.comercioId,
      proveedorId
    );
    return { success: true, cotizaciones };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al cargar cotizaciones pendientes",
      cotizaciones: [],
    };
  }
}

export async function deleteMovimientoAction(
  movimientoId: string,
  proveedorId?: string
) {
  try {
    const session = await getSessionOrThrow();
    await eliminarMovimiento(session.user.comercioId, movimientoId);

    revalidatePath("/proveedores");
    if (proveedorId) {
      revalidatePath(`/proveedores/${proveedorId}`);
    }
    revalidatePath("/proveedores/recibos-pendientes");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al eliminar el movimiento",
    };
  }
}

