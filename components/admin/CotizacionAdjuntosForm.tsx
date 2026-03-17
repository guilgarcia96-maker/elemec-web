"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  cotizacionId: string;
};

export default function CotizacionAdjuntosForm({ cotizacionId }: Props) {
  const router = useRouter();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    setSubiendo(true);

    try {
      const res = await fetch("/api/admin/cotizaciones/adjuntos", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "No se pudo subir el archivo");
      }

      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir archivos");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5"
    >
      <input type="hidden" name="id" value={cotizacionId} />
      <label className="mb-2 block text-sm font-semibold text-white/70">
        Adjuntar documentos
      </label>
      <input
        type="file"
        name="archivos"
        multiple
        required
        className="block w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white file:mr-4 file:rounded-md file:border-0 file:bg-[#e2b44b] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
      />
      <p className="mt-2 text-xs text-white/35">
        Requiere haber ejecutado el SQL extendido y creado el bucket privado `backoffice-docs`.
      </p>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={subiendo}
        className="mt-3 rounded-lg bg-[#e2b44b] px-5 py-2 text-sm font-bold text-black hover:bg-[#d4a43a] transition disabled:opacity-60"
      >
        {subiendo ? "Subiendo..." : "Subir archivos"}
      </button>
    </form>
  );
}
