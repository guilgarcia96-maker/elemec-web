import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Palette } from "./palettes";

const services = [
  {
    title: "Obras e instalaciones industriales",
    description:
      "Diseño, montaje y normalización de redes y sistemas de gas, calefacción y utilidades, incluyendo tramitaciones y puesta en marcha según alcance.",
    benefit: "Operación segura y conforme a normativa, con continuidad de servicio.",
  },
  {
    title: "Mantención de calderas y sistemas térmicos",
    description:
      "Mantenciones preventivas y correctivas para recintos críticos, con experiencia sostenida en infraestructura hospitalaria y entornos de alta exigencia.",
    benefit: "Menor detención de equipos, mayor eficiencia y mayor vida útil de activos.",
  },
  {
    title: "Proyectos e instalaciones eléctricas / potencia",
    description:
      "Ejecución y mejora de infraestructura eléctrica: tableros, líneas, variadores de frecuencia y bancos de condensadores según requerimiento técnico.",
    benefit: "Estabilidad eléctrica, eficiencia energética y menor riesgo operacional.",
  },
  {
    title: "Generación de vapor y sistemas asociados",
    description:
      "Instalación y puesta en marcha de generadores de vapor y sistemas complementarios para operación industrial continua.",
    benefit: "Confiabilidad de proceso y desempeño térmico sostenido.",
  },
  {
    title: "Puesta en obra, planificación y control de costos",
    description:
      "Gestión integral de ejecución: planificación, coordinación de obra, control de avance y control de costos desde inicio a cierre.",
    benefit: "Mejor cumplimiento de plazos y presupuesto con menos desviaciones.",
  },
  {
    title: "Aislación térmica (línea en desarrollo)",
    description:
      "Desarrollo de capacidad productiva para aislación térmica, incluyendo poliuretano expandido como complemento técnico para la zona austral.",
    benefit: "Mayor eficiencia energética y confort térmico para climas extremos.",
  },
];

const differentiators = [
  "18 años de trayectoria en obras y mantenciones (desde 2006)",
  "Experiencia en proyectos de alta complejidad técnica",
  "Foco en cumplimiento normativo, tramitaciones y puesta en marcha",
  "Ejecución en Magallanes y Tierra del Fuego con continuidad operacional",
  "Experiencia con clientes públicos y privados",
];

const sectors = [
  "Salud y hospitales",
  "Industria y plantas de proceso",
  "Energía y combustibles",
  "Sector público e institucional",
  "Comercial y residencial",
];

interface ElemecPageProps {
  palette: Palette;
  templateLabel: string;
}

export default function ElemecPage({ palette, templateLabel }: ElemecPageProps) {
  const themeStyle = {
    "--bg": palette.bg,
    "--header-bg": palette.headerBg,
    "--header-border": palette.headerBorder,
    "--section-alt": palette.sectionAlt,
    "--card": palette.card,
    "--card-soft": palette.cardSoft,
    "--border": palette.border,
    "--text": palette.text,
    "--text-soft": palette.textSoft,
    "--brand": palette.brand,
    "--brand-soft": palette.brandSoft,
    "--accent": palette.accent,
    "--accent-hover": palette.accentHover,
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]" style={themeStyle}>
      <header className="sticky top-0 z-30 border-b border-[var(--header-border)] bg-[var(--header-bg)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#inicio" className="flex items-center gap-3">
            <Image src="/logo.PNG" alt="ELEMEC" width={180} height={64} priority />
            <span className="hidden text-xs tracking-[0.28em] text-[var(--brand-soft)] md:block">OBRAS Y SERVICIOS DE INGENIERÍA</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-[var(--text-soft)] md:flex">
            <a href="#servicios" className="hover:text-[var(--brand-soft)]">Servicios</a>
            <a href="#empresa" className="hover:text-[var(--brand-soft)]">Empresa</a>
            <a href="#rubros" className="hover:text-[var(--brand-soft)]">Rubros</a>
            <a href="#contacto" className="hover:text-[var(--brand-soft)]">Contacto</a>
          </nav>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            ← Plantillas
          </Link>
        </div>
      </header>

      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-end px-6">
        <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--text-soft)]">
          Plantilla: {templateLabel}
        </span>
      </div>

      <main id="inicio">
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="inline-flex rounded-full border border-[var(--brand)]/80 bg-[var(--brand)]/20 px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--brand-soft)]">
              Ingeniería en Magallanes
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-[var(--text)] md:text-5xl">
              Obras y servicios de ingeniería para operación segura y continua.
            </h1>
            <p className="mt-5 max-w-xl text-[var(--text-soft)]">
              ELEMEC es una empresa con 18 años de trayectoria en la Región de Magallanes.
              Ejecutamos proyectos y mantenciones en gas, calefacción, electricidad, vapor y utilidades industriales,
              con soluciones a medida y cumplimiento normativo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#contacto"
                className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[var(--accent-hover)]"
              >
                Solicitar evaluación técnica
              </a>
              <a
                href="#servicios"
                className="rounded-lg border border-[var(--brand)] px-5 py-3 text-sm font-semibold text-[var(--brand-soft)] transition hover:border-[var(--brand-soft)] hover:bg-[var(--brand)]/20"
              >
                Ver servicios
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-6 shadow-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-soft)]">Indicadores de referencia</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Metric label="Años de experiencia" value="18" />
              <Metric label="Cobertura regional" value="100%" />
              <Metric label="Tiempo de respuesta" value="&lt;24 h" />
              <Metric label="Cumplimiento de plazos" value="95%" />
            </div>
          </div>
        </section>

        <section id="servicios" className="border-y border-[var(--header-border)] bg-[var(--section-alt)] py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-semibold text-[var(--text)]">Servicios</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-soft)]">
              Ejecutamos proyectos de ingeniería y mantención industrial con foco en seguridad, continuidad operativa y control técnico en terreno.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <article key={service.title} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <h3 className="text-lg font-semibold text-[var(--brand-soft)]">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{service.description}</p>
                  <p className="mt-3 text-sm text-[var(--accent)]">Beneficio: {service.benefit}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="empresa" className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold text-[var(--text)]">ELEMEC en terreno desde 2006</h2>
            <p className="mt-4 text-[var(--text-soft)]">
              Nuestra cobertura incluye Punta Arenas, Porvenir, Isla Dawson, Cerro Sombrero y otras zonas de Tierra del Fuego.
              Diseñamos, ejecutamos y mantenemos infraestructura crítica para clientes públicos y privados en Magallanes.
            </p>
            <div className="mt-5 rounded-xl border border-[var(--brand)]/60 bg-[var(--brand)]/20 p-4 text-sm text-zinc-200">
              Eslogan propuesto: <span className="font-semibold text-[var(--brand-soft)]">&ldquo;Ingeniería confiable para climas exigentes.&rdquo;</span>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-[var(--text-soft)]">
            {differentiators.map((item) => (
              <li key={item} className="rounded-lg border border-[var(--border)] bg-[var(--card-soft)] px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section id="rubros" className="border-y border-[var(--header-border)] bg-[var(--section-alt)] py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-semibold text-[var(--text)]">Rubros atendidos</h2>
            <p className="mt-3 text-[var(--text-soft)]">
              Participamos en proyectos para salud, industria y energía, con estándares de ejecución compatibles con recintos de operación continua.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
              {sectors.map((sector) => (
                <div key={sector} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center text-sm text-zinc-200">
                  {sector}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Nota: los logos de clientes se incorporan una vez autorizados por cada organización.
            </p>
          </div>
        </section>

        <section id="contacto" className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-2xl border border-[var(--brand)]/60 bg-[var(--brand)]/20 p-8">
            <h2 className="text-3xl font-semibold text-[var(--text)]">Cotiza con ELEMEC</h2>
            <p className="mt-3 max-w-2xl text-[var(--text-soft)]">
              Completa el formulario o contáctanos directamente. Estos datos están listos para editar con tus canales oficiales.
            </p>

            <div className="mt-6 grid gap-4 text-sm text-[var(--text)] md:grid-cols-3">
              <InfoCard label="Teléfono" value="+56 9 0000 0000" />
              <InfoCard label="Email" value="contacto@elemec.cl" />
              <InfoCard label="Horario" value="Lun a Vie 08:30 – 18:30" />
            </div>

            <form className="mt-8 grid gap-3 md:grid-cols-2">
              <Input label="Nombre" type="text" />
              <Input label="Empresa" type="text" />
              <Input label="Email" type="email" />
              <Input label="Teléfono" type="tel" />
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-zinc-200">Servicio</label>
                <select className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[var(--accent)]">
                  <option>Obras e instalaciones industriales</option>
                  <option>Mantención de calderas y sistemas térmicos</option>
                  <option>Proyectos e instalaciones eléctricas</option>
                  <option>Generación de vapor</option>
                  <option>Puesta en obra y control de costos</option>
                  <option>Aislación térmica</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-zinc-200">Mensaje</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[var(--accent)]"
                  placeholder="Cuéntanos tu requerimiento"
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-zinc-300">
                  Mensaje de éxito: &ldquo;Gracias por tu solicitud. Te responderemos a la brevedad.&rdquo; | Política de privacidad: pendiente de publicación.
                </p>
                <button
                  type="button"
                  className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[var(--accent-hover)]"
                >
                  Enviar consulta
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-[var(--text-soft)] md:grid-cols-3">
            <a href="https://wa.me/56900000000" className="rounded-lg border border-[var(--border)] bg-[var(--card-soft)] px-4 py-3 hover:border-[var(--accent)]">
              WhatsApp (editable)
            </a>
            <a href="https://maps.google.com/?q=Punta+Arenas" className="rounded-lg border border-[var(--border)] bg-[var(--card-soft)] px-4 py-3 hover:border-[var(--accent)]">
              Ver ubicación en Google Maps
            </a>
            <a href="#" className="rounded-lg border border-[var(--border)] bg-[var(--card-soft)] px-4 py-3 hover:border-[var(--accent)]">
              LinkedIn / Instagram (pendiente)
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs text-[var(--text-soft)]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--brand-soft)]">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-[var(--text-soft)]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function Input({ label, type }: { label: string; type: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-[var(--text-soft)]">{label}</label>
      <input
        type={type}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[var(--accent)]"
      />
    </div>
  );
}
