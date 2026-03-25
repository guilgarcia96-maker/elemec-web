"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Categoria {
  id: string;
  nombre: string;
  color: string;
  icono: string;
}

interface Presupuesto {
  id: string;
  monto: number;
  mes: number;
  anio: number;
  centro_costo: string | null;
  categoria_id: string;
  categoria: Categoria | null;
  gastado: number;
}

const CLP = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function GastosPresupuestosClient() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [form, setForm] = useState({ categoria_id: "", monto: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function loadData() {
    fetch("/api/admin/gastos/categorias").then(r => r.json()).then(setCategorias);
    fetch(`/api/admin/gastos/presupuestos?mes=${mes}&anio=${anio}`).then(r => r.json()).then(setPresupuestos);
  }

  useEffect(() => { loadData(); }, [mes, anio]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/admin/gastos/presupuestos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoria_id: form.categoria_id,
        monto: Number(form.monto),
        mes,
        anio,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al guardar");
    } else {
      setForm({ categoria_id: "", monto: "" });
      loadData();
    }
    setSaving(false);
  }

  function prevMonth() {
    if (mes === 1) { setMes(12); setAnio(anio - 1); }
    else setMes(mes - 1);
  }

  function nextMonth() {
    if (mes === 12) { setMes(1); setAnio(anio + 1); }
    else setMes(mes + 1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Presupuestos</h1>
          <p className="mt-1 text-sm text-gray-400">
            Limites de gasto por categoria y mes
          </p>
        </div>
        <Link
          href="/admin/gastos"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-900"
        >
          Dashboard
        </Link>
      </div>

      {/* Navegacion mensual */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-sm font-medium text-orange-600">
          {monthNames[mes - 1]} {anio}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-gray-50 p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="mb-1 block text-xs text-gray-400">Categoria</label>
          <select
            value={form.categoria_id}
            onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            required
          >
            <option value="">Seleccionar</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Limite mensual</label>
          <input
            type="number"
            step="1"
            placeholder="Monto"
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: e.target.value })}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </form>

      {/* Lista de presupuestos */}
      <div className="space-y-3">
        {presupuestos.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-300 text-center">
            No hay presupuestos configurados para {monthNames[mes - 1]} {anio}
          </div>
        ) : (
          presupuestos.map((b) => {
            const pct = b.monto > 0 ? Math.min((b.gastado / b.monto) * 100, 100) : 0;
            const over = b.gastado > b.monto;
            const realPct = b.monto > 0 ? (b.gastado / b.monto) * 100 : 0;
            const remaining = b.monto - b.gastado;

            return (
              <div key={b.id} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: b.categoria?.color ?? "#6b7280" }}
                    />
                    <span className="font-medium text-gray-700">{b.categoria?.nombre ?? "Desconocida"}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-semibold tabular-nums ${
                      over ? "text-red-400" : "text-gray-500"
                    }`}>
                      {CLP(b.gastado)} / {CLP(b.monto)}
                    </span>
                    <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full border ${
                      over
                        ? "text-red-700 bg-red-50 border-red-200"
                        : realPct >= 80
                          ? "text-yellow-700 bg-yellow-50 border-yellow-200"
                          : "text-green-700 bg-green-50 border-green-200"
                    }`}>
                      {Math.round(realPct)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      over ? "bg-red-500" : realPct >= 80 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-300">
                    {over
                      ? `Excedido por ${CLP(Math.abs(remaining))}`
                      : `Restante: ${CLP(remaining)}`
                    }
                  </p>
                  {b.centro_costo && (
                    <span className="text-[10px] text-gray-300 border border-gray-200 rounded-full px-2 py-0.5">
                      CC: {b.centro_costo}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
