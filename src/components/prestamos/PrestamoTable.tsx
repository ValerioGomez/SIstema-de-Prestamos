// src/components/prestamos/PrestamoTable.tsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Prestamo {
  id: string;
  cliente: { nombre: string; cedula: string };
  monto: number;
  estado: string;
  fechaInicio: string;
}

export default function PrestamoTable() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPrestamosRecientes = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "http://localhost:4000/api/prestamos/recientes"
        );
        if (res.ok) {
          const data = await res.json();
          setPrestamos(data);
        } else {
          toast.error("No se pudieron cargar los préstamos recientes.");
        }
      } catch (error) {
        console.error("Error al cargar préstamos:", error);
        toast.error("Error de conexión al cargar préstamos.");
      } finally {
        setLoading(false);
      }
    };

    cargarPrestamosRecientes();
  }, []);

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4 p-4 bg-white rounded-t-lg shadow">
        Préstamos Recientes
      </h2>
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
        <tbody className="divide-y divide-gray-200">
          {loading && (
            <tr>
              <td colSpan={4} className="py-4 px-6 text-center text-gray-500">
                Cargando préstamos...
              </td>
            </tr>
          )}
          {!loading && prestamos.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 px-6 text-center text-gray-500">
                No hay préstamos para mostrar.
              </td>
            </tr>
          )}
          {!loading &&
            prestamos.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="py-3 px-6">{p.cliente.nombre}</td>
                <td className="py-3 px-6">S/ {p.monto.toFixed(2)}</td>
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
