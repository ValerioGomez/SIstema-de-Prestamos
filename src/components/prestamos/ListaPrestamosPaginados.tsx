// src/components/prestamos/ListaPrestamosPaginados.tsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Prestamo {
  id: string;
  cliente: { nombre: string; cedula: string };
  monto: number;
  estado: string;
  fechaInicio: string;
}

interface ApiResponse {
  prestamos: Prestamo[];
  totalPrestamos: number;
  totalPages: number;
  currentPage: number;
}

export default function ListaPrestamosPaginados() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const cargarPrestamos = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:4000/api/prestamos?page=${currentPage}&limit=5&estado=no-pagados`
        );
        if (res.ok) {
          const responseData: ApiResponse = await res.json();
          setData(responseData);
        } else {
          toast.error("No se pudieron cargar los préstamos.");
        }
      } catch (error) {
        console.error("Error al cargar préstamos:", error);
        toast.error("Error de conexión al cargar préstamos.");
      } finally {
        setLoading(false);
      }
    };

    cargarPrestamos();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && data && newPage <= data.totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <h2 className="text-2xl font-semibold mb-4">
        Historial de Préstamos Pendientes
      </h2>
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
                Fecha
              </th>
              <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={4} className="py-4 px-6 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading &&
              data?.prestamos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3 px-6">{p.cliente.nombre}</td>
                  <td className="py-3 px-6">S/ {p.monto.toFixed(2)}</td>
                  <td className="py-3 px-6">
                    {format(new Date(p.fechaInicio), "dd/MM/yyyy")}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium
                      ${
                        p.estado === "PAGADO"
                          ? "bg-green-100 text-green-800"
                          : ""
                      }
                      ${
                        p.estado === "ACTIVO"
                          ? "bg-yellow-100 text-yellow-800"
                          : ""
                      }
                      ${
                        p.estado === "ATRASADO" ? "bg-red-100 text-red-800" : ""
                      }
                    `}
                    >
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-700">
            Página {data.currentPage} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === data.totalPages}
              className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
