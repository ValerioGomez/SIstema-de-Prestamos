import { useEffect, useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale/es";
import DatePicker from "react-datepicker";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";
import "react-datepicker/dist/react-datepicker.css";

interface Stats {
  montoTotalPrestado: number;
  numeroClientes: number;
  prestamosActivos: number;
  prestamosPagados: number;
  prestamosVencidos: number;
  tasaMorosidad: number;
  ingresosIntereses: number;
}

interface PrestamoReporte {
  id: string;
  monto: number;
  tasaInteres: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  cliente: {
    nombre: string;
    cedula: string;
  };
}

const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) => (
  <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4">
    <div className={`text-3xl p-3 rounded-full ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const formatSoles = (value: number) =>
  `S/ ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Reportes() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [prestamosMes, setPrestamosMes] = useState([]);
  const [prestamosReporte, setPrestamosReporte] = useState<PrestamoReporte[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filtros de fecha
  const [filtroPeriodo, setFiltroPeriodo] = useState("mes");
  const [fechaInicio, setFechaInicio] = useState(startOfMonth(new Date()));
  const [fechaFin, setFechaFin] = useState(endOfMonth(new Date()));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statsUrl = "http://localhost:4000/api/reportes/estadisticas";
        const prestamosMesUrl =
          "http://localhost:4000/api/reportes/prestamos-mes";
        const prestamosReporteUrl = new URL(
          "http://localhost:4000/api/reportes/prestamos"
        );
        prestamosReporteUrl.searchParams.append(
          "desde",
          fechaInicio.toISOString()
        );
        prestamosReporteUrl.searchParams.append(
          "hasta",
          fechaFin.toISOString()
        );

        const [statsRes, prestamosMesRes, prestamosReporteRes] =
          await Promise.all([
            fetch(statsUrl),
            fetch(prestamosMesUrl),
            fetch(prestamosReporteUrl),
          ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (prestamosMesRes.ok) setPrestamosMes(await prestamosMesRes.json());
      } catch (error) {
        toast.error("Error al cargar los datos para los reportes.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    const hoy = new Date();
    if (filtroPeriodo === "mes") {
      setFechaInicio(startOfMonth(hoy));
      setFechaFin(endOfMonth(hoy));
    } else if (filtroPeriodo === "ano") {
      setFechaInicio(new Date(hoy.getFullYear(), 0, 1));
      setFechaFin(new Date(hoy.getFullYear(), 11, 31));
    } else if (filtroPeriodo === "dia") {
      setFechaInicio(hoy);
      setFechaFin(hoy);
    }
    // "periodo" se maneja con el DatePicker
  }, [filtroPeriodo]);

  const handleExport = (format: "xlsx" | "csv", tipoReporte: string) => {
    if (tipoReporte !== "prestamos") {
      return toast.error(`Reporte de ${tipoReporte} no implementado.`);
    }

    if (prestamosReporte.length === 0) {
      return toast.error("No hay datos para exportar.");
    }

    toast.success(`Exportando a ${format.toUpperCase()}...`);

    const dataToExport = prestamosReporte.map((p) => ({
      "ID Prestamo": p.id,
      Cliente: p.cliente.nombre,
      "DNI Cliente": p.cliente.cedula,
      Monto: p.monto,
      "Tasa Interes (%)": p.tasaInteres,
      "Fecha Inicio": format(new Date(p.fechaInicio), "dd/MM/yyyy"),
      "Fecha Fin": format(new Date(p.fechaFin), "dd/MM/yyyy"),
      Estado: p.estado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prestamos");
    XLSX.writeFile(workbook, `reporte_prestamos.${format}`);
    setShowExportModal(false);
  };

  const pieData = stats
    ? [
        { name: "Activos", value: stats.prestamosActivos },
        { name: "Pagados", value: stats.prestamosPagados },
        { name: "Vencidos", value: stats.prestamosVencidos },
      ]
    : [];

  const COLORS = ["#3b82f6", "#10b981", "#ef4444"];

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      {/* Encabezado */}
      <div className="bg-white rounded-xl shadow p-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Reportes y Estadísticas
          </h1>
          <p className="text-gray-500">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="dia">Hoy</option>
            <option value="mes">Este Mes</option>
            <option value="ano">Este Año</option>
            <option value="periodo">Personalizado</option>
          </select>
          {filtroPeriodo === "periodo" && (
            <div className="flex items-center gap-2">
              <DatePicker
                selected={fechaInicio}
                onChange={(date: Date) => setFechaInicio(date)}
                selectsStart
                startDate={fechaInicio}
                endDate={fechaFin}
                className="p-2 border rounded-lg w-32"
                dateFormat="dd/MM/yyyy"
              />
              <DatePicker
                selected={fechaFin}
                onChange={(date: Date) => setFechaFin(date)}
                selectsEnd
                startDate={fechaInicio}
                endDate={fechaFin}
                minDate={fechaInicio}
                className="p-2 border rounded-lg w-32"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          )}
        </div>
      </div>

      {/* 1. Estadísticas Generales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        <StatCard
          title="Monto Total Prestado"
          value={formatSoles(stats?.montoTotalPrestado || 0)}
          icon="💰"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Clientes Registrados"
          value={(stats?.numeroClientes || 0).toString()}
          icon="👥"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Préstamos Activos"
          value={(stats?.prestamosActivos || 0).toString()}
          icon="📅"
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          title="Tasa de Morosidad"
          value={`${(stats?.tasaMorosidad || 0).toFixed(1)}%`}
          icon="🔁"
          color="bg-red-100 text-red-600"
        />
      </div>

      {/* 2. Reportes por Período (Gráficos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-semibold text-gray-800 mb-4">
            Préstamos por Mes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prestamosMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => [value, "Cantidad"]} />
              <Legend />
              <Bar dataKey="cantidad" fill="#3b82f6" name="N° de Préstamos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-semibold text-gray-800 mb-4">
            Distribución de Préstamos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, "Cantidad"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Reportes Descargables */}
      <div className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-800">Reportes Descargables</h3>
          <p className="text-sm text-gray-500">
            Genera reportes detallados de tus operaciones.
          </p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
          Exportar
        </button>
      </div>

      {/* MODAL DE EXPORTACIÓN */}
      {showExportModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6">
              Selecciona un tipo de reporte
            </h2>

            <div className="space-y-4">
              {/* Reporte de Préstamos */}
              <div className="border p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-lg">
                    Reporte de Préstamos
                  </h4>
                  <p className="text-sm text-gray-600">
                    Detalle de todos los préstamos en el período seleccionado.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toast.error("PDF no implementado")}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport("xlsx", "prestamos")}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport("csv", "prestamos")}
                    className="bg-gray-500 text-white px-3 py-1 rounded"
                  >
                    CSV
                  </button>
                </div>
              </div>

              {/* Aquí puedes agregar más tipos de reportes */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
