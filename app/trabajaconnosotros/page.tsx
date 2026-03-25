"use client";

import { useState } from "react";
import Link from "next/link";

const beneficios = [
  "Trabajo en proyectos de alta complejidad técnica en el extremo sur del país.",
  "Equipo técnico con más de 18 años de trayectoria en ingeniería industrial.",
  "Participación en obras de impacto real para el sector salud, energía y procesos.",
  "Desarrollo profesional en una de las regiones más desafiantes de Chile.",
  "Estabilidad laboral y respeto por los equipos de trabajo.",
];

const perfilesBuscados = [
  { cargo: "Técnico en Gas y Calefacción", area: "Operaciones" },
  { cargo: "Electricista Industrial", area: "Proyectos Eléctricos" },
  { cargo: "Mecánico de Calderas", area: "Mantención" },
  { cargo: "Jefe de Obra", area: "Puesta en Obra" },
  { cargo: "Dibujante / Proyectista", area: "Ingeniería y Diseño" },
];

export default function TrabajaConNosotrosPage() {
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/postulacion", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Error al enviar la postulación");
      }

      setEnviado(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado. Por favor intenta nuevamente."
      );
    } finally {
      setCargando(false);
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
            Trabaja con Nosotros
          </h1>
          <p className="mt-4 max-w-3xl text-[var(--text-soft)]">
            ELEMEC está presente con proyectos y servicios en obras de pequeña,
            mediana y gran magnitud a lo largo de la Región de Magallanes y
            Tierra del Fuego. Contamos con personal técnico capacitado para la
            ejecución y mantención de nuestras instalaciones.
          </p>
        </div>
      </section>

      {/* Beneficios / Por qué ELEMEC */}
      <section className="py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text)]">
              ¿Por qué trabajar en ELEMEC?
            </h2>
            <p className="mt-4 text-[var(--text-soft)]">
              Somos un equipo comprometido con la excelencia técnica y la
              seguridad en terreno. Si buscas desarrollar tu carrera en
              proyectos de ingeniería en el sur de Chile, ELEMEC es tu lugar.
            </p>
            <ul className="mt-6 space-y-3">
              {beneficios.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 text-sm text-[var(--text-soft)]"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[var(--text)]">
              Perfiles que buscamos
            </h2>
            <p className="mt-4 text-sm text-[var(--text-soft)]">
              Instancias de contratación abiertas permanentemente según
              disponibilidad de proyectos.
            </p>
            <div className="mt-5 space-y-3">
              {perfilesBuscados.map((p) => (
                <div
                  key={p.cargo}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--brand-soft)]">
                      {p.cargo}
                    </p>
                    <p className="text-xs text-[var(--text-soft)]">{p.area}</p>
                  </div>
                  <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs text-[var(--accent)]">
                    Abierto
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section className="border-y border-[var(--header-border)] bg-[var(--section-alt)] py-14">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-2xl font-semibold text-[var(--text)]">
            Envía tu postulación
          </h2>
          <p className="mt-3 text-sm text-[var(--text-soft)]">
            Completa tus datos y adjunta tu CV. Serás contactado/a si tu perfil
            coincide con alguna de nuestras necesidades actuales o futuras.
          </p>

          {enviado ? (
            <div className="mt-8 rounded-xl border border-green-700/40 bg-green-900/20 p-6 text-center">
              <p className="text-lg font-semibold text-green-400">
                ¡Postulación enviada!
              </p>
              <p className="mt-2 text-sm text-[var(--text-soft)]">
                Gracias por tu interés en ELEMEC. Revisaremos tu información y
                te contactaremos si hay una oportunidad disponible.
              </p>
              <button
                type="button"
                onClick={() => { setEnviado(false); setError(null); }}
                className="mt-4 text-xs text-[var(--accent)] hover:underline"
              >
                Enviar otra postulación
              </button>
            </div>
          ) : (
            <form
              className="mt-8 grid gap-4 sm:grid-cols-2"
              onSubmit={handleSubmit}
            >
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Nombres *
                </label>
                <input
                  required
                  type="text"
                  name="nombre"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]"
                  placeholder="+56 9 ..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Celular
                </label>
                <input
                  type="tel"
                  name="celular"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]"
                  placeholder="+56 9 ..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Cargo al que postulas
                </label>
                <select name="cargo" className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]">
                  <option value="">— Selecciona —</option>
                  {perfilesBuscados.map((p) => (
                    <option key={p.cargo}>{p.cargo}</option>
                  ))}
                  <option>Otro cargo</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Adjuntar CV (PDF)
                </label>
                <input
                  type="file"
                  name="cv"
                  accept=".pdf,.doc,.docx"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text-soft)] outline-none file:mr-3 file:rounded file:border-0 file:bg-[var(--accent)] file:px-2 file:py-1 file:text-xs file:font-semibold file:text-black"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-[var(--text-soft)]">
                  Comentarios *
                </label>
                <textarea
                  rows={4}
                  name="mensaje"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]"
                  placeholder="Cuéntanos sobre tu experiencia y por qué te interesa ELEMEC..."
                />
              </div>
              {error && (
                <div className="sm:col-span-2 rounded-lg border border-red-700/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-start gap-2 text-xs text-[var(--text-soft)]">
                  <input type="checkbox" required className="mt-0.5" />
                  <span>Acepto recibir novedades por e-mail de ELEMEC.</span>
                </label>
                <button
                  type="submit"
                  disabled={cargando}
                  className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {cargando ? "Enviando..." : "ENVIAR"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-xs text-[var(--text-soft)]">
            <Link
              href="#"
              className="underline hover:text-[var(--accent)] transition"
            >
              Ver Política Corporativa en Seguridad, Salud y Medio Ambiente →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
