import { RegisterForm } from "@/components/auth/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrar Comercio | Gestión Comercial",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo / Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mb-4 shadow-lg">
            G
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Crear cuenta
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Registrá tu comercio en la plataforma
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
