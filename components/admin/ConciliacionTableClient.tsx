"use client";

import { useState } from "react";
import AdjuntoPreviewPanel from "@/components/admin/AdjuntoPreviewPanel";
import AdjuntoThumbnail from "@/components/admin/AdjuntoThumbnail";

type Estado = "pendiente" | "conciliado" | "observado";
type Tipo = "ingreso" | "egreso";

const BADGE_ESTADO: Record<Estado, string> = {
  pendiente:  "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  conciliado: "bg-green-500/20 text-green-300 border-green-500/40",
  observado:  "bg-red-500/20 text-red-300 border-red-500/40",
};

const BADGE_TIPO: Record<Tipo, string> = {
  ingreso: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  egreso:  "bg-rose-500/20 text-rose-300 border-rose-500/40",
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
  conciliacion_adjuntos?: Adjunto[];
}

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
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-widest text-white/40">
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
                <td colSpan={canEdit ? 9 : 8} className="px-4 py-10 text-center text-white/30">
                  No hay movimientos registrados.
                </td>
              </tr>
            )}
            {movimientos.map((m) => (
              <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-4 py-3">
                  <AdjuntoThumbnail
                    storagePath={getStoragePath(m)}
                    alt="Adjunto"
                    onClick={() => openPreview(m)}
                    size="sm"
                  />
                </td>
                <td className="px-4 py-3 text-white/50 whitespace-nowrap">
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
                <td className="px-4 py-3 text-white/70 hidden md:table-cell">{m.categoria}</td>
                <td className="px-4 py-3 text-white/70 max-w-xs truncate hidden md:table-cell">
                  {m.descripcion || "\u2014"}
                </td>
                <td className="px-4 py-3 text-white/50 font-mono text-xs hidden md:table-cell">
                  {m.referencia || "\u2014"}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-white">
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
                          className="rounded border border-green-500/40 px-2 py-0.5 text-xs text-green-300 hover:bg-green-500/10 transition"
                        >
                          Conciliar
                        </button>
                      )}
                      {m.estado !== "observado" && (
                        <button
                          name="estado"
                          value="observado"
                          className="rounded border border-red-500/40 px-2 py-0.5 text-xs text-red-300 hover:bg-red-500/10 transition"
                        >
                          Observar
                        </button>
                      )}
                      {m.estado !== "pendiente" && (
                        <button
                          name="estado"
                          value="pendiente"
                          className="rounded border border-yellow-500/40 px-2 py-0.5 text-xs text-yellow-300 hover:bg-yellow-500/10 transition"
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
        ] : []}
      />
    </>
  );
}
