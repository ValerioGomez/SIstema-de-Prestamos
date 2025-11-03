import { useState } from "react";

export default function PerfilUsuario() {
  const [form, setForm] = useState({
    nombre: "Admin",
    correo: "admin@prestamos.com",
    telefono: "123-456-7890",
  });

  const handleSave = () => {
    alert("Cambios guardados");
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Perfil y Configuración</h2>
      <input
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        className="w-full p-3 mb-4 border rounded"
      />
      <input
        value={form.correo}
        onChange={(e) => setForm({ ...form, correo: e.target.value })}
        className="w-full p-3 mb-4 border rounded"
      />
      <input
        value={form.telefono}
        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        className="w-full p-3 mb-4 border rounded"
      />
      <button
        onClick={handleSave}
        className="w-full bg-blue-600 text-white p-3 rounded font-semibold"
      >
        Guardar Cambios
      </button>
    </div>
  );
}
