"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteProductoAction } from "@/actions/producto.actions";

export function DeleteProductoButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("¿Estás seguro de eliminar este producto? No aparecerá más en el catálogo.")) return;

    startTransition(async () => {
      const result = await deleteProductoAction(id);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? "..." : "Eliminar"}
    </Button>
  );
}
