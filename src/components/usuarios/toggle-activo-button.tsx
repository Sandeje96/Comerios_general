"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleActivoUsuarioAction } from "@/actions/usuario.actions";

export function ToggleActivoButton({ id, activo }: { id: string; activo: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleActivoUsuarioAction(id, !activo);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  return (
    <Button
      variant={activo ? "destructive" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isPending ? "..." : activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
