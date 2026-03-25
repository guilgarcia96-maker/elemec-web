'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  cliente_email: string;
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
  { label: 'Registro fotográfico', short: 'Fotos' },
  { label: 'Análisis IA', short: 'IA' },
  { label: 'Edición', short: 'Edición' },
  { label: 'Vista previa', short: 'Preview' },
];

const DEFAULT_DATA: InformeData = {
  titulo: '',
  servicio_tipo: '',
  cliente_nombre: '',
  cliente_empresa: '',
  cliente_email: '',
  obra: '',
  ubicacion: '',
  fecha_trabajo: new Date().toISOString().split('T')[0],
  descripcion_trabajos: '',
  fotos: [],
  secciones: [],
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/* ─── Iconos inline ───────────────────────────────────────────────── */

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

/* ─── Componente ──────────────────────────────────────────────────── */

export default function InformeWizard({ editingId, initialData }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<InformeData>(initialData ?? DEFAULT_DATA);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');
  const [visible, setVisible] = useState(true);
  const prevStepRef = useRef(step);

  /* ─── Toast helper ────────────────────────────────────────────── */
  const showToast = useCallback((msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  /* ─── Auto-save al cambiar de paso ────────────────────────────── */
  useEffect(() => {
    if (prevStepRef.current !== step && data.id) {
      autoSave();
    }
    prevStepRef.current = step;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /* ─── Persistencia ────────────────────────────────────────────── */
  const buildPatchBody = useCallback(() => ({
    titulo: data.titulo,
    servicio_tipo: data.servicio_tipo,
    cliente_nombre: data.cliente_nombre,
    cliente_empresa: data.cliente_empresa,
    cliente_email: data.cliente_email,
    obra: data.obra,
    ubicacion: data.ubicacion,
    fecha_trabajo: data.fecha_trabajo,
    descripcion_trabajos: data.descripcion_trabajos,
    contenido_json: {
      secciones: data.secciones.map((s) => ({
        id: s.id,
        titulo: s.titulo,
        contenido: s.contenido,
        tipo: s.tipo,
        visible: s.visible,
        orden: s.orden,
      })),
    },
  }), [data]);

  const autoSave = useCallback(async () => {
    if (!data.id) return;
    setSaveStatus('saving');
    setSaveError('');
    try {
      const res = await fetch(`/api/admin/informes/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPatchBody()),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setSaveError(msg);
      setSaveStatus('error');
    }
  }, [data, buildPatchBody]);

  /* Crear informe si no existe */
  const crearInforme = useCallback(async (): Promise<string | null> => {
    setSaveStatus('saving');
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
          cliente_email: data.cliente_email,
          obra: data.obra,
          ubicacion: data.ubicacion,
          fecha_trabajo: data.fecha_trabajo,
          descripcion_trabajos: data.descripcion_trabajos,
        }),
      });
      if (!res.ok) throw new Error('Error al crear informe');
      const { id } = await res.json();
      setData((prev) => ({ ...prev, id }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
      return id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear';
      setSaveError(msg);
      setSaveStatus('error');
      showToast(msg, 'error');
      return null;
    }
  }, [data, showToast]);

  /* ─── Navegación animada ──────────────────────────────────────── */
  const navigateTo = useCallback((target: number) => {
    const dir = target > step ? 'forward' : 'back';
    setAnimDir(dir);
    setVisible(false);
    setTimeout(() => {
      setStep(target);
      setVisible(true);
    }, 150);
  }, [step]);

  const goNext = useCallback(async () => {
    if (step === 0 && !data.id) {
      const id = await crearInforme();
      if (!id) return;
    }
    navigateTo(Math.min(step + 1, STEPS.length - 1));
  }, [step, data.id, crearInforme, navigateTo]);

  const goPrev = useCallback(() => {
    navigateTo(Math.max(step - 1, 0));
  }, [step, navigateTo]);

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
    const efectiveId = data.id ?? await crearInforme();
    if (!efectiveId) throw new Error('No se pudo crear el informe');
    const res = await fetch(`/api/admin/informes/${efectiveId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: 'borrador',
        ...buildPatchBody(),
      }),
    });
    if (!res.ok) throw new Error('Error al guardar borrador');
  }, [data, crearInforme, buildPatchBody]);

  const emitirInforme = useCallback(async () => {
    if (!data.id) throw new Error('El informe no ha sido creado');
    const res = await fetch(`/api/admin/informes/${data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: 'emitido',
        ...buildPatchBody(),
      }),
    });
    if (!res.ok) throw new Error('Error al emitir informe');
    router.push(`/admin/informes/${data.id}`);
  }, [data, buildPatchBody, router]);

  /* ─── Render ──────────────────────────────────────────────────── */
  const isSaving = saveStatus === 'saving';

  return (
    <div className="max-w-4xl mx-auto pb-24">

      {/* Toast de error / éxito */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {/* ─── Indicador de pasos ──────────────────────────────────── */}
      <div className="mb-8">
        {/* Texto de progreso */}
        <p className="text-xs text-gray-400 font-medium mb-4 text-center tracking-wide uppercase">
          Paso {step + 1} de {STEPS.length} — {STEPS[step].label}
        </p>

        {/* Barra de pasos */}
        <div className="flex items-start justify-between relative">
          {/* Línea de fondo */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" style={{ left: '5%', right: '5%' }} />
          {/* Línea de progreso */}
          <div
            className="absolute top-5 h-0.5 bg-orange-500 transition-all duration-500 z-0"
            style={{
              left: '5%',
              width: `${(step / (STEPS.length - 1)) * 90}%`,
            }}
          />

          {STEPS.map((s, i) => {
            const isCompleted = i < step;
            const isActive = i === step;
            return (
              <div key={i} className="relative flex flex-col items-center z-10" style={{ width: '20%' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (i < step) navigateTo(i);
                  }}
                  disabled={i > step}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 border-2 shadow-sm ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white cursor-pointer hover:bg-green-600 hover:border-green-600'
                      : isActive
                        ? 'bg-orange-500 border-orange-500 text-white ring-4 ring-orange-100 animate-pulse-subtle'
                        : 'bg-white border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <IconCheck /> : i + 1}
                </button>
                <span
                  className={`mt-2 text-[11px] font-medium text-center leading-tight px-1 ${
                    isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <span className="hidden sm:block">{s.label}</span>
                  <span className="sm:hidden">{s.short}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Error de guardado inline ─────────────────────────────── */}
      {saveStatus === 'error' && saveError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {saveError}
        </div>
      )}

      {/* ─── Contenido del paso activo ────────────────────────────── */}
      <div
        className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[420px] transition-all duration-150 ${
          visible
            ? 'opacity-100 translate-y-0'
            : animDir === 'forward'
              ? 'opacity-0 translate-y-2'
              : 'opacity-0 -translate-y-2'
        }`}
      >
        {step === 0 && (
          <StepDatosGenerales
            data={{
              titulo: data.titulo,
              servicio_tipo: data.servicio_tipo,
              cliente_nombre: data.cliente_nombre,
              cliente_empresa: data.cliente_empresa,
              cliente_email: data.cliente_email,
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
            clienteEmail={data.cliente_email}
            onGuardarBorrador={guardarBorrador}
            onEmitir={emitirInforme}
          />
        )}
      </div>

      {/* ─── Barra de navegación sticky ───────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Botón Anterior */}
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <IconChevronLeft />
            Anterior
          </button>

          {/* Indicador de guardado centrado */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            {saveStatus === 'saving' && (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-orange-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-orange-500">Guardando...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-600">Guardado</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span className="text-red-500">Sin guardar</span>
              </>
            )}
            {saveStatus === 'idle' && data.id && (
              <span className="text-gray-300">Guardado automático activo</span>
            )}
          </div>

          {/* Botón Siguiente (oculto en paso final) */}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 rounded-lg transition-all duration-200 shadow-sm"
            >
              Siguiente
              <IconChevronRight />
            </button>
          ) : (
            /* Placeholder para mantener layout balanceado en paso final */
            <div className="w-[110px]" />
          )}
        </div>
      </div>
    </div>
  );
}
