import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pagados: 0,
    activos: 0,
    atrasados: 0,
  });

  useEffect(() => {
    setTimeout(() => {
      setStats({
        total: 8000,
        pagados: 1,
        activos: 1,
        atrasados: 0,
      });
    }, 500);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700">Total Préstamos</h3>
        <p className="text-3xl font-bold text-blue-600">${stats.total}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700">Pagados</h3>
        <p className="text-3xl font-bold text-green-600">{stats.pagados}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700">Activos</h3>
        <p className="text-3xl font-bold text-yellow-600">{stats.activos}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700">Atrasados</h3>
        <p className="text-3xl font-bold text-red-600">{stats.atrasados}</p>
      </div>
    </div>
  );
}
