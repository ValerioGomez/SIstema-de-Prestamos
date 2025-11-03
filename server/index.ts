// server/index.ts - VERSIÓN ACTUALIZADA Y CORREGIDA
import express from "express";
import cors from "cors";
import { prisma } from "../src/lib/prisma";

const app = express();

app.use(cors());
app.use(express.json());

// ===================== TEST DB =====================
app.get("/api/test-db", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, correo: true, nombre: true, rol: true },
    });
    res.json({ success: true, count: usuarios.length, usuarios });
  } catch (error) {
    console.error("Error en test-db:", error);
    res.status(500).json({ success: false, error: "DB no conectada" });
  }
});

// ===================== LOGIN TEMPORAL =====================
app.post("/api/login", async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (!usuario || usuario.contraseña !== contraseña) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    res.json({ id: usuario.id, nombre: usuario.nombre, rol: usuario.rol });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ===================== CLIENTES =====================

// BUSCAR CLIENTE POR DNI
app.get("/api/clientes/dni/:dni", async (req, res) => {
  const { dni } = req.params;
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { cedula: dni },
      include: { prestamos: { orderBy: { fechaInicio: "desc" } } },
    });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar cliente" });
  }
});

// CREAR CLIENTE
app.post("/api/clientes", async (req, res) => {
  const { cedula, nombre, telefono, correo } = req.body;
  try {
    const cliente = await prisma.cliente.create({
      data: { cedula, nombre, telefono, correo },
    });
    res.json(cliente);
  } catch (error) {
    console.error("Error crear cliente:", error);
    res.status(500).json({ error: "Error al crear cliente" });
  }
});

// ===================== PRÉSTAMOS =====================

// CREAR PRÉSTAMO - AHORA USANDO clienteId (UUID)
app.post("/api/prestamos", async (req, res) => {
  const { clienteId, monto, tasaInteres = 1, fechaInicio, fechaFin } = req.body;

  console.log("📦 Datos para nuevo préstamo:", { clienteId, monto });

  try {
    // clienteId aquí debe ser el ID del cliente (UUID), no el DNI
    const prestamo = await prisma.prestamo.create({
      data: {
        clienteId: clienteId, // Este es el ID UUID del cliente
        usuarioId: "admin-001",
        monto: parseFloat(monto),
        tasaInteres: parseFloat(tasaInteres),
        plazoMeses: 30,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        estado: "ACTIVO",
      },
      include: {
        cliente: {
          select: { nombre: true, cedula: true },
        },
      },
    });

    console.log("✅ Préstamo creado para cliente ID:", clienteId);
    res.json({ success: true, prestamo });
  } catch (error: any) {
    console.error("❌ Error crear préstamo:", error);
    res
      .status(500)
      .json({ error: "Error al crear préstamo: " + error.message });
  }
});

// LISTAR PRÉSTAMOS RECIENTES
app.get("/api/prestamos/recientes", async (req, res) => {
  try {
    const prestamos = await prisma.prestamo.findMany({
      orderBy: { fechaInicio: "desc" },
      take: 10,
      include: {
        cliente: {
          select: { nombre: true, cedula: true },
        },
      },
    });
    res.json(prestamos);
  } catch (error) {
    console.error("Error obtener préstamos:", error);
    res.status(500).json({ error: "Error al obtener préstamos" });
  }
});

// OBTENER PRÉSTAMOS POR DNI DE CLIENTE - RUTA CORREGIDA
app.get("/api/prestamos/cliente/:dni", async (req, res) => {
  const { dni } = req.params;
  console.log("🔍 Buscando préstamos para DNI:", dni);

  try {
    // Buscar cliente por DNI
    const cliente = await prisma.cliente.findUnique({
      where: { cedula: dni },
    });

    if (!cliente) {
      console.log("❌ Cliente no encontrado con DNI:", dni);
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    console.log("✅ Cliente encontrado:", cliente.nombre);

    // Buscar préstamos del cliente ORDENADOS por fecha (más nuevo primero)
    const prestamos = await prisma.prestamo.findMany({
      where: {
        clienteId: cliente.id, // Buscar por ID del cliente, no por DNI directo
      },
      include: {
        pagos: {
          orderBy: { fechaVencimiento: "desc" },
        },
        cliente: {
          select: {
            nombre: true,
            cedula: true,
            telefono: true,
          },
        },
      },
      orderBy: {
        fechaInicio: "desc",
      },
    });

    console.log(`📊 Encontrados ${prestamos.length} préstamos`);
    res.json(prestamos);
  } catch (error) {
    console.error("❌ Error al obtener préstamos:", error);
    res.status(500).json({ error: "Error al obtener préstamos" });
  }
});

// ===================== PAGOS =====================
app.post("/api/pagos", async (req, res) => {
  const { prestamoId, monto, tipoPago, notas } = req.body;

  try {
    const pago = await prisma.pago.create({
      data: {
        prestamoId,
        monto: parseFloat(monto),
        tipo: tipoPago,
        fechaPago: new Date(),
        fechaVencimiento: new Date(),
        notas: notas || "",
      },
    });

    // Verificar si el préstamo está completamente pagado
    const prestamo = await prisma.prestamo.findUnique({
      where: { id: prestamoId },
      include: { pagos: true },
    });

    const totalPagado =
      prestamo?.pagos.reduce((sum, p) => sum + p.monto, 0) || 0;

    if (totalPagado >= prestamo!.monto) {
      await prisma.prestamo.update({
        where: { id: prestamoId },
        data: { estado: "PAGADO" },
      });
    }

    res.json({ success: true, pago });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({ error: "Error al registrar pago" });
  }
});

// ===================== ADELANTOS =====================
app.post("/api/prestamos/adelanto", async (req, res) => {
  const { clienteId, monto, notas } = req.body;

  try {
    const nuevoPrestamo = await prisma.prestamo.create({
      data: {
        clienteId,
        usuarioId: "admin-001",
        monto: parseFloat(monto),
        tasaInteres: 1,
        plazoMeses: 30,
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        estado: "ACTIVO",
        notas: notas || "Préstamo generado por adelanto de pago",
      },
    });

    res.json({ success: true, prestamo: nuevoPrestamo });
  } catch (error) {
    console.error("Error al crear préstamo por adelanto:", error);
    res.status(500).json({ error: "Error al crear préstamo" });
  }
});

// ===================== SERVER =====================
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
