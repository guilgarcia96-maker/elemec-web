"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  created_at: string;
}

export default function GastosCategoriasClient() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState({ nombre: "", icono: "tag", color: "#f97316" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function loadCategorias() {
    fetch("/api/admin/gastos/categorias").then(r => r.json()).then(setCategorias);
  }

  useEffect(() => { loadCategorias(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const method = editId ? "PUT" : "POST";
      const body = editId ? { id: editId, ...form } : form;
      const res = await fetch("/api/admin/gastos/categorias", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar");
        return;
      }

      setForm({ nombre: "", icono: "tag", color: "#f97316" });
      setEditId(null);
      loadCategorias();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar esta categoria?")) return;
    setError("");
    const res = await fetch(`/api/admin/gastos/categorias?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al eliminar");
      return;
    }
    loadCategorias();
  }

  function handleEdit(cat: Categoria) {
    setEditId(cat.id);
    setForm({ nombre: cat.nombre, icono: cat.icono, color: cat.color });
    setError("");
  }

  function handleCancel() {
    setEditId(null);
    setForm({ nombre: "", icono: "tag", color: "#f97316" });
    setError("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categorias de Gastos</h1>
          <p className="mt-1 text-sm text-gray-400">
            {categorias.length} categoria{categorias.length !== 1 ? "s" : ""} registrada{categorias.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/gastos"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-900"
        >
          Dashboard
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">
          {editId ? "Editar Categoria" : "Nueva Categoria"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Nombre</label>
            <input
              type="text"
              placeholder="Nombre de la categoria"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Icono (ej: box, truck, tag)</label>
            <input
              type="text"
              placeholder="tag"
              value={form.icono}
              onChange={(e) => setForm({ ...form, icono: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer bg-transparent"
              />
              <span className="text-sm text-gray-400 font-mono">{form.color}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
          >
            {editId ? "Actualizar" : "Agregar"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-500 transition hover:border-gray-400"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Lista */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Categorias ({categorias.length})
          </h2>
        </div>
        {categorias.length === 0 ? (
          <p className="px-5 py-10 text-sm text-gray-300 text-center">No hay categorias registradas</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{cat.nombre}</p>
                    <p className="text-[10px] text-gray-300">Icono: {cat.icono}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: cat.color }} />
                  <button
                    onClick={() => handleEdit(cat)}
                    className="text-xs text-orange-400 hover:text-orange-300 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
