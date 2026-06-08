import bcrypt from "bcrypt";
import { createUsuario, findUsuarioByEmail } from "../repositories/usuario.repository";
import { UsuarioCreateInput } from "../validators/usuario.schema";

export async function registrarNuevoUsuario(comercioId: string, data: UsuarioCreateInput) {
  // Verificar email único
  const existe = await findUsuarioByEmail(data.email);
  if (existe) {
    throw new Error("El email ya está registrado en el sistema");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  return createUsuario({
    comercioId,
    nombre: data.nombre,
    email: data.email,
    passwordHash,
    rol: data.rol,
  });
}
