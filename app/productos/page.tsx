import Link from "next/link";

const productos = [
  {
    nombre: "Redes de Gas",
    descripcion:
      "Diseño, montaje y mantención de redes de gas natural y GLP para instalaciones industriales, hospitales y edificios.",
    href: "/servicios",
    color: "from-blue-900 to-blue-800",
    icono: "🔧",
  },
  {
    nombre: "Sistemas de Calefacción",
    descripcion:
      "Instalación y mantención de sistemas de calefacción central para recintos de alta exigencia en clima austral.",
    href: "/servicios",
    color: "from-orange-900 to-orange-800",
    icono: "🔥",
  },
  {
    nombre: "Instalaciones Eléctricas",
    descripcion:
      "Infraestructura eléctrica de potencia, tableros, variadores de frecuencia y bancos de condensadores.",
    href: "/servicios",
    color: "from-yellow-900 to-yellow-800",
    icono: "⚡",
  },
  {
    nombre: "Generadores de Vapor",
    descripcion:
      "Puesta en marcha e instalación de generadores de vapor para procesos industriales continuos.",
    href: "/servicios",
    color: "from-slate-800 to-slate-700",
    icono: "💨",
  },
  {
    nombre: "Calderas",
    descripcion:
      "Mantención preventiva y correctiva de calderas en hospitales, plantas de proceso y recintos críticos.",
    href: "/servicios",
    color: "from-gray-800 to-gray-700",
    icono: "🏭",
  },
  {
    nombre: "Aislación Térmica",
    descripcion:
      "Soluciones de aislación térmica con poliuretano expandido para eficiencia energética en climas extremos.",
    href: "/servicios",
    color: "from-teal-900 to-teal-800",
    icono: "🧱",
    badge: "En desarrollo",
  },
  {
    nombre: "Utilidades Industriales",
    descripcion:
      "Redes y sistemas de utilidades en plantas industriales: agua, aire comprimido, vapor y combustibles.",
    href: "/servicios",
    color: "from-indigo-900 to-indigo-800",
    icono: "🔩",
  },
  {
    nombre: "Control de Costos y Obra",
    descripcion:
      "Puesta en obra, planificación y control de avance para asegurar cumplimiento de plazos y presupuesto.",
    href: "/servicios",
    color: "from-green-900 to-green-800",
    icono: "📋",
  },
  {
    nombre: "Tramitaciones y Normativa",
    descripcion:
      "Gestión de tramitaciones ante entidades reguladoras y cumplimiento normativo en instalaciones de gas y electricidad.",
    href: "/servicios",
    color: "from-purple-900 to-purple-800",
    icono: "📄",
  },
  {
    nombre: "Accesorios y Complementos",
    descripcion:
      "Provisión de accesorios, materiales y equipamiento complementario para obras de ingeniería en terreno.",
    href: "/servicios",
    color: "from-rose-900 to-rose-800",
    icono: "🔑",
  },
];

export default function ProductosPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header de página */}
      <section className="border-b border-[var(--header-border)] bg-[var(--section-alt)] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            ELEMEC
          </p>
          <h1 className="mt-2 text-4xl font-bold text-[var(--text)]">
            Productos
          </h1>
          <p className="mt-4 max-w-3xl text-[var(--text-soft)]">
            Nuestras líneas de trabajo están enfocadas en proponer una oferta
            de valor para nuestros clientes. Contamos con un completo equipo
            técnico especializado en: Gas, Calefacción, Electricidad, Vapor y
            Utilidades Industriales.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-[var(--text-soft)]">
            Nuestros altos estándares de calidad y rigor en aspectos de
            seguridad, de la mano con nuestros procesos de certificación, nos
            permiten garantizar una capacidad de respuesta efectiva y eficaz
            hasta en los proyectos más exigentes.
          </p>
        </div>
      </section>

      {/* Grid de productos / líneas */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {productos.map((p) => (
              <Link
                key={p.nombre}
                href={p.href}
                className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
              >
                <div className="mb-3 text-3xl">{p.icono}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-[var(--brand-soft)] group-hover:text-[var(--accent)] transition">
                    {p.nombre}
                  </h2>
                  {p.badge && (
                    <span className="rounded-full border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-2 py-0.5 text-xs text-[var(--accent)]">
                      {p.badge}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  {p.descripcion}
                </p>
                <p className="mt-3 text-xs text-[var(--accent)] opacity-0 group-hover:opacity-100 transition">
                  Ver servicio →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--header-border)] bg-[var(--section-alt)] py-14">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-[var(--text)]">
            ¿Buscas una solución de ingeniería específica?
          </h2>
          <p className="mt-3 text-[var(--text-soft)]">
            Cuéntanos tu requerimiento y te responderemos a la brevedad.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/cotiza-aqui"
              className="rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)]"
            >
              Cotiza aquí
            </Link>
            <Link
              href="/servicios"
              className="rounded-lg border border-[var(--border)] px-8 py-3 text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Ver Servicios
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
