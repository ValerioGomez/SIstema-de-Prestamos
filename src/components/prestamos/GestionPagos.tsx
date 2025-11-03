// src/components/prestamos/GestionPagos.tsx
"use client";
import { useState, useEffect } from "react";
import { format, isBefore, differenceInDays } from "date-fns";
import ListaPrestamosPaginados from "./ListaPrestamosPaginados";
import toast from "react-hot-toast";

interface Prestamo {
  id: string;
  monto: number;
  tasaInteres: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  notas?: string;
  pagos: Pago[];
  cliente: {
    id: string;
    nombre: string;
    cedula: string;
  };
}

interface Pago {
  id: string;
  monto: number;
  tipo: string;
  fechaPago: string;
}

interface Cliente {
  id: string;
  nombre: string;
  cedula: string;
}

export default function GestionPagos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prestamoSeleccionado, setPrestamoSeleccionado] =
    useState<Prestamo | null>(null);
  const [montoPago, setMontoPago] = useState("");
  const [tipoPago, setTipoPago] = useState<"TOTAL" | "PARCIAL" | "ADELANTO">(
    "PARCIAL"
  );
  const [showModalAdelanto, setShowModalAdelanto] = useState(false);
  const [nuevoPrestamo, setNuevoPrestamo] = useState({ monto: "", notas: "" });

  // BÚSQUEDA DE CLIENTES EN TIEMPO REAL (DEBOUNCED)
  useEffect(() => {
    if (searchTerm.length < 3 || selectedCliente) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:4000/api/clientes/buscar?term=${searchTerm}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (error) {
        toast.error("Error al buscar clientes");
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms de espera

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCliente]);

  // FUNCIÓN PARA CARGAR PRÉSTAMOS DE UN CLIENTE SELECCIONADO
  const cargarPrestamosCliente = async (cliente: Cliente) => {
    setLoading(true);
    setSearchTerm(`${cliente.nombre} (${cliente.cedula})`);
    setSelectedCliente(cliente);
    setSearchResults([]);
    setPrestamos([]);

    try {
      const res = await fetch(
        `http://localhost:4000/api/prestamos/cliente/${cliente.cedula}`
      );
      if (res.ok) {
        const data = await res.json();
        setPrestamos(data);
        if (data.length === 0) {
          toast.info("Este cliente no tiene préstamos registrados.");
        } else {
          toast.success(`Se encontraron ${data.length} préstamos.`);
        }
      } else {
        toast.error("No se pudieron cargar los préstamos de este cliente.");
      }
    } catch (error) {
      toast.error("Error de conexión al cargar los préstamos.");
    } finally {
      setLoading(false);
    }
  };

  // CALCULAR ESTADO Y COLOR DEL PRÉSTAMO
  const getEstadoPrestamo = (prestamo: Prestamo) => {
    if (prestamo.estado === "PAGADO") {
      return {
        estado: "PAGADO",
        color: "bg-gray-100 text-gray-800",
        badge: "✅ Pagado",
      };
    }

    const hoy = new Date();
    const fechaFin = new Date(prestamo.fechaFin);
    const totalPagado = prestamo.pagos.reduce(
      (sum, pago) => sum + pago.monto,
      0
    );
    const saldoPendiente = prestamo.monto - totalPagado;

    if (saldoPendiente <= 0) {
      return {
        estado: "PAGADO",
        color: "bg-gray-100 text-gray-800",
        badge: "✅ Pagado",
      };
    }

    if (isBefore(fechaFin, hoy)) {
      const diasAtraso = differenceInDays(hoy, fechaFin);
      return {
        estado: "ATRASADO",
        color: "bg-red-100 text-red-800",
        badge: `⚠️ Atrasado ${diasAtraso} días`,
      };
    }

    return {
      estado: "AL_DIA",
      color: "bg-green-100 text-green-800",
      badge: "✅ Al día",
    };
  };

  // CALCULAR SALDO PENDIENTE
  const calcularSaldoPendiente = (prestamo: Prestamo) => {
    const totalPagado = prestamo.pagos.reduce(
      (sum, pago) => sum + pago.monto,
      0
    );
    return prestamo.monto - totalPagado;
  };

  // ABRIR MODAL DE PAGO
  const abrirModalPago = (prestamo: Prestamo) => {
    if (prestamo.estado === "PAGADO") {
      toast.info("Este préstamo ya está completamente pagado");
      return;
    }

    const saldoPendiente = calcularSaldoPendiente(prestamo);
    setPrestamoSeleccionado(prestamo);
    setMontoPago(saldoPendiente.toString());
    setTipoPago("PARCIAL");
    setShowModal(true);
  };

  // PROCESAR PAGO
  const procesarPago = async () => {
    if (!prestamoSeleccionado || !montoPago) return;

    const montoNum = parseFloat(montoPago);
    const saldoPendiente = calcularSaldoPendiente(prestamoSeleccionado);

    if (tipoPago === "TOTAL" && montoNum < saldoPendiente) {
      toast.error("El monto debe ser igual al saldo pendiente para pago total");
      return;
    }

    if (tipoPago === "ADELANTO" && montoNum > saldoPendiente) {
      // Mostrar modal para nuevo préstamo
      const excedente = montoNum - saldoPendiente;
      setNuevoPrestamo({
        monto: excedente.toString(),
        notas: `Adelanto del préstamo ${prestamoSeleccionado.id}`,
      });
      setShowModalAdelanto(true);
      setShowModal(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prestamoId: prestamoSeleccionado.id,
          monto: montoNum,
          tipoPago: "CUOTA", // Corregido: Enviar un valor válido del enum
          notas: `Pago ${tipoPago.toLowerCase()}`,
        }),
      });

      if (res.ok) {
        toast.success(`Pago de S/ ${montoNum} registrado exitosamente`);
        setShowModal(false);
        if (selectedCliente) cargarPrestamosCliente(selectedCliente); // Recargar lista
      } else {
        toast.error("Error al registrar pago");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  // CREAR PRÉSTAMO POR ADELANTO
  const crearPrestamoAdelanto = async () => {
    if (!prestamoSeleccionado || !nuevoPrestamo.monto) return;

    try {
      // Primero registrar el pago del préstamo actual
      const saldoPendiente = calcularSaldoPendiente(prestamoSeleccionado);
      await fetch("http://localhost:4000/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prestamoId: prestamoSeleccionado.id,
          monto: saldoPendiente,
          tipoPago: "TOTAL",
          notas: "Pago total con adelanto",
        }),
      });

      // Luego crear nuevo préstamo con el excedente
      const res = await fetch("http://localhost:4000/api/prestamos/adelanto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: prestamoSeleccionado.cliente.id,
          monto: nuevoPrestamo.monto,
          notas: nuevoPrestamo.notas,
        }),
      });

      if (res.ok) {
        toast.success(
          `Préstamo de S/ ${nuevoPrestamo.monto} creado por adelanto`
        );
        setShowModalAdelanto(false);
        if (selectedCliente) cargarPrestamosCliente(selectedCliente); // Recargar lista
      }
    } catch (error) {
      toast.error("Error al procesar adelanto");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Gestión de Pagos
      </h1>

      {/* BUSCAR POR DNI */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Buscar Cliente para Gestionar Pagos
        </h2>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (selectedCliente) {
                setSelectedCliente(null);
                setPrestamos([]);
              }
            }}
            placeholder="Buscar por Nombre o DNI..."
            className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
            disabled={!!selectedCliente}
          />
          {loading && !selectedCliente && (
            <p className="text-sm text-gray-500 mt-2">Buscando...</p>
          )}

          {/* Resultados de la búsqueda */}
          {searchResults.length > 0 && !selectedCliente && (
            <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
              {searchResults.map((c) => (
                <li
                  key={c.id}
                  onClick={() => cargarPrestamosCliente(c)}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                >
                  <p className="font-semibold">{c.nombre}</p>
                  <p className="text-sm text-gray-600">{c.cedula}</p>
                </li>
              ))}
            </ul>
          )}

          {selectedCliente && (
            <button
              onClick={() => {
                setSelectedCliente(null);
                setSearchTerm("");
                setPrestamos([]);
              }}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-red-500 hover:text-red-700 font-semibold"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* LISTA DE PRÉSTAMOS */}
      {prestamos.length > 0 && (
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">
              Préstamos de {prestamos[0].cliente.nombre}
            </h2>
            <p className="text-gray-600">DNI: {prestamos[0].cliente.cedula}</p>
          </div>

          <div className="divide-y">
            {prestamos.map((prestamo, index) => {
              const estado = getEstadoPrestamo(prestamo);
              const saldoPendiente = calcularSaldoPendiente(prestamo);
              const totalPagado = prestamo.monto - saldoPendiente;
              const numeroPrestamo = prestamos.length - index;

              return (
                <div key={prestamo.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Préstamo N°{numeroPrestamo}
                      </h3>
                      <p className="text-gray-600">
                        {format(new Date(prestamo.fechaInicio), "dd/MM/yyyy")} -
                        {format(new Date(prestamo.fechaFin), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${estado.color}`}
                    >
                      {estado.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Monto Total</p>
                      <p className="font-semibold">
                        S/ {prestamo.monto.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pagado</p>
                      <p className="font-semibold text-green-600">
                        S/ {totalPagado.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Saldo Pendiente</p>
                      <p className="font-semibold text-red-600">
                        S/ {saldoPendiente.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Interés</p>
                      <p className="font-semibold">
                        {prestamo.tasaInteres}% diario
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => abrirModalPago(prestamo)}
                      disabled={estado.estado === "PAGADO"}
                      className={`px-6 py-2 rounded-lg font-semibold transition ${
                        estado.estado === "PAGADO"
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {estado.estado === "PAGADO" ? "Pagado" : "Realizar Pago"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DE PAGO */}
      {showModal && prestamoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Realizar Pago</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tipo de Pago
                </label>
                <select
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value as any)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="PARCIAL">Pago Parcial</option>
                  <option value="TOTAL">Pago Total</option>
                  <option value="ADELANTO">Adelanto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Monto a Pagar (S/)
                </label>
                <input
                  type="number"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Saldo pendiente: S/{" "}
                  {calcularSaldoPendiente(prestamoSeleccionado).toFixed(2)}
                </p>
              </div>

              {tipoPago === "ADELANTO" &&
                parseFloat(montoPago) >
                  calcularSaldoPendiente(prestamoSeleccionado) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">
                      💡 El monto excede el saldo pendiente. El excedente se
                      convertirá en un nuevo préstamo.
                    </p>
                  </div>
                )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={procesarPago}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Confirmar Pago
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PRÉSTAMO POR ADELANTO */}
      {showModalAdelanto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              Nuevo Préstamo por Adelanto
            </h3>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  💰 Se detectó un adelanto. El excedente se convertirá en un
                  nuevo préstamo.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Monto del Nuevo Préstamo (S/)
                </label>
                <input
                  type="number"
                  value={nuevoPrestamo.monto}
                  onChange={(e) =>
                    setNuevoPrestamo({
                      ...nuevoPrestamo,
                      monto: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notas</label>
                <textarea
                  value={nuevoPrestamo.notas}
                  onChange={(e) =>
                    setNuevoPrestamo({
                      ...nuevoPrestamo,
                      notas: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Descripción del nuevo préstamo..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={crearPrestamoAdelanto}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Crear Préstamo
                </button>
                <button
                  onClick={() => setShowModalAdelanto(false)}
                  className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de préstamos paginados */}
      <ListaPrestamosPaginados />
    </div>
  );
}
