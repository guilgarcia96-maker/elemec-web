"use client";

import { useState } from "react";

interface AdjuntoPreviewPanelProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  titulo?: string;
  datos: Array<{ label: string; valor: string | number | null }>;
  ocrText?: string | null;
}

export default function AdjuntoPreviewPanel({
  open,
  onClose,
  imageUrl,
  titulo,
  datos,
  ocrText,
}: AdjuntoPreviewPanelProps) {
  const [ocrOpen, setOcrOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-white/10 bg-[#13131f] transition-transform duration-300 md:w-[480px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">
            {titulo || "Vista previa"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:border-white/30 hover:text-white"
            aria-label="Cerrar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto">
          {/* Imagen */}
          {imageUrl ? (
            <div className="border-b border-white/10 p-4">
              <a href={imageUrl} target="_blank" rel="noreferrer" title="Abrir imagen completa">
                <img
                  src={imageUrl}
                  alt={titulo || "Documento adjunto"}
                  className="max-h-[400px] w-full rounded-lg border border-white/10 object-contain transition hover:border-orange-500/50"
                />
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-center border-b border-white/10 p-10">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-xs text-white/30">Sin imagen disponible</p>
              </div>
            </div>
          )}

          {/* Datos registrados */}
          <div className="border-b border-white/10 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
              Datos registrados
            </h3>
            <div className="space-y-2">
              {datos.map((d, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-sm">
                  <span className="shrink-0 text-white/40">{d.label}</span>
                  <span className="text-right text-white/80">
                    {d.valor != null && d.valor !== "" ? String(d.valor) : "—"}
                  </span>
                </div>
              ))}
              {datos.length === 0 && (
                <p className="text-xs text-white/30">Sin datos registrados</p>
              )}
            </div>
          </div>

          {/* Texto OCR (colapsable) */}
          {ocrText && (
            <div className="p-4">
              <button
                onClick={() => setOcrOpen(!ocrOpen)}
                className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-widest text-white/40 transition hover:text-white/60"
              >
                <span>Texto OCR</span>
                <svg
                  className={`h-4 w-4 transition-transform ${ocrOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {ocrOpen && (
                <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-xs text-white/60">
                  {ocrText}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {imageUrl && (
          <div className="shrink-0 border-t border-white/10 px-5 py-3">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-orange-500 transition hover:text-orange-400"
            >
              Abrir imagen completa
            </a>
          </div>
        )}
      </div>
    </>
  );
}
