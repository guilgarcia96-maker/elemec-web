"use client";

import { useState } from "react";

interface Props {
  informeId: string;
  clienteEmail?: string;
}

export default function EnviarClienteButton({ informeId, clienteEmail }: Props) {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  if (!clienteEmail) return null;

  const confirmar = () => setConfirmando(true);
  const cancelar = () => setConfirmando(false);

  const enviar = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/informes/${informeId}/enviar`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al enviar");
        setConfirmando(false);
        return;
      }
      setOk(true);
      setConfirmando(false);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (ok) {
    return (
      <span className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
        Enviado al cliente
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      {!confirmando ? (
        <button
          onClick={confirmar}
          className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition"
        >
          Enviar al cliente
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Enviar a {clienteEmail}?</span>
          <button
            onClick={enviar}
            disabled={loading}
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition"
          >
            {loading ? "Enviando..." : "Sí, enviar"}
          </button>
          <button
            onClick={cancelar}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-400 transition"
          >
            Cancelar
          </button>
        </div>
      )}
      {error && (
        <p className="absolute left-0 top-full mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
