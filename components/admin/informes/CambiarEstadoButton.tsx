"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Estado = "borrador" | "emitido" | "aprobado" | "archivado";

interface Props {
  informeId: string;
  estadoActual: Estado;
}

const TRANSICIONES: Record<Estado, { siguiente: Estado; label: string; cls: string } | null> = {
  borrador: {
    siguiente: "emitido",
    label: "Emitir informe",
    cls: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  emitido: {
    siguiente: "aprobado",
    label: "Marcar como aprobado",
    cls: "bg-green-600 hover:bg-green-700 text-white",
  },
  aprobado: {
    siguiente: "archivado",
    label: "Archivar",
    cls: "bg-purple-600 hover:bg-purple-700 text-white",
  },
  archivado: null,
};

export default function CambiarEstadoButton({ informeId, estadoActual }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  const transicion = TRANSICIONES[estadoActual];
  if (!transicion) return null;

  const confirmar = () => setConfirmando(true);
  const cancelar = () => setConfirmando(false);

  const ejecutar = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/informes/${informeId}/estado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: transicion.siguiente }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al cambiar estado");
        setLoading(false);
        setConfirmando(false);
        return;
      }
      router.refresh();
      setConfirmando(false);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      {!confirmando ? (
        <button
          onClick={confirmar}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${transicion.cls}`}
        >
          {transicion.label}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">¿Confirmar?</span>
          <button
            onClick={ejecutar}
            disabled={loading}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {loading ? "Cambiando..." : "Sí, confirmar"}
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
