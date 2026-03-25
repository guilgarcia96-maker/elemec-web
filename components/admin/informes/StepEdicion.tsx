'use client';

import { useState, useCallback } from 'react';
import type { SeccionItem } from './StepAnalisisIA';

/* ─── Tipos ────────────────────────────────────────────────────────── */

interface Props {
  secciones: SeccionItem[];
  onChange: (secciones: SeccionItem[]) => void;
  informeId?: string;
  servicioTipo: string;
  descripcionTrabajos: string;
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

let secCounter = 0;
function nextSecId() {
  secCounter++;
  return `sec_${Date.now()}_${secCounter}`;
}

function arrayMove<T extends { orden: number }>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy.map((s, i) => ({ ...s, orden: i + 1 }));
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/* ─── Badge de tipo de sección ──────────────────────────────────── */
function TipoBadge({ tipo }: { tipo: SeccionItem['tipo'] }) {
  const map = {
    texto: { label: 'Texto', cls: 'bg-gray-100 text-gray-500' },
    fotos: { label: 'Fotos', cls: 'bg-blue-100 text-blue-600' },
    conclusion: { label: 'Conclusión', cls: 'bg-orange-100 text-orange-600' },
  };
  const { label, cls } = map[tipo];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

/* ─── Componente ──────────────────────────────────────────────────── */

export default function StepEdicion({
  secciones,
  onChange,
  informeId,
  servicioTipo,
  descripcionTrabajos,
}: Props) {
  const [regenerandoId, setRegenerandoId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(secciones.map((s) => s.id))
  );

  /* Toggle expandir/colapsar */
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /* Actualizar campo de una sección */
  const updateSeccion = useCallback(
    (id: string, field: keyof SeccionItem, value: string | boolean) => {
      onChange(secciones.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    },
    [secciones, onChange]
  );

  /* Reordenar */
  const moveUp = useCallback(
    (idx: number) => {
      if (idx <= 0) return;
      onChange(arrayMove(secciones, idx, idx - 1));
    },
    [secciones, onChange]
  );

  const moveDown = useCallback(
    (idx: number) => {
      if (idx >= secciones.length - 1) return;
      onChange(arrayMove(secciones, idx, idx + 1));
    },
    [secciones, onChange]
  );

  /* Agregar sección */
  const addSeccion = useCallback(() => {
    const nueva: SeccionItem = {
      id: nextSecId(),
      titulo: 'Nueva sección',
      contenido: '',
      tipo: 'texto',
      visible: true,
      orden: secciones.length + 1,
    };
    onChange([...secciones, nueva]);
    setExpandedIds((prev) => new Set([...prev, nueva.id]));
  }, [secciones, onChange]);

  /* Eliminar sección */
  const removeSeccion = useCallback(
    (id: string) => {
      const updated = secciones
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, orden: i + 1 }));
      onChange(updated);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [secciones, onChange]
  );

  /* Regenerar sección con IA */
  const regenerarSeccion = useCallback(
    async (secId: string) => {
      setRegenerandoId(secId);
      try {
        const seccion = secciones.find((s) => s.id === secId);
        if (!seccion) return;

        const res = await fetch('/api/admin/informes/generar-texto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            informe_id: informeId,
            servicio_tipo: servicioTipo,
            descripcion_trabajos: descripcionTrabajos,
            secciones: [{ id: seccion.id, titulo: seccion.titulo, tipo: seccion.tipo }],
            regenerar_seccion: secId,
          }),
        });

        if (!res.ok) throw new Error('Error al regenerar');

        const { secciones: generadas } = await res.json();
        const generada = generadas?.find((g: { id: string; contenido: string }) => g.id === secId);
        if (generada) {
          onChange(secciones.map((s) => (s.id === secId ? { ...s, contenido: generada.contenido } : s)));
        }
      } catch {
        // silencioso
      } finally {
        setRegenerandoId(null);
      }
    },
    [secciones, onChange, informeId, servicioTipo, descripcionTrabajos]
  );

  /* Expandir / colapsar todas */
  const expandAll = () => setExpandedIds(new Set(secciones.map((s) => s.id)));
  const collapseAll = () => setExpandedIds(new Set());

  return (
    <div className="space-y-4">
      {/* ── Cabecera ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">
            Secciones del informe
          </h3>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
            {secciones.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {secciones.length > 1 && (
            <>
              <button
                type="button"
                onClick={expandAll}
                className="text-xs text-gray-500 hover:text-gray-700 transition px-2 py-1 rounded hover:bg-gray-100"
              >
                Expandir todo
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="text-xs text-gray-500 hover:text-gray-700 transition px-2 py-1 rounded hover:bg-gray-100"
              >
                Colapsar todo
              </button>
              <div className="w-px h-4 bg-gray-200" />
            </>
          )}
          <button
            type="button"
            onClick={addSeccion}
            className="inline-flex items-center gap-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition font-semibold shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar sección
          </button>
        </div>
      </div>

      {secciones.length === 0 && (
        <div className="text-center py-14 text-sm text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          No hay secciones. Genera un borrador con IA en el paso anterior o agrega secciones manualmente.
        </div>
      )}

      {/* ── Lista de secciones ───────────────────────────────── */}
      <div className="space-y-3">
        {secciones.map((sec, idx) => {
          const isExpanded = expandedIds.has(sec.id);
          const isRegenerando = regenerandoId === sec.id;
          const words = wordCount(sec.contenido);

          return (
            <div
              key={sec.id}
              className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                !sec.visible
                  ? 'border-gray-100 opacity-55'
                  : sec.tipo === 'fotos'
                    ? 'border-blue-200 bg-blue-50/30'
                    : sec.tipo === 'conclusion'
                      ? 'border-orange-200 bg-orange-50/20'
                      : 'border-gray-200 bg-white'
              }`}
            >
              {/* ── Cabecera de sección ── */}
              <div className={`flex items-center gap-2 px-4 py-3 ${
                sec.tipo === 'fotos'
                  ? 'bg-blue-50/60'
                  : sec.tipo === 'conclusion'
                    ? 'bg-orange-50/60'
                    : 'bg-gray-50'
              }`}>
                {/* Flechas reorden */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-700 disabled:text-gray-200 transition rounded"
                    title="Mover arriba"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === secciones.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-700 disabled:text-gray-200 transition rounded"
                    title="Mover abajo"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Número de orden */}
                <span className="text-xs font-bold text-gray-400 w-4 text-center shrink-0">
                  {sec.orden}
                </span>

                {/* Título editable — clic también expande */}
                <input
                  type="text"
                  value={sec.titulo}
                  onChange={(e) => updateSeccion(sec.id, 'titulo', e.target.value)}
                  onClick={() => !isExpanded && toggleExpand(sec.id)}
                  className="flex-1 bg-transparent text-sm font-semibold text-gray-800 outline-none border-b border-transparent focus:border-orange-500 transition px-1 py-0.5 min-w-0"
                />

                {/* Badge tipo */}
                <TipoBadge tipo={sec.tipo} />

                {/* Contador palabras */}
                {sec.tipo !== 'fotos' && (
                  <span className="text-[10px] text-gray-400 hidden sm:block shrink-0">
                    {words} pal.
                  </span>
                )}

                {/* Toggle visible */}
                <button
                  type="button"
                  onClick={() => updateSeccion(sec.id, 'visible', !sec.visible)}
                  className={`p-1.5 rounded-lg transition-colors duration-150 ${
                    sec.visible ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/60' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-200/60'
                  }`}
                  title={sec.visible ? 'Ocultar del PDF' : 'Incluir en PDF'}
                >
                  {sec.visible ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>

                {/* Regenerar con IA */}
                {sec.tipo !== 'fotos' && (
                  <button
                    type="button"
                    onClick={() => regenerarSeccion(sec.id)}
                    disabled={isRegenerando}
                    className="p-1.5 rounded-lg text-orange-400 hover:text-orange-600 hover:bg-orange-50 disabled:text-orange-200 transition-all duration-150 flex items-center gap-1"
                    title="Regenerar con IA"
                  >
                    {isRegenerando ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Expandir / colapsar */}
                <button
                  type="button"
                  onClick={() => toggleExpand(sec.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-all duration-150"
                  title={isExpanded ? 'Colapsar' : 'Expandir'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Eliminar */}
                <button
                  type="button"
                  onClick={() => removeSeccion(sec.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                  title="Eliminar sección"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>

              {/* ── Contenido editable ── */}
              {isExpanded && (
                <div className="p-4">
                  {sec.tipo === 'fotos' ? (
                    <div className="flex items-center gap-2 py-3 text-sm text-blue-500 bg-blue-50/50 rounded-lg px-3">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                      Las fotos del registro fotográfico se incluirán automáticamente en el PDF.
                    </div>
                  ) : (
                    <div className="relative">
                      <textarea
                        value={sec.contenido}
                        onChange={(e) => updateSeccion(sec.id, 'contenido', e.target.value)}
                        placeholder={`Escribe el contenido de "${sec.titulo}"...`}
                        rows={7}
                        className="w-full rounded-xl border border-gray-200 bg-[#f8f9fb] px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:bg-white resize-y leading-relaxed min-h-[150px]"
                      />
                      {words > 0 && (
                        <span className="absolute bottom-2 right-3 text-[10px] text-gray-300 pointer-events-none">
                          {words} palabras
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
