import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface AjustesSistema {
  nombreEmpresa: string;
  direccion: string;
  telefono: string;
  correo: string;
  simboloMoneda: string;
  interesDiarioDefecto: number;
}

interface AjustesProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export default function Ajustes({ isDarkMode, setIsDarkMode }: AjustesProps) {
  const [ajustes, setAjustes] = useState<AjustesSistema>({
    nombreEmpresa: "",
    direccion: "",
    telefono: "",
    correo: "",
    simboloMoneda: "S/",
    interesDiarioDefecto: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAjustes = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:4000/api/ajustes");
        if (res.ok) {
          const data = await res.json();
          setAjustes(data);
        } else {
          toast.error("No se pudieron cargar los ajustes.");
        }
      } catch (error) {
        toast.error("Error de conexión al cargar ajustes.");
      } finally {
        setLoading(false);
      }
    };
    fetchAjustes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAjustes((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    toast.loading("Guardando ajustes...");
    try {
      const res = await fetch("http://localhost:4000/api/ajustes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ajustes),
      });
      toast.dismiss();
      if (res.ok) {
        toast.success("Ajustes guardados correctamente.");
      } else {
        toast.error("Error al guardar los ajustes.");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Error de conexión al guardar.");
    }
  };

  const handleSeedDatabase = async () => {
    if (
      !window.confirm(
        "¿Estás seguro? Esta acción borrará TODOS los datos actuales y los reemplazará con datos de prueba."
      )
    ) {
      return;
    }

    toast.loading("Generando datos de prueba...");
    try {
      const res = await fetch("http://localhost:4000/api/seed-database", {
        method: "POST",
      });
      toast.dismiss();
      if (res.ok) {
        toast.success(
          "Base de datos reiniciada con datos de prueba. Refresca la página."
        );
      } else {
        toast.error("Error al generar datos de prueba.");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Error de conexión.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Información de la Empresa
        </h2>
        {loading ? (
          <p>Cargando ajustes...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              name="nombreEmpresa"
              value={ajustes.nombreEmpresa}
              onChange={handleInputChange}
              placeholder="Nombre de la empresa"
              className="w-full p-3 border dark:border-slate-600 bg-transparent dark:text-white rounded-lg"
            />
            <input
              name="direccion"
              value={ajustes.direccion}
              onChange={handleInputChange}
              placeholder="Dirección"
              className="w-full p-3 border dark:border-slate-600 bg-transparent dark:text-white rounded-lg"
            />
            <input
              name="telefono"
              value={ajustes.telefono}
              onChange={handleInputChange}
              placeholder="Teléfono de contacto"
              className="w-full p-3 border dark:border-slate-600 bg-transparent dark:text-white rounded-lg"
            />
            <input
              name="correo"
              type="email"
              value={ajustes.correo}
              onChange={handleInputChange}
              placeholder="Correo de contacto"
              className="w-full p-3 border dark:border-slate-600 bg-transparent dark:text-white rounded-lg"
            />
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Ajustes de Préstamos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Símbolo de Moneda
            </label>
            <input
              name="simboloMoneda"
              value={ajustes.simboloMoneda}
              onChange={handleInputChange}
              placeholder="S/"
              className="w-full p-3 border dark:border-slate-600 bg-transparent dark:text-white rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Interés Diario por Defecto (%)
            </label>
            <input
              name="interesDiarioDefecto"
              type="number"
              value={ajustes.interesDiarioDefecto}
              onChange={handleInputChange}
              placeholder="1.0"
              className="w-full p-3 border dark:border-slate-600 bg-transparent dark:text-white rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Apariencia
        </h2>
        <div className="flex items-center justify-between ">
          <p className="font-medium dark:text-gray-200">Modo Oscuro</p>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-14 h-8 rounded-full p-1 flex items-center transition-colors duration-300 ${
              isDarkMode
                ? "bg-indigo-600 justify-end"
                : "bg-gray-300 justify-start"
            }`}
          >
            <span className="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300"></span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Acciones del Sistema
        </h2>
        <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
          <h3 className="font-semibold text-red-800">Zona Peligrosa</h3>
          <p className="text-sm text-red-600 mb-4">
            Esta acción es irreversible. Borrará todos los datos actuales.
          </p>
          <button
            onClick={handleSeedDatabase}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700"
          >
            Reiniciar Base de Datos con Datos de Prueba
          </button>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={handleGuardar}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700"
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
