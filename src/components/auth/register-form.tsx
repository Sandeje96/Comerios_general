"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/validators/auth.schema";
import { registerAction } from "@/actions/auth.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombreResponsable: "",
      apellidoResponsable: "",
      nombreFantasia: "",
      celular: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsPending(true);
    setError(null);
    const result = await registerAction(data);
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <Card className="w-[500px]">
      <CardHeader>
        <CardTitle>Registrar Comercio</CardTitle>
        <CardDescription>Crea una nueva cuenta para tu comercio</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombreResponsable">Nombre</Label>
              <Input id="nombreResponsable" {...form.register("nombreResponsable")} />
              {form.formState.errors.nombreResponsable && <p className="text-sm text-red-500">{form.formState.errors.nombreResponsable.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidoResponsable">Apellido</Label>
              <Input id="apellidoResponsable" {...form.register("apellidoResponsable")} />
              {form.formState.errors.apellidoResponsable && <p className="text-sm text-red-500">{form.formState.errors.apellidoResponsable.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombreFantasia">Nombre de Fantasía (Comercio)</Label>
            <Input id="nombreFantasia" {...form.register("nombreFantasia")} />
            {form.formState.errors.nombreFantasia && <p className="text-sm text-red-500">{form.formState.errors.nombreFantasia.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="celular">Celular (Opcional)</Label>
            <Input id="celular" {...form.register("celular")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Registrando..." : "Registrar Comercio"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
