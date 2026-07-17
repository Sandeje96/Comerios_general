-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CAJERO');

-- CreateEnum
CREATE TYPE "TipoMovimientoStock" AS ENUM ('INGRESO', 'VENTA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('COMPLETADA', 'ANULADA');

-- CreateTable
CREATE TABLE "Comercio" (
    "id" TEXT NOT NULL,
    "nombreFantasia" TEXT NOT NULL,
    "nombreResponsable" TEXT NOT NULL,
    "apellidoResponsable" TEXT NOT NULL,
    "celular" TEXT,
    "email" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comercio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT,
    "rol" "Role" NOT NULL DEFAULT 'CAJERO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "codigoInterno" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioCosto" DECIMAL(10,2),
    "precioVenta" DECIMAL(10,2) NOT NULL,
    "stockActual" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoStock" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" "TipoMovimientoStock" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoVenta" NOT NULL DEFAULT 'COMPLETADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentaDetalle" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "precioCosto" DECIMAL(10,2),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VentaDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comprobante" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "numeroComprobante" INTEGER NOT NULL,
    "snapshotJSON" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comprobante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Comercio_email_key" ON "Comercio"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_comercioId_idx" ON "Usuario"("comercioId");

-- CreateIndex
CREATE INDEX "Producto_comercioId_idx" ON "Producto"("comercioId");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_comercioId_codigoInterno_key" ON "Producto"("comercioId", "codigoInterno");

-- CreateIndex
CREATE INDEX "MovimientoStock_comercioId_productoId_idx" ON "MovimientoStock"("comercioId", "productoId");

-- CreateIndex
CREATE INDEX "MovimientoStock_comercioId_idx" ON "MovimientoStock"("comercioId");

-- CreateIndex
CREATE INDEX "Venta_comercioId_idx" ON "Venta"("comercioId");

-- CreateIndex
CREATE INDEX "Venta_comercioId_createdAt_idx" ON "Venta"("comercioId", "createdAt");

-- CreateIndex
CREATE INDEX "VentaDetalle_comercioId_ventaId_idx" ON "VentaDetalle"("comercioId", "ventaId");

-- CreateIndex
CREATE UNIQUE INDEX "Comprobante_ventaId_key" ON "Comprobante"("ventaId");

-- CreateIndex
CREATE INDEX "Comprobante_comercioId_idx" ON "Comprobante"("comercioId");

-- CreateIndex
CREATE UNIQUE INDEX "Comprobante_comercioId_numeroComprobante_key" ON "Comprobante"("comercioId", "numeroComprobante");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

