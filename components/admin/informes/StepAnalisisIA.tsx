'use client';

import { useState, useCallback } from 'react';
import type { FotoItem } from './StepFotos';

/* ─── Tipos ────────────────────────────────────────────────────────── */

export interface SeccionItem {
  id: string;
  titulo: string;
  contenido: string;
  tipo: 'texto' | 'fotos' | 'conclusion';
  visible: boolean;
  orden: number;
}

interface Props {
  fotos: FotoItem[];
  onFotosChange: (fotos: FotoItem[]) => void;
  secciones: SeccionItem[];
  onSeccionesChange: (secciones: SeccionItem[]) => void;
  descripcionTrabajos: string;
  onDescripcionTrabajosChange: (val: string) => void;
  informeId?: string;
  servicioTipo: string;
}

/* ─── Componente ──────────────────────────────────────────────────── */

export default function StepAnalisisIA({
  fotos,
  onFotosChange,
  secciones,
  onSeccionesChange,
  descripcionTrabajos,
  onDescripcionTrabajosChange,
  informeId,
  servicioTipo,
}: Props) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  /* Regenerar descripción de una foto individual */
  const regenerarFoto = useCallback(async (fotoId: string) => {
    const foto = fotos.find((f) => f.id === fotoId);
    if (!foto) return;

    onFotosChange(fotos.map((f) => (f.id === fotoId ? { ...f, analizando: true } : f)));

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
      onFotosChange(
        fotos.map((f) => (f.id === fotoId ? { ...f, descripcion, analizando: false } : f))
      );
    } catch {
      onFotosChange(fotos.map((f) => (f.id === fotoId ? { ...f, analizando: false } : f)));
    }
  }, [fotos, onFotosChange, informeId]);

  /* Generar borrador completo del informe */
  const generarBorrador = useCallback(async () => {
    setGenerando(true);
    setError('');

    try {
      const res = await fetch('/api/admin/informes/generar-texto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          informe_id: informeId,
          servicio_tipo: servicioTipo,
          descripcion_trabajos: descripcionTrabajos,
          fotos: fotos.map((f) => ({
            url: f.url,
            descripcion: f.descripcion,
            orden: f.orden,
          })),
          secciones: secciones.map((s) => ({
            id: s.id,
            titulo: s.titulo,
            tipo: s.tipo,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Error al generar borrador');
      }

      const { secciones: generadas } = await res.json();

      // Actualizar contenido de secciones existentes con lo generado
      const updated = secciones.map((sec) => {
        const generada = generadas?.find((g: { id: string; contenido: string }) => g.id === sec.id);
        return generada ? { ...sec, contenido: generada.contenido } : sec;
      });

      onSeccionesChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setGenerando(false);
    }
  }, [informeId, servicioTipo, descripcionTrabajos, fotos, secciones, onSeccionesChange]);

  const fotosConDescripcion = fotos.filter((f) => f.descripcion);

  return (
    <div className="space-y-8">
      {/* Resumen de fotos analizadas */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Fotos analizadas ({fotosConDescripcion.length} de {fotos.length})
        </h3>

        {fotos.length === 0 && (
          <p className="text-sm text-gray-400 italic">
            No hay fotos cargadas. Vuelve al paso anterior para agregar fotos.
          </p>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {fotos.map((foto) => (
            <div key={foto.id} className="flex gap-3 bg-white border border-gray-200 rounded-lg p-3">
              <img
                src={foto.url}
                alt={`Foto ${foto.orden}`}
                className="w-20 h-20 object-cover rounded shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-500">#{foto.orden}</span>
                  {foto.descripcion && (
                    <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">
                      IA
                    </span>
                  )}
                </div>
                <textarea
                  value={foto.descripcion}
                  onChange={(e) =>
                    onFotosChange(
                      fotos.map((f) =>
                        f.id === foto.id ? { ...f, descripcion: e.target.value } : f
                      )
                    )
                  }
                  placeholder="Sin descripción"
                  rows={2}
                  className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 resize-none"
                />
                <button
                  type="button"
                  onClick={() => regenerarFoto(foto.id)}
                  disabled={foto.analizando}
                  className="mt-1 text-xs text-orange-500 hover:text-orange-600 disabled:text-gray-300 font-medium transition"
                >
                  {foto.analizando ? 'Analizando...' : 'Regenerar descripción'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Descripción general de los trabajos */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Descripción general de los trabajos
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Proporciona contexto para que la IA genere un mejor informe. Describe brevemente qué se hizo, dónde y por qué.
        </p>
        <textarea
          value={descripcionTrabajos}
          onChange={(e) => onDescripcionTrabajosChange(e.target.value)}
          placeholder="Ej: Se realizó el montaje de un intercambiador de calor en la planta de procesos. Los trabajos incluyeron la preparación de bases, izaje con grúa de 50 ton, nivelación y alineamiento..."
          rows={5}
          className="w-full rounded border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 resize-y"
        />
      </div>

      {/* Botón generar borrador */}
      <div className="flex flex-col items-center gap-3 py-4">
        <button
          type="button"
          onClick={generarBorrador}
          disabled={generando}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2.5 rounded-lg transition font-semibold text-sm flex items-center gap-2"
        >
          {generando ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generando borrador...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Generar borrador del informe con IA
            </>
          )}
        </button>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* Preview de secciones generadas */}
        {secciones.some((s) => s.contenido) && (
          <div className="w-full mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Vista previa de secciones generadas
            </h3>
            <div className="space-y-3">
              {secciones
                .filter((s) => s.contenido)
                .map((sec) => (
                  <div key={sec.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-1">{sec.titulo}</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {sec.contenido}
                    </p>
                  </div>
                ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Podrás editar todas las secciones en el siguiente paso.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
