import Link from "next/link";

const servicios = [
  {
    titulo: "Montaje y Desmontaje de Instalaciones",
    imagen: null,
    descripcion:
      "En ELEMEC contamos con la experiencia, respaldo y calidad en obras de instalación y desmontaje. Personal altamente calificado, para entregar un servicio que cumple con los más altos estándares de seguridad. Avalados por nuestras certificaciones y experiencia en las principales obras de la Región de Magallanes. Nuestros servicios cubren los siguientes sistemas:",
    items: [
      "Redes de Gas Natural y GLP.",
      "Sistemas de Calefacción Central.",
      "Instalaciones Eléctricas y de Potencia.",
      "Generadores de Vapor y sistemas asociados.",
      "Redes de Utilidades Industriales.",
      "Estructuras y soportería especial.",
    ],
  },
  {
    titulo: "Mantención de Equipos y Sistemas",
    imagen: null,
    descripcion:
      "Ya sea en nuestras dependencias o en faena, ELEMEC entrega experiencia y protocolos de trabajo que garantizan calidad total en el proceso y un equipo humano altamente calificado, para efectuar un servicio de mantenimiento altamente efectivo en calderas, sistemas térmicos e instalaciones industriales.",
    items: [],
  },
  {
    titulo: "Ingeniería y Diseño",
    imagen: null,
    descripcion:
      "Nuestro departamento técnico cuenta con el conocimiento, experiencia y respaldo de innumerables proyectos ejecutados en la Región de Magallanes y Tierra del Fuego. Modulación de equipos en obra, diseño de instalaciones, cálculo estructural, tramitaciones normativas y desarrollo de procesos enfocados en eficiencia y seguridad.",
    items: [],
  },
  {
    titulo: "Asesoría Técnica",
    imagen: null,
    descripcion:
      "A través de nuestro departamento técnico, contamos con personal altamente capacitado y dispuesto para ayudarlo en la búsqueda de las mejores soluciones a sus requerimientos. Contamos con personal técnico en terreno para atender de manera efectiva los requerimientos de cualquier tipo de obra en la zona austral.",
    items: [],
  },
  {
    titulo: "Logística y Coordinación",
    imagen: null,
    descripcion:
      "ELEMEC ofrece capacidad logística orientada a atender los proyectos de nuestros clientes de la manera más efectiva en la Región de Magallanes y Tierra del Fuego, con cobertura en Punta Arenas, Porvenir, Isla Dawson, Cerro Sombrero y otras zonas de la región.",
    items: [],
  },
  {
    titulo: "Aislación Térmica",
    imagen: null,
    descripcion:
      "Línea en desarrollo orientada a eficiencia energética y confort térmico para climas extremos. Desarrollo de capacidad productiva para aislación térmica, incluyendo poliuretano expandido como complemento técnico para la zona austral de Chile.",
    items: [],
    badge: "En desarrollo",
  },
  {
    titulo: "Puesta en Obra y Control de Costos",
    imagen: null,
    descripcion:
      "Gestión integral de ejecución: planificación, coordinación de obra, control de avance y control de costos desde inicio hasta cierre de proyecto. Aseguramos el cumplimiento de plazos y presupuesto con menor tasa de desviaciones.",
    items: [],
  },
];

export default function ServiciosPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header de página */}
      <section className="border-b border-[var(--header-border)] bg-[var(--section-alt)] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            ELEMEC
          </p>
          <h1 className="mt-2 text-4xl font-bold text-[var(--text)]">
            Servicios
          </h1>
          <p className="mt-4 max-w-3xl text-[var(--text-soft)]">
            Líderes en el suministro de servicios de ingeniería para la
            industria en Magallanes, satisfaciendo las necesidades de nuestros
            clientes de manera eficiente y segura. Con capacidad de entregar la
            oferta más amplia y robusta de soluciones para el mercado austral.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-[var(--text-soft)]">
            Nuestros altos estándares de calidad y rigor en aspectos de
            seguridad, junto con nuestros procesos de certificación, nos
            permiten garantizar una capacidad de respuesta efectiva y eficaz
            hasta en los proyectos más exigentes del país.
          </p>
        </div>
      </section>

      {/* Lista de servicios */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl space-y-10 px-6">
          {servicios.map((s) => (
            <div
              key={s.titulo}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-[var(--brand-soft)]">
                  {s.titulo}
                </h2>
                {s.badge && (
                  <span className="rounded-full border border-[var(--accent)]/60 bg-[var(--accent)]/10 px-3 py-0.5 text-xs text-[var(--accent)]">
                    {s.badge}
                  </span>
                )}
              </div>
              <p className="mt-4 leading-7 text-[var(--text-soft)]">
                {s.descripcion}
              </p>
              {s.items.length > 0 && (
                <ul className="mt-4 space-y-1">
                  {s.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-[var(--text-soft)]"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--header-border)] bg-[var(--section-alt)] py-14">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-[var(--text)]">
            ¿Tienes un requerimiento específico?
          </h2>
          <p className="mt-3 text-[var(--text-soft)]">
            Nuestro equipo técnico evaluará tu situación sin costo.
          </p>
          <Link
            href="/cotiza-aqui"
            className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)]"
          >
            Cotiza aquí
          </Link>
        </div>
      </section>
    </div>
  );
}
