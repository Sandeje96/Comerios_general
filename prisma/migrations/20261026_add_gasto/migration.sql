-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('PROVEEDORES', 'ALQUILER', 'SERVICIOS', 'INTERNET_TELEFONIA', 'SUELDOS', 'MANTENIMIENTO', 'IMPUESTOS', 'OTROS');

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "categoria" "CategoriaGasto" NOT NULL DEFAULT 'OTROS',
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" TEXT,
    "comprobante" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gasto_comercioId_idx" ON "Gasto"("comercioId");

-- CreateIndex
CREATE INDEX "Gasto_comercioId_fecha_idx" ON "Gasto"("comercioId", "fecha");

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
