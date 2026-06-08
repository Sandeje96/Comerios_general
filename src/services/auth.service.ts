import prisma from "@/repositories/prisma";
import bcrypt from "bcrypt";
import { RegisterInput } from "@/validators/auth.schema";

export async function registerComercio(data: RegisterInput) {
  const { nombreResponsable, apellidoResponsable, nombreFantasia, celular, email, password } = data;

  // 1. Verificar si el email ya existe
  const existingUser = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("El email ya está en uso");
  }

  // 2. Hashear la contraseña
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Transacción para crear el Comercio y el Usuario ADMIN inicial
  const result = await prisma.$transaction(async (tx) => {
    const comercio = await tx.comercio.create({
      data: {
        nombreFantasia,
        nombreResponsable,
        apellidoResponsable,
        celular,
        email,
      },
    });

    const usuario = await tx.usuario.create({
      data: {
        comercioId: comercio.id,
        email,
        passwordHash,
        nombre: `${nombreResponsable} ${apellidoResponsable}`,
        rol: "ADMIN",
      },
    });

    return { comercio, usuario };
  });

  return result;
}
