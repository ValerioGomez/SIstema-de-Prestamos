"use client";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays, addMonths, differenceInDays } from "date-fns";
import toast from "react-hot-toast";
import ListaPrestamosPaginados from "./ListaPrestamosPaginados";

interface Cliente {
  id: string;
  nombre: string;
  cedula: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  nacionalidad?: string;
  tipoDocumento?: string;
}

export default function NuevoPrestamo() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);

  const [tipoPrestamo, setTipoPrestamo] = useState<"diario" | "mensual">(
    "diario"
  );
  const [dias, setDias] = useState(30);
  const [monto, setMonto] = useState("");
  const [interes, setInteres] = useState(1);
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(addDays(new Date(), 2));
  const [showModal, setShowModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    correo: "",
    direccion: "",
    nacionalidad: "Peruana",
    tipoDocumento: "DNI",
  });
  const [loading, setLoading] = useState(false);

  // CÁLCULOS EN TIEMPO REAL
  const montoNum = parseFloat(monto) || 0;
  const interesDiario =
    tipoPrestamo === "diario" ? interes / 100 : interes / 100 / 30;
  const interesTotal = montoNum * interesDiario * dias;
  const totalPagar = montoNum + interesTotal;

  // BÚSQUEDA DE CLIENTES EN TIEMPO REAL (DEBOUNCED)
  useEffect(() => {
    if (searchTerm.length < 3) {
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
  }, [searchTerm]);

  // SINCRONIZACIÓN DE LÓGICA DE PRÉSTAMO
  useEffect(() => {
    if (tipoPrestamo === "diario") {
      setInteres(1);
      setDias(30);
      setFechaFin(addDays(fechaInicio, 30));
    } else {
      // Mensual
      setInteres(15);
      const nuevaFechaFin = addMonths(fechaInicio, 1);
      setFechaFin(nuevaFechaFin);
      setDias(differenceInDays(nuevaFechaFin, fechaInicio));
    }
  }, [tipoPrestamo, fechaInicio]);

  // SINCRONIZACIÓN DÍAS <-> FECHA FIN
  const handleDiasChange = (nuevosDias: number) => {
    setDias(nuevosDias);
    setFechaFin(addDays(fechaInicio, nuevosDias));
  };

  const handleFechaFinChange = (nuevaFecha: Date) => {
    setFechaFin(nuevaFecha);
    setDias(differenceInDays(nuevaFecha, fechaInicio) + 1);
  };

  // BUSCAR CLIENTE
  const seleccionarCliente = (clienteSeleccionado: Cliente) => {
    setCliente(clienteSeleccionado);
    setSearchTerm(
      `${clienteSeleccionado.nombre} (${clienteSeleccionado.cedula})`
    );
    setSearchResults([]);
  };

  const handleShowModal = () => {
    setShowModal(true);
  };

  // CREAR CLIENTE NUEVO
  const crearCliente = async () => {
    if (!nuevoCliente.nombre?.trim() || !nuevoCliente.cedula?.trim()) {
      toast.error("El Nombre y el DNI/Identificador son requeridos.");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoCliente,
        }),
      });

      if (res.ok) {
        const clienteNuevo = await res.json();
        seleccionarCliente(clienteNuevo);
        setShowModal(false);
        setNuevoCliente({
          nombre: "",
          cedula: "",
          telefono: "",
          correo: "",
          direccion: "",
          nacionalidad: "Peruana",
          tipoDocumento: "DNI",
        });
        toast.success("Cliente registrado exitosamente");
      }
    } catch (error) {
      toast.error("Error al crear cliente");
    }
  };

  const crearPrestamo = async () => {
    if (!cliente || !monto) {
      toast.error("Complete todos los campos");
      return;
    }

    console.log("📤 Enviando datos al servidor:", {
      clienteId: cliente.id,
      monto: montoNum,
      tasaInteres: interes,
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
    });

    try {
      const res = await fetch("http://localhost:4000/api/prestamos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          clienteId: cliente.id,
          monto: montoNum,
          tasaInteres: interes,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
        }),
      });

      console.log("📥 Respuesta del servidor:", res.status, res.statusText);

      const responseData = await res.json();
      console.log("📦 Datos de respuesta:", responseData);

      if (res.ok) {
        toast.success(`✅ Préstamo de S/ ${montoNum} creado exitosamente`);
        setMonto("");
        setSearchTerm("");
        setCliente(null);
      } else {
        toast.error(
          `❌ Error: ${
            responseData.error || responseData.mensaje || "Error desconocido"
          }`
        );
      }
    } catch (error) {
      console.error("💥 Error de conexión:", error);
      toast.error("🔌 Error de conexión con el servidor");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* SECCIÓN 1: BÚSQUEDA Y SELECCIÓN DE CLIENTE */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Paso 1: Buscar Cliente
        </h3>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCliente(null); // Deseleccionar cliente al cambiar búsqueda
            }}
            placeholder="Buscar por Nombre o DNI..."
            className="w-full p-4 pr-32 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
            disabled={!!cliente} // Deshabilitar si ya hay un cliente seleccionado
          />
          {loading && <p className="text-sm text-gray-500 mt-2">Buscando...</p>}

          {/* Resultados de la búsqueda o botón para registrar */}
          {!cliente && searchTerm.length >= 3 && !loading && (
            <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
              {searchResults.length > 0 ? (
                searchResults.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => seleccionarCliente(c)}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                  >
                    <p className="font-semibold">{c.nombre}</p>
                    <p className="text-sm text-gray-600">{c.cedula}</p>
                  </li>
                ))
              ) : (
                <p className="p-3 text-center text-gray-500">
                  No se encontraron clientes.
                </p>
              )}
            </ul>
          )}
          {!cliente && (
            <button
              onClick={handleShowModal}
              className="absolute top-1/2 right-4 -translate-y-1/2 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-200"
            >
              + Registrar Cliente
            </button>
          )}

          {/* Cliente seleccionado */}
          {cliente && (
            <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg flex justify-between items-center">
              <div>
                <p className="font-bold text-green-800 text-lg">
                  {cliente.nombre}
                </p>
                <p className="text-sm text-gray-600">DNI: {cliente.cedula}</p>
              </div>
              <button
                onClick={() => {
                  setCliente(null);
                  setSearchTerm("");
                }}
                className="text-red-500 hover:text-red-700 font-semibold"
              >
                Cambiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FORMULARIO DE PRÉSTAMO */}
      {cliente && (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
          <h3 className="text-xl font-bold text-gray-800">
            Paso 2: Detalles del Préstamo
          </h3>

          {/* TIPO DE PRÉSTAMO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Préstamo
            </label>
            <div className="flex rounded-lg border p-1 bg-gray-100">
              <button
                onClick={() => setTipoPrestamo("diario")}
                className={`flex-1 p-2 rounded-md font-semibold transition ${
                  tipoPrestamo === "diario"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-600"
                }`}
              >
                Diario
              </button>
              <button
                onClick={() => setTipoPrestamo("mensual")}
                className={`flex-1 p-2 rounded-md font-semibold transition ${
                  tipoPrestamo === "mensual"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-600"
                }`}
              >
                Mensual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* MONTO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto del Préstamo (S/)
              </label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="500.00"
                min="1"
              />
            </div>

            {/* DÍAS */}
            <div className={tipoPrestamo === "mensual" ? "hidden" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días de Préstamo
              </label>
              <input
                type="number"
                value={dias}
                onChange={(e) =>
                  handleDiasChange(parseInt(e.target.value) || 1)
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            {/* INTERÉS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interés ({tipoPrestamo === "diario" ? "Diario" : "Mensual"}) %
              </label>
              <input
                type="number"
                value={interes}
                onChange={(e) => setInteres(parseFloat(e.target.value) || 1)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.5"
                min="0"
              />
            </div>

            {/* FECHA INICIO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <DatePicker
                selected={fechaInicio}
                onChange={setFechaInicio}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                dateFormat="dd/MM/yyyy"
              />
            </div>

            {/* FECHA FIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <DatePicker
                selected={fechaFin}
                onChange={handleFechaFinChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>

          {/* RESUMEN DE PAGO */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-3">
              Resumen del Préstamo
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Monto Préstamo</p>
                <p className="font-bold text-lg">S/ {montoNum.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Interés Total</p>
                <p className="font-bold text-lg text-red-600">
                  S/ {interesTotal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total a Pagar</p>
                <p className="font-bold text-lg text-emerald-600">
                  S/ {totalPagar.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Pago por Día</p>
                <p className="font-bold text-lg text-gray-700">
                  S/ {(totalPagar / dias).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* BOTÓN CONFIRMAR */}
          <button
            onClick={crearPrestamo}
            disabled={!monto || montoNum <= 0}
            className="w-full py-4 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:bg-gray-400 transition-colors text-lg"
          >
            Confirmar Préstamo
          </button>
        </div>
      )}

      {/* MODAL CREAR CLIENTE NUEVO */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-6">Registrar Nuevo Cliente</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna 1 */}
              <div className="space-y-4">
                <select
                  value={nuevoCliente.tipoDocumento}
                  onChange={(e) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      tipoDocumento: e.target.value,
                    })
                  }
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="DNI">DNI</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Carnet de Extranjería">
                    Carnet de Extranjería
                  </option>
                  <option value="Otro">Otro</option>
                </select>
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={nuevoCliente.nombre}
                  onChange={(e) =>
                    setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={nuevoCliente.telefono}
                  onChange={(e) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      telefono: e.target.value,
                    })
                  }
                  className="w-full p-3 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Dirección"
                  value={nuevoCliente.direccion}
                  onChange={(e) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      direccion: e.target.value,
                    })
                  }
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              {/* Columna 2 */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="N° de Documento *"
                  value={nuevoCliente.cedula}
                  onChange={(e) =>
                    setNuevoCliente({ ...nuevoCliente, cedula: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Nacionalidad"
                  value={nuevoCliente.nacionalidad}
                  onChange={(e) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      nacionalidad: e.target.value,
                    })
                  }
                  className="w-full p-3 border rounded-lg"
                />
                <input
                  type="email"
                  placeholder="Correo"
                  value={nuevoCliente.correo}
                  onChange={(e) =>
                    setNuevoCliente({ ...nuevoCliente, correo: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={crearCliente}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Registrar Cliente
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
      )}

      {/* Tabla de préstamos paginados */}
      <ListaPrestamosPaginados />
    </div>
  );
}
