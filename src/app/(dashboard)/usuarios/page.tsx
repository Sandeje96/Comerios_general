import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsuariosByComercio } from "@/repositories/usuario.repository";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ToggleActivoButton } from "@/components/usuarios/toggle-activo-button";
import Link from "next/link";

export default async function UsuariosPage() {
  const session = await auth();
  
  if (!session?.user?.comercioId) redirect("/login");
  if (session.user.rol !== "ADMIN") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
        <p>Solo los administradores pueden gestionar usuarios.</p>
      </div>
    );
  }

  const usuarios = await getUsuariosByComercio(session.user.comercioId);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500">Gestiona los accesos de tus empleados</p>
        </div>
        <Link 
          href="/usuarios/nuevo"
          className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Nuevo Usuario
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.nombre}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.rol === "ADMIN" ? "default" : "secondary"}>
                    {user.rol}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.activo ? "default" : "destructive"} className={user.activo ? "bg-green-500 hover:bg-green-600" : ""}>
                    {user.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {user.id !== session.user.id && (
                    <ToggleActivoButton id={user.id} activo={user.activo} />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {usuarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
