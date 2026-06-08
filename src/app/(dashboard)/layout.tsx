import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Global */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Links Izquierda */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                  G
                </div>
                <span className="font-bold text-slate-900 hidden sm:block">Gestión</span>
              </Link>
              
              <div className="hidden sm:flex items-center gap-1">
                <Link href="/ventas" className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                  Ventas
                </Link>
                <Link href="/productos" className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                  Productos
                </Link>
                {session.user.rol === "ADMIN" && (
                  <Link href="/usuarios" className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                    Usuarios
                  </Link>
                )}
              </div>
            </div>

            {/* User Menú Derecha */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-900 leading-none">{session.user.name || "Usuario"}</p>
                <p className="text-xs text-slate-500 mt-1">{session.user.rol}</p>
              </div>
              <a 
                href="/api/auth/signout" 
                className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md transition-colors"
              >
                Salir
              </a>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="sm:hidden border-t border-slate-100 bg-slate-50 flex overflow-x-auto p-2 gap-2">
          <Link href="/ventas" className="flex-1 text-center px-3 py-2 rounded-md text-xs font-medium text-slate-700 bg-white shadow-sm border border-slate-200">
            Ventas
          </Link>
          <Link href="/productos" className="flex-1 text-center px-3 py-2 rounded-md text-xs font-medium text-slate-700 bg-white shadow-sm border border-slate-200">
            Productos
          </Link>
          {session.user.rol === "ADMIN" && (
            <Link href="/usuarios" className="flex-1 text-center px-3 py-2 rounded-md text-xs font-medium text-slate-700 bg-white shadow-sm border border-slate-200">
              Usuarios
            </Link>
          )}
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
