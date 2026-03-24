'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  cotizacionId: string;
  token: string;
}

export default function ClienteRespuestaButtons({ cotizacionId, token }: Props) {
  const router = useRouter();
  const [showReject, setShowReject] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<'aprobada' | 'rechazada' | null>(null);
  const [error, setError] = useState('');

  async function enviarRespuesta(decision: 'aprobada' | 'rechazada') {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cotizacion/respuesta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cotizacion_id: cotizacionId,
          token,
          decision,
          motivo: decision === 'rechazada' ? motivo : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error al procesar respuesta' }));
        setError(data.error ?? 'Error al procesar respuesta');
        setLoading(false);
        return;
      }
      setDone(decision);
      setLoading(false);
      // Refrescar la página para mostrar el nuevo estado
      router.refresh();
    } catch {
      setError('Error de conexión. Intente nuevamente.');
      setLoading(false);
    }
  }

  if (done === 'aprobada') {
    return (
      <div className="mt-6 rounded-xl border border-green-500/30 bg-green-50 p-6 text-center">
        <p className="text-lg font-bold text-green-700">Cotización aprobada exitosamente</p>
        <p className="mt-2 text-sm text-green-600">
          Hemos registrado su aprobación. Nuestro equipo se comunicará para coordinar los siguientes pasos.
        </p>
      </div>
    );
  }

  if (done === 'rechazada') {
    return (
      <div className="mt-6 rounded-xl border border-red-300/30 bg-red-50 p-6 text-center">
        <p className="text-lg font-bold text-red-700">Respuesta registrada</p>
        <p className="mt-2 text-sm text-red-600">
          Hemos registrado su decisión. Si desea reconsiderar o tiene preguntas, no dude en contactarnos.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-[var(--header-border)] bg-[var(--section-alt)] p-6 md:p-8">
      <h2 className="text-sm font-semibold text-[var(--text-body)] mb-4">Responder cotización</h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!showReject ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => enviarRespuesta('aprobada')}
            className="flex-1 rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Aprobar cotización'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowReject(true)}
            className="flex-1 rounded-lg border-2 border-red-500 px-6 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Rechazar cotización
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-[var(--text-soft)] mb-3">
            Indique el motivo del rechazo (opcional):
          </p>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder="Escriba el motivo..."
            className="w-full rounded-lg border border-[var(--header-border)] bg-white px-3 py-2 text-sm text-[var(--text-body)] outline-none focus:border-orange-500 placeholder:text-[var(--text-soft)]"
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => enviarRespuesta('rechazada')}
              className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Confirmar rechazo'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => { setShowReject(false); setMotivo(''); }}
              className="rounded-lg border border-[var(--header-border)] px-6 py-2.5 text-sm text-[var(--text-soft)] transition hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
