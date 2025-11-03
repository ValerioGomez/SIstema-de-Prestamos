// src/components/prestamos/NuevoPrestamo.tsx
"use client";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

export default function NuevoPrestamo() {
  const [dni, setDni] = useState("");
  const [cliente, setCliente] = useState<any>(null);
  const [monto, setMonto] = useState("");
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date(Date.now() + 86400000)); // mañana
  const [interes, setInteres] = useState("1");
  const [loading, setLoading] = useState(false);
  const [prestamosRecientes, setPrestamosRecientes] = useState([]);

  // BUSCAR CLIENTE
  const buscarCliente = async () => {
    if (dni.length < 8) return;
    setLoading(true);
    const res = await fetch(`http://localhost:4000/api/clientes/dni/${dni}`);
    const data = await res.json();
    setCliente(data);
    setLoading(false);
  };

  // CREAR PRÉSTAMO
  const crearPrestamo = async () => {
    if (!cliente || !monto) return;
    const res = await fetch("http://localhost:4000/api/prestamos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId: cliente.id,
        monto,
        tasaInteres: interes,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      }),
    });
    if (res.ok) {
      alert("Préstamo creado");
      cargarPrestamosRecientes();
    }
  };

  // CARGAR PRÉSTAMOS RECIENTES
  const cargarPrestamosRecientes = async () => {
    const res = await fetch("http://localhost:4000/api/prestamos/recientes");
    const data = await res.json();
    setPrestamosRecientes(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold text-center">Nuevo Préstamo</h2>

      {/* BUSCAR CLIENTE */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium">DNI del Cliente</label>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="12345678"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={buscarCliente}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      {/* FORMULARIO */}
      {cliente && (
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label>Cliente</label>
              <p className="font-semibold">{cliente.nombre}</p>
            </div>
            <div>
              <label>Monto (S/)</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="1000"
              />
            </div>
            <div>
              <label>Fecha Inicio</label>
              <DatePicker
                selected={fechaInicio}
                onChange={setFechaInicio}
                className="w-full p-2 border rounded"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div>
              <label>Fecha Fin</label>
              <DatePicker
                selected={fechaFin}
                onChange={setFechaFin}
                className="w-full p-2 border rounded"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            <div>
              <label>Interés Diario (%)</label>
              <input
                type="number"
                value={interes}
                onChange={(e) => setInteres(e.target.value)}
                className="w-full p-2 border rounded"
                defaultValue={1}
              />
            </div>
          </div>
          <button
            onClick={crearPrestamo}
            className="w-full py-3 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700"
          >
            Crear Préstamo
          </button>
        </div>
      )}

      {/* REPORTE RECIENTE */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Préstamos Recientes</h3>
        <button
          onClick={cargarPrestamosRecientes}
          className="mb-3 px-4 py-1 bg-gray-600 text-white rounded text-sm"
        >
          Actualizar
        </button>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Cliente</th>
                <th className="p-2 text-left">Monto</th>
                <th className="p-2 text-left">Inicio</th>
                <th className="p-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {prestamosRecientes.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.cliente.nombre}</td>
                  <td className="p-2">S/ {p.monto}</td>
                  <td className="p-2">
                    {format(new Date(p.fechaInicio), "dd/MM")}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        p.estado === "PAGADO"
                          ? "bg-green-100 text-green-800"
                          : p.estado === "ATRASADO"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
