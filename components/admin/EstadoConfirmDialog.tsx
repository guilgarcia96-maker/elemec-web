'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Estado = 'proceso' | 'nueva' | 'en_revision' | 'cotizada' | 'ganada' | 'perdida';

const LABEL: Record<Estado, string> = {
  proceso:     'En proceso',
  nueva:       'Nueva',
  en_revision: 'En revisión',
  cotizada:    'Cotizada',
  ganada:      'Ganada',
  perdida:     'Perdida',
};

const BADGE: Record<Estado, string> = {
  proceso:     'bg-orange-500/20 text-orange-300 border-orange-500/40',
  nueva:       'bg-blue-500/20 text-blue-300 border-blue-500/40',
  en_revision: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  cotizada:    'bg-purple-500/20 text-purple-300 border-purple-500/40',
  ganada:      'bg-green-500/20 text-green-300 border-green-500/40',
  perdida:     'bg-red-500/20 text-red-300 border-red-500/40',
};

// Transiciones válidas según el estado actual
const TRANSICIONES: Record<Estado, Estado[]> = {
  proceso:     ['nueva', 'en_revision', 'cotizada'],
  nueva:       ['en_revision', 'cotizada', 'perdida', 'proceso'],
  en_revision: ['cotizada', 'perdida', 'proceso'],
  cotizada:    ['ganada', 'perdida', 'proceso'],
  ganada:      [],
  perdida:     ['proceso'],
};

interface Props {
  cotizacionId: string;
  estadoActual: string;
}

export default function EstadoConfirmDialog({ cotizacionId, estadoActual }: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Estado | null>(null);
  const [motivoPerdida, setMotivoPerdida] = useState('');
  const [loading, setLoading] = useState(false);

  const transicionesValidas = TRANSICIONES[estadoActual as Estado] ?? [];

  if (transicionesValidas.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold text-white/70">Cambiar estado</p>
        <p className="mt-2 text-xs text-white/40">
          Estado terminal: no hay transiciones disponibles desde &quot;{LABEL[estadoActual as Estado] ?? estadoActual}&quot;.
        </p>
      </div>
    );
  }

  async function submitEstado(nuevoEstado: Estado) {
    setLoading(true);
    const formData = new FormData();
    formData.append('id', cotizacionId);
    formData.append('estado', nuevoEstado);
    if (nuevoEstado === 'perdida' && motivoPerdida) {
      formData.append('motivo_perdida', motivoPerdida);
    }

    const res = await fetch('/api/admin/cotizaciones/estado', {
      method: 'POST',
      body: formData,
    });

    setLoading(false);
    setDialog(null);
    setMotivoPerdida('');

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <>
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="mb-3 text-sm font-semibold text-white/70">Cambiar estado</p>
        <div className="flex flex-wrap gap-2">
          {transicionesValidas.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setDialog(e)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${BADGE[e]} hover:opacity-80`}
            >
              {LABEL[e]}
            </button>
          ))}
        </div>
      </div>

      {/* Dialog overlay */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-[#1a1a2e] p-6 shadow-2xl">
            {dialog === 'perdida' ? (
              <>
                <h3 className="text-lg font-bold text-red-300">Marcar como Perdida</h3>
                <p className="mt-2 text-sm text-white/50">
                  Indica el motivo por el cual se perdió esta cotización.
                </p>
                <textarea
                  value={motivoPerdida}
                  onChange={(e) => setMotivoPerdida(e.target.value)}
                  rows={3}
                  placeholder="Motivo de pérdida (requerido)..."
                  className="mt-3 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-red-400 placeholder:text-white/30"
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setDialog(null); setMotivoPerdida(''); }}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/60 hover:border-white/40 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading || !motivoPerdida.trim()}
                    onClick={() => submitEstado('perdida')}
                    className="rounded-lg bg-red-700 px-5 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50 transition"
                  >
                    {loading ? 'Guardando...' : 'Confirmar pérdida'}
                  </button>
                </div>
              </>
            ) : dialog === 'ganada' ? (
              <>
                <h3 className="text-lg font-bold text-green-300">Confirmar cotización ganada</h3>
                <p className="mt-2 text-sm text-white/50">
                  Confirmar que esta cotización fue ganada. Esta acción es irreversible.
                </p>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/60 hover:border-white/40 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => submitEstado('ganada')}
                    className="rounded-lg bg-green-700 px-5 py-2 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50 transition"
                  >
                    {loading ? 'Guardando...' : 'Confirmar ganada'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white">Cambiar estado</h3>
                <p className="mt-2 text-sm text-white/50">
                  Cambiar el estado a <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${BADGE[dialog]}`}>{LABEL[dialog]}</span>
                </p>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/60 hover:border-white/40 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => submitEstado(dialog)}
                    className="rounded-lg bg-[#e2b44b] px-5 py-2 text-sm font-bold text-black hover:bg-[#d4a43a] disabled:opacity-50 transition"
                  >
                    {loading ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
