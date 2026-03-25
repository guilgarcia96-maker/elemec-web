"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SERVICIOS = [
  "Mantenimiento",
  "Instalacion",
  "Reparacion",
  "Inspeccion",
  "Montaje",
  "Desmontaje",
  "Asesoria",
  "Otro",
];

interface FotoItem {
  file: File;
  preview: string;
  uploading: boolean;
  adjuntoId?: string;
  storagePath?: string;
  descripcionAi?: string;
  descripcionEdit?: string;
}

interface ContenidoIA {
  resumen_ejecutivo: string;
  alcance: string;
  descripcion_trabajos: string;
  hallazgos: string;
  conclusiones: string;
  recomendaciones: string;
}

const SECCIONES_LABELS: Record<keyof ContenidoIA, string> = {
  resumen_ejecutivo: "Resumen Ejecutivo",
  alcance: "Alcance",
  descripcion_trabajos: "Descripcion de Trabajos",
  hallazgos: "Hallazgos",
  conclusiones: "Conclusiones",
  recomendaciones: "Recomendaciones",
};

export default function NuevoInformePage() {
  const router = useRouter();

  // Seccion 1: Datos generales
  const [titulo, setTitulo] = useState("");
  const [servicioTipo, setServicioTipo] = useState("");
  const [obra, setObra] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [fechaTrabajo, setFechaTrabajo] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteEmpresa, setClienteEmpresa] = useState("");

  // Secciones colapsables
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    datos: true,
    fotos: true,
    contenido: true,
  });

  // Seccion 2: Fotos
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [analizandoTodas, setAnalizandoTodas] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seccion 3: Contenido
  const [descripcionTrabajos, setDescripcionTrabajos] = useState("");
  const [contenidoIA, setContenidoIA] = useState<ContenidoIA | null>(null);
  const [generandoTexto, setGenerandoTexto] = useState(false);

  // Estado general
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // ID temporal para asociar fotos antes de guardar
  const [tempInformeId, setTempInformeId] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Crear informe temporal para asociar fotos
  const ensureInformeId = useCallback(async (): Promise<string | null> => {
    if (tempInformeId) return tempInformeId;
    try {
      const res = await fetch("/api/admin/informes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim() || "Informe sin titulo",
          tipo: "tecnico",
          servicio_tipo: servicioTipo || null,
          obra: obra || null,
          ubicacion: ubicacion || null,
          fecha_trabajo: fechaTrabajo || null,
          cliente_nombre: clienteNombre || null,
          cliente_empresa: clienteEmpresa || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al crear informe temporal");
        return null;
      }
      const data = await res.json();
      setTempInformeId(data.id);
      return data.id as string;
    } catch {
      setError("Error de conexion al crear informe");
      return null;
    }
  }, [tempInformeId, titulo, servicioTipo, obra, ubicacion, fechaTrabajo, clienteNombre, clienteEmpresa]);

  // Subir y analizar una foto
  const analizarFoto = async (index: number) => {
    const foto = fotos[index];
    if (!foto || foto.adjuntoId) return;

    const informeId = await ensureInformeId();
    if (!informeId) return;

    setFotos((prev) =>
      prev.map((f, i) => (i === index ? { ...f, uploading: true } : f)),
    );

    try {
      const formData = new FormData();
      formData.append("image", foto.file);
      formData.append("informe_id", informeId);

      const res = await fetch("/api/admin/informes/analizar-foto", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al analizar foto");
        setFotos((prev) =>
          prev.map((f, i) => (i === index ? { ...f, uploading: false } : f)),
        );
        return;
      }

      const data = await res.json();
      setFotos((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                uploading: false,
                adjuntoId: data.id,
                storagePath: data.storagePath,
                descripcionAi: data.descripcion_ai,
                descripcionEdit: data.descripcion_ai,
              }
            : f,
        ),
      );
    } catch {
      setError("Error de conexion al analizar foto");
      setFotos((prev) =>
        prev.map((f, i) => (i === index ? { ...f, uploading: false } : f)),
      );
    }
  };

  // Analizar todas las fotos sin procesar
  const analizarTodas = async () => {
    setAnalizandoTodas(true);
    for (let i = 0; i < fotos.length; i++) {
      if (!fotos[i].adjuntoId) {
        await analizarFoto(i);
      }
    }
    setAnalizandoTodas(false);
  };

  // Agregar fotos
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const nuevas: FotoItem[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
        uploading: false,
      }));
    setFotos((prev) => [...prev, ...nuevas]);
  };

  // Eliminar foto
  const eliminarFoto = (index: number) => {
    setFotos((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  // Generar texto con IA
  const generarTexto = async () => {
    if (!descripcionTrabajos.trim()) {
      setError("Describe los trabajos realizados antes de generar el borrador");
      return;
    }

    setGenerandoTexto(true);
    setError("");

    try {
      const fotosDescripciones = fotos
        .filter((f) => f.descripcionEdit || f.descripcionAi)
        .map((f) => f.descripcionEdit || f.descripcionAi || "");

      const res = await fetch("/api/admin/informes/generar-texto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          informe_id: tempInformeId,
          tipo_servicio: servicioTipo,
          obra,
          descripcion_trabajos: descripcionTrabajos,
          fotos_descripciones: fotosDescripciones,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al generar texto");
        setGenerandoTexto(false);
        return;
      }

      const data = await res.json();
      setContenidoIA(data as ContenidoIA);
    } catch {
      setError("Error de conexion al generar texto");
    }
    setGenerandoTexto(false);
  };

  // Guardar informe
  const guardar = async (estado: "borrador" | "emitido") => {
    if (!titulo.trim()) {
      setError("El titulo es obligatorio");
      return;
    }

    setSaving(true);
    setError("");

    const contenido_json = contenidoIA || {};
    const contenido_html = ""; // se genera bajo demanda via PDF

    try {
      if (tempInformeId) {
        // Actualizar el informe temporal
        const res = await fetch(`/api/admin/informes/${tempInformeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: titulo.trim(),
            tipo: "tecnico",
            servicio_tipo: servicioTipo || null,
            obra: obra || null,
            ubicacion: ubicacion || null,
            fecha_trabajo: fechaTrabajo || null,
            cliente_nombre: clienteNombre || null,
            cliente_empresa: clienteEmpresa || null,
            contenido_json,
            contenido_html,
            estado,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al guardar");
          setSaving(false);
          return;
        }

        router.push(`/admin/informes/${tempInformeId}`);
      } else {
        // Crear nuevo
        const res = await fetch("/api/admin/informes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: titulo.trim(),
            tipo: "tecnico",
            servicio_tipo: servicioTipo || null,
            obra: obra || null,
            ubicacion: ubicacion || null,
            fecha_trabajo: fechaTrabajo || null,
            cliente_nombre: clienteNombre || null,
            cliente_empresa: clienteEmpresa || null,
            contenido_json,
            contenido_html,
            estado,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al crear informe");
          setSaving(false);
          return;
        }

        const data = await res.json();
        router.push(`/admin/informes/${data.id}`);
      }
    } catch {
      setError("Error de conexion al guardar");
      setSaving(false);
    }
  };

  // Drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/informes"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-400 transition"
          >
            &larr; Volver
          </Link>
          <h1 className="text-2xl font-bold">Nuevo Informe Tecnico</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SECCION 1: Datos generales */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <button
            onClick={() => toggleSection("datos")}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-gray-500">
              1. Datos Generales
            </span>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${openSections.datos ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.datos && (
            <div className="border-t border-gray-100 px-5 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500">Titulo del informe *</label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Informe de mantenimiento preventivo Torres de Enfriamiento"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Tipo de servicio</label>
                  <select
                    value={servicioTipo}
                    onChange={(e) => setServicioTipo(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Seleccionar...</option>
                    {SERVICIOS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Obra / Proyecto</label>
                  <input
                    type="text"
                    value={obra}
                    onChange={(e) => setObra(e.target.value)}
                    placeholder="Nombre de la obra"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Ubicacion</label>
                  <input
                    type="text"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="Direccion o ubicacion del trabajo"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Fecha del trabajo</label>
                  <input
                    type="date"
                    value={fechaTrabajo}
                    onChange={(e) => setFechaTrabajo(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Nombre del cliente</label>
                  <input
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Nombre de contacto"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Empresa del cliente</label>
                  <input
                    type="text"
                    value={clienteEmpresa}
                    onChange={(e) => setClienteEmpresa(e.target.value)}
                    placeholder="Razon social"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECCION 2: Fotos */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <button
            onClick={() => toggleSection("fotos")}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-gray-500">
              2. Fotografias ({fotos.length})
            </span>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${openSections.fotos ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.fotos && (
            <div className="border-t border-gray-100 px-5 py-5">
              {/* Drag-drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition hover:border-orange-400 hover:bg-orange-50/30"
              >
                <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                </svg>
                <p className="text-sm text-gray-500">Arrastra fotos aqui o haz clic para seleccionar</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
              </div>

              {fotos.length > 0 && (
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={analizarTodas}
                    disabled={analizandoTodas || fotos.every((f) => !!f.adjuntoId)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {analizandoTodas ? "Analizando..." : "Analizar todas con IA"}
                  </button>
                </div>
              )}

              {/* Grid de fotos */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fotos.map((foto, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto.preview}
                        alt={`Foto ${i + 1}`}
                        className="h-48 w-full object-cover"
                      />
                      <button
                        onClick={() => eliminarFoto(i)}
                        className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 transition"
                        title="Eliminar foto"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {foto.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      {foto.adjuntoId ? (
                        <textarea
                          value={foto.descripcionEdit || ""}
                          onChange={(e) =>
                            setFotos((prev) =>
                              prev.map((f, j) =>
                                j === i ? { ...f, descripcionEdit: e.target.value } : f,
                              ),
                            )
                          }
                          rows={3}
                          className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      ) : (
                        <button
                          onClick={() => analizarFoto(i)}
                          disabled={foto.uploading}
                          className="w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                        >
                          Analizar con IA
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECCION 3: Contenido */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <button
            onClick={() => toggleSection("contenido")}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-gray-500">
              3. Contenido del Informe
            </span>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${openSections.contenido ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.contenido && (
            <div className="border-t border-gray-100 px-5 py-5">
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Descripcion de los trabajos realizados
                </label>
                <textarea
                  value={descripcionTrabajos}
                  onChange={(e) => setDescripcionTrabajos(e.target.value)}
                  rows={5}
                  placeholder="Describe brevemente los trabajos realizados, equipos involucrados y procedimientos aplicados..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <button
                onClick={generarTexto}
                disabled={generandoTexto}
                className="mb-6 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
              >
                {generandoTexto ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generando borrador...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    Generar borrador con IA
                  </>
                )}
              </button>

              {/* Secciones generadas */}
              {contenidoIA && (
                <div className="space-y-4">
                  {(Object.keys(SECCIONES_LABELS) as (keyof ContenidoIA)[]).map((key) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500">
                        {SECCIONES_LABELS[key]}
                      </label>
                      <textarea
                        value={contenidoIA[key]}
                        onChange={(e) =>
                          setContenidoIA((prev) =>
                            prev ? { ...prev, [key]: e.target.value } : prev,
                          )
                        }
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones de accion */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => guardar("borrador")}
            disabled={saving}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar borrador"}
          </button>
          <button
            onClick={() => guardar("emitido")}
            disabled={saving}
            className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar y emitir"}
          </button>
          <Link
            href="/admin/informes"
            className="rounded-lg px-4 py-2.5 text-sm text-gray-400 transition hover:text-gray-600"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  );
}
