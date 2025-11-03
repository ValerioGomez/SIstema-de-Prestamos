"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiLogIn, FiMail, FiLock, FiLoader } from "react-icons/fi";

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contraseña }),
      });

      if (res.ok) {
        const user = await res.json();
        onLogin(user);
      } else {
        const error = await res.json();
        toast.error(error.error || "Credenciales incorrectas");
      }
    } catch (err) {
      toast.error(
        "Error de conexión. Asegúrate de que el servidor esté corriendo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="flex w-full max-w-5xl mx-auto overflow-hidden bg-white rounded-2xl shadow-lg">
        {/* Columna de Información */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-slate-800 text-white">
          <div className="space-y-5">
            <h2 className="text-4xl font-bold leading-tight">
              Sistema de Préstamos
            </h2>
            <p className="text-indigo-200 text-lg">
              Gestiona tus préstamos y clientes de forma eficiente y segura.
            </p>
          </div>
          <div>
            <p className="text-sm text-indigo-200">
              © 2025 SamsamTec. Todos los derechos reservados.
            </p>
            <p className="text-sm text-indigo-200 mt-1">
              Desarrollado por:{" "}
              <a
                href="https://valerio-gomez.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                Valerio Gomez
              </a>
            </p>
          </div>
        </div>

        {/* Columna de Login */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col items-center mb-8">
              <div className="bg-indigo-100 p-4 rounded-full mb-4">
                <FiLogIn className="text-indigo-400 text-4xl" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Bienvenido
              </h1>
              <p className="text-gray-500">Ingresa para continuar</p>
            </div>

            <div className="relative mb-4">
              <FiMail className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full p-4 pl-12 bg-gray-50 border border-gray-300 rounded-xl text-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                disabled={loading}
              />
            </div>

            <div className="relative mb-6">
              <FiLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Contraseña"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                className="w-full p-4 pl-12 bg-gray-50 border border-gray-300 rounded-xl text-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 flex items-center justify-center rounded-xl text-lg font-semibold text-white transition-all duration-300 transform bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed hover:scale-105 shadow-lg shadow-indigo-500/30"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Iniciando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-8 text-center">
            Usa: <strong>admin@prestamos.com</strong> / <strong>123456</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
