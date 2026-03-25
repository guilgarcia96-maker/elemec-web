"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdjuntoPreviewPanel from "@/components/admin/AdjuntoPreviewPanel";
import AdjuntoThumbnail from "@/components/admin/AdjuntoThumbnail";

interface Categoria {
  id: string;
  nombre: string;
  color: string;
  icono: string;
}

interface Adjunto {
  id: string;
  storage_path: string;
}

interface Gasto {
  id: string;
  fecha: string;
  descripcion: string | null;
  categoria: string | null;
  categoria_id: string | null;
  subcategoria: string | null;
  monto: number;
  referencia: string | null;
  centro_costo: string | null;
  estado: string;
  rut_emisor: string | null;
  razon_social_emisor: string | null;
  tipo_documento: string | null;
  monto_neto: number | null;
  monto_iva: number | null;
  monto_total: number | null;
  forma_pago: string | null;
  rut_receptor: string | null;
  conciliacion_adjuntos?: Adjunto[];
}

const TIPOS_DOCUMENTO = [
  { value: "boleta", label: "Boleta" },
  { value: "factura", label: "Factura" },
  { value: "factura_exenta", label: "Factura Exenta" },
  { value: "nota_credito", label: "Nota de Crédito" },
  { value: "guia_despacho", label: "Guía de Despacho" },
];

const FORMAS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta_debito", label: "Tarjeta Débito" },
  { value: "tarjeta_credito", label: "Tarjeta Crédito" },
  { value: "cheque", label: "Cheque" },
  { value: "otro", label: "Otro" },
];

const BADGE_TIPO_DOC: Record<string, string> = {
  boleta: "bg-sky-100 text-sky-700 border-sky-200",
  factura: "bg-violet-100 text-violet-700 border-violet-200",
  factura_exenta: "bg-teal-100 text-teal-700 border-teal-200",
  nota_credito: "bg-amber-100 text-amber-700 border-amber-200",
  guia_despacho: "bg-pink-100 text-pink-700 border-pink-200",
};

function tipoDocLabel(val: string | null): string {
  return TIPOS_DOCUMENTO.find(t => t.value === val)?.label ?? "";
}

const CLP = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default function GastosListaClient() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [error, setError] = useState("");

  // Filtros
  const [filterCat, setFilterCat] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");

  // Preview panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);

  // Formulario
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    categoria: "",
    categoria_id: "",
    subcategoria: "",
    monto: "",
    referencia: "",
    centro_costo: "",
    rut_emisor: "",
    razon_social_emisor: "",
    tipo_documento: "",
    monto_neto: "",
    monto_iva: "",
    monto_total: "",
    forma_pago: "",
    rut_receptor: "",
  });

  const loadCategorias = useCallback(async () => {
    const res = await fetch("/api/admin/gastos/categorias");
    if (res.ok) setCategorias(await res.json());
  }, []);

  const loadGastos = useCallback(async () => {
    setLoading(true);
    // Se usa la API de stats para obtener los gastos del mes, pero
    // necesitamos todos los egresos. Usaremos conciliacion_movimientos directamente
    // via una llamada ad-hoc. Aqui construimos una consulta basica via stats.
    // En realidad, haremos fetch directo.
    const params = new URLSearchParams();
    if (filterDesde) params.set("desde", filterDesde);
    if (filterHasta) params.set("hasta", filterHasta);
    if (filterCat) params.set("categoria_id", filterCat);
    if (filterSearch) params.set("busqueda", filterSearch);

    const res = await fetch(`/api/admin/gastos/lista?${params}`);
    if (res.ok) {
      setGastos(await res.json());
    }
    setLoading(false);
  }, [filterCat, filterSearch, filterDesde, filterHasta]);

  useEffect(() => { loadCategorias(); }, [loadCategorias]);
  useEffect(() => { loadGastos(); }, [loadGastos]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      tipo: "egreso" as const,
      fecha: form.fecha,
      descripcion: form.descripcion,
      categoria: form.categoria_id
        ? categorias.find(c => c.id === form.categoria_id)?.nombre ?? form.categoria
        : form.categoria,
      categoria_id: form.categoria_id || null,
      subcategoria: form.subcategoria || null,
      monto: Number(form.monto),
      referencia: form.referencia || null,
      centro_costo: form.centro_costo || null,
      rut_emisor: form.rut_emisor || null,
      razon_social_emisor: form.razon_social_emisor || null,
      tipo_documento: form.tipo_documento || null,
      monto_neto: form.monto_neto ? Number(form.monto_neto) : null,
      monto_iva: form.monto_iva ? Number(form.monto_iva) : null,
      monto_total: form.monto_total ? Number(form.monto_total) : null,
      forma_pago: form.forma_pago || null,
      rut_receptor: form.rut_receptor || null,
    };

    try {
      if (editId) {
        const res = await fetch("/api/admin/gastos/lista", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al actualizar");
          return;
        }
        setEditId(null);
      } else {
        const res = await fetch("/api/admin/conciliacion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al crear");
          return;
        }
      }
      resetForm();
      loadGastos();
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({
      fecha: new Date().toISOString().split("T")[0],
      descripcion: "",
      categoria: "",
      categoria_id: "",
      subcategoria: "",
      monto: "",
      referencia: "",
      centro_costo: "",
      rut_emisor: "",
      razon_social_emisor: "",
      tipo_documento: "",
      monto_neto: "",
      monto_iva: "",
      monto_total: "",
      forma_pago: "",
      rut_receptor: "",
    });
    setShowForm(false);
    setEditId(null);
    setError("");
  }

  function handleEdit(g: Gasto) {
    setEditId(g.id);
    setShowForm(true);
    setForm({
      fecha: g.fecha,
      descripcion: g.descripcion ?? "",
      categoria: g.categoria ?? "",
      categoria_id: g.categoria_id ?? "",
      subcategoria: g.subcategoria ?? "",
      monto: String(g.monto),
      referencia: g.referencia ?? "",
      centro_costo: g.centro_costo ?? "",
      rut_emisor: g.rut_emisor ?? "",
      razon_social_emisor: g.razon_social_emisor ?? "",
      tipo_documento: g.tipo_documento ?? "",
      monto_neto: g.monto_neto != null ? String(g.monto_neto) : "",
      monto_iva: g.monto_iva != null ? String(g.monto_iva) : "",
      monto_total: g.monto_total != null ? String(g.monto_total) : "",
      forma_pago: g.forma_pago ?? "",
      rut_receptor: g.rut_receptor ?? "",
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este gasto?")) return;
    const res = await fetch(`/api/admin/gastos/lista?id=${id}`, { method: "DELETE" });
    if (res.ok) loadGastos();
  }

  async function handleAutoCategorize() {
    if (!form.descripcion) return;
    setCategorizing(true);
    try {
      const res = await fetch("/api/admin/gastos/categorizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion: form.descripcion, monto: form.monto }),
      });
      if (res.ok) {
        const data = await res.json();
        const match = categorias.find(c => c.nombre === data.category);
        if (match) {
          setForm(f => ({ ...f, categoria_id: match.id, categoria: match.nombre }));
        }
      }
    } finally {
      setCategorizing(false);
    }
  }

  function openPreview(g: Gasto) {
    setSelectedGasto(g);
    setPanelOpen(true);
  }

  function getStoragePath(g: Gasto): string | null {
    return g.conciliacion_adjuntos?.[0]?.storage_path ?? null;
  }

  function getImageUrl(path: string | null): string | null {
    if (!path) return null;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    return `${base}/storage/v1/object/public/backoffice-docs/${path}`;
  }

  const catMap = new Map(categorias.map(c => [c.id, c]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lista de Gastos</h1>
          <p className="mt-1 text-sm text-gray-400">
            {gastos.length} egreso{gastos.length !== 1 ? "s" : ""} registrado{gastos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/gastos"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-900"
          >
            Dashboard
          </Link>
          <button
            onClick={() => { setShowForm(!showForm); if (editId) resetForm(); }}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            {showForm ? "Cerrar" : "Nuevo Gasto"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {editId ? "Editar Gasto" : "Nuevo Gasto"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Monto</label>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Categoria</label>
              <select
                value={form.categoria_id}
                onChange={(e) => {
                  const cat = categorias.find(c => c.id === e.target.value);
                  setForm({ ...form, categoria_id: e.target.value, categoria: cat?.nombre ?? "" });
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                required
              >
                <option value="">Seleccionar</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Referencia</label>
              <input
                type="text"
                placeholder="Num. factura, boleta..."
                value={form.referencia}
                onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Descripcion</label>
              <input
                type="text"
                placeholder="Descripcion del gasto"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Centro de costo</label>
              <input
                type="text"
                placeholder="Opcional"
                value={form.centro_costo}
                onChange={(e) => setForm({ ...form, centro_costo: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Subcategoria</label>
              <input
                type="text"
                placeholder="Opcional"
                value={form.subcategoria}
                onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
          {/* Datos tributarios */}
          <div className="border-t border-gray-200 pt-3 mt-1">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-300 mb-3">Datos Tributarios</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Tipo Documento</label>
              <select
                value={form.tipo_documento}
                onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
                <option value="">Sin especificar</option>
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Forma de Pago</label>
              <select
                value={form.forma_pago}
                onChange={(e) => setForm({ ...form, forma_pago: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
                <option value="">Sin especificar</option>
                {FORMAS_PAGO.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">RUT Emisor</label>
              <input
                type="text"
                placeholder="76.123.456-7"
                value={form.rut_emisor}
                onChange={(e) => setForm({ ...form, rut_emisor: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Razón Social Emisor</label>
              <input
                type="text"
                placeholder="Nombre legal"
                value={form.razon_social_emisor}
                onChange={(e) => setForm({ ...form, razon_social_emisor: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Monto Neto</label>
              <input
                type="number"
                step="1"
                min={0}
                placeholder="Sin IVA"
                value={form.monto_neto}
                onChange={(e) => {
                  const neto = Number(e.target.value);
                  const iva = Math.round(neto * 0.19);
                  const total = neto + iva;
                  setForm({
                    ...form,
                    monto_neto: e.target.value,
                    monto_iva: e.target.value ? String(iva) : "",
                    monto_total: e.target.value ? String(total) : "",
                  });
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">IVA (19%)</label>
              <input
                type="number"
                step="1"
                min={0}
                placeholder="IVA"
                value={form.monto_iva}
                onChange={(e) => setForm({ ...form, monto_iva: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Monto Total</label>
              <input
                type="number"
                step="1"
                min={0}
                placeholder="Con IVA"
                value={form.monto_total}
                onChange={(e) => {
                  const total = Number(e.target.value);
                  const neto = Math.round(total / 1.19);
                  const iva = total - neto;
                  setForm({
                    ...form,
                    monto_total: e.target.value,
                    monto_neto: e.target.value ? String(neto) : "",
                    monto_iva: e.target.value ? String(iva) : "",
                  });
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">RUT Receptor</label>
              <input
                type="text"
                placeholder="RUT ELEMEC"
                value={form.rut_receptor}
                onChange={(e) => setForm({ ...form, rut_receptor: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              {saving ? "Guardando..." : editId ? "Actualizar" : "Agregar"}
            </button>
            <button
              type="button"
              disabled={categorizing || !form.descripcion}
              onClick={handleAutoCategorize}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-2"
            >
              {categorizing ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                  Analizando...
                </>
              ) : (
                "Auto-categorizar IA"
              )}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-500 transition hover:border-gray-400"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="rounded-xl border border-gray-200 bg-gray-50">
        <div className="border-b border-gray-200 px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Filtros</h3>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Desde</label>
            <input
              type="date"
              value={filterDesde}
              onChange={(e) => setFilterDesde(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Hasta</label>
            <input
              type="date"
              value={filterHasta}
              onChange={(e) => setFilterHasta(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Categoria</label>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Busqueda</label>
            <input
              type="text"
              placeholder="Descripcion, referencia..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-widest text-gray-400">
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Descripcion</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3">Referencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-300">
                  Cargando...
                </td>
              </tr>
            ) : gastos.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-300">
                  No hay gastos registrados
                </td>
              </tr>
            ) : (
              gastos.map((g) => {
                const cat = g.categoria_id ? catMap.get(g.categoria_id) : null;
                return (
                  <tr key={g.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <AdjuntoThumbnail
                        storagePath={getStoragePath(g)}
                        alt="Adjunto"
                        onClick={() => openPreview(g)}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(g.fecha).toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 truncate">{g.descripcion || "Sin descripcion"}</span>
                        {g.tipo_documento && (
                          <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BADGE_TIPO_DOC[g.tipo_documento] ?? "bg-gray-100 text-gray-400 border-gray-300"}`}>
                            {tipoDocLabel(g.tipo_documento)}
                          </span>
                        )}
                      </div>
                      {g.rut_emisor && (
                        <div className="text-xs text-gray-400 mt-0.5">{g.rut_emisor}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat?.color ?? "#6b7280" }}
                        />
                        <span className="text-gray-500 text-xs">
                          {cat?.nombre ?? g.categoria ?? "Sin categoria"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500 whitespace-nowrap">
                      {CLP(Number(g.monto))}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {g.referencia || "--"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        g.estado === "conciliado"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : g.estado === "observado"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                      }`}>
                        {g.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(g)}
                          className="text-xs text-orange-400 hover:text-orange-300 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Panel de vista previa */}
      <AdjuntoPreviewPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setSelectedGasto(null); }}
        imageUrl={selectedGasto ? getImageUrl(getStoragePath(selectedGasto)) : null}
        titulo="Recibo de gasto"
        datos={selectedGasto ? [
          { label: "Monto", valor: CLP(Number(selectedGasto.monto)) },
          { label: "Descripcion", valor: selectedGasto.descripcion },
          { label: "Fecha", valor: selectedGasto.fecha },
          { label: "Categoria", valor: selectedGasto.categoria },
          { label: "Referencia", valor: selectedGasto.referencia },
          { label: "Centro de costo", valor: selectedGasto.centro_costo },
          { label: "Estado", valor: selectedGasto.estado },
          { label: "Tipo Documento", valor: tipoDocLabel(selectedGasto.tipo_documento) || null },
          { label: "RUT Emisor", valor: selectedGasto.rut_emisor },
          { label: "Razón Social", valor: selectedGasto.razon_social_emisor },
          { label: "Monto Neto", valor: selectedGasto.monto_neto != null ? CLP(Number(selectedGasto.monto_neto)) : null },
          { label: "IVA", valor: selectedGasto.monto_iva != null ? CLP(Number(selectedGasto.monto_iva)) : null },
          { label: "Monto Total", valor: selectedGasto.monto_total != null ? CLP(Number(selectedGasto.monto_total)) : null },
          { label: "Forma de Pago", valor: FORMAS_PAGO.find(f => f.value === selectedGasto.forma_pago)?.label ?? null },
          { label: "RUT Receptor", valor: selectedGasto.rut_receptor },
        ] : []}
      />
    </div>
  );
}
