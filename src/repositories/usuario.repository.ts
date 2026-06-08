import prisma from "./prisma";
import { Prisma } from "@prisma/client";

export async function getUsuariosByComercio(comercioId: string) {
  return prisma.usuario.findMany({
    where: { comercioId },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUsuario(data: Prisma.UsuarioUncheckedCreateInput) {
  return prisma.usuario.create({
    data,
    select: { id: true, nombre: true, email: true, rol: true },
  });
}

export async function toggleActivoUsuario(comercioId: string, id: string, activo: boolean) {
  return prisma.usuario.update({
    where: { id, comercioId },
    data: { activo },
  });
}

export async function findUsuarioByEmail(email: string) {
  return prisma.usuario.findUnique({
    where: { email },
    select: { id: true },
  });
}
