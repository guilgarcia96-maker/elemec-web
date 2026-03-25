'use client';

import { useState, useCallback } from 'react';

/* ─── Tipos ────────────────────────────────────────────────────────── */

interface Props {
  informeId?: string;
  onGuardarBorrador: () => Promise<void>;
  onEmitir: () => Promise<void>;
}

/* ─── Componente ──────────────────────────────────────────────────── */

export default function StepPreview({ informeId, onGuardarBorrador, onEmitir }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [emitiendo, setEmitiendo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const pdfUrl = informeId ? `/api/admin/informes/${informeId}/pdf` : null;

  const handleGuardar = useCallback(async () => {
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      await onGuardarBorrador();
      setMensaje('Borrador guardado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }, [onGuardarBorrador]);

  const handleEmitir = useCallback(async () => {
    if (!confirm('Al emitir el informe ya no se podrá editar. ¿Continuar?')) return;
    setEmitiendo(true);
    setError('');
    setMensaje('');
    try {
      await onEmitir();
      setMensaje('Informe emitido correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al emitir');
    } finally {
      setEmitiendo(false);
    }
  }, [onEmitir]);

  return (
    <div className="space-y-6">
      {/* Vista previa del PDF */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Vista previa del informe</h3>
        {pdfUrl ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <iframe
              src={pdfUrl}
              className="w-full h-[600px]"
              title="Vista previa del informe"
            />
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center h-64">
            <p className="text-sm text-gray-400">
              Guarda el informe primero para ver la vista previa del PDF.
            </p>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2.5">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        {/* Descargar PDF */}
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg transition font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Descargar PDF
          </a>
        )}

        {/* Guardar borrador */}
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 rounded-lg transition font-medium text-sm"
        >
          {guardando ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          )}
          Guardar borrador
        </button>

        {/* Emitir informe */}
        <button
          type="button"
          onClick={handleEmitir}
          disabled={emitiendo}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg transition font-semibold text-sm"
        >
          {emitiendo ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          Emitir informe
        </button>

        {/* Enviar al cliente (próximamente) */}
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed text-sm"
          title="Próximamente"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Enviar al cliente
          <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
            Próximamente
          </span>
        </button>
      </div>
    </div>
  );
}
