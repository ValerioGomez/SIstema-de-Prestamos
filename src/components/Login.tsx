"use client";
import { useState } from "react";

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
        alert(error.error || "Credenciales incorrectas");
      }
    } catch (err) {
      alert("Error de conexión. Asegúrate de que el servidor esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Iniciar Sesión
        </h1>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="w-full p-4 mb-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          className="w-full p-4 mb-6 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-xl text-lg font-semibold text-white transition-all duration-300 transform
            ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105 shadow-lg"
            }`}
        >
          {loading ? "Iniciando..." : "Entrar"}
        </button>

        <p className="text-sm text-gray-600 mt-6 text-center">
          Usa: <strong>admin@prestamos.com</strong> / <strong>123456</strong>
        </p>
      </form>
    </div>
  );
}
