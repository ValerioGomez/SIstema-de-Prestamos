"use client";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays } from "date-fns";
import toast from "react-hot-toast";

interface Cliente {
  id: string;
  nombre: string;
  cedula: string;
  telefono?: string;
  correo?: string;
}

export default function NuevoPrestamo() {
  const [dni, setDni] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [dias, setDias] = useState(2);
  const [monto, setMonto] = useState("");
  const [interes, setInteres] = useState(1);
  const [interesEditado, setInteresEditado] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(addDays(new Date(), 2));
  const [showModal, setShowModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    correo: "",
  });
  const [loading, setLoading] = useState(false);

  // CÁLCULOS EN TIEMPO REAL
  const montoNum = parseFloat(monto) || 0;
  const interesTotal = montoNum * (interes / 100) * dias;
  const totalPagar = montoNum + interesTotal;

  // ACTUALIZAR FECHA FIN AUTOMÁTICAMENTE
  useEffect(() => {
    setFechaFin(addDays(fechaInicio, dias));
  }, [fechaInicio, dias]);

  // BUSCAR CLIENTE
  const buscarCliente = async () => {
    if (dni.length < 8) {
      toast.error("DNI debe tener 8 dígitos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/clientes/dni/${dni}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setCliente(data);
          toast.success(`Cliente encontrado: ${data.nombre}`);
        } else {
          setCliente(null);
          setShowModal(true);
        }
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // CREAR CLIENTE NUEVO
  const crearCliente = async () => {
    if (!nuevoCliente.nombre.trim()) {
      toast.error("Nombre es requerido");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cedula: dni,
          nombre: nuevoCliente.nombre,
          telefono: nuevoCliente.telefono,
          correo: nuevoCliente.correo,
        }),
      });

      if (res.ok) {
        const clienteNuevo = await res.json();
        setCliente(clienteNuevo);
        setShowModal(false);
        setNuevoCliente({ nombre: "", telefono: "", correo: "" });
        toast.success("Cliente registrado exitosamente");
      }
    } catch (error) {
      toast.error("Error al crear cliente");
    }
  };

  // HABILITAR EDICIÓN DE INTERÉS
  const habilitarEdicionInteres = () => {
    const password = prompt("Ingrese contraseña para modificar interés:");
    if (password === "admin123") {
      // Cambia por tu contraseña
      setInteresEditado(true);
      toast.success("Interés habilitado para edición");
    } else {
      toast.error("Contraseña incorrecta");
    }
  };

  // CREAR PRÉSTAMO
  const crearPrestamo = async () => {
    if (!cliente) {
      toast.error("Seleccione un cliente");
      return;
    }
    if (!monto || montoNum <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/prestamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: cliente.id,
          monto: montoNum,
          tasaInteres: interes,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
        }),
      });

      if (res.ok) {
        const prestamoCreado = await res.json();
        toast.success(`Préstamo de S/ ${montoNum} creado exitosamente`);

        // Reset form
        setMonto("");
        setDni("");
        setCliente(null);
        setInteres(1);
        setInteresEditado(false);
        setDias(2);
        setFechaInicio(new Date());
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al crear préstamo");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Nuevo Préstamo
      </h2>

      {/* BUSCAR CLIENTE - BOTÓN VISIBLE SIEMPRE */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          DNI del Cliente
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && buscarCliente()}
            placeholder="12345678"
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            maxLength={8}
          />
          <button
            onClick={buscarCliente}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Buscando..." : "Buscar Cliente"}
          </button>
        </div>

        {cliente && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">
              ✓ Cliente: {cliente.nombre}
            </p>
            {cliente.telefono && (
              <p className="text-green-600">Tel: {cliente.telefono}</p>
            )}
          </div>
        )}
      </div>

      {/* FORMULARIO DE PRÉSTAMO */}
      {cliente && (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Detalles del Préstamo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días de Préstamo
              </label>
              <input
                type="number"
                value={dias}
                onChange={(e) => setDias(parseInt(e.target.value) || 1)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            {/* INTERÉS */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interés Diario (%)
                <button
                  type="button"
                  onClick={habilitarEdicionInteres}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  {interesEditado ? "✓ Editando" : "🔒 Modificar"}
                </button>
              </label>
              <input
                type="number"
                value={interes}
                onChange={(e) => setInteres(parseFloat(e.target.value) || 1)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.1"
                min="0.1"
                max="10"
                disabled={!interesEditado}
              />
              {!interesEditado && (
                <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-lg cursor-not-allowed"></div>
              )}
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
                onChange={setFechaFin}
                className="w-full p-3 border rounded-lg bg-gray-50"
                dateFormat="dd/MM/yyyy"
                readOnly
              />
            </div>
          </div>

          {/* RESUMEN DE PAGO */}
          <div className="bg-gray-50 p-4 rounded-lg border">
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
                <p className="font-bold text-lg text-orange-600">
                  S/ {interesTotal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total a Pagar</p>
                <p className="font-bold text-lg text-green-600">
                  S/ {totalPagar.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Por Día</p>
                <p className="font-bold text-lg">
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
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-3">Cliente No Encontrado</h3>
            <p className="text-sm text-gray-600 mb-4">
              Registrar nuevo cliente con DNI: <strong>{dni}</strong>
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre completo *"
                value={nuevoCliente.nombre}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Teléfono (opcional)"
                value={nuevoCliente.telefono}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Correo (opcional)"
                value={nuevoCliente.correo}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, correo: e.target.value })
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
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
    </div>
  );
}
