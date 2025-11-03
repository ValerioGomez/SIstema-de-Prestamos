-- CreateEnum
CREATE TYPE "EstadoPrestamo" AS ENUM ('ACTIVO', 'PAGADO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('CUOTA', 'EXTRA', 'MULTA');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'EMPLEADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contraseña" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'ADMIN',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "cedula" TEXT NOT NULL,
    "nacionalidad" TEXT,
    "tipoDocumento" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestamos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "tasaInteres" DOUBLE PRECISION NOT NULL,
    "plazoMeses" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "estado" "EstadoPrestamo" NOT NULL DEFAULT 'ACTIVO',
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prestamos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "prestamoId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "tipo" "TipoPago" NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajustes" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "nombreEmpresa" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "simboloMoneda" TEXT NOT NULL DEFAULT 'S/',
    "interesDiarioDefecto" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ajustes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "usuarios_correo_idx" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_correo_key" ON "clientes"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cedula_key" ON "clientes"("cedula");

-- CreateIndex
CREATE INDEX "clientes_cedula_idx" ON "clientes"("cedula");

-- CreateIndex
CREATE INDEX "prestamos_clienteId_idx" ON "prestamos"("clienteId");

-- CreateIndex
CREATE INDEX "prestamos_estado_idx" ON "prestamos"("estado");

-- CreateIndex
CREATE INDEX "pagos_prestamoId_idx" ON "pagos"("prestamoId");

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "prestamos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
