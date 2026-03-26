import Link from "next/link";
import { servicios } from "./servicios/serviciosData";

const noticias = [
  {
    slug: "#",
    titulo: "ELEMEC completa proyecto de redes de vapor en Punta Arenas",
    resumen:
      "Exitosa finalización de un sistema de generación y distribución de vapor para instalación industrial en la zona norte de la ciudad.",
    fecha: "Noviembre 2025",
  },
  {
    slug: "#",
    titulo: "Mantenimiento preventivo de calderas: claves para la seguridad operacional",
    resumen:
      "En entornos hospitalarios y de proceso continuo, la mantención regular de calderas es fundamental para garantizar continuidad y seguridad.",
    fecha: "Octubre 2025",
  },
  {
    slug: "#",
    titulo: "ELEMEC avanza en proyecto de aislación térmica para Tierra del Fuego",
    resumen:
      "Desarrollo de nueva línea de servicios orientada a eficiencia energética y confort térmico en condiciones climáticas extremas.",
    fecha: "Septiembre 2025",
  },
  {
    slug: "#",
    titulo: "Proyecto destacado: instalación eléctrica en recinto de salud",
    resumen:
      "ELEMEC ejecuta renovación de tableros e infraestructura eléctrica en recinto de salud de alta complejidad en Magallanes.",
    fecha: "Agosto 2025",
  },
];


export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Fondo imagen */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Barra de acento superior */}
        <div className="relative h-1 bg-[var(--accent)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl">
            {/* Texto */}
            <div>
              <p className="inline-flex rounded-full border border-[var(--accent)]/60 bg-[var(--accent)]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
                Ingeniería en Magallanes
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl">
                Obras y servicios de ingeniería para operación{" "}
                <span className="text-[var(--brand-soft)]">segura y continua.</span>
              </h1>
              <p className="mt-5 max-w-xl text-white/70">
                ELEMEC es una empresa con 18 años de trayectoria en la Región
                de Magallanes. Ejecutamos proyectos y mantenciones en gas,
                calefacción, electricidad, vapor y utilidades industriales, con
                soluciones a medida y cumplimiento normativo.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/cotiza-aqui"
                  className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[var(--accent-hover)]"
                >
                  Solicitar cotización
                </Link>
                <Link
                  href="/servicios"
                  className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  Ver servicios
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOBRE ELEMEC ───────────────────────────────────────── */}
      <section className="border-y border-[var(--header-border)] bg-[var(--section-alt)] py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-semibold text-[var(--text)]">ELEMEC</h2>
            <p className="mt-4 leading-7 text-[var(--text-soft)]">
              Un completo equipo técnico especializado en Gas, Calefacción,
              Electricidad, Vapor y Utilidades Industriales es parte de la
              propuesta de valor que ELEMEC tiene para sus clientes.
            </p>
            <p className="mt-4 leading-7 text-[var(--text-soft)]">
              Nuestra experiencia nos avala como referentes en servicio y
              ejecución de obras de ingeniería en Magallanes y Tierra del
              Fuego, con capacidad de operar en proyectos de alta complejidad
              técnica para clientes públicos y privados.
            </p>
            <p className="mt-4 leading-7 text-[var(--text-soft)]">
              Gestionamos todo tipo de requerimientos para dar soluciones
              constructivas y de mantención a los distintos desafíos que se
              presenten en la zona austral de Chile.
            </p>
          </div>
          <div className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10">
            <div className="text-center">
              <p className="text-5xl font-bold text-[var(--brand-soft)]">18</p>
              <p className="mt-2 text-sm text-[var(--text-soft)]">
                años de trayectoria
              </p>
              <div className="mx-auto mt-4 h-px w-16 bg-[var(--accent)]" />
              <p className="mt-4 text-sm italic text-[var(--text-soft)]">
                &ldquo;Ingeniería confiable para climas exigentes.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICIOS DESTACADOS ───────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-semibold text-[var(--text)]">
            Servicios
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--text-soft)]">
            Disponibilidad y respuesta efectiva a los requerimientos de sus
            proyectos e instalaciones industriales en la Región de Magallanes.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {servicios.map((s) => (
              <Link
                key={s.slug}
                href={`/servicios/${s.slug}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                  {s.iconoImg ? (
                    <>
                      <img
                        src={s.iconoImg}
                        alt={s.titulo}
                        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        style={{ filter: "brightness(1.05) saturate(0.9)" }}
                      />
                      <div className="absolute inset-0 bg-orange-600/10 mix-blend-multiply" />
                    </>
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${s.gradiente} transition duration-300 group-hover:brightness-75`}
                    />
                  )}
                  <div className="absolute inset-0 bg-[var(--accent)]/0 transition duration-300 group-hover:bg-[var(--accent)]/20" />
                  {s.badge && (
                    <span className="absolute right-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-black">
                      {s.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-center text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition">
                  {s.titulo}
                </h3>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-right">
            <Link
              href="/servicios"
              className="text-sm text-[var(--brand-soft)] hover:text-[var(--accent)] transition"
            >
              Ver todos los servicios →
            </Link>
          </div>
        </div>
      </section>

      {/* ── NOTICIAS RECIENTES ─────────────────────────────────── */}
      <section className="border-t border-[var(--header-border)] bg-[var(--section-alt)] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold text-[var(--text)]">
            Noticias Recientes
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {noticias.map((n) => (
              <article
                key={n.titulo}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
              >
                <p className="text-xs text-[var(--accent)]">{n.fecha}</p>
                <h3 className="mt-2 font-semibold leading-5 text-[var(--brand-soft)]">
                  {n.titulo}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  {n.resumen}
                </p>
                <Link
                  href={n.slug}
                  className="mt-4 inline-block text-xs text-[var(--accent)] hover:underline"
                >
                  Leer más →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-[var(--text)]">
            ¿Necesitas un servicio de ingeniería en Magallanes?
          </h2>
          <p className="mt-4 text-[var(--text-soft)]">
            Contáctanos y te responderemos en menos de 24 horas. Nuestro
            equipo técnico evaluará tu requerimiento sin costo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/cotiza-aqui"
              className="rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)]"
            >
              Cotiza aquí
            </Link>
            <Link
              href="/trabajaconnosotros"
              className="rounded-lg border border-[var(--border)] px-8 py-3 font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Trabaja con nosotros
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
