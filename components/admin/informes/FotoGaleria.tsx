"use client";

import { useState } from "react";

interface Foto {
  url: string;
  descripcion: string;
  nombre: string;
}

interface Props {
  fotos: Foto[];
}

export default function FotoGaleria({ fotos }: Props) {
  const [ampliada, setAmpliada] = useState<number | null>(null);

  if (fotos.length === 0) return null;

  const cerrar = () => setAmpliada(null);
  const anterior = () =>
    setAmpliada((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
  const siguiente = () =>
    setAmpliada((prev) => (prev !== null ? Math.min(fotos.length - 1, prev + 1) : null));

  return (
    <>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {fotos.map((foto, i) => (
          <div
            key={i}
            className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition hover:shadow-md"
            onClick={() => setAmpliada(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto.url}
              alt={foto.nombre || `Foto ${i + 1}`}
              className="h-48 w-full object-cover"
            />
            {foto.descripcion && (
              <div className="px-3 py-2">
                <p className="text-xs font-bold text-gray-400">Foto {i + 1}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-600">
                  {foto.descripcion}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {ampliada !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={cerrar}
        >
          <div
            className="relative mx-4 max-w-3xl w-full rounded-xl overflow-hidden bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={cerrar}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotos[ampliada].url}
              alt={fotos[ampliada].nombre || `Foto ${ampliada + 1}`}
              className="w-full max-h-[70vh] object-contain bg-gray-950"
            />

            {fotos[ampliada].descripcion && (
              <div className="px-5 py-3">
                <p className="text-xs font-bold text-orange-500 mb-1">
                  Foto {ampliada + 1} de {fotos.length}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {fotos[ampliada].descripcion}
                </p>
              </div>
            )}

            {/* Navegación */}
            <div className="flex items-center justify-between px-5 pb-4">
              <button
                onClick={anterior}
                disabled={ampliada === 0}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-400 disabled:opacity-30 transition"
              >
                ← Anterior
              </button>
              <span className="text-xs text-gray-400">
                {ampliada + 1} / {fotos.length}
              </span>
              <button
                onClick={siguiente}
                disabled={ampliada === fotos.length - 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-400 disabled:opacity-30 transition"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
