// server/index.ts - VERSIÓN COMPLETA Y CORREGIDA
import express from "express";
import cors from "cors";
import { prisma } from "../src/lib/prisma";

const app = express(); // ¡ESTA LÍNEA ES CRÍTICA!

app.use(cors());
app.use(express.json());

// TEST DB
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

// LOGIN TEMPORAL (texto plano - para pruebas)
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

// CREAR PRÉSTAMO - VERSIÓN SIMPLIFICADA Y SEGURA
app.post("/api/prestamos", async (req, res) => {
  console.log("🎯 SOLICITUD RECIBIDA EN /api/prestamos");
  console.log("📦 Body:", req.body);

  const { clienteId, monto, tasaInteres = 1, fechaInicio, fechaFin } = req.body;

  try {
    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      console.log("❌ Cliente no encontrado:", clienteId);
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    console.log("✅ Cliente encontrado:", cliente.nombre);

    // Calcular días entre fechas
    const diffTime =
      new Date(fechaFin).getTime() - new Date(fechaInicio).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // CREAR PRÉSTAMO
    const prestamo = await prisma.prestamo.create({
      data: {
        clienteId: clienteId,
        usuarioId: "admin-001", // Asegúrate que este usuario existe
        monto: parseFloat(monto),
        tasaInteres: parseFloat(tasaInteres),
        plazoMeses: diffDays,
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

    console.log("✅ PRÉSTAMO CREADO EXITOSAMENTE");
    console.log("ID:", prestamo.id);
    console.log("Monto:", prestamo.monto);

    res.json({
      success: true,
      message: "Préstamo creado exitosamente",
      prestamo: prestamo,
    });
  } catch (error: any) {
    console.error("❌ ERROR al crear préstamo:");
    console.error("Mensaje:", error.message);
    console.error("Código:", error.code);

    res.status(500).json({
      error: "Error al crear préstamo",
      detalle: error.message,
    });
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

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
