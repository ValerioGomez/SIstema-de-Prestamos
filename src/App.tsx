// src/App.tsx
import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/prestamos/Dashboard";
import PrestamoTable from "./components/prestamos/PrestamoTable";
import SolicitudPrestamo from "./components/prestamos/SolicitudPrestamo";
import DetallePrestamo from "./components/prestamos/DetallePrestamo";
import GestionPagos from "./components/prestamos/GestionPagos";
import PerfilUsuario from "./components/prestamos/PerfilUsuario";
import "./index.css";

function App() {
  // FORZAR LOGIN: user = null
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<
    "dashboard" | "nuevo" | "detalle" | "pagos" | "perfil"
  >("dashboard");

  // SI NO HAY USUARIO → MOSTRAR LOGIN
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-blue-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sistema de Préstamos</h1>
          <div className="space-x-4">
            <button
              onClick={() => setView("dashboard")}
              className={`px-4 py-2 rounded ${
                view === "dashboard" ? "bg-blue-800" : ""
              } hover:bg-blue-800 transition`}
            >
              Panel
            </button>
            <button
              onClick={() => setView("nuevo")}
              className={`px-4 py-2 rounded ${
                view === "nuevo" ? "bg-blue-800" : ""
              } hover:bg-blue-800 transition`}
            >
              Nuevo Préstamo
            </button>
            <button
              onClick={() => setView("perfil")}
              className={`px-4 py-2 rounded ${
                view === "perfil" ? "bg-blue-800" : ""
              } hover:bg-blue-800 transition`}
            >
              Perfil
            </button>
            <button
              onClick={() => setUser(null)}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENIDO */}
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-lg mb-6">
          Bienvenido, <strong>{user.nombre}</strong>
        </p>

        {view === "dashboard" && (
          <>
            <Dashboard />
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-4">Préstamos Activos</h2>
              <PrestamoTable />
            </div>
          </>
        )}

        {view === "nuevo" && <SolicitudPrestamo />}
        {view === "detalle" && <DetallePrestamo />}
        {view === "pagos" && <GestionPagos prestamoId="1" />}
        {view === "perfil" && <PerfilUsuario />}
      </div>
    </div>
  );
}

export default App;
