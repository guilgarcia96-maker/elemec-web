"use client";

import { useState } from "react";
import Link from "next/link";

async function enviarCotizacion(form: HTMLFormElement): Promise<void> {
  const fd = new FormData(form);
  const body = Object.fromEntries(fd.entries());
  const res = await fetch("/api/cotizacion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Error al enviar");
}

const regiones = [
  "Metropolitana",
  "Valparaíso",
  "Biobío",
  "Los Lagos",
  "Aysén",
  "Magallanes y Antártica Chilena",
  "Otra",
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

const tiposServicio = [
  "Obras e instalaciones industriales",
  "Mantención de calderas y sistemas térmicos",
  "Proyectos e instalaciones eléctricas / potencia",
  "Generación de vapor y sistemas asociados",
  "Puesta en obra, planificación y control de costos",
  "Aislación térmica",
  "Asesoría técnica",
  "Tramitaciones y normalización",
  "Otro",
];

export default function CotizaAquiPage() {
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header de página */}
      <section className="border-b border-[var(--header-border)] bg-[var(--section-alt)] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            ELEMEC
          </p>
          <h1 className="mt-2 text-4xl font-bold text-[var(--text)]">
            Cotización
          </h1>
          <p className="mt-4 max-w-3xl text-[var(--text-soft)]">
            Completa el formulario con los detalles de tu proyecto u obra. Te
            responderemos a la brevedad con una evaluación técnica sin costo.
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
              onSubmit={async (e) => {
                e.preventDefault();
                setEnviando(true);
                setError(null);
                try {
                  await enviarCotizacion(e.currentTarget);
                  setEnviado(true);
                } catch {
                  setError("No se pudo enviar la solicitud. Inténtalo nuevamente.");
                } finally {
                  setEnviando(false);
                }
              }}
            >
              {/* Datos personales */}
              <div className="sm:col-span-2">
                <h2 className="text-lg font-semibold text-[var(--brand-soft)]">
                  Datos de contacto
                </h2>
                <div className="mt-1 h-px bg-[var(--border)]" />
              </div>

              <Field label="Nombre" name="nombre" type="text" placeholder="Tu nombre" required />
              <Field label="Apellidos" name="apellidos" type="text" placeholder="Tus apellidos" required />
              <Field label="Compañía" name="compania" type="text" placeholder="Nombre de la empresa" />
              <Field label="RUT Empresa" name="rutEmpresa" type="text" placeholder="12.345.678-9" />
              <Field label="Cargo" name="cargo" type="text" placeholder="Tu cargo en la empresa" />
              <Field label="Correo electrónico" name="email" type="email" placeholder="tu@email.com" required />
              <Field label="Móvil" name="movil" type="tel" placeholder="+56 9 ..." />
              <Field label="Teléfono" name="telefono" type="tel" placeholder="+56 2 ..." />

              {/* Datos del proyecto */}
              <div className="sm:col-span-2 mt-2">
                <h2 className="text-lg font-semibold text-[var(--brand-soft)]">
                  Información del proyecto / obra
                </h2>
                <div className="mt-1 h-px bg-[var(--border)]" />
              </div>

              <Field label="Nombre de la obra o proyecto" name="nombreObra" type="text" placeholder="Ej: Planta procesadora Norte" />
              <Field label="Fecha de inicio estimada" name="fechaInicio" type="date" />
              <div className="sm:col-span-2">
                <Field label="Dirección de la obra / proyecto" name="direccion" type="text" placeholder="Calle, número, ciudad" />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Región
                </label>
                <select name="region" className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]">
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
                <select name="tipoObra" className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]">
                  <option value="">— Selecciona —</option>
                  {tiposObra.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Tipo de servicio requerido
                </label>
                <select name="tipoServicio" className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]">
                  <option value="">— Selecciona —</option>
                  {tiposServicio.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Comentarios
                </label>
                <textarea
                  name="comentarios"
                  rows={5}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]"
                  placeholder="Describe con el mayor detalle posible tu requerimiento: alcance, plazos, condiciones especiales, etc."
                />
              </div>

              {/* Envío */}
              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
                <p className="text-xs text-[var(--text-soft)]">
                  Política de privacidad: pendiente de publicación. Tu
                  información se usará únicamente para responder tu solicitud.
                </p>
                <button
                  type="submit"
                  disabled={enviando}
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
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  required?: boolean;
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
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]"
      />
    </div>
  );
}
