import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { FiEdit, FiTrash2 } from "react-icons/fi";

interface Cliente {
  id: string;
  nombre: string;
  cedula: string;
  creadoEn: string;
}

interface ApiResponse {
  clientes: Cliente[];
  totalClientes: number;
  totalPages: number;
  currentPage: number;
}

interface ClienteDetallado extends Cliente {
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  nacionalidad: string | null;
  tipoDocumento: string | null;
  prestamos: any[]; // Simplificado para el ejemplo
}

export default function ListaClientes() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para los modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [clienteActual, setClienteActual] =
    useState<Partial<ClienteDetallado> | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClientDetails, setSelectedClientDetails] =
    useState<ClienteDetallado | null>(null);
  const [showLoanHistoryModal, setShowLoanHistoryModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const url = new URL("http://localhost:4000/api/clientes");
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("limit", "10");
      if (searchTerm) {
        url.searchParams.append("term", searchTerm);
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const responseData: ApiResponse = await res.json();
        setData(responseData);
      } else {
        toast.error("No se pudieron cargar los clientes.");
      }
    } catch (error) {
      toast.error("Error de conexión al cargar clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClientes();
    }, 500); // Debounce para no sobrecargar con búsquedas

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && data && newPage <= data.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const abrirModalEdicion = (
    cliente: Partial<ClienteDetallado> | null = null
  ) => {
    setClienteActual(
      cliente || {
        nombre: "",
        cedula: "",
        telefono: "",
        correo: "",
        direccion: "",
        nacionalidad: "Peruana",
        tipoDocumento: "DNI",
      }
    );
    setShowEditModal(true);
    setShowDetailsModal(false); // Ocultar modal de detalles si está abierto
  };

  const abrirModalDetalles = async (clienteId: string) => {
    setLoadingDetails(true);
    setShowDetailsModal(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/clientes/${clienteId}`
      );
      if (res.ok) {
        const clienteData: ClienteDetallado = await res.json();
        setSelectedClientDetails(clienteData);
      } else {
        toast.error("Error al cargar los detalles del cliente.");
        setShowDetailsModal(false);
      }
    } catch (error) {
      toast.error("Error de conexión.");
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const cerrarModales = () => {
    setShowEditModal(false);
    setShowDetailsModal(false);
    setShowLoanHistoryModal(false);
    setClienteActual(null);
    setSelectedClientDetails(null);
  };

  const getEstadoCliente = (cliente: ClienteDetallado | null) => {
    if (!cliente || cliente.prestamos.length === 0)
      return { texto: "Sin Préstamos", color: "text-gray-500" };
    const tieneAtrasos = cliente.prestamos.some((p) => p.estado === "ATRASADO");
    return tieneAtrasos
      ? { texto: "Moroso", color: "text-red-500" }
      : { texto: "Buen Cliente", color: "text-green-500" };
  };

  const handleGuardarCliente = async () => {
    if (!clienteActual || !clienteActual.nombre || !clienteActual.cedula) {
      return toast.error("Nombre y DNI son obligatorios.");
    }

    const url = clienteActual.id
      ? `http://localhost:4000/api/clientes/${clienteActual.id}`
      : "http://localhost:4000/api/clientes";
    const method = clienteActual.id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clienteActual),
      });

      if (res.ok) {
        toast.success(
          `Cliente ${clienteActual.id ? "actualizado" : "creado"} con éxito.`
        );
        cerrarModales();
        setClienteActual(null);
        fetchClientes(); // Recargar la lista
      } else {
        toast.error("Error al guardar el cliente.");
      }
    } catch (error) {
      toast.error("Error de conexión.");
    }
  };

  const handleEliminarCliente = async (clienteId: string) => {
    if (
      !window.confirm(
        "¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:4000/api/clientes/${clienteId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        toast.success("Cliente eliminado con éxito.");
        cerrarModales();
        fetchClientes(); // Recargar la lista
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al eliminar el cliente.");
      }
    } catch (error) {
      toast.error("Error de conexión al intentar eliminar.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Lista de Clientes</h2>
        <button
          onClick={() => abrirModalEdicion()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
          + Añadir Cliente
        </button>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por nombre o DNI..."
        className="w-full p-3 border border-gray-300 rounded-lg mb-6"
      />

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">DNI</th>
              <th className="py-3 px-4 text-left">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading &&
              data?.clientes.map((cliente) => (
                <tr
                  key={cliente.id}
                  onClick={() => abrirModalDetalles(cliente.id)}
                  className="hover:bg-blue-50 cursor-pointer"
                >
                  <td className="py-3 px-4 font-medium">{cliente.nombre}</td>
                  <td className="py-3 px-4">{cliente.cedula}</td>
                  <td className="py-3 px-4">
                    {format(new Date(cliente.creadoEn), "dd/MM/yyyy")}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm">
            Página {data.currentPage} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === data.totalPages}
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR/CREAR CLIENTE */}
      {showEditModal && clienteActual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {clienteActual.id ? "Editar Cliente" : "Nuevo Cliente"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={clienteActual.tipoDocumento || "DNI"}
                onChange={(e) =>
                  setClienteActual({
                    ...clienteActual,
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
                value={clienteActual.cedula || ""}
                onChange={(e) =>
                  setClienteActual({ ...clienteActual, cedula: e.target.value })
                }
                placeholder="N° de Documento"
                className="w-full p-3 border rounded-lg"
              />
              <input
                value={clienteActual.nombre || ""}
                onChange={(e) =>
                  setClienteActual({ ...clienteActual, nombre: e.target.value })
                }
                placeholder="Nombre completo"
                className="w-full p-3 border rounded-lg"
              />
              <input
                value={clienteActual.cedula || ""}
                onChange={(e) =>
                  setClienteActual({ ...clienteActual, cedula: e.target.value })
                }
                placeholder="DNI"
                className="w-full p-3 border rounded-lg"
                maxLength={8}
              />
              <input
                value={clienteActual.telefono || ""}
                onChange={(e) =>
                  setClienteActual({
                    ...clienteActual,
                    telefono: e.target.value,
                  })
                }
                placeholder="Teléfono"
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="email"
                value={clienteActual.correo || ""}
                onChange={(e) =>
                  setClienteActual({ ...clienteActual, correo: e.target.value })
                }
                placeholder="Correo electrónico"
                className="w-full p-3 border rounded-lg"
              />
              <input
                value={clienteActual.direccion || ""}
                onChange={(e) =>
                  setClienteActual({
                    ...clienteActual,
                    direccion: e.target.value,
                  })
                }
                placeholder="Dirección"
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleGuardarCliente}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold"
              >
                Guardar
              </button>
              <button
                onClick={cerrarModales}
                className="flex-1 py-3 bg-gray-300 rounded-lg font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES DE CLIENTE */}
      {showDetailsModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cerrarModales}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetails ? (
              <p>Cargando detalles...</p>
            ) : selectedClientDetails ? (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedClientDetails.nombre}
                    </h3>
                    <p className="text-gray-500">
                      DNI: {selectedClientDetails.cedula}
                    </p>
                  </div>
                  <span
                    className={`font-bold text-lg ${
                      getEstadoCliente(selectedClientDetails).color
                    }`}
                  >
                    {getEstadoCliente(selectedClientDetails).texto}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6 border-t pt-4">
                  <p>
                    <strong>Teléfono:</strong>{" "}
                    {selectedClientDetails.telefono || "No registrado"}
                  </p>
                  <p>
                    <strong>Correo:</strong>{" "}
                    {selectedClientDetails.correo || "No registrado"}
                  </p>
                  <p className="md:col-span-2">
                    <strong>Dirección:</strong>{" "}
                    {selectedClientDetails.direccion || "No registrada"}
                  </p>
                  <p>
                    <strong>Cliente desde:</strong>{" "}
                    {format(
                      new Date(selectedClientDetails.creadoEn),
                      "dd/MM/yyyy"
                    )}
                  </p>
                  <p>
                    <strong>Préstamos totales:</strong>
                    <button
                      onClick={() => setShowLoanHistoryModal(true)}
                      className="ml-2 text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                      disabled={selectedClientDetails.prestamos.length === 0}
                    >
                      {selectedClientDetails.prestamos.length} (Ver historial)
                    </button>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => abrirModalEdicion(selectedClientDetails)}
                    className="w-full sm:w-auto flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <FiEdit /> Editar
                  </button>
                  <button
                    onClick={() =>
                      handleEliminarCliente(selectedClientDetails.id)
                    }
                    disabled={selectedClientDetails.prestamos.length > 0}
                    className="w-full sm:w-auto flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FiTrash2 /> Eliminar
                  </button>
                  <button
                    onClick={cerrarModales}
                    className="flex-1 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <p>No se pudieron cargar los detalles.</p>
            )}
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL DE PRÉSTAMOS */}
      {showLoanHistoryModal && selectedClientDetails && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={cerrarModales}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Historial de Préstamos de: {selectedClientDetails.nombre}
            </h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Inicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedClientDetails.prestamos.map((prestamo) => (
                    <tr key={prestamo.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        S/ {prestamo.monto.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(prestamo.fechaInicio), "dd/MM/yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            prestamo.estado === "PAGADO"
                              ? "bg-green-100 text-green-800"
                              : prestamo.estado === "ATRASADO"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {prestamo.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={cerrarModales}
              className="mt-6 w-full py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
