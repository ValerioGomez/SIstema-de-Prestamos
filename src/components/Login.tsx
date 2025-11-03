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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="bg-slate-800/50 backdrop-blur-lg p-12 rounded-3xl shadow-2xl max-w-md w-full border border-slate-700">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-500/20 p-4 rounded-full mb-4">
              <FiLogIn className="text-indigo-400 text-4xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-100 mb-2">
              Bienvenido
            </h1>
            <p className="text-gray-400">Ingresa para continuar</p>
          </div>

          <div className="relative mb-4">
            <FiMail className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full p-4 pl-12 bg-slate-700/50 border border-slate-600 rounded-xl text-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled={loading}
            />
          </div>

          <div className="relative mb-6">
            <FiLock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              placeholder="Contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              className="w-full p-4 pl-12 bg-slate-700/50 border border-slate-600 rounded-xl text-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 flex items-center justify-center rounded-xl text-lg font-semibold text-white transition-all duration-300 transform bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed hover:scale-105 shadow-lg shadow-indigo-500/20"
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

        <p className="text-sm text-slate-400 mt-6 text-center">
          Usa: <strong>admin@prestamos.com</strong> / <strong>123456</strong>
        </p>
      </div>
    </div>
  );
}
