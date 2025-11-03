import { useState } from "react";

export default function GestionPagos({ prestamoId }: { prestamoId: string }) {
  const [monto, setMonto] = useState("");

  const handlePago = () => {
    if (monto) {
      alert(`Pago de $${monto} registrado`);
      setMonto("");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Realizar Pago</h3>
      <input
        type="number"
        placeholder="Monto"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        className="w-full p-3 mb-4 border rounded"
      />
      <button
        onClick={handlePago}
        className="w-full bg-green-600 text-white p-3 rounded font-semibold"
      >
        Pagar Ahora
      </button>
    </div>
  );
}
