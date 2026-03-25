"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  adjuntoId: string;
  openHref: string;
  canDelete: boolean;
};

export default function CotizacionAdjuntoActions({ adjuntoId, openHref, canDelete }: Props) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);

  async function eliminarAdjunto() {
    const ok = window.confirm("Esta accion eliminara el archivo adjunto. Continuar?");
    if (!ok) return;

    setEliminando(true);
    try {
      const res = await fetch(`/api/admin/cotizaciones/adjuntos/${adjuntoId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "No se pudo eliminar");
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar";
      window.alert(message);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={openHref}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-orange-500 hover:text-orange-500 transition"
      >
        Abrir
      </a>
      {canDelete && (
        <button
          type="button"
          onClick={eliminarAdjunto}
          disabled={eliminando}
          className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 transition disabled:opacity-50"
        >
          {eliminando ? "Eliminando..." : "Eliminar"}
        </button>
      )}
    </div>
  );
}
