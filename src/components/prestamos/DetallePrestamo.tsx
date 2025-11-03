import { useState } from "react";

export default function DetallePrestamo() {
  const [prestamo] = useState({
    monto: 5000,
    tasa: 12,
    saldo: 3800,
    estado: "ACTIVO",
    cliente: "Juan Pérez",
    pagos: [
      { fecha: "2025-01-15", monto: 500, tipo: "CUOTA" },
      { fecha: "2025-02-15", monto: 500, tipo: "CUOTA" },
    ],
  });

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Detalles del Préstamo</h2>
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <strong>Cliente:</strong> {prestamo.cliente}
        </div>
        <div>
          <strong>Monto:</strong> ${prestamo.monto}
        </div>
        <div>
          <strong>Tasa:</strong> {prestamo.tasa}%
        </div>
        <div>
          <strong>Saldo:</strong> ${prestamo.saldo}
        </div>
      </div>
      <h3 className="text-xl mb-4">Historial de Pagos</h3>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Fecha</th>
            <th className="p-3 text-left">Monto</th>
            <th className="p-3 text-left">Tipo</th>
          </tr>
        </thead>
        <tbody>
          {prestamo.pagos.map((p, i) => (
            <tr key={i}>
              <td className="p-3 border">{p.fecha}</td>
              <td className="p-3 border">${p.monto}</td>
              <td className="p-3 border">{p.tipo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
