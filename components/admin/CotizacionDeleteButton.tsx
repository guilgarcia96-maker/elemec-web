'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  cotizacionId: string;
  codigo?: string | null;
}

export default function CotizacionDeleteButton({ cotizacionId, codigo }: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/cotizaciones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cotizacionId }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Error al eliminar la cotización');
        setLoading(false);
        return;
      }

      router.push('/admin/cotizaciones');
    } catch {
      setError('Error de red al eliminar la cotización');
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDialog(true)}
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
      >
        Eliminar
      </button>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-red-600">Eliminar cotización</h3>
            <p className="mt-2 text-sm text-gray-600">
              ¿Estás seguro de que deseas eliminar la cotización
              {codigo ? <> <span className="font-mono font-semibold">{codigo}</span></> : ''}?
              Esta acción es irreversible y eliminará todos los archivos y registros asociados.
            </p>

            {error && (
              <p className="mt-3 text-xs text-red-600">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setDialog(false); setError(null); }}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-gray-400 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {loading ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
