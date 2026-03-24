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
  conciliacion_adjuntos?: Adjunto[];
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
          <p className="mt-1 text-sm text-white/50">
            {gastos.length} egreso{gastos.length !== 1 ? "s" : ""} registrado{gastos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/gastos"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/60 transition hover:border-white/40 hover:text-white"
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
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">
            {editId ? "Editar Gasto" : "Nuevo Gasto"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="mb-1 block text-xs text-white/50">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Monto</label>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Categoria</label>
              <select
                value={form.categoria_id}
                onChange={(e) => {
                  const cat = categorias.find(c => c.id === e.target.value);
                  setForm({ ...form, categoria_id: e.target.value, categoria: cat?.nombre ?? "" });
                }}
                className="w-full rounded-lg border border-white/15 bg-[#0f0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              >
                <option value="">Seleccionar</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Referencia</label>
              <input
                type="text"
                placeholder="Num. factura, boleta..."
                value={form.referencia}
                onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs text-white/50">Descripcion</label>
              <input
                type="text"
                placeholder="Descripcion del gasto"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Centro de costo</label>
              <input
                type="text"
                placeholder="Opcional"
                value={form.centro_costo}
                onChange={(e) => setForm({ ...form, centro_costo: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Subcategoria</label>
              <input
                type="text"
                placeholder="Opcional"
                value={form.subcategoria}
                onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {categorizing ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-emerald-300 border-t-transparent rounded-full" />
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
                className="rounded-lg border border-white/20 px-5 py-2 text-sm text-white/60 transition hover:border-white/40"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="rounded-xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">Filtros</h3>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">Desde</label>
            <input
              type="date"
              value={filterDesde}
              onChange={(e) => setFilterDesde(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Hasta</label>
            <input
              type="date"
              value={filterHasta}
              onChange={(e) => setFilterHasta(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Categoria</label>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#0f0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Busqueda</label>
            <input
              type="text"
              placeholder="Descripcion, referencia..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-widest text-white/40">
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
                <td colSpan={8} className="px-4 py-10 text-center text-white/30">
                  Cargando...
                </td>
              </tr>
            ) : gastos.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-white/30">
                  No hay gastos registrados
                </td>
              </tr>
            ) : (
              gastos.map((g) => {
                const cat = g.categoria_id ? catMap.get(g.categoria_id) : null;
                return (
                  <tr key={g.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <AdjuntoThumbnail
                        storagePath={getStoragePath(g)}
                        alt="Adjunto"
                        onClick={() => openPreview(g)}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-white/50 whitespace-nowrap">
                      {new Date(g.fecha).toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-4 py-3 text-white/70 max-w-xs truncate">
                      {g.descripcion || "Sin descripcion"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat?.color ?? "#6b7280" }}
                        />
                        <span className="text-white/60 text-xs">
                          {cat?.nombre ?? g.categoria ?? "Sin categoria"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white/70 whitespace-nowrap">
                      {CLP(Number(g.monto))}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      {g.referencia || "--"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        g.estado === "conciliado"
                          ? "bg-green-500/20 text-green-300 border-green-500/40"
                          : g.estado === "observado"
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                            : "bg-blue-500/20 text-blue-300 border-blue-500/40"
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
        ] : []}
      />
    </div>
  );
}
