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
    <div className="flex min-h-screen bg-[#f8f9fb] text-gray-900">
      {/* Mini sidebar placeholder que coincide con AdminShell */}
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-gray-200">
          <p className="text-base font-bold text-orange-500">ELEMEC</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">Backoffice</p>
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
                  ? "bg-orange-500/10 text-orange-500 border border-[#e2b44b]/30"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="font-semibold">{item.label}</span>
              <span className={`text-[10px] mt-0.5 ${item.active ? "text-orange-500/60" : "text-gray-400"}`}>
                {item.sub}
              </span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex-1 px-3 py-4 md:px-6 md:py-10">
        <div className="mb-6">
          <a href="/admin/conciliacion" className="text-xs text-gray-400 hover:text-gray-700 transition">
            ← Conciliación
          </a>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Movimiento</h1>
          <a
            href="/admin/conciliacion/escanear"
            className="flex items-center gap-2 rounded-lg border border-[#e2b44b]/40 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-500 hover:bg-orange-500/20 transition"
          >
            <span>&#128196;</span> Escanear recibo con IA
          </a>
        </div>
        <p className="text-sm text-gray-500 mb-8">Registra un ingreso o egreso para conciliación contable.</p>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
          {/* Tipo y fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Tipo *</label>
              <select
                name="tipo"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500"
              >
                <option value="">Selecciona...</option>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Fecha *</label>
              <input
                type="date"
                name="fecha"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="mb-1 block text-sm text-gray-600">Categoría *</label>
            <select
              name="categoria"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500"
            >
              <option value="">Selecciona una categoría...</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-1 block text-sm text-gray-600">Descripción</label>
            <input
              type="text"
              name="descripcion"
              maxLength={500}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 bg-white"
              placeholder="Descripción del movimiento..."
            />
          </div>

          {/* Referencia y centro de costo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Referencia / N° documento</label>
              <input
                type="text"
                name="referencia"
                maxLength={100}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 bg-white"
                placeholder="Ej: FAC-2026-001"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Centro de costo</label>
              <input
                type="text"
                name="centro_costo"
                maxLength={100}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 bg-white"
                placeholder="Ej: Operaciones Sur"
              />
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="mb-1 block text-sm text-gray-600">Monto CLP *</label>
            <input
              type="number"
              name="monto"
              required
              min={0}
              step={1}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 bg-white"
              placeholder="0"
            />
          </div>

          {/* Datos tributarios */}
          <div className="border-t border-gray-200 pt-4 mt-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Datos Tributarios</h3>
          </div>

          {/* Tipo documento y forma de pago */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Tipo Documento</label>
              <select
                name="tipo_documento"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500"
              >
                <option value="">Sin especificar</option>
                <option value="boleta">Boleta</option>
                <option value="factura">Factura</option>
                <option value="factura_exenta">Factura Exenta</option>
                <option value="nota_credito">Nota de Crédito</option>
                <option value="guia_despacho">Guía de Despacho</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Forma de Pago</label>
              <select
                name="forma_pago"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500"
              >
                <option value="">Sin especificar</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta_debito">Tarjeta Débito</option>
                <option value="tarjeta_credito">Tarjeta Crédito</option>
                <option value="cheque">Cheque</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          {/* RUT emisor y razón social */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-gray-600">RUT Emisor</label>
              <input
                type="text"
                name="rut_emisor"
                maxLength={20}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 bg-white"
                placeholder="Ej: 76.123.456-7"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Razón Social Emisor</label>
              <input
                type="text"
                name="razon_social_emisor"
                maxLength={200}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 bg-white"
                placeholder="Nombre legal del emisor"
              />
            </div>
          </div>

          {/* Montos neto, IVA, total */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Monto Neto</label>
              <input
                type="number"
                name="monto_neto"
                step="1"
                min={0}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 bg-white"
                placeholder="Sin IVA"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">IVA (19%)</label>
              <input
                type="number"
                name="monto_iva"
                step="1"
                min={0}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 bg-white"
                placeholder="IVA"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Monto Total</label>
              <input
                type="number"
                name="monto_total"
                step="1"
                min={0}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 bg-white"
                placeholder="Con IVA"
              />
            </div>
          </div>

          {/* RUT receptor */}
          <div>
            <label className="mb-1 block text-sm text-gray-600">RUT Receptor</label>
            <input
              type="text"
              name="rut_receptor"
              maxLength={20}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 bg-white"
              placeholder="RUT de ELEMEC"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="mb-1 block text-sm text-gray-600">Notas internas</label>
            <textarea
              name="notas"
              rows={3}
              maxLength={2000}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 placeholder:text-gray-400 bg-white"
              placeholder="Observaciones adicionales..."
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Registrar movimiento"}
            </button>
            <a
              href="/admin/conciliacion"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
