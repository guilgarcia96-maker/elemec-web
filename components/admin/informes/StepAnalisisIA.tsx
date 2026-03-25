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

type TabActiva = 'fotos' | 'contenido';

/* ─── Skeleton de carga ───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex gap-3 animate-pulse">
      <div className="w-16 h-16 rounded-lg bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );
}

function SkeletonSeccion() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
      <div className="h-3 bg-gray-200 rounded w-4/6" />
    </div>
  );
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
  const [tab, setTab] = useState<TabActiva>('fotos');
  const [expandedSec, setExpandedSec] = useState<string | null>(null);

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

      const updated = secciones.map((sec) => {
        const generada = generadas?.find((g: { id: string; contenido: string }) => g.id === sec.id);
        return generada ? { ...sec, contenido: generada.contenido } : sec;
      });

      onSeccionesChange(updated);
      // Cambiar a tab de contenido tras generar
      setTab('contenido');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setGenerando(false);
    }
  }, [informeId, servicioTipo, descripcionTrabajos, fotos, secciones, onSeccionesChange]);

  const fotosConDescripcion = fotos.filter((f) => f.descripcion);
  const seccionesGeneradas = secciones.filter((s) => s.contenido && s.tipo !== 'fotos');

  return (
    <div className="space-y-6">

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab('fotos')}
          className={`px-5 py-2.5 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px ${
            tab === 'fotos'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            Descripciones de fotos
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              tab === 'fotos' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {fotosConDescripcion.length}/{fotos.length}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab('contenido')}
          className={`px-5 py-2.5 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px ${
            tab === 'contenido'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Contenido del informe
            {seccionesGeneradas.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                tab === 'contenido' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
              }`}>
                {seccionesGeneradas.length} generadas
              </span>
            )}
          </span>
        </button>
      </div>

      {/* ── Tab: Descripciones de fotos ───────────────────────── */}
      {tab === 'fotos' && (
        <div className="space-y-3">
          {fotos.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              No hay fotos cargadas. Vuelve al paso anterior para agregar fotos.
            </div>
          )}

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {fotos.map((foto) => (
              <div key={foto.id} className="flex gap-3 bg-white border border-gray-200 rounded-xl p-3 hover:border-gray-300 transition-all duration-200">
                {/* Thumbnail */}
                <div className="relative shrink-0">
                  <img
                    src={foto.url}
                    alt={`Foto ${foto.orden}`}
                    loading="lazy"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-gray-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {foto.orden}
                  </span>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {foto.descripcion && !foto.analizando && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                        Analizada
                      </span>
                    )}
                    {foto.analizando && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide flex items-center gap-1">
                        <svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Analizando
                      </span>
                    )}
                    {!foto.descripcion && !foto.analizando && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                        Pendiente
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
                    placeholder="Sin descripción — escribe manualmente o regenera con IA"
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 bg-[#f8f9fb] px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:bg-white resize-none leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={() => regenerarFoto(foto.id)}
                    disabled={foto.analizando}
                    className="mt-1.5 text-xs text-orange-500 hover:text-orange-600 disabled:text-gray-300 font-semibold transition-colors duration-150 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    {foto.analizando ? 'Analizando...' : 'Regenerar con IA'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Contenido del informe ────────────────────────── */}
      {tab === 'contenido' && (
        <div className="space-y-6">
          {/* Descripción de trabajos */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Descripción general de los trabajos
            </label>
            <p className="text-xs text-gray-400 mb-2.5">
              Proporciona contexto para que la IA genere un mejor informe. Describe brevemente qué se hizo, dónde y por qué.
            </p>
            <div className="relative">
              <textarea
                value={descripcionTrabajos}
                onChange={(e) => onDescripcionTrabajosChange(e.target.value)}
                placeholder="Ej: Se realizó el montaje de un intercambiador de calor en la planta de procesos. Los trabajos incluyeron la preparación de bases, izaje con grúa de 50 ton, nivelación y alineamiento..."
                rows={5}
                className="w-full rounded-xl border border-gray-200 bg-[#f8f9fb] px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:bg-white resize-y leading-relaxed"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-gray-300 pointer-events-none">
                {descripcionTrabajos.length} caracteres
              </span>
            </div>
          </div>

          {/* Botón generar borrador */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={generarBorrador}
              disabled={generando}
              className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-8 py-3 rounded-xl transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
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
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  Generar borrador del informe con IA
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2 w-full max-w-md">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          {/* Skeletons mientras genera */}
          {generando && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 text-center">La IA está redactando las secciones del informe...</p>
              {[1, 2, 3].map((i) => <SkeletonSeccion key={i} />)}
            </div>
          )}

          {/* Vista previa de secciones generadas */}
          {!generando && seccionesGeneradas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  Secciones generadas ({seccionesGeneradas.length})
                </h3>
                <span className="text-xs text-gray-400">Haz clic en cada sección para ver el contenido completo</span>
              </div>
              <div className="space-y-2">
                {secciones
                  .filter((s) => s.contenido && s.tipo !== 'fotos')
                  .map((sec) => {
                    const isExpanded = expandedSec === sec.id;
                    return (
                      <div key={sec.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedSec(isExpanded ? null : sec.id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors duration-150 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              sec.tipo === 'conclusion' ? 'bg-orange-400' : 'bg-blue-400'
                            }`} />
                            <span className="text-sm font-semibold text-gray-800">{sec.titulo}</span>
                            {!isExpanded && (
                              <span className="text-xs text-gray-400 truncate max-w-[280px]">
                                — {sec.contenido.substring(0, 80)}...
                              </span>
                            )}
                          </div>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-100">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pt-3">
                              {sec.contenido}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
              <p className="text-xs text-gray-400 text-center pt-1">
                Podrás editar y reorganizar todas las secciones en el siguiente paso.
              </p>
            </div>
          )}

          {/* Skeletons de fotos si no hay fotos analizadas */}
          {!generando && fotos.length > 0 && fotosConDescripcion.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Tienes {fotos.length} foto{fotos.length !== 1 ? 's' : ''} sin analizar. Analízalas primero para que la IA genere descripciones más detalladas.
            </div>
          )}
        </div>
      )}

      {/* Skeletons loading tab fotos */}
      {tab === 'fotos' && generando && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}
    </div>
  );
}
