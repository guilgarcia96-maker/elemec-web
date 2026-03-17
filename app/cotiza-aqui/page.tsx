"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { servicios } from "../servicios/serviciosData";

/* ─── File limits ─────────────────────────────────────────────────────────── */
const MAX_FILE_MB = 20;
const MAX_TOTAL_MB = 80;
const MAX_FILES = 8;

/* ─── RUT helpers ─────────────────────────────────────────────────────────── */
function formatRut(raw: string): string {
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length === 0) return "";
  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);
  if (body.length === 0) return dv;
  let grouped = "";
  for (let i = body.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) grouped = "." + grouped;
    grouped = body[i] + grouped;
  }
  return `${grouped}-${dv}`;
}

function validateRut(rut: string): boolean {
  const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const rem = 11 - (sum % 11);
  const expected = rem === 11 ? "0" : rem === 10 ? "K" : String(rem);
  return dv === expected;
}

/* ─── Phone helpers ───────────────────────────────────────────────────────── */
// Returns digits-only local number (strips country code 56 if present), capped at 9 digits.
function localDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const local =
    digits.startsWith("56") && digits.length > 2 ? digits.slice(2) : digits;
  return local.slice(0, 9);
}

function formatPhone(raw: string): string {
  const d = localDigits(raw);
  if (!d) return "";
  if (d.startsWith("9")) {
    // Mobile: +56 9 XXXX XXXX
    const g1 = d.slice(1, 5);
    const g2 = d.slice(5, 9);
    const parts = ["+56 9", g1, g2].filter(Boolean);
    return parts.join(" ");
  }
  // Fixed line: +56 XX XXX XXXX
  const g0 = d.slice(0, 2);
  const g1 = d.slice(2, 5);
  const g2 = d.slice(5, 9);
  return ["+56", g0, g1, g2].filter(Boolean).join(" ");
}

// A complete Chilean number has exactly 9 local digits.
function validatePhone(tel: string): boolean {
  if (!tel) return true;
  const d = localDigits(tel);
  return d.length === 9;
}

/* ─── Presupuesto helpers ─────────────────────────────────────────────────── */
function formatCLP(digits: string): string {
  if (!digits) return "";
  return Number(digits).toLocaleString("es-CL");
}

const regiones = [
  "Metropolitana",
  "Aysén",
  "Magallanes y Antártica Chilena",
];

const tiposObra = [
  "Industrial / Plantas de proceso",
  "Salud / Hospitales",
  "Energía y combustibles",
  "Sector público e institucional",
  "Comercial",
  "Residencial",
  "Otro",
];

const prioridades = ["Crítica (0-48h)", "Alta (esta semana)", "Media (este mes)", "Planificada"];
const modalidades = ["Proyecto nuevo", "Ampliación", "Mantención", "Reparación", "Otro"];
const MOBILE_EXAMPLE = "+56 9 8765 4321";
const LANDLINE_EXAMPLE = "+56 61 234 5678";

export default function CotizaAquiPage() {
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servicioSlug, setServicioSlug] = useState("");
  const [alcancesSeleccionados, setAlcancesSeleccionados] = useState<string[]>([]);

  /* ── Controlled validated fields ──────────────────────────────────────── */
  const [rutVal, setRutVal] = useState("");
  const [rutError, setRutError] = useState("");
  const [movilError, setMovilError] = useState("");
  const [telefonoError, setTelefonoError] = useState("");
  const movilRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);

  function handlePhoneBlur(
    ref: React.RefObject<HTMLInputElement | null>,
    setErr: (v: string) => void,
    example: string
  ) {
    const input = ref.current;
    if (!input || !input.value.trim()) { setErr(""); return; }
    const formatted = formatPhone(input.value);
    input.value = formatted;
    if (!validatePhone(formatted)) {
      setErr(`Número incompleto. Ej: ${example}`);
    } else {
      setErr("");
    }
  }

  /* presupuesto: raw digits + editing flag for blur-only formatting */
  const [presupuestoRaw, setPresupuestoRaw] = useState("");
  const [presupuestoEditing, setPresupuestoEditing] = useState(false);
  const presupuestoDisplay = presupuestoEditing
    ? presupuestoRaw
    : presupuestoRaw
    ? formatCLP(presupuestoRaw)
    : "";

  /* file validation */
  const [fileError, setFileError] = useState("");

  const servicioActivo = servicios.find((s) => s.slug === servicioSlug);

  function toggleAlcance(item: string, checked: boolean) {
    setAlcancesSeleccionados((prev) =>
      checked ? Array.from(new Set([...prev, item])) : prev.filter((i) => i !== item)
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setFileError("");
    if (!files.length) return;

    if (files.length > MAX_FILES) {
      setFileError(`Máximo ${MAX_FILES} archivos por envío.`);
      e.target.value = "";
      return;
    }
    const oversized = files.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (oversized.length) {
      setFileError(
        `${oversized.length > 1 ? "Archivos" : "Archivo"} que supera${oversized.length > 1 ? "n" : ""} ${MAX_FILE_MB} MB: ${oversized.map((f) => f.name).join(", ")}`
      );
      e.target.value = "";
      return;
    }
    const totalBytes = files.reduce((s, f) => s + f.size, 0);
    if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
      setFileError(`El total de archivos supera el límite de ${MAX_TOTAL_MB} MB.`);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (rutVal && !validateRut(rutVal)) {
      setRutError("RUT inválido — verifica el dígito verificador.");
      return;
    }
    const movilFormatted = movilRef.current?.value
      ? formatPhone(movilRef.current.value)
      : "";
    if (movilFormatted && !validatePhone(movilFormatted)) {
      setMovilError("Número incompleto. Ej: +56 9 8765 4321");
      movilRef.current?.focus();
      return;
    }
    const telFormatted = telefonoRef.current?.value
      ? formatPhone(telefonoRef.current.value)
      : "";
    if (telFormatted && !validatePhone(telFormatted)) {
      setTelefonoError("Número incompleto. Ej: +56 61 234 5678");
      telefonoRef.current?.focus();
      return;
    }
    if (fileError) return;

    setEnviando(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("alcances", JSON.stringify(alcancesSeleccionados));
      /* send raw numeric string for presupuesto */
      fd.set("presupuestoEstimado", presupuestoRaw);
      const res = await fetch("/api/cotizacion", { method: "POST", body: fd });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Error al enviar");
      }
      setEnviado(true);
      setServicioSlug("");
      setAlcancesSeleccionados([]);
      setRutVal("");
      if (movilRef.current) movilRef.current.value = "";
      if (telefonoRef.current) telefonoRef.current.value = "";
      setPresupuestoRaw("");
    } catch {
      setError("No se pudo enviar la solicitud. Inténtalo nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header de página */}
      <section className="border-b border-[var(--header-border)] bg-[var(--section-alt)] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            ELEMEC
          </p>
          <h1 className="mt-2 text-4xl font-bold text-[var(--text)]">
            Solicitud de Cotización Técnica
          </h1>
          <p className="mt-4 max-w-3xl text-[var(--text-soft)]">
            Selecciona el servicio y los alcances específicos que necesitas.
            Nuestro equipo técnico revisará tu requerimiento y enviará propuesta
            con plan de trabajo, plazos y recursos.
          </p>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <p className="text-[var(--text-soft)]">Teléfono</p>
              <p className="mt-1 font-semibold">+56 9 0000 0000</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <p className="text-[var(--text-soft)]">Email</p>
              <p className="mt-1 font-semibold">contacto@elemec.cl</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <p className="text-[var(--text-soft)]">Horario</p>
              <p className="mt-1 font-semibold">Lun a Vie 08:30 – 18:30</p>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-6">
          {enviado ? (
            <div className="rounded-2xl border border-green-700/40 bg-green-900/20 p-8 text-center">
              <p className="text-2xl font-bold text-green-400">
                ¡Cotización enviada!
              </p>
              <p className="mt-3 text-[var(--text-soft)]">
                Gracias por tu solicitud. Te responderemos a la brevedad con
                una evaluación técnica detallada.
              </p>
              <button
                type="button"
                onClick={() => setEnviado(false)}
                className="mt-5 rounded-lg border border-[var(--border)] px-5 py-2 text-sm text-[var(--text-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
              >
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form
              className="grid gap-5 sm:grid-cols-2"
              onSubmit={handleSubmit}
            >
              {/* ── Datos de contacto ───────────────────────────────────── */}
              <div className="sm:col-span-2">
                <h2 className="text-lg font-semibold text-[var(--brand-soft)]">
                  Datos de contacto
                </h2>
                <div className="mt-1 h-px bg-[var(--border)]" />
              </div>

              <Field label="Nombre" name="nombre" type="text" placeholder="TU NOMBRE" required uppercase />
              <Field label="Apellidos" name="apellidos" type="text" placeholder="TUS APELLIDOS" required uppercase />
              <Field label="Compañía" name="compania" type="text" placeholder="NOMBRE DE LA EMPRESA" uppercase />

              {/* RUT — auto-format + mod-11 validation */}
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  RUT Empresa
                </label>
                <input
                  name="rutEmpresa"
                  value={rutVal}
                  onChange={(e) => {
                    setRutVal(formatRut(e.target.value));
                    setRutError("");
                  }}
                  onBlur={() => {
                    if (rutVal && !validateRut(rutVal))
                      setRutError("RUT inválido — verifica el dígito verificador.");
                  }}
                  placeholder="12.345.678-9"
                  maxLength={12}
                  className={`w-full rounded-lg border ${
                    rutError ? "border-red-500" : "border-[var(--border)]"
                  } bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]`}
                />
                {rutError && (
                  <p className="mt-1 text-xs text-red-400">{rutError}</p>
                )}
              </div>

              <Field label="Cargo" name="cargo" type="text" placeholder="TU CARGO EN LA EMPRESA" uppercase />
              <Field label="Correo electrónico" name="email" type="email" placeholder="tu@email.com" required />

              {/* Móvil — auto-format +56 9 XXXX XXXX */}
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Móvil
                </label>
                <input
                  name="movil"
                  ref={movilRef}
                  defaultValue=""
                  onChange={() => setMovilError("")}
                  onBlur={() => {
                    handlePhoneBlur(movilRef, setMovilError, MOBILE_EXAMPLE);
                  }}
                  placeholder="+56 9 XXXX XXXX"
                  maxLength={18}
                  inputMode="tel"
                  className={`w-full rounded-lg border ${
                    movilError ? "border-red-500" : "border-[var(--border)]"
                  } bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]`}
                />
                {movilError && (
                  <p className="mt-1 text-xs text-red-400">{movilError}</p>
                )}
              </div>

              {/* Teléfono — auto-format +56 XX XXX XXXX */}
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Teléfono
                </label>
                <input
                  name="telefono"
                  ref={telefonoRef}
                  defaultValue=""
                  onChange={() => setTelefonoError("")}
                  onBlur={() => {
                    handlePhoneBlur(telefonoRef, setTelefonoError, LANDLINE_EXAMPLE);
                  }}
                  placeholder="+56 61 XXX XXXX"
                  maxLength={18}
                  inputMode="tel"
                  className={`w-full rounded-lg border ${
                    telefonoError ? "border-red-500" : "border-[var(--border)]"
                  } bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]`}
                />
                {telefonoError && (
                  <p className="mt-1 text-xs text-red-400">{telefonoError}</p>
                )}
              </div>

              {/* ── Datos del proyecto ──────────────────────────────────── */}
              <div className="sm:col-span-2 mt-2">
                <h2 className="text-lg font-semibold text-[var(--brand-soft)]">
                  Información del proyecto / obra
                </h2>
                <div className="mt-1 h-px bg-[var(--border)]" />
              </div>

              <Field label="Nombre de la obra o proyecto" name="nombreObra" type="text" placeholder="EJ: PLANTA PROCESADORA NORTE" uppercase />
              <Field label="Fecha de inicio estimada" name="fechaInicio" type="date" />
              <div className="sm:col-span-2">
                <Field label="Dirección de la obra / proyecto" name="direccion" type="text" placeholder="CALLE, NÚMERO, CIUDAD" uppercase />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Región
                </label>
                <select
                  name="region"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="">— Selecciona —</option>
                  {regiones.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Tipo de obra
                </label>
                <select
                  name="tipoObra"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="">— Selecciona —</option>
                  {tiposObra.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Modalidad requerida
                </label>
                <select
                  name="modalidad"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="">— Selecciona —</option>
                  {modalidades.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Prioridad operacional
                </label>
                <select
                  name="prioridad"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="">— Selecciona —</option>
                  {prioridades.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* ── Servicio y alcances ─────────────────────────────────── */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Servicio principal solicitado
                </label>
                <select
                  name="servicioPrincipal"
                  value={servicioSlug}
                  onChange={(e) => {
                    setServicioSlug(e.target.value);
                    setAlcancesSeleccionados([]);
                  }}
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="">— Selecciona —</option>
                  {servicios.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.titulo}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--section-alt)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">
                      Alcances del servicio
                    </p>
                    <p className="text-xs text-[var(--text-soft)]">
                      Marca los alcances específicos para construir una propuesta ajustada.
                    </p>
                  </div>
                  <p className="text-xs text-[var(--accent)]">
                    {alcancesSeleccionados.length} seleccionados
                  </p>
                </div>

                {servicioActivo ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {servicioActivo.items.map((item) => {
                      const checked = alcancesSeleccionados.includes(item);
                      return (
                        <label
                          key={item}
                          className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleAlcance(item, e.target.checked)}
                            className="mt-0.5"
                          />
                          <span className="text-[var(--text-soft)]">{item}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[var(--text-soft)]">
                    Primero selecciona un servicio principal para habilitar sus alcances.
                  </p>
                )}
              </div>

              {/* Presupuesto — CLP format on blur */}
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Presupuesto estimado (CLP)
                </label>
                {/* hidden input carries the raw digits to FormData */}
                <input type="hidden" name="presupuestoEstimado" value={presupuestoRaw} />
                <input
                  type="text"
                  inputMode="numeric"
                  value={presupuestoDisplay}
                  onFocus={() => setPresupuestoEditing(true)}
                  onBlur={() => setPresupuestoEditing(false)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
                    setPresupuestoRaw(digits);
                  }}
                  placeholder="Ej: 15.000.000"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]"
                />
              </div>

              <Field
                label="Plazo deseado de ejecución"
                name="plazoDeseado"
                type="text"
                placeholder="EJ: 6 SEMANAS"
                uppercase
              />

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Comentarios
                </label>
                <textarea
                  name="comentarios"
                  rows={5}
                  onInput={(e) => {
                    const ta = e.target as HTMLTextAreaElement;
                    const pos = ta.selectionStart;
                    ta.value = ta.value.toUpperCase();
                    ta.setSelectionRange(pos, pos);
                  }}
                  placeholder="DESCRIBE CON EL MAYOR DETALLE POSIBLE TU REQUERIMIENTO: ALCANCE, PLAZOS, CONDICIONES ESPECIALES, ETC."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]"
                />
              </div>

              {/* ── Adjuntos ────────────────────────────────────────────── */}
              <div className="sm:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--section-alt)] p-4">
                <label className="mb-1 block text-sm font-semibold text-[var(--text)]">
                  Adjuntos del cliente
                </label>
                <p className="mb-3 text-xs text-[var(--text-soft)]">
                  Sube planos, especificaciones, fotos de terreno, documentos
                  técnicos o bases de licitación.{" "}
                  <span className="text-[var(--accent)]">
                    Máx. {MAX_FILES} archivos · {MAX_FILE_MB} MB por archivo · {MAX_TOTAL_MB} MB en total.
                  </span>
                </p>
                <input
                  type="file"
                  name="archivos"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.dwg"
                  onChange={handleFileChange}
                  className="block w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] file:mr-4 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
                />
                {fileError && (
                  <p className="mt-2 text-xs text-red-400">{fileError}</p>
                )}
              </div>

              {/* Envío */}
              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
                <p className="text-xs text-[var(--text-soft)]">
                  Tu información se usará únicamente para responder tu solicitud.
                </p>
                <button
                  type="submit"
                  disabled={enviando || !!fileError}
                  className="rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {enviando ? "Enviando…" : "Enviar solicitud"}
                </button>
              </div>
              {error && (
                <p className="sm:col-span-2 text-sm text-red-400">{error}</p>
              )}
            </form>
          )}

          {/* Política */}
          <p className="mt-8 text-center text-xs text-[var(--text-soft)]">
            <Link
              href="#"
              className="underline hover:text-[var(--accent)] transition"
            >
              Ver Política Corporativa en Seguridad, Salud y Medio Ambiente →
            </Link>
          </p>
        </div>
      </section>

      {/* Contacto alternativo */}
      <section className="border-t border-[var(--header-border)] bg-[var(--section-alt)] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-xl font-semibold text-[var(--text)]">
            ¿Prefieres contactarnos directamente?
          </h2>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <a
              href="https://wa.me/56900000000"
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <p className="font-semibold">WhatsApp</p>
              <p className="mt-1 text-[var(--text-soft)]">+56 9 0000 0000</p>
            </a>
            <a
              href="https://maps.google.com/?q=Punta+Arenas+ELEMEC"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <p className="font-semibold">Ubicación</p>
              <p className="mt-1 text-[var(--text-soft)]">
                Bernardo O&apos;Higgins 1234, Punta Arenas
              </p>
            </a>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <p className="font-semibold">Horario de atención</p>
              <p className="mt-1 text-[var(--text-soft)]">
                Lun – Vie: 08:30 a 18:30
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  required,
  uppercase,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  uppercase?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-[var(--text-soft)]">
        {label} {required && <span className="text-[var(--accent)]">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        onInput={
          uppercase
            ? (e) => {
                const input = e.target as HTMLInputElement;
                const pos = input.selectionStart;
                input.value = input.value.toUpperCase();
                input.setSelectionRange(pos, pos);
              }
            : undefined
        }
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]"
      />
    </div>
  );
}
