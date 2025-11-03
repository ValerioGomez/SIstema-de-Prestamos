// src/App.tsx
import { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/prestamos/Dashboard";
import PrestamoTable from "./components/prestamos/PrestamoTable";
import SolicitudPrestamo from "./components/prestamos/SolicitudPrestamo";
import GestionPagos from "./components/prestamos/GestionPagos";
import PerfilUsuario from "./components/prestamos/PerfilUsuario";
import ListaClientes from "./components/clientes/ListaClientes";
import Reportes from "./components/reportes/Reportes";
import Ajustes from "./components/ajustes/Ajustes";
import "./index.css";

function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<
    | "dashboard"
    | "nuevo"
    | "pagos"
    | "clientes"
    | "reportes"
    | "ajustes"
    | "perfil"
  >("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil y ajustar sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const navigationItems = [
    { key: "dashboard" as const, label: "INICIO", icon: "🏠" },
    { key: "nuevo" as const, label: "NUEVO PRÉSTAMO", icon: "💰" },
    { key: "pagos" as const, label: "PAGOS", icon: "💳" },
    { key: "clientes" as const, label: "CLIENTES", icon: "👥" },
    { key: "reportes" as const, label: "REPORTES", icon: "📊" },
    { key: "ajustes" as const, label: "AJUSTES", icon: "⚙️" },
    { key: "perfil" as const, label: "MI PERFIL", icon: "👤" },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* OVERLAY PARA MÓVIL */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
        bg-gradient-to-b from-blue-800 to-blue-900 text-white 
        shadow-xl
        transition-all duration-300 ease-in-out
        fixed md:relative z-30
        ${sidebarOpen ? "w-64" : "w-0 md:w-20"}
        ${isMobile ? "h-full" : "min-h-screen"}
        flex flex-col
      `}
      >
        {/* HEADER SIDEBAR */}
        <div
          className={`p-4 border-b border-blue-700 ${
            !sidebarOpen && "hidden md:block"
          }`}
        >
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <>
                <div>
                  <h1 className="text-xl font-bold">Sistema Préstamos</h1>
                  <p className="text-blue-200 text-sm">v2.0</p>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-1 rounded-lg hover:bg-blue-700 transition"
                >
                  ◀
                </button>
              </>
            )}
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-blue-700 transition mx-auto"
              >
                ▶
              </button>
            )}
          </div>
        </div>

        {/* USUARIO INFO */}
        <div
          className={`p-4 border-b border-blue-700 ${
            !sidebarOpen && "hidden md:block"
          }`}
        >
          {sidebarOpen && (
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">👤</span>
              </div>
              <p className="font-semibold truncate">{user.nombre}</p>
              <p className="text-blue-200 text-sm capitalize">
                {user.rol?.toLowerCase()}
              </p>
            </div>
          )}
          {!sidebarOpen && (
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg">👤</span>
              </div>
            </div>
          )}
        </div>

        {/* NAVEGACIÓN PRINCIPAL */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setView(item.key);
                if (isMobile) setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center p-3 rounded-xl transition-all duration-200
                ${
                  view === item.key
                    ? "bg-white text-blue-800 shadow-lg"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }
                ${!sidebarOpen && "justify-center"}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* CERRAR SESIÓN - SIEMPRE ABAJO */}
        <div
          className={`p-4 border-t border-blue-700 ${
            !sidebarOpen && "hidden md:block"
          }`}
        >
          <button
            onClick={() => setUser(null)}
            className={`
              w-full flex items-center p-3 rounded-xl transition-all duration-200
              bg-red-600 hover:bg-red-700 text-white
              ${!sidebarOpen && "justify-center"}
            `}
          >
            <span className="text-xl">🚪</span>
            {sidebarOpen && (
              <span className="ml-3 font-medium">CERRAR SESIÓN</span>
            )}
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* HEADER SUPERIOR */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 mr-4 md:hidden"
              >
                ☰
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                {view === "dashboard" && "Panel Principal"}
                {view === "nuevo" && "Nuevo Préstamo"}
                {view === "pagos" && "Gestión de Pagos"}
                {view === "clientes" && "Gestión de Clientes"}
                {view === "reportes" && "Reportes y Estadísticas"}
                {view === "ajustes" && "Ajustes del Sistema"}
                {view === "perfil" && "Mi Perfil"}
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </header>

        {/* CONTENIDO DINÁMICO */}
        <main className="flex-1 p-6 overflow-auto">
          {view === "dashboard" && (
            <div className="space-y-6">
              <Dashboard />
              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-2xl font-semibold mb-4">
                  Préstamos Activos
                </h2>
                <PrestamoTable />
              </div>
            </div>
          )}

          {view === "nuevo" && <SolicitudPrestamo />}
          {view === "pagos" && <GestionPagos prestamoId="1" />}
          {view === "clientes" && <ListaClientes />}
          {view === "reportes" && <Reportes />}
          {view === "ajustes" && <Ajustes />}
          {view === "perfil" && <PerfilUsuario />}
        </main>
      </div>
    </div>
  );
}

export default App;
