import { auth } from "@/lib/auth";
import { logoutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Bienvenido, {session?.user?.name}</p>
      <p className="mb-4 text-sm text-gray-500">ID Comercio: {session?.user?.comercioId}</p>

      <form action={logoutAction}>
        <Button variant="destructive" type="submit">Cerrar Sesión</Button>
      </form>
    </div>
  );
}
