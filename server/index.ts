// server/index.ts
import express from "express";
import cors from "cors";
import { prisma } from "../src/lib/prisma";

const app = express(); // ← ESTO FALTABA

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

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
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

// CREAR PRÉSTAMO
app.post("/api/prestamos", async (req, res) => {
  const { clienteId, monto, tasaInteres = 1, fechaInicio, fechaFin } = req.body;
  try {
    const prestamo = await prisma.prestamo.create({
      data: {
        clienteId,
        usuarioId: "admin-001", // Cambiar por usuario logueado
        monto: parseFloat(monto),
        tasaInteres: parseFloat(tasaInteres),
        plazoMeses: 0, // No usado
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        estado: "ACTIVO",
      },
      include: { cliente: true },
    });
    res.json(prestamo);
  } catch (error) {
    res.status(500).json({ error: "Error al crear préstamo" });
  }
});

// LISTAR PRÉSTAMOS RECIENTES
app.get("/api/prestamos/recientes", async (req, res) => {
  try {
    const prestamos = await prisma.prestamo.findMany({
      orderBy: { fechaInicio: "desc" },
      take: 10,
      include: { cliente: true },
    });
    res.json(prestamos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener préstamos" });
  }
});

// AGREGAR AL FINAL DE server/index.ts
app.post("/api/clientes", async (req, res) => {
  const { cedula, nombre, telefono, correo } = req.body;
  try {
    const cliente = await prisma.cliente.create({
      data: { cedula, nombre, telefono, correo },
    });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: "Error al crear cliente" });
  }
});
