'use client';

import { PRESETS, type PresetConfig } from '@/lib/informe-presets';

/* ─── Tipos ────────────────────────────────────────────────────────── */

export interface DatosGenerales {
  titulo: string;
  servicio_tipo: string;
  cliente_nombre: string;
  cliente_empresa: string;
  obra: string;
  ubicacion: string;
  fecha_trabajo: string;
}

interface Props {
  data: DatosGenerales;
  onChange: (data: DatosGenerales) => void;
  onTipoServicioChange: (tipo: string) => void;
}

/* ─── Iconos por tipo ──────────────────────────────────────────────── */

function ServiceIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className ?? 'w-8 h-8';
  switch (icon) {
    case 'wrench':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
        </svg>
      );
    case 'cog':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'thermometer':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
        </svg>
      );
    case 'compass':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
  }
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

const inputCls =
  'w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20';

const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

/* ─── Componente ──────────────────────────────────────────────────── */

export default function StepDatosGenerales({ data, onChange, onTipoServicioChange }: Props) {
  function update(field: keyof DatosGenerales, value: string) {
    onChange({ ...data, [field]: value });
  }

  function handleTipoClick(tipo: string) {
    update('servicio_tipo', tipo);
    onTipoServicioChange(tipo);
  }

  return (
    <div className="space-y-6">
      {/* Tipo de servicio */}
      <div>
        <label className={labelCls}>Tipo de servicio</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-1">
          {Object.entries(PRESETS).map(([key, preset]: [string, PresetConfig]) => {
            const selected = data.servicio_tipo === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleTipoClick(key)}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition text-center ${
                  selected
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ServiceIcon icon={preset.icono} className={`w-8 h-8 mb-2 ${selected ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className="text-sm font-semibold">{preset.nombre}</span>
                <span className="text-[11px] mt-1 text-gray-400 leading-tight">{preset.descripcion}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Datos del informe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelCls}>Título del informe</label>
          <input
            type="text"
            value={data.titulo}
            onChange={(e) => update('titulo', e.target.value)}
            placeholder="Ej: Informe de montaje intercambiador de calor"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Nombre del contacto</label>
          <input
            type="text"
            value={data.cliente_nombre}
            onChange={(e) => update('cliente_nombre', e.target.value)}
            placeholder="Nombre del cliente"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Empresa</label>
          <input
            type="text"
            value={data.cliente_empresa}
            onChange={(e) => update('cliente_empresa', e.target.value)}
            placeholder="Nombre de la empresa"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Obra / Proyecto</label>
          <input
            type="text"
            value={data.obra}
            onChange={(e) => update('obra', e.target.value)}
            placeholder="Nombre de la obra o proyecto"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Ubicación</label>
          <input
            type="text"
            value={data.ubicacion}
            onChange={(e) => update('ubicacion', e.target.value)}
            placeholder="Ej: Planta ENAP, Punta Arenas"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Fecha de los trabajos</label>
          <input
            type="date"
            value={data.fecha_trabajo}
            onChange={(e) => update('fecha_trabajo', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}
