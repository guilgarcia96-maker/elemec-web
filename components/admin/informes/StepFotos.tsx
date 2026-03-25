'use client';

import { useRef, useState, useCallback } from 'react';
import FotoCard from './FotoCard';

/* ─── Tipos ────────────────────────────────────────────────────────── */

export interface FotoItem {
  id: string;
  url: string;
  descripcion: string;
  analizando: boolean;
  orden: number;
  /** Archivo local (antes de subir a storage) */
  file?: File;
}

interface Props {
  fotos: FotoItem[];
  onChange: (fotos: FotoItem[]) => void;
  informeId?: string;
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

let fotoCounter = 0;
function nextId() {
  fotoCounter++;
  return `foto_${Date.now()}_${fotoCounter}`;
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy.map((f, i) => ({ ...(f as T & { orden: number }), orden: i + 1 }));
}

/* ─── Componente ──────────────────────────────────────────────────── */

export default function StepFotos({ fotos, onChange, informeId }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  /* Agregar archivos */
  const addFiles = useCallback((files: FileList | File[]) => {
    const newFotos: FotoItem[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file, i) => ({
        id: nextId(),
        url: URL.createObjectURL(file),
        descripcion: '',
        analizando: false,
        orden: fotos.length + i + 1,
        file,
      }));
    if (newFotos.length > 0) {
      onChange([...fotos, ...newFotos]);
    }
  }, [fotos, onChange]);

  /* Drag & drop handlers */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  /* Analizar una foto con IA */
  const analizarFoto = useCallback(async (fotoId: string) => {
    const foto = fotos.find((f) => f.id === fotoId);
    if (!foto) return;

    onChange(fotos.map((f) => (f.id === fotoId ? { ...f, analizando: true } : f)));

    try {
      const formData = new FormData();
      if (foto.file) {
        formData.append('foto', foto.file);
      } else {
        formData.append('foto_url', foto.url);
      }
      if (informeId) formData.append('informe_id', informeId);

      const res = await fetch('/api/admin/informes/analizar-foto', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al analizar foto');

      const data = await res.json();
      const desc = data.descripcion_ai ?? data.descripcion ?? '';
      onChange(
        fotos.map((f) =>
          f.id === fotoId ? { ...f, descripcion: desc, analizando: false } : f
        )
      );
    } catch {
      onChange(fotos.map((f) => (f.id === fotoId ? { ...f, analizando: false } : f)));
    }
  }, [fotos, onChange, informeId]);

  /* Analizar todas las fotos sin descripción (en chunks de 3) */
  const analizarTodas = useCallback(async () => {
    const sinDescripcion = fotos.filter((f) => !f.descripcion && !f.analizando);
    if (sinDescripcion.length === 0) return;

    setBatchProgress({ current: 0, total: sinDescripcion.length });
    const CHUNK_SIZE = 3;
    let processed = 0;

    for (let i = 0; i < sinDescripcion.length; i += CHUNK_SIZE) {
      const chunk = sinDescripcion.slice(i, i + CHUNK_SIZE);
      await Promise.allSettled(chunk.map((f) => analizarFoto(f.id)));
      processed += chunk.length;
      setBatchProgress({ current: processed, total: sinDescripcion.length });
    }

    setBatchProgress(null);
  }, [fotos, analizarFoto]);

  /* Cambiar descripción */
  const handleDescripcionChange = useCallback((fotoId: string, val: string) => {
    onChange(fotos.map((f) => (f.id === fotoId ? { ...f, descripcion: val } : f)));
  }, [fotos, onChange]);

  /* Reordenar */
  const handleMoveUp = useCallback((idx: number) => {
    if (idx <= 0) return;
    onChange(arrayMove(fotos, idx, idx - 1));
  }, [fotos, onChange]);

  const handleMoveDown = useCallback((idx: number) => {
    if (idx >= fotos.length - 1) return;
    onChange(arrayMove(fotos, idx, idx + 1));
  }, [fotos, onChange]);

  /* Eliminar */
  const handleRemove = useCallback((fotoId: string) => {
    const updated = fotos
      .filter((f) => f.id !== fotoId)
      .map((f, i) => ({ ...f, orden: i + 1 }));
    onChange(updated);
  }, [fotos, onChange]);

  /* Stats */
  const analizadas = fotos.filter((f) => f.descripcion && !f.analizando).length;
  const sinDescripcion = fotos.filter((f) => !f.descripcion && !f.analizando).length;
  const analizando = fotos.filter((f) => f.analizando).length;
  const pct = fotos.length > 0 ? Math.round((analizadas / fotos.length) * 100) : 0;
  const compact = fotos.length >= 9;

  return (
    <div className="space-y-6">

      {/* ── Zona drag & drop ─────────────────────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-orange-500 bg-orange-50/80 scale-[1.01]'
            : 'border-gray-300 bg-[#f8f9fb] hover:border-orange-400 hover:bg-orange-50/40'
        } ${fotos.length === 0 ? 'py-14' : 'py-8'}`}
      >
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <div className={`rounded-xl p-3 transition-colors duration-200 ${dragging ? 'bg-orange-100' : 'bg-gray-100'}`}>
            <svg
              className={`h-8 w-8 transition-colors duration-200 ${dragging ? 'text-orange-500' : 'text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
          <p className={`text-sm font-semibold transition-colors duration-200 ${dragging ? 'text-orange-600' : 'text-gray-700'}`}>
            {dragging ? 'Suelta las fotos aquí' : 'Arrastra tus fotos aquí o haz clic para seleccionar'}
          </p>
          <p className="text-xs text-gray-400">JPG, PNG, HEIC — múltiples archivos permitidos</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* ── Panel de estadísticas y acciones ─────────────────── */}
      {fotos.length > 0 && (
        <div className="bg-[#f8f9fb] border border-gray-200 rounded-xl p-4 space-y-3">
          {/* Contador */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-gray-700">
                {fotos.length} foto{fotos.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                {analizadas} analizadas
              </span>
              {sinDescripcion > 0 && (
                <span className="flex items-center gap-1 text-gray-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                  {sinDescripcion} pendientes
                </span>
              )}
              {analizando > 0 && (
                <span className="flex items-center gap-1 text-orange-500 font-medium">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {analizando} analizando
                </span>
              )}
            </div>

            {sinDescripcion > 0 && (
              <button
                type="button"
                onClick={analizarTodas}
                disabled={!!batchProgress}
                className="inline-flex items-center gap-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg transition font-semibold shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                {batchProgress
                  ? `Analizando ${batchProgress.current} de ${batchProgress.total}...`
                  : `Analizar todas con IA (${sinDescripcion})`}
              </button>
            )}
          </div>

          {/* Barra de progreso */}
          {fotos.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Progreso de análisis</span>
                <span className="text-xs font-semibold text-gray-600">{pct}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {batchProgress && (
                <p className="text-xs text-orange-500 font-medium">
                  Procesando foto {batchProgress.current} de {batchProgress.total}...
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Grid de fotos ─────────────────────────────────────── */}
      {fotos.length > 0 && (
        <div className={`grid gap-4 ${compact ? 'grid-cols-3 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
          {fotos.map((foto, idx) => (
            <FotoCard
              key={foto.id}
              src={foto.url}
              descripcion={foto.descripcion}
              onDescripcionChange={(val) => handleDescripcionChange(foto.id, val)}
              onAnalizar={() => analizarFoto(foto.id)}
              analizando={foto.analizando}
              orden={foto.orden}
              onMoveUp={idx > 0 ? () => handleMoveUp(idx) : undefined}
              onMoveDown={idx < fotos.length - 1 ? () => handleMoveDown(idx) : undefined}
              onRemove={() => handleRemove(foto.id)}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
