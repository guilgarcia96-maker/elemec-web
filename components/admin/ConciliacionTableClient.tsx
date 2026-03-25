"use client";

import { useState } from "react";
import AdjuntoPreviewPanel from "@/components/admin/AdjuntoPreviewPanel";
import AdjuntoThumbnail from "@/components/admin/AdjuntoThumbnail";

type Estado = "pendiente" | "conciliado" | "observado";
type Tipo = "ingreso" | "egreso";

const BADGE_ESTADO: Record<Estado, string> = {
  pendiente:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  conciliado: "bg-green-100 text-green-700 border-green-200",
  observado:  "bg-red-100 text-red-700 border-red-200",
};

const BADGE_TIPO: Record<Tipo, string> = {
  ingreso: "bg-emerald-100 text-emerald-700 border-emerald-200",
  egreso:  "bg-rose-100 text-rose-700 border-rose-200",
};

function fmtCLP(n: number) {
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

interface Adjunto {
  id: string;
  storage_path: string;
}

interface Movimiento {
  id: string;
  fecha: string;
  tipo: string;
  categoria: string;
  descripcion: string | null;
  referencia: string | null;
  monto: number;
  estado: string;
  centro_costo?: string | null;
  rut_emisor?: string | null;
  razon_social_emisor?: string | null;
  tipo_documento?: string | null;
  monto_neto?: number | null;
  monto_iva?: number | null;
  monto_total?: number | null;
  forma_pago?: string | null;
  rut_receptor?: string | null;
  conciliacion_adjuntos?: Adjunto[];
}

const BADGE_TIPO_DOC: Record<string, string> = {
  boleta: "bg-sky-100 text-sky-700 border-sky-200",
  factura: "bg-violet-100 text-violet-700 border-violet-200",
  factura_exenta: "bg-teal-100 text-teal-700 border-teal-200",
  nota_credito: "bg-amber-100 text-amber-700 border-amber-200",
  guia_despacho: "bg-pink-100 text-pink-700 border-pink-200",
};

const TIPO_DOC_LABELS: Record<string, string> = {
  boleta: "Boleta",
  factura: "Factura",
  factura_exenta: "Factura Exenta",
  nota_credito: "Nota de Crédito",
  guia_despacho: "Guía de Despacho",
};

const FORMA_PAGO_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Tarjeta Débito",
  tarjeta_credito: "Tarjeta Crédito",
  cheque: "Cheque",
  otro: "Otro",
};

interface Props {
  movimientos: Movimiento[];
  canEdit: boolean;
}

export default function ConciliacionTableClient({ movimientos, canEdit }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<Movimiento | null>(null);

  function getStoragePath(m: Movimiento): string | null {
    return m.conciliacion_adjuntos?.[0]?.storage_path ?? null;
  }

  function getImageUrl(path: string | null): string | null {
    if (!path) return null;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    return `${base}/storage/v1/object/public/backoffice-docs/${path}`;
  }

  function openPreview(m: Movimiento) {
    setSelected(m);
    setPanelOpen(true);
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-widest text-gray-400">
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 hidden md:table-cell">Categoria</th>
              <th className="px-4 py-3 hidden md:table-cell">Descripcion</th>
              <th className="px-4 py-3 hidden md:table-cell">Referencia</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3">Estado</th>
              {canEdit && <th className="px-4 py-3">Accion</th>}
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 9 : 8} className="px-4 py-10 text-center text-gray-400">
                  No hay movimientos registrados.
                </td>
              </tr>
            )}
            {movimientos.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <AdjuntoThumbnail
                    storagePath={getStoragePath(m)}
                    alt="Adjunto"
                    onClick={() => openPreview(m)}
                    size="sm"
                  />
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {m.fecha}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      BADGE_TIPO[m.tipo as Tipo] ?? ""
                    }`}
                  >
                    {m.tipo}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{m.categoria}</td>
                <td className="px-4 py-3 max-w-xs hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 truncate">{m.descripcion || "\u2014"}</span>
                    {m.tipo_documento && (
                      <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BADGE_TIPO_DOC[m.tipo_documento] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {TIPO_DOC_LABELS[m.tipo_documento] ?? m.tipo_documento}
                      </span>
                    )}
                  </div>
                  {m.rut_emisor && (
                    <div className="text-xs text-gray-400 mt-0.5">{m.rut_emisor}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">
                  {m.referencia || "\u2014"}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                  {fmtCLP(Number(m.monto))}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      BADGE_ESTADO[m.estado as Estado] ?? BADGE_ESTADO.pendiente
                    }`}
                  >
                    {m.estado}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <form action="/api/admin/conciliacion/estado" method="POST" className="flex gap-1">
                      <input type="hidden" name="id" value={m.id} />
                      {m.estado !== "conciliado" && (
                        <button
                          name="estado"
                          value="conciliado"
                          className="rounded border border-green-200 px-2 py-0.5 text-xs text-green-700 hover:bg-green-50 transition"
                        >
                          Conciliar
                        </button>
                      )}
                      {m.estado !== "observado" && (
                        <button
                          name="estado"
                          value="observado"
                          className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 transition"
                        >
                          Observar
                        </button>
                      )}
                      {m.estado !== "pendiente" && (
                        <button
                          name="estado"
                          value="pendiente"
                          className="rounded border border-yellow-200 px-2 py-0.5 text-xs text-yellow-700 hover:bg-yellow-50 transition"
                        >
                          Pendiente
                        </button>
                      )}
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdjuntoPreviewPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setSelected(null); }}
        imageUrl={selected ? getImageUrl(getStoragePath(selected)) : null}
        titulo="Documento de movimiento"
        datos={selected ? [
          { label: "Monto", valor: fmtCLP(Number(selected.monto)) },
          { label: "Tipo", valor: selected.tipo },
          { label: "Descripcion", valor: selected.descripcion },
          { label: "Fecha", valor: selected.fecha },
          { label: "Categoria", valor: selected.categoria },
          { label: "Referencia", valor: selected.referencia },
          { label: "Centro de costo", valor: selected.centro_costo ?? null },
          { label: "Estado", valor: selected.estado },
          { label: "Tipo Documento", valor: selected.tipo_documento ? (TIPO_DOC_LABELS[selected.tipo_documento] ?? null) : null },
          { label: "RUT Emisor", valor: selected.rut_emisor ?? null },
          { label: "Razón Social", valor: selected.razon_social_emisor ?? null },
          { label: "Monto Neto", valor: selected.monto_neto != null ? fmtCLP(Number(selected.monto_neto)) : null },
          { label: "IVA", valor: selected.monto_iva != null ? fmtCLP(Number(selected.monto_iva)) : null },
          { label: "Monto Total", valor: selected.monto_total != null ? fmtCLP(Number(selected.monto_total)) : null },
          { label: "Forma de Pago", valor: selected.forma_pago ? (FORMA_PAGO_LABELS[selected.forma_pago] ?? null) : null },
          { label: "RUT Receptor", valor: selected.rut_receptor ?? null },
        ] : []}
      />
    </>
  );
}
