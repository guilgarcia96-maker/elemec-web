"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface CategoriaItem {
  id: string;
  nombre: string;
}

interface OcrResult {
  ocrText: string;
  monto: number | null;
  descripcion: string | null;
  fecha: string | null;
  categoria: string | null;
  categoria_id: string | null;
  tipo: "ingreso" | "egreso";
  referencia: string | null;
  rut_emisor: string | null;
  razon_social_emisor: string | null;
  tipo_documento: string | null;
  monto_neto: number | null;
  monto_iva: number | null;
  monto_total: number | null;
  forma_pago: string | null;
  rut_receptor: string | null;
  storagePath: string;
  categorias: CategoriaItem[];
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

export default function EscanearClient() {
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    monto: "",
    descripcion: "",
    fecha: new Date().toISOString().slice(0, 10),
    tipo: "egreso",
    categoria: "",
    categoria_id: "",
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

  // Cargar categorías al montar
  useEffect(() => {
    fetch("/api/admin/gastos/categorias")
      .then((r) => r.json())
      .then((data: CategoriaItem[]) => {
        if (Array.isArray(data)) setCategorias(data);
      })
      .catch(() => {});
  }, []);

  const fileRef = useRef<HTMLInputElement>(null);

  // Seleccionar archivo sin procesar todavía
  const selectFile = useCallback((file: File) => {
    setPreview(URL.createObjectURL(file));
    setSelectedFile(file);
    setOcrText("");
    setSaved(false);
    setError("");
  }, []);

  // Enviar a OCR
  const analyzeFile = useCallback(async () => {
    if (!selectedFile) return;
    setProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await fetch("/api/admin/conciliacion/ocr", { method: "POST", body: formData });
      const data: OcrResult = await res.json();

      if (!res.ok) {
        setError((data as unknown as { error: string }).error || "Error al procesar");
        return;
      }

      setOcrText(data.ocrText || "");
      setStoragePath(data.storagePath || "");

      // Si el OCR devuelve categorías actualizadas, usarlas; si no, mantener las ya cargadas
      const catList: CategoriaItem[] = data.categorias?.length ? data.categorias : categorias;
      if (data.categorias?.length) setCategorias(data.categorias);

      // Resolver categoria_id: el OCR puede devolver el id directamente o sólo el nombre
      let resolvedCategoriaId = data.categoria_id || "";
      let resolvedCategoriaNombre = data.categoria || "";
      if (!resolvedCategoriaId && resolvedCategoriaNombre) {
        const match = catList.find(
          (c) => c.nombre.toLowerCase() === resolvedCategoriaNombre.toLowerCase()
        );
        if (match) resolvedCategoriaId = match.id;
      }
      if (!resolvedCategoriaNombre && resolvedCategoriaId) {
        const match = catList.find((c) => c.id === resolvedCategoriaId);
        if (match) resolvedCategoriaNombre = match.nombre;
      }

      setForm({
        monto: data.monto != null ? String(data.monto) : "",
        descripcion: data.descripcion || "",
        fecha: data.fecha || new Date().toISOString().slice(0, 10),
        tipo: data.tipo || "egreso",
        categoria: resolvedCategoriaNombre,
        categoria_id: resolvedCategoriaId,
        referencia: data.referencia || "",
        centro_costo: "",
        rut_emisor: data.rut_emisor || "",
        razon_social_emisor: data.razon_social_emisor || "",
        tipo_documento: data.tipo_documento || "",
        monto_neto: data.monto_neto != null ? String(data.monto_neto) : "",
        monto_iva: data.monto_iva != null ? String(data.monto_iva) : "",
        monto_total: data.monto_total != null ? String(data.monto_total) : "",
        forma_pago: data.forma_pago || "",
        rut_receptor: data.rut_receptor || "",
      });
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setProcessing(false);
    }
  }, [selectedFile]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) selectFile(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/conciliacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          monto: Number(form.monto),
          monto_neto: form.monto_neto ? Number(form.monto_neto) : null,
          monto_iva: form.monto_iva ? Number(form.monto_iva) : null,
          monto_total: form.monto_total ? Number(form.monto_total) : null,
          tipo_documento: form.tipo_documento || null,
          forma_pago: form.forma_pago || null,
          rut_emisor: form.rut_emisor || null,
          razon_social_emisor: form.razon_social_emisor || null,
          rut_receptor: form.rut_receptor || null,
          categoria_id: form.categoria_id || null,
          storagePath,
        }),
      });

      if (res.ok) {
        setSaved(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Error al guardar el movimiento.");
      }
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setPreview(null);
    setSelectedFile(null);
    setOcrText("");
    setStoragePath("");
    setSaved(false);
    setError("");
    setForm({
      monto: "",
      descripcion: "",
      fecha: new Date().toISOString().slice(0, 10),
      tipo: "egreso",
      categoria: "",
      categoria_id: "",
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
    if (fileRef.current) fileRef.current.value = "";
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder:text-gray-400";

  return (
    <div className="flex-1 px-3 py-4 md:px-6 md:py-10">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/admin/conciliacion" className="text-xs text-gray-400 hover:text-gray-900 transition">
          &larr; Conciliación
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Escanear Documento con IA</h1>
      <p className="text-sm text-gray-400 mb-8">
        Sube una imagen de recibo, factura o boleta para extraer datos automáticamente.
      </p>

      {/* Zona de carga */}
      <div className="mb-8">
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
            dragging
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 hover:border-orange-400 hover:bg-gray-100"
          }`}
        >
          {preview ? (
            <img src={preview} alt="Vista previa" className="max-h-64 mx-auto rounded-lg" />
          ) : (
            <div>
              <div className="text-4xl text-gray-300 mb-3">&#128196;</div>
              <p className="text-gray-400">
                {dragging ? "Suelta la imagen aquí" : "Click o arrastra una imagen de recibo/factura"}
              </p>
              <p className="text-xs text-gray-300 mt-1">JPG, PNG - Tickets, facturas, recibos</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />

        {/* Botón analizar */}
        {preview && !ocrText && !processing && (
          <button
            onClick={analyzeFile}
            className="mt-4 rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition"
          >
            Analizar con IA
          </button>
        )}

        {processing && (
          <div className="mt-4 flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full" />
            <span className="text-sm text-gray-400">Analizando documento con IA...</span>
          </div>
        )}

        {error && !ocrText && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {/* Resultados: texto OCR + formulario */}
      {ocrText && !saved && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Texto detectado */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">Texto detectado por IA</h2>
            <pre className="text-sm bg-gray-50 border border-gray-200 p-4 rounded-lg whitespace-pre-wrap max-h-96 overflow-auto text-gray-600">
              {ocrText}
            </pre>
          </div>

          {/* Formulario */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">Datos del movimiento</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Tipo y fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Tipo *</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    required
                    className={inputClass}
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Fecha *</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Monto */}
              <div>
                <label className="mb-1 block text-sm text-gray-600">Monto CLP * (detectado por IA)</label>
                <input
                  type="number"
                  step="1"
                  min={0}
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  required
                  className={inputClass}
                  placeholder="0"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="mb-1 block text-sm text-gray-600">Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  maxLength={500}
                  className={inputClass}
                  placeholder="Descripción del movimiento..."
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="mb-1 block text-sm text-gray-600">Categoría * (sugerida por IA)</label>
                <select
                  value={form.categoria_id}
                  onChange={(e) => {
                    const selected = categorias.find((c) => c.id === e.target.value);
                    setForm({
                      ...form,
                      categoria_id: e.target.value,
                      categoria: selected?.nombre ?? "",
                    });
                  }}
                  required
                  className={inputClass}
                >
                  <option value="">Selecciona una categoría...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Referencia y centro de costo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Referencia / N° documento</label>
                  <input
                    type="text"
                    value={form.referencia}
                    onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                    maxLength={100}
                    className={inputClass}
                    placeholder="Ej: FAC-2026-001"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Centro de costo</label>
                  <input
                    type="text"
                    value={form.centro_costo}
                    onChange={(e) => setForm({ ...form, centro_costo: e.target.value })}
                    maxLength={100}
                    className={inputClass}
                    placeholder="Ej: Operaciones Sur"
                  />
                </div>
              </div>

              {/* Separador: Datos tributarios */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Datos Tributarios</h3>
              </div>

              {/* Tipo documento y forma de pago */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Tipo Documento</label>
                  <select
                    value={form.tipo_documento}
                    onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Sin especificar</option>
                    {TIPOS_DOCUMENTO.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Forma de Pago</label>
                  <select
                    value={form.forma_pago}
                    onChange={(e) => setForm({ ...form, forma_pago: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Sin especificar</option>
                    {FORMAS_PAGO.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RUT emisor y razón social */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">RUT Emisor</label>
                  <input
                    type="text"
                    value={form.rut_emisor}
                    onChange={(e) => setForm({ ...form, rut_emisor: e.target.value })}
                    maxLength={20}
                    className={inputClass}
                    placeholder="Ej: 76.123.456-7"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Razón Social Emisor</label>
                  <input
                    type="text"
                    value={form.razon_social_emisor}
                    onChange={(e) => setForm({ ...form, razon_social_emisor: e.target.value })}
                    maxLength={200}
                    className={inputClass}
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
                    step="1"
                    min={0}
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
                    className={inputClass}
                    placeholder="Sin IVA"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">IVA (19%)</label>
                  <input
                    type="number"
                    step="1"
                    min={0}
                    value={form.monto_iva}
                    onChange={(e) => setForm({ ...form, monto_iva: e.target.value })}
                    className={inputClass}
                    placeholder="IVA"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Monto Total</label>
                  <input
                    type="number"
                    step="1"
                    min={0}
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
                    className={inputClass}
                    placeholder="Con IVA"
                  />
                </div>
              </div>

              {/* RUT receptor */}
              <div>
                <label className="mb-1 block text-sm text-gray-600">RUT Receptor</label>
                <input
                  type="text"
                  value={form.rut_receptor}
                  onChange={(e) => setForm({ ...form, rut_receptor: e.target.value })}
                  maxLength={20}
                  className={inputClass}
                  placeholder="RUT de ELEMEC"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar movimiento"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-500 hover:text-gray-900 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Éxito */}
      {saved && (
        <div className="max-w-md">
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
            <p className="text-green-700 font-semibold mb-4">Movimiento guardado correctamente</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/admin/conciliacion"
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-500 hover:text-gray-900 transition"
              >
                Ver conciliación
              </Link>
              <button
                onClick={reset}
                className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600 transition"
              >
                Escanear otro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
