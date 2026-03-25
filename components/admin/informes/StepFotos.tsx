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

    // Marcar como analizando
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

      const { descripcion } = await res.json();
      onChange(
        fotos.map((f) =>
          f.id === fotoId ? { ...f, descripcion, analizando: false } : f
        )
      );
    } catch {
      onChange(fotos.map((f) => (f.id === fotoId ? { ...f, analizando: false } : f)));
    }
  }, [fotos, onChange, informeId]);

  /* Analizar todas las fotos sin descripción */
  const analizarTodas = useCallback(async () => {
    const sinDescripcion = fotos.filter((f) => !f.descripcion && !f.analizando);
    if (sinDescripcion.length === 0) return;

    setBatchProgress({ current: 0, total: sinDescripcion.length });

    for (let i = 0; i < sinDescripcion.length; i++) {
      setBatchProgress({ current: i + 1, total: sinDescripcion.length });
      await analizarFoto(sinDescripcion[i].id);
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

  const sinDescripcion = fotos.filter((f) => !f.descripcion).length;

  return (
    <div className="space-y-6">
      {/* Zona drag & drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          dragging
            ? 'border-orange-500 bg-orange-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-gray-700">
          Arrastra fotos aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG, HEIC — múltiples archivos permitidos
        </p>
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

      {/* Barra de acciones */}
      {fotos.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {fotos.length} foto{fotos.length !== 1 ? 's' : ''}
            {sinDescripcion > 0 && (
              <span className="text-orange-500 ml-1">
                ({sinDescripcion} sin descripción)
              </span>
            )}
          </p>
          {sinDescripcion > 0 && (
            <button
              type="button"
              onClick={analizarTodas}
              disabled={!!batchProgress}
              className="text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-1.5 rounded-lg transition font-medium"
            >
              {batchProgress
                ? `Analizando ${batchProgress.current} de ${batchProgress.total}...`
                : `Analizar todas con IA (${sinDescripcion})`}
            </button>
          )}
        </div>
      )}

      {/* Grid de fotos */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
