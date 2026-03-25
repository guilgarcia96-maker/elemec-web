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

interface EditForm {
  fecha: string;
  descripcion: string;
  categoria: string;
  monto: string;
  referencia: string;
  centro_costo: string;
  rut_emisor: string;
  razon_social_emisor: string;
  tipo_documento: string;
  monto_neto: string;
  monto_iva: string;
  monto_total: string;
  forma_pago: string;
  rut_receptor: string;
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
  onRefresh?: () => void;
}

function movimientoToEditForm(m: Movimiento): EditForm {
  return {
    fecha: m.fecha,
    descripcion: m.descripcion ?? "",
    categoria: m.categoria ?? "",
    monto: String(m.monto),
    referencia: m.referencia ?? "",
    centro_costo: m.centro_costo ?? "",
    rut_emisor: m.rut_emisor ?? "",
    razon_social_emisor: m.razon_social_emisor ?? "",
    tipo_documento: m.tipo_documento ?? "",
    monto_neto: m.monto_neto != null ? String(m.monto_neto) : "",
    monto_iva: m.monto_iva != null ? String(m.monto_iva) : "",
    monto_total: m.monto_total != null ? String(m.monto_total) : "",
    forma_pago: m.forma_pago ?? "",
    rut_receptor: m.rut_receptor ?? "",
  };
}

export default function ConciliacionTableClient({ movimientos: initialMovimientos, canEdit, onRefresh }: Props) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>(initialMovimientos);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<Movimiento | null>(null);

  // Edición inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Eliminación
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

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

  function startEdit(m: Movimiento) {
    setEditingId(m.id);
    setEditForm(movimientoToEditForm(m));
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
    setEditError("");
  }

  async function saveEdit(id: string) {
    if (!editForm) return;
    setSaving(true);
    setEditError("");

    const res = await fetch("/api/admin/gastos/lista", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        ...editForm,
        monto: editForm.monto !== "" ? Number(editForm.monto) : undefined,
        monto_neto: editForm.monto_neto !== "" ? Number(editForm.monto_neto) : null,
        monto_iva: editForm.monto_iva !== "" ? Number(editForm.monto_iva) : null,
        monto_total: editForm.monto_total !== "" ? Number(editForm.monto_total) : null,
        tipo_documento: editForm.tipo_documento || null,
        forma_pago: editForm.forma_pago || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEditError(data.error || "Error al guardar");
      setSaving(false);
      return;
    }

    // Actualizar localmente
    setMovimientos((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return {
          ...m,
          fecha: editForm.fecha,
          descripcion: editForm.descripcion || null,
          categoria: editForm.categoria,
          monto: Number(editForm.monto),
          referencia: editForm.referencia || null,
          centro_costo: editForm.centro_costo || null,
          rut_emisor: editForm.rut_emisor || null,
          razon_social_emisor: editForm.razon_social_emisor || null,
          tipo_documento: editForm.tipo_documento || null,
          monto_neto: editForm.monto_neto !== "" ? Number(editForm.monto_neto) : null,
          monto_iva: editForm.monto_iva !== "" ? Number(editForm.monto_iva) : null,
          monto_total: editForm.monto_total !== "" ? Number(editForm.monto_total) : null,
          forma_pago: editForm.forma_pago || null,
          rut_receptor: editForm.rut_receptor || null,
        };
      })
    );

    setSaving(false);
    setEditingId(null);
    setEditForm(null);
    onRefresh?.();
  }

  async function confirmDelete(id: string) {
    setDeletingId(id);
    setDeleteError("");

    const res = await fetch(`/api/admin/gastos/lista?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error || "Error al eliminar");
      setDeletingId(null);
      return;
    }

    setMovimientos((prev) => prev.filter((m) => m.id !== id));
    setDeleteConfirm(null);
    setDeletingId(null);
    onRefresh?.();
  }

  const inputClass = "rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 w-full";
  const colSpan = canEdit ? 9 : 8;

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
                <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">
                  No hay movimientos registrados.
                </td>
              </tr>
            )}

            {deleteError && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-2">
                  <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {deleteError}
                  </div>
                </td>
              </tr>
            )}

            {movimientos.map((m) => (
              <>
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
                      <div className="flex flex-wrap gap-1">
                        {/* Botones de estado */}
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

                        {/* Editar */}
                        <button
                          onClick={() => startEdit(m)}
                          className="rounded border border-blue-200 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50 transition"
                        >
                          Editar
                        </button>

                        {/* Eliminar */}
                        {deleteConfirm === m.id ? (
                          <span className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">¿Confirmar?</span>
                            <button
                              onClick={() => confirmDelete(m.id)}
                              disabled={deletingId === m.id}
                              className="rounded border border-red-400 bg-red-50 px-2 py-0.5 text-xs text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                            >
                              {deletingId === m.id ? "..." : "Sí"}
                            </button>
                            <button
                              onClick={() => { setDeleteConfirm(null); setDeleteError(""); }}
                              className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 transition"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => { setDeleteConfirm(m.id); setDeleteError(""); }}
                            className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50 transition"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>

                {/* Fila de edición inline */}
                {canEdit && editingId === m.id && editForm && (
                  <tr key={`edit-${m.id}`} className="border-b border-blue-100 bg-blue-50">
                    <td colSpan={colSpan} className="px-4 py-4">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Editar movimiento</p>

                        {editError && (
                          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            {editError}
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Fecha</label>
                            <input
                              type="date"
                              value={editForm.fecha}
                              onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Monto</label>
                            <input
                              type="number"
                              step="1"
                              value={editForm.monto}
                              onChange={(e) => setEditForm({ ...editForm, monto: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Categoria</label>
                            <input
                              type="text"
                              value={editForm.categoria}
                              onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Centro de Costo</label>
                            <input
                              type="text"
                              value={editForm.centro_costo}
                              onChange={(e) => setEditForm({ ...editForm, centro_costo: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Descripcion</label>
                            <input
                              type="text"
                              value={editForm.descripcion}
                              onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Referencia</label>
                            <input
                              type="text"
                              value={editForm.referencia}
                              onChange={(e) => setEditForm({ ...editForm, referencia: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Tipo Documento</label>
                            <select
                              value={editForm.tipo_documento}
                              onChange={(e) => setEditForm({ ...editForm, tipo_documento: e.target.value })}
                              className={inputClass}
                            >
                              <option value="">— Ninguno —</option>
                              {Object.entries(TIPO_DOC_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">RUT Emisor</label>
                            <input
                              type="text"
                              value={editForm.rut_emisor}
                              onChange={(e) => setEditForm({ ...editForm, rut_emisor: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Razón Social</label>
                            <input
                              type="text"
                              value={editForm.razon_social_emisor}
                              onChange={(e) => setEditForm({ ...editForm, razon_social_emisor: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Monto Neto</label>
                            <input
                              type="number"
                              step="1"
                              value={editForm.monto_neto}
                              onChange={(e) => setEditForm({ ...editForm, monto_neto: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Monto IVA</label>
                            <input
                              type="number"
                              step="1"
                              value={editForm.monto_iva}
                              onChange={(e) => setEditForm({ ...editForm, monto_iva: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Monto Total</label>
                            <input
                              type="number"
                              step="1"
                              value={editForm.monto_total}
                              onChange={(e) => setEditForm({ ...editForm, monto_total: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">Forma de Pago</label>
                            <select
                              value={editForm.forma_pago}
                              onChange={(e) => setEditForm({ ...editForm, forma_pago: e.target.value })}
                              className={inputClass}
                            >
                              <option value="">— Ninguna —</option>
                              {Object.entries(FORMA_PAGO_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] text-gray-400 uppercase">RUT Receptor</label>
                            <input
                              type="text"
                              value={editForm.rut_receptor}
                              onChange={(e) => setEditForm({ ...editForm, rut_receptor: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => saveEdit(m.id)}
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                          >
                            {saving ? "Guardando..." : "Guardar"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
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
