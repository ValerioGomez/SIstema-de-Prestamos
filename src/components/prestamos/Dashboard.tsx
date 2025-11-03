import { useEffect, useState } from "react";
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
import toast from "react-hot-toast";
import ListaPrestamosPaginados from "./ListaPrestamosPaginados";

// Datos de ejemplo para los gráficos
const monthlyData = [
  { name: "Ene", prestamos: 25, monto: 42000 },
  { name: "Feb", prestamos: 30, monto: 51000 },
  { name: "Mar", prestamos: 20, monto: 35000 },
  { name: "Abr", prestamos: 32, monto: 58000 },
  { name: "May", prestamos: 38, monto: 62000 },
  { name: "Jun", prestamos: 28, monto: 50000 },
];

const COLORS = ["#3b82f6", "#10b981", "#ef4444"];

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

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPrestamosActivos: 0,
    montoTotalPrestado: 0,
    montoTotalRecuperado: 0,
    montoEnMora: 0,
    clientesRegistrados: 0,
    clientesPuntuales: 0,
    clientesNoPuntuales: 0,
    pagosRealizadosEsteMes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<
    "diario" | "semanal" | "mensual" | "anual"
  >("mensual");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:4000/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          toast.error("No se pudieron cargar las estadísticas.");
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        toast.error("Error de conexión al cargar estadísticas.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatSoles = (value: number) =>
    `S/ ${value.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Datos para el gráfico de estado de préstamos (ahora con datos reales)
  const loanStatusData = [
    { name: "Activos", value: stats.totalPrestamosActivos },
    { name: "Recuperado", value: stats.montoTotalRecuperado },
    { name: "En Mora", value: stats.montoEnMora },
  ].filter((item) => item.value > 0);

  // Datos para el gráfico de clientes
  const clientStatusData = [
    { name: "Puntuales", value: stats.clientesPuntuales },
    { name: "No Puntuales", value: stats.clientesNoPuntuales },
  ].filter((item) => item.value > 0);

  const CLIENT_COLORS = ["#22c55e", "#f97316"];

  return (
    <div className="space-y-8">
      {/* --- INDICADORES CLAVE (KPIs) --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        <StatCard
          title="Préstamos Activos"
          value={stats.totalPrestamosActivos.toString()}
          icon="💸"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Monto Prestado"
          value={formatSoles(stats.montoTotalPrestado)}
          icon="📈"
          color="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          title="Monto Recuperado"
          value={formatSoles(stats.montoTotalRecuperado)}
          icon="💰"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Monto en Mora"
          value={formatSoles(stats.montoEnMora)}
          icon="⚠️"
          color="bg-red-100 text-red-600"
        />
        <StatCard
          title="Clientes Registrados"
          value={stats.clientesRegistrados.toString()}
          icon="👥"
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Pagos (este mes)"
          value={stats.pagosRealizadosEsteMes.toString()}
          icon="📅"
          color="bg-pink-100 text-pink-600"
        />
      </div>

      {/* --- GRÁFICOS PRINCIPALES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Gráfico de Líneas: Evolución Mensual */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Evolución de Préstamos
            </h3>
            <div className="flex border rounded-lg p-1 bg-gray-100 text-sm">
              {["diario", "semanal", "mensual", "anual"].map((range) => (
                <button
                  key={range}
                  onClick={() =>
                    setTimeRange(
                      range as "diario" | "semanal" | "mensual" | "anual"
                    )
                  }
                  className={`px-3 py-1 rounded-md font-semibold transition capitalize ${
                    timeRange === range
                      ? "bg-white shadow text-blue-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="prestamos"
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Torta: Estado de los Préstamos */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Composición de la Cartera
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={loanStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {loanStatusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico Donut: Clientes Puntuales vs No puntuales */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Comportamiento de Clientes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={clientStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {clientStatusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CLIENT_COLORS[index % CLIENT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- TABLA INFERIOR --- */}
      <ListaPrestamosPaginados />
    </div>
  );
}
