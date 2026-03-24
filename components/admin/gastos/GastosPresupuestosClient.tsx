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
          <p className="mt-1 text-sm text-white/50">
            Limites de gasto por categoria y mes
          </p>
        </div>
        <Link
          href="/admin/gastos"
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/60 transition hover:border-white/40 hover:text-white"
        >
          Dashboard
        </Link>
      </div>

      {/* Navegacion mensual */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg border border-white/10 text-white/40 hover:bg-white/5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-sm font-medium text-orange-400">
          {monthNames[mes - 1]} {anio}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg border border-white/10 text-white/40 hover:bg-white/5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="mb-1 block text-xs text-white/50">Categoria</label>
          <select
            value={form.categoria_id}
            onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
            className="rounded-lg border border-white/15 bg-[#0f0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            required
          >
            <option value="">Seleccionar</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Limite mensual</label>
          <input
            type="number"
            step="1"
            placeholder="Monto"
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: e.target.value })}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/30 text-center">
            No hay presupuestos configurados para {monthNames[mes - 1]} {anio}
          </div>
        ) : (
          presupuestos.map((b) => {
            const pct = b.monto > 0 ? Math.min((b.gastado / b.monto) * 100, 100) : 0;
            const over = b.gastado > b.monto;
            const realPct = b.monto > 0 ? (b.gastado / b.monto) * 100 : 0;
            const remaining = b.monto - b.gastado;

            return (
              <div key={b.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: b.categoria?.color ?? "#6b7280" }}
                    />
                    <span className="font-medium text-white/80">{b.categoria?.nombre ?? "Desconocida"}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-semibold tabular-nums ${
                      over ? "text-red-400" : "text-white/60"
                    }`}>
                      {CLP(b.gastado)} / {CLP(b.monto)}
                    </span>
                    <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full border ${
                      over
                        ? "text-red-400 bg-red-500/10 border-red-500/30"
                        : realPct >= 80
                          ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                          : "text-green-400 bg-green-500/10 border-green-500/30"
                    }`}>
                      {Math.round(realPct)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      over ? "bg-red-500" : realPct >= 80 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-white/30">
                    {over
                      ? `Excedido por ${CLP(Math.abs(remaining))}`
                      : `Restante: ${CLP(remaining)}`
                    }
                  </p>
                  {b.centro_costo && (
                    <span className="text-[10px] text-white/20 border border-white/10 rounded-full px-2 py-0.5">
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
