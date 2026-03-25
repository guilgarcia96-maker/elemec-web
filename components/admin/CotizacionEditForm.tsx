'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Campos editables en el formulario inline
const EDIT_FIELDS: { key: string; label: string; type?: string; multiline?: boolean }[] = [
  { key: 'nombre',           label: 'Nombre' },
  { key: 'apellidos',        label: 'Apellidos' },
  { key: 'compania',         label: 'Compañía / Cliente' },
  { key: 'rut_empresa',      label: 'RUT Empresa' },
  { key: 'cargo',            label: 'Cargo' },
  { key: 'email',            label: 'Correo electrónico', type: 'email' },
  { key: 'movil',            label: 'Móvil' },
  { key: 'telefono',         label: 'Teléfono' },
  { key: 'nombre_obra',      label: 'Obra / Proyecto' },
  { key: 'tipo_obra',        label: 'Tipo de obra' },
  { key: 'tipo_servicio',    label: 'Tipo de servicio' },
  { key: 'direccion',        label: 'Dirección' },
  { key: 'comuna',           label: 'Comuna' },
  { key: 'ciudad',           label: 'Ciudad' },
  { key: 'region',           label: 'Región' },
  { key: 'prioridad',        label: 'Prioridad' },
  { key: 'origen',           label: 'Origen' },
  { key: 'vendedor',         label: 'Vendedor' },
  { key: 'condicion_venta',  label: 'Condición de venta' },
  { key: 'observaciones',    label: 'Observaciones', multiline: true },
  { key: 'comentarios',      label: 'Comentarios', multiline: true },
];

interface Props {
  cotizacionId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cotizacion: Record<string, any>;
}

export default function CotizacionEditForm({ cotizacionId, cotizacion }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of EDIT_FIELDS) {
      init[f.key] = cotizacion[f.key] ?? '';
    }
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);

    const body: Record<string, string | null> = { id: cotizacionId };
    for (const f of EDIT_FIELDS) {
      body[f.key] = values[f.key] || null;
    }

    try {
      const res = await fetch('/api/admin/cotizaciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Error al guardar los cambios');
        setLoading(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError('Error de red al guardar los cambios');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-orange-400 hover:text-orange-600 transition"
      >
        Editar
      </button>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-orange-700">Editar cotización</h2>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="text-xs text-gray-400 hover:text-gray-700 transition"
        >
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {EDIT_FIELDS.map((f) =>
          f.multiline ? (
            <div key={f.key} className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
              <textarea
                rows={3}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400"
              />
            </div>
          ) : (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
              <input
                type={f.type ?? 'text'}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400"
              />
            </div>
          )
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600">{error}</p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition"
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-gray-400 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
