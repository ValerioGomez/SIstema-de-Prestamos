// server/index.ts - VERSIÓN ACTUALIZADA Y CORREGIDA
import express from "express";
import cors from "cors";
import { prisma } from "../src/lib/prisma";
import { isBefore } from "date-fns";

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
  const { cedula, nombre, telefono, correo, direccion } = req.body;
  try {
    // Verificar si ya existe un cliente con la misma cédula
    const cedulaExistente = await prisma.cliente.findUnique({
      where: { cedula },
    });
    if (cedulaExistente) {
      return res
        .status(409)
        .json({ error: `El DNI ${cedula} ya está registrado.` });
    }

    // Verificar si ya existe un cliente con el mismo correo (si se proporcionó)
    if (correo) {
      const correoExistente = await prisma.cliente.findUnique({
        where: { correo },
      });
      if (correoExistente) {
        return res
          .status(409)
          .json({ error: `El correo ${correo} ya está en uso.` });
      }
    }

    const cliente = await prisma.cliente.create({
      data: { cedula, nombre, telefono, correo: correo || null, direccion },
    });
    res.json(cliente);
  } catch (error) {
    console.error("Error al crear cliente:", error);
    res
      .status(500)
      .json({ error: "Ocurrió un error inesperado al crear el cliente." });
  }
});

// BUSCAR CLIENTES POR TÉRMINO (DNI O NOMBRE)
app.get("/api/clientes/buscar", async (req, res) => {
  const { term } = req.query;
  if (!term || typeof term !== "string") {
    return res.status(400).json({ error: "Término de búsqueda requerido" });
  }

  try {
    const clientes = await prisma.cliente.findMany({
      where: {
        OR: [
          { nombre: { contains: term, mode: "insensitive" } },
          { cedula: { startsWith: term } },
        ],
      },
      take: 10, // Limitar a 10 resultados
    });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar clientes" });
  }
});

// LISTAR TODOS LOS CLIENTES CON PAGINACIÓN Y BÚSQUEDA
app.get("/api/clientes", async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const term = req.query.term as string;
  const skip = (page - 1) * limit;

  const where: Prisma.ClienteWhereInput = {};
  if (term) {
    where.OR = [
      { nombre: { contains: term, mode: "insensitive" } },
      { cedula: { contains: term } },
    ];
  }

  try {
    const [clientes, totalClientes] = await prisma.$transaction([
      prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creadoEn: "desc" },
      }),
      prisma.cliente.count({ where }),
    ]);

    res.json({
      clientes,
      totalClientes,
      totalPages: Math.ceil(totalClientes / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ error: "Error al obtener la lista de clientes" });
  }
});

// OBTENER CLIENTE POR ID (PARA EL MODAL DE DETALLES)
app.get("/api/clientes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        prestamos: true, // Incluimos los préstamos para el detalle
      },
    });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener detalles del cliente" });
  }
});

// ACTUALIZAR CLIENTE
app.put("/api/clientes/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, correo, direccion } = req.body;
  try {
    const cliente = await prisma.cliente.update({
      where: { id },
      data: { nombre, telefono, correo, direccion },
    });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el cliente" });
  }
});

// ELIMINAR CLIENTE
app.delete("/api/clientes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Primero, verificar si el cliente tiene préstamos
    const clienteConPrestamos = await prisma.cliente.findUnique({
      where: { id },
      include: { prestamos: true },
    });

    if (clienteConPrestamos && clienteConPrestamos.prestamos.length > 0) {
      return res.status(409).json({
        error: "No se puede eliminar un cliente con préstamos asociados.",
      });
    }

    // Si no tiene préstamos, proceder a eliminar
    await prisma.cliente.delete({ where: { id } });
    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    res.status(500).json({ error: "Error al eliminar el cliente" });
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
      // Corrección: Usar 'include' en lugar de 'select' para traer relaciones.
      // Prisma no permite 'select' e 'include' en el mismo nivel.
      include: {
        pagos: {
          orderBy: { fechaPago: "desc" },
        },
        cliente: {
          select: {
            id: true,
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

// OBTENER TODOS LOS PRÉSTAMOS CON PAGINACIÓN
app.get("/api/prestamos", async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const estado = req.query.estado as string;

  let whereClause: any = {};

  // Filtrar por préstamos no pagados si se especifica
  if (estado === "no-pagados") {
    whereClause.estado = { not: "PAGADO" };
  }

  try {
    const [prestamos, totalPrestamos] = await prisma.$transaction([
      prisma.prestamo.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { fechaInicio: "desc" },
        include: {
          cliente: {
            select: { nombre: true, cedula: true },
          },
        },
      }),
      prisma.prestamo.count({ where: whereClause }),
    ]);

    res.json({
      prestamos,
      totalPrestamos,
      totalPages: Math.ceil(totalPrestamos / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error al obtener préstamos paginados:", error);
    res.status(500).json({ error: "Error al obtener la lista de préstamos" });
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

// ===================== PAGOS =====================
app.post("/api/pagos", async (req, res) => {
  const { prestamoId, monto, tipoPago, notas } = req.body;

  // Asegurarse de que el tipo de pago sea válido para el enum de Prisma
  const validTipoPago = ["CUOTA", "EXTRA", "MULTA"].includes(tipoPago)
    ? tipoPago
    : "CUOTA";

  try {
    const pago = await prisma.pago.create({
      data: {
        prestamoId,
        monto: parseFloat(monto),
        tipo: validTipoPago,
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

    if (prestamo) {
      const totalPagado = prestamo.pagos.reduce((sum, p) => sum + p.monto, 0);

      // Lógica de cálculo de interés simple para la comprobación
      const diasTranscurridos =
        (new Date().getTime() - new Date(prestamo.fechaInicio).getTime()) /
        (1000 * 3600 * 24);
      const interesGenerado =
        prestamo.monto * (prestamo.tasaInteres / 100) * diasTranscurridos;
      const totalAdeudado = prestamo.monto + interesGenerado;

      if (totalPagado >= totalAdeudado) {
        await prisma.prestamo.update({
          where: { id: prestamoId },
          data: { estado: "PAGADO" },
        });
      }
    }

    res.json({ success: true, pago });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({ error: "Error al registrar pago" });
  }
});

// ===================== DASHBOARD =====================
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const totalPrestado = await prisma.prestamo.aggregate({
      _sum: { monto: true },
    });

    const totalPagado = await prisma.pago.aggregate({
      _sum: { monto: true },
    });

    const prestamosActivos = await prisma.prestamo.count({
      where: { estado: "ACTIVO" },
    });

    const prestamosAtrasados = await prisma.prestamo.count({
      where: { estado: "ATRASADO" },
    });

    const montoEnMora = await prisma.prestamo.aggregate({
      where: { estado: "ATRASADO" },
      _sum: { monto: true },
    });

    const totalClientes = await prisma.cliente.count();

    const pagosEsteMes = await prisma.pago.count({
      where: {
        fechaPago: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
    });

    // Calcular clientes puntuales vs no puntuales
    const todosLosClientes = await prisma.cliente.findMany({
      include: {
        prestamos: {
          where: { estado: "ATRASADO" },
        },
      },
    });

    const clientesNoPuntuales = todosLosClientes.filter(
      (c) => c.prestamos.length > 0
    ).length;
    const clientesPuntuales = totalClientes - clientesNoPuntuales;

    res.json({
      totalPrestamosActivos: prestamosActivos + prestamosAtrasados,
      montoTotalPrestado: totalPrestado._sum.monto || 0,
      montoTotalRecuperado: totalPagado._sum.monto || 0,
      montoEnMora: montoEnMora._sum.monto || 0,
      clientesRegistrados: totalClientes,
      pagosRealizadosEsteMes: pagosEsteMes,
      clientesPuntuales,
      clientesNoPuntuales,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    res.status(500).json({ error: "Error al cargar las estadísticas" });
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

// ===================== SEED DATABASE (PARA PRUEBAS) =====================
app.post("/api/seed-database", async (req, res) => {
  console.log("🌱 Iniciando proceso de sembrado de base de datos...");
  try {
    // 1. Limpiar datos existentes en el orden correcto
    await prisma.pago.deleteMany({});
    await prisma.prestamo.deleteMany({});
    await prisma.cliente.deleteMany({});
    console.log("🗑️ Base de datos limpiada.");

    // 2. Crear clientes aleatorios
    const nombres = [
      "Juan",
      "Maria",
      "Pedro",
      "Ana",
      "Luis",
      "Laura",
      "Carlos",
      "Sofia",
      "Miguel",
      "Elena",
    ];
    const apellidos = [
      "Perez",
      "Gomez",
      "Rodriguez",
      "Lopez",
      "Martinez",
      "Garcia",
      "Sanchez",
      "Diaz",
      "Torres",
      "Ramirez",
    ];

    const clientesCreados = [];
    for (let i = 0; i < 25; i++) {
      const cliente = await prisma.cliente.create({
        data: {
          nombre: `${nombres[Math.floor(Math.random() * nombres.length)]} ${
            apellidos[Math.floor(Math.random() * apellidos.length)]
          }`,
          cedula: Math.floor(70000000 + Math.random() * 10000000).toString(),
          telefono: `9${Math.floor(10000000 + Math.random() * 90000000)}`,
        },
      });
      clientesCreados.push(cliente);
    }
    console.log(`👤 Creados ${clientesCreados.length} clientes.`);

    // 3. Crear préstamos y pagos aleatorios para cada cliente
    for (const cliente of clientesCreados) {
      const numPrestamos = Math.floor(Math.random() * 3) + 1; // 1 a 3 préstamos por cliente

      for (let i = 0; i < numPrestamos; i++) {
        const monto = Math.floor(Math.random() * (5000 - 500 + 1) + 500);
        const tasaInteres = Math.random() * (5 - 1) + 1; // Interés entre 1% y 5%
        const diasPlazo = Math.floor(Math.random() * (90 - 30 + 1) + 30); // Plazo de 30 a 90 días

        const diasAtras = Math.floor(Math.random() * 180); // Préstamos iniciados en los últimos 6 meses
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - diasAtras);

        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + diasPlazo);

        let estado: "ACTIVO" | "PAGADO" | "ATRASADO" = "ACTIVO";
        const hoy = new Date();

        // Decidir estado
        const decisionEstado = Math.random();
        if (decisionEstado < 0.4) {
          // 40% de chance de estar pagado
          estado = "PAGADO";
        } else if (isBefore(fechaFin, hoy)) {
          estado = "ATRASADO";
        } else {
          estado = "ACTIVO";
        }

        const prestamo = await prisma.prestamo.create({
          data: {
            clienteId: cliente.id,
            usuarioId: "admin-001", // Asumiendo un admin por defecto
            monto,
            tasaInteres,
            plazoMeses: diasPlazo, // Usamos plazo en días aquí
            fechaInicio,
            fechaFin,
            estado,
            notas: "Préstamo generado automáticamente.",
          },
        });

        // Crear pagos para préstamos que no sean nuevos-activos
        if (
          estado === "PAGADO" ||
          estado === "ATRASADO" ||
          (estado === "ACTIVO" && Math.random() > 0.5)
        ) {
          const interesTotal = monto * (tasaInteres / 100) * diasPlazo;
          const totalAPagar = monto + interesTotal;
          let montoPagado = 0;

          if (estado === "PAGADO") {
            montoPagado = totalAPagar;
          } else {
            // ATRAZADO o ACTIVO con pagos
            montoPagado = Math.random() * (totalAPagar * 0.8); // Paga hasta el 80%
          }

          let pagosACrear = Math.floor(Math.random() * 5) + 1;
          let montoPorPago = montoPagado / pagosACrear;

          for (let j = 0; j < pagosACrear; j++) {
            const fechaPago = new Date(fechaInicio);
            fechaPago.setDate(
              fechaInicio.getDate() + Math.floor(Math.random() * diasAtras)
            );

            await prisma.pago.create({
              data: {
                prestamoId: prestamo.id,
                monto: montoPorPago,
                tipo: "CUOTA",
                fechaPago,
                fechaVencimiento: fechaFin,
              },
            });
          }
        }
      }
    }
    console.log("💸 Préstamos y pagos generados.");

    res.status(200).json({
      message: "¡Base de datos sembrada exitosamente con datos de prueba!",
    });
  } catch (error) {
    console.error("❌ Error al sembrar la base de datos:", error);
    res.status(500).json({ error: "No se pudo sembrar la base de datos." });
  }
});

// ===================== SERVER =====================
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
