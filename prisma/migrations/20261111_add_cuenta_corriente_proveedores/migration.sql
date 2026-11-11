-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "MedioPagoProveedor" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'DEBITO', 'CREDITO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoCheque" AS ENUM ('PENDIENTE', 'ACREDITADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoPagoProveedor" AS ENUM ('CONFIRMADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoMovimientoCC" AS ENUM ('DEBITO', 'CREDITO');

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuit" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotizacionProveedor" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "numeroComprobante" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montoTotal" DECIMAL(12,2) NOT NULL,
    "montoPagado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "archivoUrl" TEXT,
    "archivoNombre" TEXT,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "anuladoMotivo" TEXT,
    "anuladoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CotizacionProveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoProveedor" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(12,2) NOT NULL,
    "medioPago" "MedioPagoProveedor" NOT NULL DEFAULT 'EFECTIVO',
    "referencia" TEXT,
    "observaciones" TEXT,
    "comprobantePagoUrl" TEXT,
    "comprobantePagoNombre" TEXT,
    "reciboRecibido" BOOLEAN NOT NULL DEFAULT false,
    "reciboNumero" TEXT,
    "reciboFecha" TIMESTAMP(3),
    "reciboArchivoUrl" TEXT,
    "reciboArchivoNombre" TEXT,
    "transferenciaBanco" TEXT,
    "transferenciaOperacion" TEXT,
    "transferenciaFecha" TIMESTAMP(3),
    "chequeNumero" TEXT,
    "chequeBanco" TEXT,
    "chequeFechaEmision" TIMESTAMP(3),
    "chequeFechaCobro" TIMESTAMP(3),
    "chequeEstado" "EstadoCheque",
    "estado" "EstadoPagoProveedor" NOT NULL DEFAULT 'CONFIRMADO',
    "anuladoMotivo" TEXT,
    "anuladoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoProveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoCotizacion" (
    "id" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "montoAsignado" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoCotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCuentaCorriente" (
    "id" TEXT NOT NULL,
    "comercioId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoMovimientoCC" NOT NULL,
    "concepto" TEXT NOT NULL,
    "comprobante" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "saldoResultante" DECIMAL(12,2),
    "cotizacionId" TEXT,
    "pagoId" TEXT,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "anuladoMotivo" TEXT,
    "anuladoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoCuentaCorriente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Proveedor_comercioId_idx" ON "Proveedor"("comercioId");
CREATE INDEX "Proveedor_comercioId_activo_idx" ON "Proveedor"("comercioId", "activo");

-- CreateIndex
CREATE INDEX "CotizacionProveedor_comercioId_proveedorId_idx" ON "CotizacionProveedor"("comercioId", "proveedorId");
CREATE INDEX "CotizacionProveedor_comercioId_fecha_idx" ON "CotizacionProveedor"("comercioId", "fecha");

-- CreateIndex
CREATE INDEX "PagoProveedor_comercioId_proveedorId_idx" ON "PagoProveedor"("comercioId", "proveedorId");
CREATE INDEX "PagoProveedor_comercioId_reciboRecibido_idx" ON "PagoProveedor"("comercioId", "reciboRecibido");
CREATE INDEX "PagoProveedor_comercioId_fecha_idx" ON "PagoProveedor"("comercioId", "fecha");

-- CreateIndex
CREATE INDEX "PagoCotizacion_pagoId_idx" ON "PagoCotizacion"("pagoId");
CREATE INDEX "PagoCotizacion_cotizacionId_idx" ON "PagoCotizacion"("cotizacionId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimientoCuentaCorriente_cotizacionId_key" ON "MovimientoCuentaCorriente"("cotizacionId");
CREATE UNIQUE INDEX "MovimientoCuentaCorriente_pagoId_key" ON "MovimientoCuentaCorriente"("pagoId");
CREATE INDEX "MovimientoCuentaCorriente_comercioId_proveedorId_idx" ON "MovimientoCuentaCorriente"("comercioId", "proveedorId");
CREATE INDEX "MovimientoCuentaCorriente_comercioId_proveedorId_fecha_idx" ON "MovimientoCuentaCorriente"("comercioId", "proveedorId", "fecha");

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionProveedor" ADD CONSTRAINT "CotizacionProveedor_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CotizacionProveedor" ADD CONSTRAINT "CotizacionProveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CotizacionProveedor" ADD CONSTRAINT "CotizacionProveedor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCotizacion" ADD CONSTRAINT "PagoCotizacion_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "PagoProveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PagoCotizacion" ADD CONSTRAINT "PagoCotizacion_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "CotizacionProveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_comercioId_fkey" FOREIGN KEY ("comercioId") REFERENCES "Comercio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "CotizacionProveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "PagoProveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
