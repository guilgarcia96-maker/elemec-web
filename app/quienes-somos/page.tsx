import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "18 Años de Experiencia en Magallanes | ELEMEC",
  description: "Desde 2007, ELEMEC brinda servicios de ingeniería y obras industriales en Punta Arenas y la Región de Magallanes. Conozca nuestra historia, misión y equipo.",
  openGraph: {
    title: "18 Años de Experiencia en Magallanes | ELEMEC",
    description: "Desde 2007, ELEMEC brinda servicios de ingeniería y obras industriales en Punta Arenas y la Región de Magallanes.",
  },
};

const valores = [
  {
    icono: "🛡️",
    titulo: "Seguridad",
    descripcion:
      "Operamos bajo los más altos estándares de seguridad en cada proyecto. El bienestar de nuestro equipo y el de nuestros clientes es innegociable.",
  },
  {
    icono: "⚙️",
    titulo: "Excelencia Técnica",
    descripcion:
      "Contamos con personal certificado y specializado en cada disciplina: gas, electricidad, calor y vapor. La calidad técnica es nuestra reputación.",
  },
  {
    icono: "🤝",
    titulo: "Compromiso",
    descripcion:
      "Cumplimos lo que prometemos. Plazos, presupuestos y estándares. Nuestros clientes saben que pueden contar con nosotros.",
  },
  {
    icono: "📍",
    titulo: "Arraigo Regional",
    descripcion:
      "Somos una empresa magallánica, formada por personas de la región. Conocemos el clima, las distancias y las exigencias del sur de Chile.",
  },
];

const hitos = [
  { año: "2007", descripcion: "Fundación de ELEMEC en Punta Arenas por Guillermo García." },
  { año: "2010", descripcion: "Primeros contratos de mantención con recintos hospitalarios de la región." },
  { año: "2014", descripcion: "Expansión de operaciones a Tierra del Fuego y zonas remotas." },
  { año: "2018", descripcion: "Consolidación como referentes en instalaciones de gas y vapor industrial." },
  { año: "2023", descripcion: "Desarrollo de nueva línea de aislación térmica para climas extremos." },
  { año: "2025", descripcion: "18 años construyendo ingeniería confiable en el sur de Chile." },
];

export default function QuienesSomosPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative h-1 bg-[var(--accent)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-[var(--accent)]/60 bg-[var(--accent)]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
              Nuestra historia
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl">
              Quiénes{" "}
              <span className="text-[var(--brand-soft)]">somos.</span>
            </h1>
            <p className="mt-5 text-lg text-white/70">
              18 años construyendo ingeniería confiable en la Región de Magallanes.
              Una empresa fundada con convicción en el sur de Chile.
            </p>
          </div>
        </div>
      </section>

      {/* ── HISTORIA ─────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                Nuestra historia
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[var(--text)]">
                Desde Punta Arenas al sur del mundo
              </h2>
              <p className="mt-5 leading-7 text-[var(--text-soft)]">
                ELEMEC nació en 2007 en Punta Arenas, fundada por{" "}
                <span className="font-semibold text-[var(--text)]">
                  Guillermo García
                </span>{" "}
                con la convicción de que la Región de Magallanes necesitaba una
                empresa de ingeniería local, con conocimiento real del territorio
                y las condiciones que lo hacen único.
              </p>
              <p className="mt-4 leading-7 text-[var(--text-soft)]">
                A lo largo de casi dos décadas, hemos desarrollado proyectos en
                gas, calefacción, electricidad, vapor y utilidades industriales
                para clientes públicos y privados en Magallanes y Tierra del
                Fuego. Cada obra ejecutada ha sido un paso más en consolidar
                nuestra reputación de excelencia técnica en condiciones extremas.
              </p>
              <p className="mt-4 leading-7 text-[var(--text-soft)]">
                Hoy somos un equipo técnico especializado, comprometido con la
                seguridad operacional y el cumplimiento normativo, capaz de
                abordar proyectos de alta complejidad en los entornos más
                desafiantes del país.
              </p>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { valor: "2007", label: "Año de fundación" },
                { valor: "18+", label: "Años de trayectoria" },
                { valor: "100%", label: "Cobertura regional" },
                { valor: "<24h", label: "Tiempo de respuesta" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center"
                >
                  <p className="text-4xl font-bold text-[var(--brand-soft)]">
                    {m.valor}
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MISIÓN Y VISIÓN ──────────────────────────────────── */}
      <section className="border-y border-[var(--header-border)] bg-[var(--section-alt)] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-2xl">
                🎯
              </div>
              <h3 className="text-xl font-bold text-[var(--text)]">Misión</h3>
              <p className="mt-3 leading-7 text-[var(--text-soft)]">
                Proveer servicios de ingeniería confiables, seguros y de alta
                calidad técnica para la industria y el sector público de la Región
                de Magallanes, contribuyendo a la continuidad operacional de
                nuestros clientes con soluciones a medida y cumplimiento normativo
                riguroso.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-2xl">
                🔭
              </div>
              <h3 className="text-xl font-bold text-[var(--text)]">Visión</h3>
              <p className="mt-3 leading-7 text-[var(--text-soft)]">
                Ser la empresa de ingeniería de referencia en la zona austral de
                Chile, reconocida por su capacidad técnica, arraigo regional y
                compromiso con la seguridad operacional, expandiendo nuestra oferta
                hacia nuevas líneas de servicio para las industrias del futuro
                en Magallanes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALORES ──────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Lo que nos define
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[var(--text)]">
            Nuestros valores
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {valores.map((v) => (
              <div
                key={v.titulo}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
              >
                <span className="text-3xl">{v.icono}</span>
                <h3 className="mt-4 font-bold text-[var(--text)]">
                  {v.titulo}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  {v.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LÍNEA DE TIEMPO ──────────────────────────────────── */}
      <section className="border-t border-[var(--header-border)] bg-[var(--section-alt)] py-16">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Trayectoria
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[var(--text)]">
            Nuestra historia en hitos
          </h2>
          <div className="mt-10 space-y-0">
            {hitos.map((h, i) => (
              <div key={h.año} className="flex gap-6">
                {/* Línea vertical */}
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-black">
                    {h.año.slice(2)}
                  </div>
                  {i < hitos.length - 1 && (
                    <div className="w-px flex-1 bg-[var(--border)]" />
                  )}
                </div>
                {/* Contenido */}
                <div className="pb-8 pt-2">
                  <p className="text-sm font-bold text-[var(--brand-soft)]">
                    {h.año}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
                    {h.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-[var(--text)]">
            ¿Quieres trabajar con nosotros?
          </h2>
          <p className="mt-3 text-[var(--text-soft)]">
            Cuéntanos tu proyecto y te contactamos a la brevedad.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/cotiza-aqui"
              className="rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)]"
            >
              Solicitar cotización
            </Link>
            <Link
              href="/servicios"
              className="rounded-lg border border-[var(--border)] px-8 py-3 text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Ver servicios
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
