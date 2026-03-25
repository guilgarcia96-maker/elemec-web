'use client';

import { useState, useCallback } from 'react';

/* ─── Tipos ────────────────────────────────────────────────────────── */

interface Props {
  informeId?: string;
  clienteEmail?: string;
  onGuardarBorrador: () => Promise<void>;
  onEmitir: () => Promise<void>;
}

/* ─── Modal de confirmación ───────────────────────────────────────── */
function ModalConfirmacion({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Emitir informe</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Esta acción es <strong className="text-gray-700">irreversible</strong>. Una vez emitido, el informe quedará bloqueado para edición y se registrará la fecha de emisión.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              ¿Confirmas que el informe está listo para emitir?
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition disabled:bg-orange-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Emitiendo...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sí, emitir informe
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Componente ──────────────────────────────────────────────────── */

export default function StepPreview({ informeId, clienteEmail, onGuardarBorrador, onEmitir }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [emitiendo, setEmitiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [showModal, setShowModal] = useState(false);
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

  const handleEnviar = useCallback(async () => {
    if (!informeId) return;
    setEnviando(true);
    setError('');
    setMensaje('');
    try {
      const res = await fetch(`/api/admin/informes/${informeId}/enviar`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Error al enviar');
      }
      const result = await res.json();
      setMensaje(`Informe enviado a ${result.enviado_a}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setEnviando(false);
    }
  }, [informeId]);

  const handleEmitirConfirm = useCallback(async () => {
    setEmitiendo(true);
    setError('');
    setMensaje('');
    try {
      await onEmitir();
      setMensaje('Informe emitido correctamente.');
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al emitir');
      setShowModal(false);
    } finally {
      setEmitiendo(false);
    }
  }, [onEmitir]);

  return (
    <>
      {showModal && (
        <ModalConfirmacion
          onConfirm={handleEmitirConfirm}
          onCancel={() => setShowModal(false)}
          loading={emitiendo}
        />
      )}

      <div className="space-y-5">
        {/* ── Cabecera ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Vista previa del informe</h3>
            <p className="text-xs text-gray-400 mt-0.5">Revisa el PDF antes de emitirlo.</p>
          </div>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#f8f9fb] border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 px-3 py-2 rounded-lg transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Descargar PDF
            </a>
          )}
        </div>

        {/* ── Vista previa ─────────────────────────────────────── */}
        {pdfUrl ? (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-xs text-gray-500 font-medium bg-white border border-gray-200 px-3 py-0.5 rounded-full truncate max-w-xs">
                  {pdfUrl}
                </span>
              </div>
            </div>
            <iframe
              src={pdfUrl}
              className="w-full h-[580px]"
              title="Vista previa del informe"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-xl bg-[#f8f9fb] flex flex-col items-center justify-center h-72 text-center px-6">
            <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">Vista previa no disponible</p>
            <p className="text-xs text-gray-400 mt-1">Guarda el informe primero para generar el PDF.</p>
          </div>
        )}

        {/* ── Mensajes de estado ───────────────────────────────── */}
        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {mensaje}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Acciones finales ─────────────────────────────────── */}
        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wide text-center">Acciones finales</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {/* Guardar borrador */}
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 px-5 py-2.5 rounded-xl transition font-semibold text-sm"
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
              onClick={() => setShowModal(true)}
              disabled={emitiendo || !informeId}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl transition font-bold text-sm shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Emitir informe
            </button>

            {/* Enviar al cliente */}
            <button
              type="button"
              onClick={handleEnviar}
              disabled={enviando || !informeId || !clienteEmail}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl transition font-semibold text-sm shadow-sm hover:shadow-md"
              title={!clienteEmail ? 'Agrega el email del cliente en Datos Generales' : 'Enviar informe por email'}
            >
              {enviando ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              )}
              {enviando ? 'Enviando...' : 'Enviar al cliente'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
