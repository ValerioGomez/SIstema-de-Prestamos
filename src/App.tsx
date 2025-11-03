import { useState, useEffect, useRef } from "react";
import Login from "./components/Login";
import Dashboard from "./components/prestamos/Dashboard";
import NuevoPrestamo from "./components/prestamos/NuevoPrestamo";
import GestionPagos from "./components/prestamos/GestionPagos";
import ListaClientes from "./components/clientes/ListaClientes";
import Reportes from "./components/reportes/Reportes";
import Ajustes from "./components/ajustes/Ajustes";
import "./index.css";
import logo from "./assets/images/logo.png";
import {
  FiHome,
  FiUsers,
  FiBarChart2,
  FiLogOut,
  FiPlusCircle,
  FiCreditCard,
  FiSettings,
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiMenu,
  FiX,
} from "react-icons/fi";

function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<
    "dashboard" | "nuevo" | "pagos" | "clientes" | "reportes" | "ajustes"
  >("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Hook para cerrar el menú si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuRef]);

  // Hook para gestionar el modo oscuro
  useEffect(() => {
    const darkModeGuardado = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(darkModeGuardado);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(isDarkMode));
  }, [isDarkMode]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const navigationItems = [
    { key: "dashboard" as const, label: "Dashboard", icon: <FiHome /> },
    {
      key: "nuevo" as const,
      label: "Nuevo Préstamo",
      icon: <FiPlusCircle />,
    },
    {
      key: "pagos" as const,
      label: "Gestión de Pagos",
      icon: <FiCreditCard />,
    },
    { key: "clientes" as const, label: "Clientes", icon: <FiUsers /> },
    { key: "reportes" as const, label: "Reportes", icon: <FiBarChart2 /> },
    { key: "ajustes" as const, label: "Ajustes", icon: <FiSettings /> },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900/50 flex">
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
        bg-slate-900 text-white dark:border-r dark:border-slate-800
        transition-all duration-300 ease-in-out
        fixed md:relative z-30
        ${sidebarOpen ? "w-64" : "w-0 md:w-0"}
        ${isMobile ? "h-full" : "min-h-screen"}
        flex flex-col
      `}
      >
        {/* Logo y Título */}
        <div className="flex items-center gap-3 px-4 py-5 mb-6 flex-shrink-0">
          <img src={logo} alt="Logo" className="h-10 w-10" />
          <div className="flex flex-col">
            <span className="text-xl font-bold">Sistema de Préstamos</span>
            <p className="text-xs text-slate-400">versión 1</p>
          </div>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setView(item.key);
                if (isMobile) setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                view === item.key
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-400 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Perfil de Usuario y Menú Desplegable */}
        <div
          className="border-t border-slate-700 p-4 relative flex-shrink-0"
          ref={userMenuRef}
        >
          {/* Menú desplegable de Logout */}
          {showUserMenu && (
            <div className="absolute bottom-full mb-2 w-full left-0 bg-slate-800 rounded-lg shadow-xl overflow-hidden">
              <button
                onClick={() => setUser(null)}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
              >
                <FiLogOut className="text-lg" />
                <span className="font-semibold">Cerrar Sesión</span>
              </button>
            </div>
          )}

          {/* Botón para abrir el menú */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex justify-between items-center text-left p-2 rounded-lg hover:bg-slate-700/50 transition-colors duration-200"
          >
            <div>
              <p className="font-semibold">{user.nombre}</p>
              <p className="text-sm text-gray-400 capitalize">
                {user.rol?.toLowerCase()}
              </p>
            </div>
            {showUserMenu ? <FiChevronDown /> : <FiChevronUp />}
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* HEADER SUPERIOR */}
        <header className="bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 mr-4 md:hidden"
              >
                {sidebarOpen ? <FiX /> : <FiMenu />}
              </button>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {view === "dashboard" && "Panel Principal"}
                {view === "nuevo" && "Nuevo Préstamo"}
                {view === "pagos" && "Gestión de Pagos"}
                {view === "clientes" && "Gestión de Clientes"}
                {view === "reportes" && "Reportes y Estadísticas"}
                {view === "ajustes" && "Ajustes del Sistema"}
              </h1>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
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
        <main className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-slate-900/50">
          {view === "dashboard" && <Dashboard />}

          {view === "nuevo" && <NuevoPrestamo />}
          {view === "pagos" && <GestionPagos />}
          {view === "clientes" && <ListaClientes />}
          {view === "reportes" && <Reportes />}
          {view === "ajustes" && (
            <Ajustes isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
