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
      className="mt-6 rounded-xl border border-gray-200 bg-white p-5"
    >
      <input type="hidden" name="id" value={cotizacionId} />
      <label className="mb-2 block text-sm font-semibold text-gray-600">
        Adjuntar documentos
      </label>
      <input
        type="file"
        name="archivos"
        multiple
        required
        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
      />
      <p className="mt-2 text-xs text-gray-400">
        Requiere haber ejecutado el SQL extendido y creado el bucket privado `backoffice-docs`.
      </p>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={subiendo}
        className="mt-3 rounded-lg bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600 transition disabled:opacity-60"
      >
        {subiendo ? "Subiendo..." : "Subir archivos"}
      </button>
    </form>
  );
}
