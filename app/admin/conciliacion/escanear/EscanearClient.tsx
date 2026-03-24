"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";

const CATEGORIAS_DEFAULT = [
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

interface OcrResult {
  ocrText: string;
  monto: number | null;
  descripcion: string | null;
  fecha: string | null;
  categoria: string | null;
  tipo: "ingreso" | "egreso";
  referencia: string | null;
  storagePath: string;
  categorias: string[];
}

export default function EscanearClient() {
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_DEFAULT);
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
    referencia: "",
    centro_costo: "",
  });

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
      if (data.categorias?.length) setCategorias(data.categorias);

      setForm({
        monto: data.monto != null ? String(data.monto) : "",
        descripcion: data.descripcion || "",
        fecha: data.fecha || new Date().toISOString().slice(0, 10),
        tipo: data.tipo || "egreso",
        categoria: data.categoria || "",
        referencia: data.referencia || "",
        centro_costo: "",
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
      referencia: "",
      centro_costo: "",
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  const inputClass =
    "w-full rounded-lg border border-white/20 bg-[#13131f] px-3 py-2 text-sm text-white outline-none focus:border-[#e2b44b] placeholder:text-white/30";

  return (
    <div className="flex-1 px-6 py-10">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/admin/conciliacion" className="text-xs text-white/40 hover:text-white transition">
          &larr; Conciliación
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-1">Escanear Documento con IA</h1>
      <p className="text-sm text-white/50 mb-8">
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
              ? "border-[#e2b44b] bg-[#e2b44b]/10"
              : "border-white/20 hover:border-[#e2b44b]/60 hover:bg-white/5"
          }`}
        >
          {preview ? (
            <img src={preview} alt="Vista previa" className="max-h-64 mx-auto rounded-lg" />
          ) : (
            <div>
              <div className="text-4xl text-white/20 mb-3">&#128196;</div>
              <p className="text-white/50">
                {dragging ? "Suelta la imagen aquí" : "Click o arrastra una imagen de recibo/factura"}
              </p>
              <p className="text-xs text-white/30 mt-1">JPG, PNG - Tickets, facturas, recibos</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />

        {/* Botón analizar */}
        {preview && !ocrText && !processing && (
          <button
            onClick={analyzeFile}
            className="mt-4 rounded-lg bg-[#e2b44b] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#d4a43a] transition"
          >
            Analizar con IA
          </button>
        )}

        {processing && (
          <div className="mt-4 flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-[#e2b44b] border-t-transparent rounded-full" />
            <span className="text-sm text-white/50">Analizando documento con IA...</span>
          </div>
        )}

        {error && !ocrText && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>

      {/* Resultados: texto OCR + formulario */}
      {ocrText && !saved && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Texto detectado */}
          <div>
            <h2 className="text-sm font-semibold text-white/70 mb-3">Texto detectado por IA</h2>
            <pre className="text-sm bg-[#13131f] border border-white/10 p-4 rounded-lg whitespace-pre-wrap max-h-96 overflow-auto text-white/60">
              {ocrText}
            </pre>
          </div>

          {/* Formulario */}
          <div>
            <h2 className="text-sm font-semibold text-white/70 mb-3">Datos del movimiento</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Tipo y fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-white/70">Tipo *</label>
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
                  <label className="mb-1 block text-sm text-white/70">Fecha *</label>
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
                <label className="mb-1 block text-sm text-white/70">Monto CLP * (detectado por IA)</label>
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
                <label className="mb-1 block text-sm text-white/70">Descripción</label>
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
                <label className="mb-1 block text-sm text-white/70">Categoría * (sugerida por IA)</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  required
                  className={inputClass}
                >
                  <option value="">Selecciona una categoría...</option>
                  {categorias.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Referencia y centro de costo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-white/70">Referencia / N° documento</label>
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
                  <label className="mb-1 block text-sm text-white/70">Centro de costo</label>
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

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#e2b44b] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#d4a43a] transition disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar movimiento"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg border border-white/20 px-6 py-2.5 text-sm text-white/60 hover:text-white transition"
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
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6 text-center">
            <p className="text-green-400 font-semibold mb-4">Movimiento guardado correctamente</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/admin/conciliacion"
                className="rounded-lg border border-white/20 px-5 py-2 text-sm text-white/60 hover:text-white transition"
              >
                Ver conciliación
              </Link>
              <button
                onClick={reset}
                className="rounded-lg bg-[#e2b44b] px-5 py-2 text-sm font-bold text-black hover:bg-[#d4a43a] transition"
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
