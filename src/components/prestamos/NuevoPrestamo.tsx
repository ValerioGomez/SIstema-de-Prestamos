// src/components/prestamos/NuevoPrestamo.tsx
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
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(addDays(new Date(), 2));
  const [showModal, setShowModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    correo: "",
  });
  const [loading, setLoading] = useState(false);
  const [sugerencias, setSugerencias] = useState<Cliente[]>([]);

  // ACTUALIZAR FECHA FIN EN TIEMPO REAL
  useEffect(() => {
    setFechaFin(addDays(fechaInicio, dias));
  }, [fechaInicio, dias]);

  // BUSCAR CLIENTE POR DNI
  const buscarCliente = async () => {
    if (dni.length < 8) {
      setSugerencias([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/clientes/dni/${dni}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setCliente(data);
          setSugerencias([]);
          toast.success("Cliente encontrado");
        } else {
          setCliente(null);
          toast.error("Cliente no encontrado");
          setShowModal(true);
        }
      } else {
        setSugerencias([]);
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // CREAR CLIENTE NUEVO
  const crearCliente = async () => {
    if (!nuevoCliente.nombre || !dni) return;
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
        toast.success("Cliente creado");
      }
    } catch (error) {
      toast.error("Error al crear cliente");
    }
  };

  // CREAR PRÉSTAMO
  const crearPrestamo = async () => {
    if (!cliente || !monto) return;
    try {
      const res = await fetch("http://localhost:4000/api/prestamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: cliente.id,
          monto: parseFloat(monto),
          tasaInteres: 1,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
        }),
      });
      if (res.ok) {
        toast.success("Préstamo creado con éxito");
        setMonto("");
        setDni("");
        setCliente(null);
      }
    } catch (error) {
      toast.error("Error al crear préstamo");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Nuevo Préstamo
      </h2>

      {/* BUSCAR DNI */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          DNI del Cliente
        </label>
        <input
          type="text"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && buscarCliente()}
          placeholder="12345678"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {sugerencias.length > 0 && (
          <div className="mt-2 border rounded-lg bg-white">
            {sugerencias.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setCliente(c);
                  setDni(c.cedula);
                  setSugerencias([]);
                }}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                {c.nombre} - {c.cedula}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FORMULARIO */}
      {cliente && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Cliente</label>
              <p className="font-bold text-lg">{cliente.nombre}</p>
            </div>
            <div>
              <label className="block text-sm font-medium">Monto (S/)</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Días</label>
              <input
                type="number"
                value={dias}
                onChange={(e) => setDias(parseInt(e.target.value) || 1)}
                className="w-full p-3 border rounded-lg"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Fecha Inicio</label>
              <DatePicker
                selected={fechaInicio}
                onChange={setFechaInicio}
                className="w-full p-3 border rounded-lg"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Fecha Fin</label>
              <DatePicker
                selected={fechaFin}
                onChange={setFechaFin}
                className="w-full p-3 border rounded-lg bg-gray-50"
                dateFormat="dd/MM/yyyy"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Interés Total</label>
              <p className="text-xl font-bold text-emerald-600">
                S/ {(parseFloat(monto) * 0.01 * dias).toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={crearPrestamo}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition"
          >
            Confirmar Préstamo
          </button>
        </div>
      )}

      {/* MODAL CREAR CLIENTE */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Cliente no encontrado</h3>
            <p className="text-sm text-gray-600 mb-4">¿Deseas registrarlo?</p>
            <input
              type="text"
              placeholder="Nombre completo"
              value={nuevoCliente.nombre}
              onChange={(e) =>
                setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })
              }
              className="w-full p-3 border rounded mb-3"
            />
            <input
              type="text"
              placeholder="Teléfono (opcional)"
              value={nuevoCliente.telefono}
              onChange={(e) =>
                setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })
              }
              className="w-full p-3 border rounded mb-3"
            />
            <input
              type="email"
              placeholder="Correo (opcional)"
              value={nuevoCliente.correo}
              onChange={(e) =>
                setNuevoCliente({ ...nuevoCliente, correo: e.target.value })
              }
              className="w-full p-3 border rounded mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={crearCliente}
                className="flex-1 py-2 bg-blue-600 text-white rounded font-semibold"
              >
                Registrar
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 bg-gray-300 text-gray-700 rounded font-semibold"
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
