import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { servicios } from "../serviciosData";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return servicios.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = servicios.find((srv) => srv.slug === slug);
  if (!s) return {};
  return {
    title: `${s.titulo} en Magallanes | ELEMEC`,
    description: `${s.descripcionCorta} Servicios industriales en Punta Arenas. Cotiza con ELEMEC.`,
    openGraph: {
      title: `${s.titulo} en Magallanes | ELEMEC`,
      description: s.descripcionCorta,
    },
  };
}

export default async function ServicioDetallePage({ params }: Props) {
  const { slug } = await params;
  const servicio = servicios.find((s) => s.slug === slug);

  if (!servicio) notFound();

  const otrosServicios = servicios.filter((s) => s.slug !== slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Fondo: imagen si existe, si no degradado del servicio */}
        {servicio.imagen ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${servicio.imagen}')` }}
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${servicio.gradiente}`}
          />
        )}
        <div className="absolute inset-0 bg-black/55" />

        {/* Barra de acento superior */}
        <div className="relative h-1 bg-[var(--accent)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-xs text-white/60">
            <Link href="/" className="hover:text-white transition">Inicio</Link>
            <span>/</span>
            <Link href="/servicios" className="hover:text-white transition">Servicios</Link>
            <span>/</span>
            <span className="text-white/90">{servicio.titulo}</span>
          </nav>

          <div className="mx-auto max-w-2xl">
            <p className="inline-flex rounded-full border border-[var(--accent)]/60 bg-[var(--accent)]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
              {servicio.badge ?? "Servicio ELEMEC"}
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl">
              {servicio.titulo.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-[var(--brand-soft)]">
                {servicio.titulo.split(" ").slice(-1)[0]}.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-white/70">
              {servicio.descripcionCorta}
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
                Ver todos los servicios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESCRIPCIÓN ────────────────────────────────────────── */}
      <section className="border-y border-[var(--header-border)] bg-[var(--section-alt)] py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-semibold text-[var(--text)]">
              Descripción
            </h2>
            <p className="mt-4 leading-7 text-[var(--text-soft)]">
              {servicio.descripcionLarga}
            </p>
          </div>
          <div className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10">
            <div className="text-center">
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${servicio.gradiente} text-5xl shadow-lg`}
              >
                {servicio.icono}
              </div>
              <div className="mx-auto mt-6 h-px w-16 bg-[var(--accent)]" />
              <p className="mt-4 text-sm italic text-[var(--text-soft)]">
                &ldquo;Ingeniería confiable para climas exigentes.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALCANCE DEL SERVICIO ───────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-semibold text-[var(--text)]">
            Alcance del servicio
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--text-soft)]">
            Disponibilidad y respuesta efectiva a los requerimientos de sus
            proyectos e instalaciones industriales en la Región de Magallanes.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servicio.items.map((item) => (
              <div
                key={item}
                className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)] hover:bg-[var(--card-soft)]"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/20">
                  <div className="h-3 w-3 rounded-full bg-[var(--accent)]" />
                </div>
                <p className="text-sm leading-6 text-[var(--text-soft)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OTROS SERVICIOS ────────────────────────────────────── */}
      <section className="border-t border-[var(--header-border)] bg-[var(--section-alt)] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold text-[var(--text)]">
            Otros servicios
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otrosServicios.map((s) => (
              <Link
                key={s.slug}
                href={`/servicios/${s.slug}`}
                className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)] hover:bg-[var(--card-soft)]"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/20">
                  <div className="h-3 w-3 rounded-full bg-[var(--accent)]" />
                </div>
                <h3 className="font-semibold text-[var(--brand-soft)] transition group-hover:text-[var(--accent)]">
                  {s.titulo}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  {s.descripcionCorta}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-right">
            <Link
              href="/servicios"
              className="text-sm text-[var(--brand-soft)] transition hover:text-[var(--accent)]"
            >
              Ver todos los servicios →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-[var(--text)]">
            ¿Necesitas este servicio en Magallanes?
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
              href="/servicios"
              className="rounded-lg border border-[var(--border)] px-8 py-3 font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              ← Volver a Servicios
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
