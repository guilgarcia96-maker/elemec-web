'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PRESETS } from '@/lib/informe-presets';
import StepDatosGenerales, { type DatosGenerales } from './StepDatosGenerales';
import StepFotos, { type FotoItem } from './StepFotos';
import StepAnalisisIA, { type SeccionItem } from './StepAnalisisIA';
import StepEdicion from './StepEdicion';
import StepPreview from './StepPreview';

/* ─── Tipos ────────────────────────────────────────────────────────── */

export interface InformeData {
  id?: string;
  titulo: string;
  servicio_tipo: string;
  cliente_nombre: string;
  cliente_empresa: string;
  obra: string;
  ubicacion: string;
  fecha_trabajo: string;
  descripcion_trabajos: string;
  fotos: FotoItem[];
  secciones: SeccionItem[];
}

interface Props {
  editingId?: string;
  initialData?: InformeData;
}

/* ─── Pasos ───────────────────────────────────────────────────────── */

const STEPS = [
  { label: 'Datos generales', short: 'Datos' },
  { label: 'Fotos', short: 'Fotos' },
  { label: 'Análisis IA', short: 'IA' },
  { label: 'Edición', short: 'Edición' },
  { label: 'Preview', short: 'Preview' },
];

const DEFAULT_DATA: InformeData = {
  titulo: '',
  servicio_tipo: '',
  cliente_nombre: '',
  cliente_empresa: '',
  obra: '',
  ubicacion: '',
  fecha_trabajo: new Date().toISOString().split('T')[0],
  descripcion_trabajos: '',
  fotos: [],
  secciones: [],
};

/* ─── Componente ──────────────────────────────────────────────────── */

export default function InformeWizard({ editingId, initialData }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<InformeData>(initialData ?? DEFAULT_DATA);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const prevStepRef = useRef(step);

  /* ─── Auto-save al cambiar de paso ────────────────────────────── */
  useEffect(() => {
    if (prevStepRef.current !== step && data.id) {
      autoSave();
    }
    prevStepRef.current = step;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /* ─── Persistencia ────────────────────────────────────────────── */
  const autoSave = useCallback(async () => {
    if (!data.id) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/admin/informes/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: data.titulo,
          servicio_tipo: data.servicio_tipo,
          cliente_nombre: data.cliente_nombre,
          cliente_empresa: data.cliente_empresa,
          obra: data.obra,
          ubicacion: data.ubicacion,
          fecha_trabajo: data.fecha_trabajo,
          descripcion_trabajos: data.descripcion_trabajos,
          fotos: data.fotos.map((f) => ({
            id: f.id,
            url: f.url,
            descripcion: f.descripcion,
            orden: f.orden,
          })),
          secciones: data.secciones.map((s) => ({
            id: s.id,
            titulo: s.titulo,
            contenido: s.contenido,
            tipo: s.tipo,
            visible: s.visible,
            orden: s.orden,
          })),
        }),
      });
      if (!res.ok) throw new Error('Error al guardar');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [data]);

  /* Crear informe si no existe */
  const crearInforme = useCallback(async (): Promise<string | null> => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/admin/informes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: data.titulo,
          servicio_tipo: data.servicio_tipo,
          cliente_nombre: data.cliente_nombre,
          cliente_empresa: data.cliente_empresa,
          obra: data.obra,
          ubicacion: data.ubicacion,
          fecha_trabajo: data.fecha_trabajo,
          descripcion_trabajos: data.descripcion_trabajos,
        }),
      });
      if (!res.ok) throw new Error('Error al crear informe');
      const { id } = await res.json();
      setData((prev) => ({ ...prev, id }));
      return id;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al crear');
      return null;
    } finally {
      setSaving(false);
    }
  }, [data]);

  /* ─── Navegación ──────────────────────────────────────────────── */
  const goNext = useCallback(async () => {
    // Si estamos en paso 0 y no tenemos id, crear el informe
    if (step === 0 && !data.id) {
      const id = await crearInforme();
      if (!id) return; // error
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, data.id, crearInforme]);

  const goPrev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  /* ─── Handlers de datos ───────────────────────────────────────── */
  const handleDatosChange = useCallback((datos: DatosGenerales) => {
    setData((prev) => ({ ...prev, ...datos }));
  }, []);

  const handleTipoServicioChange = useCallback((tipo: string) => {
    const preset = PRESETS[tipo];
    if (!preset) return;
    const secciones: SeccionItem[] = preset.secciones.map((s, i) => ({
      id: `preset_${tipo}_${i}`,
      titulo: s.titulo,
      contenido: '',
      tipo: s.tipo,
      visible: true,
      orden: i + 1,
    }));
    setData((prev) => ({ ...prev, servicio_tipo: tipo, secciones }));
  }, []);

  const handleFotosChange = useCallback((fotos: FotoItem[]) => {
    setData((prev) => ({ ...prev, fotos }));
  }, []);

  const handleSeccionesChange = useCallback((secciones: SeccionItem[]) => {
    setData((prev) => ({ ...prev, secciones }));
  }, []);

  const handleDescripcionTrabajosChange = useCallback((val: string) => {
    setData((prev) => ({ ...prev, descripcion_trabajos: val }));
  }, []);

  /* ─── Acciones finales ────────────────────────────────────────── */
  const guardarBorrador = useCallback(async () => {
    if (!data.id) {
      const id = await crearInforme();
      if (!id) throw new Error('No se pudo crear el informe');
    }
    const res = await fetch(`/api/admin/informes/${data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: 'borrador',
        titulo: data.titulo,
        servicio_tipo: data.servicio_tipo,
        cliente_nombre: data.cliente_nombre,
        cliente_empresa: data.cliente_empresa,
        obra: data.obra,
        ubicacion: data.ubicacion,
        fecha_trabajo: data.fecha_trabajo,
        descripcion_trabajos: data.descripcion_trabajos,
        fotos: data.fotos.map((f) => ({
          id: f.id,
          url: f.url,
          descripcion: f.descripcion,
          orden: f.orden,
        })),
        secciones: data.secciones.map((s) => ({
          id: s.id,
          titulo: s.titulo,
          contenido: s.contenido,
          tipo: s.tipo,
          visible: s.visible,
          orden: s.orden,
        })),
      }),
    });
    if (!res.ok) throw new Error('Error al guardar borrador');
  }, [data, crearInforme]);

  const emitirInforme = useCallback(async () => {
    if (!data.id) throw new Error('El informe no ha sido creado');
    const res = await fetch(`/api/admin/informes/${data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: 'emitido',
        titulo: data.titulo,
        servicio_tipo: data.servicio_tipo,
        cliente_nombre: data.cliente_nombre,
        cliente_empresa: data.cliente_empresa,
        obra: data.obra,
        ubicacion: data.ubicacion,
        fecha_trabajo: data.fecha_trabajo,
        descripcion_trabajos: data.descripcion_trabajos,
        fotos: data.fotos.map((f) => ({
          id: f.id,
          url: f.url,
          descripcion: f.descripcion,
          orden: f.orden,
        })),
        secciones: data.secciones.map((s) => ({
          id: s.id,
          titulo: s.titulo,
          contenido: s.contenido,
          tipo: s.tipo,
          visible: s.visible,
          orden: s.orden,
        })),
      }),
    });
    if (!res.ok) throw new Error('Error al emitir informe');
  }, [data]);

  /* ─── Render ──────────────────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto">
      {/* Indicador de pasos */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Línea de fondo */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
          <div
            className="absolute top-4 left-0 h-0.5 bg-orange-500 transition-all duration-300"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((s, i) => {
            const isCompleted = i < step;
            const isActive = i === step;
            return (
              <div key={i} className="relative flex flex-col items-center z-10">
                <button
                  type="button"
                  onClick={() => {
                    if (i < step) setStep(i); // solo retroceder
                  }}
                  disabled={i > step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition border-2 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white cursor-pointer'
                      : isActive
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </button>
                <span
                  className={`mt-1.5 text-[11px] font-medium whitespace-nowrap ${
                    isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.short}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicador de guardado */}
      {saving && (
        <div className="mb-4 text-xs text-orange-500 flex items-center gap-1.5">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Guardando...
        </div>
      )}
      {saveError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {saveError}
        </div>
      )}

      {/* Contenido del paso activo */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[400px]">
        {step === 0 && (
          <StepDatosGenerales
            data={{
              titulo: data.titulo,
              servicio_tipo: data.servicio_tipo,
              cliente_nombre: data.cliente_nombre,
              cliente_empresa: data.cliente_empresa,
              obra: data.obra,
              ubicacion: data.ubicacion,
              fecha_trabajo: data.fecha_trabajo,
            }}
            onChange={handleDatosChange}
            onTipoServicioChange={handleTipoServicioChange}
          />
        )}
        {step === 1 && (
          <StepFotos
            fotos={data.fotos}
            onChange={handleFotosChange}
            informeId={data.id}
          />
        )}
        {step === 2 && (
          <StepAnalisisIA
            fotos={data.fotos}
            onFotosChange={handleFotosChange}
            secciones={data.secciones}
            onSeccionesChange={handleSeccionesChange}
            descripcionTrabajos={data.descripcion_trabajos}
            onDescripcionTrabajosChange={handleDescripcionTrabajosChange}
            informeId={data.id}
            servicioTipo={data.servicio_tipo}
          />
        )}
        {step === 3 && (
          <StepEdicion
            secciones={data.secciones}
            onChange={handleSeccionesChange}
            informeId={data.id}
            servicioTipo={data.servicio_tipo}
            descripcionTrabajos={data.descripcion_trabajos}
          />
        )}
        {step === 4 && (
          <StepPreview
            informeId={data.id}
            onGuardarBorrador={guardarBorrador}
            onEmitir={emitirInforme}
          />
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={goPrev}
          disabled={step === 0}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Anterior
        </button>

        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={goNext}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 rounded-lg transition"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}
