"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIAS = [
  "Cobranza clientes",
  "Pago proveedores",
  "Remuneraciones",
  "Gastos operacionales",
  "Gastos administrativos",
  "Ingresos por servicios",
  "Devoluciones",
  "Impuestos y contribuciones",
  "Otros ingresos",
  "Otros egresos",
];

export default function NuevoMovimientoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));

    const res = await fetch("/api/admin/conciliacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/admin/conciliacion");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Error al guardar el movimiento.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen bg-[#0f0f1a] text-white">
      {/* Mini sidebar placeholder que coincide con AdminShell */}
      <aside className="w-56 shrink-0 border-r border-white/10 bg-[#13131f] flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-base font-bold text-[#e2b44b]">ELEMEC</p>
          <p className="text-[10px] text-white/35 mt-0.5 uppercase tracking-widest">Backoffice</p>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {[
            { href: "/admin/cotizaciones",  label: "Cotizaciones",  sub: "Solicitudes recibidas" },
            { href: "/admin/postulaciones", label: "Postulaciones", sub: "Pipeline de RRHH" },
            { href: "/admin/conciliacion",  label: "Conciliación",  sub: "Movimientos contables", active: true },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col px-3 py-2.5 rounded-lg text-sm transition ${
                item.active
                  ? "bg-[#e2b44b]/10 text-[#e2b44b] border border-[#e2b44b]/30"
                  : "text-white/55 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="font-semibold">{item.label}</span>
              <span className={`text-[10px] mt-0.5 ${item.active ? "text-[#e2b44b]/60" : "text-white/30"}`}>
                {item.sub}
              </span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex-1 px-6 py-10">
        <div className="mb-6">
          <a href="/admin/conciliacion" className="text-xs text-white/40 hover:text-white transition">
            ← Conciliación
          </a>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Nuevo Movimiento</h1>
        <p className="text-sm text-white/50 mb-8">Registra un ingreso o egreso para conciliación contable.</p>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
          {/* Tipo y fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">Tipo *</label>
              <select
                name="tipo"
                required
                className="w-full rounded-lg border border-white/20 bg-[#13131f] px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b]"
              >
                <option value="">Selecciona...</option>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Fecha *</label>
              <input
                type="date"
                name="fecha"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-white/20 bg-[#13131f] px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b]"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="mb-1 block text-sm text-white/70">Categoría *</label>
            <select
              name="categoria"
              required
              className="w-full rounded-lg border border-white/20 bg-[#13131f] px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b]"
            >
              <option value="">Selecciona una categoría...</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-1 block text-sm text-white/70">Descripción</label>
            <input
              type="text"
              name="descripcion"
              maxLength={500}
              className="w-full rounded-lg border border-white/20 bg-[#13131f] px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b] placeholder:text-white/30"
              placeholder="Descripción del movimiento..."
            />
          </div>

          {/* Referencia y centro de costo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">Referencia / N° documento</label>
              <input
                type="text"
                name="referencia"
                maxLength={100}
                className="w-full rounded-lg border border-white/20 bg-[#13131f] px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b] placeholder:text-white/30"
                placeholder="Ej: FAC-2026-001"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Centro de costo</label>
              <input
                type="text"
                name="centro_costo"
                maxLength={100}
                className="w-full rounded-lg border border-white/20 bg-[#13131f] px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b] placeholder:text-white/30"
                placeholder="Ej: Operaciones Sur"
              />
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="mb-1 block text-sm text-white/70">Monto CLP *</label>
            <input
              type="number"
              name="monto"
              required
              min={0}
              step={1}
              className="w-full rounded-lg border border-white/20 bg-[#13131f] px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b] placeholder:text-white/30"
              placeholder="0"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="mb-1 block text-sm text-white/70">Notas internas</label>
            <textarea
              name="notas"
              rows={3}
              maxLength={2000}
              className="w-full rounded-lg border border-white/20 bg-[#13131f] px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b] placeholder:text-white/30"
              placeholder="Observaciones adicionales..."
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#e2b44b] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#d4a43a] transition disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Registrar movimiento"}
            </button>
            <a
              href="/admin/conciliacion"
              className="rounded-lg border border-white/20 px-6 py-2.5 text-sm text-white/60 hover:text-white transition"
            >
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
