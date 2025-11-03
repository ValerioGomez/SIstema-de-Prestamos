// src/components/prestamos/PrestamoTable.tsx
import { useEffect, useState } from "react";

interface Prestamo {
  id: string;
  cliente: { nombre: string };
  monto: number;
  estado: string;
}

export default function PrestamoTable() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);

  useEffect(() => {
    // Simulación de datos (luego será fetch real)
    setTimeout(() => {
      setPrestamos([
        {
          id: "1",
          cliente: { nombre: "Juan Pérez" },
          monto: 5000,
          estado: "ACTIVO",
        },
        {
          id: "2",
          cliente: { nombre: "María López" },
          monto: 3000,
          estado: "PAGADO",
        },
      ]);
    }, 500);
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">
              Cliente
            </th>
            <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">
              Monto
            </th>
            <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">
              Estado
            </th>
            <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {prestamos.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="py-3 px-6">{p.cliente.nombre}</td>
              <td className="py-3 px-6">${p.monto}</td>
              <td className="py-3 px-6">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium
                  ${p.estado === "PAGADO" ? "bg-green-100 text-green-800" : ""}
                  ${
                    p.estado === "ACTIVO" ? "bg-yellow-100 text-yellow-800" : ""
                  }
                  ${p.estado === "ATRASADO" ? "bg-red-100 text-red-800" : ""}
                `}
                >
                  {p.estado}
                </span>
              </td>
              <td className="py-3 px-6">
                <button className="text-blue-600 hover:underline mr-3">
                  Ver
                </button>
                <button className="text-red-600 hover:underline">
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
