import Link from "next/link";

/* ─────────────────────────────────────────────────────────────
   VERSIÓN 2 — Enfoque "Fundador + storytelling"
   Estructura: Frase impacto → Historia personal del fundador →
   Línea de tiempo horizontal → Pilares → CTA
───────────────────────────────────────────────────────────── */

const pilares = [
  { numero: "01", titulo: "Conocimiento local", descripcion: "Operamos donde otros no llegan. Conocemos el clima, las distancias y los códigos de la región." },
  { numero: "02", titulo: "Equipo técnico propio", descripcion: "No tercerizamos el conocimiento. Nuestro equipo está capacitado, certificado y comprometido." },
  { numero: "03", titulo: "Cumplimiento normativo", descripcion: "Tramitamos, proyectamos y ejecutamos dentro del marco regulatorio vigente en Chile." },
  { numero: "04", titulo: "Respuesta rápida", descripcion: "En menos de 24 horas estamos en terreno. La continuidad operacional de nuestros clientes no espera." },
];

const hitos = [
  { año: "2007", texto: "Fundación" },
  { año: "2010", texto: "Recintos hospitalarios" },
  { año: "2014", texto: "Tierra del Fuego" },
  { año: "2018", texto: "Referentes en vapor industrial" },
  { año: "2025", texto: "18 años en el sur" },
];

export default function QuienesSomosV2() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ── FRASE DE IMPACTO ─────────────────────────────────── */}
      <section className="border-b border-[var(--header-border)] bg-[var(--section-alt)] py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Punta Arenas · Desde 2007
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-[var(--text)] md:text-6xl">
            Ingeniería hecha{" "}
            <span className="text-[var(--brand-soft)]">en el sur,</span>{" "}
            para el sur.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-[var(--text-soft)]">
            ELEMEC nació en Punta Arenas con una idea simple: que Magallanes
            merece una empresa de ingeniería local, técnica y comprometida
            con su gente y su industria.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/cotiza-aqui" className="rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)]">
              Trabaja con nosotros
            </Link>
            <Link href="/servicios" className="rounded-lg border border-[var(--border)] px-8 py-3 text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
              Ver servicios
            </Link>
          </div>
        </div>
      </section>

      {/* ── HISTORIA DEL FUNDADOR ────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            {/* Texto */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                El origen
              </p>
              <h2 className="mt-4 text-3xl font-bold text-[var(--text)]">
                Una empresa fundada con convicción
              </h2>
              <p className="mt-5 leading-7 text-[var(--text-soft)]">
                En 2007,{" "}
                <span className="font-semibold text-[var(--text)]">Guillermo García</span>{" "}
                fundó ELEMEC en Punta Arenas con la certeza de que la Región de
                Magallanes necesitaba un referente local en ingeniería industrial.
                No una sucursal de Santiago. Una empresa formada por y para el sur de Chile.
              </p>
              <p className="mt-4 leading-7 text-[var(--text-soft)]">
                Desde el primer proyecto, ELEMEC se distinguió por el rigor técnico,
                el cumplimiento de plazos y la capacidad de operar en las condiciones
                más desafiantes de la zona austral: frío extremo, zonas remotas,
                instalaciones críticas.
              </p>
              <p className="mt-4 leading-7 text-[var(--text-soft)]">
                Hoy, después de casi dos décadas, esa convicción fundacional sigue
                intacta. Somos más grandes, más especializados, pero seguimos siendo
                la misma empresa magallánica comprometida con sus clientes.
              </p>
            </div>

            {/* Cita destacada */}
            <div className="relative rounded-2xl border border-[var(--accent)]/30 bg-[var(--card)] p-10">
              <div className="absolute -top-4 left-8 text-6xl leading-none text-[var(--accent)]/30 select-none">"</div>
              <p className="text-lg font-medium leading-8 text-[var(--text)]">
                Magallanes necesitaba una empresa de ingeniería que entendiera
                sus tiempos, sus distancias y su industria. Eso quisimos ser
                desde el primer día.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <p className="text-sm font-semibold text-[var(--brand-soft)]">
                  Guillermo García — Fundador
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LÍNEA DE TIEMPO HORIZONTAL ──────────────────────── */}
      <section className="border-y border-[var(--header-border)] bg-[var(--section-alt)] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
            18 años de trayectoria
          </h2>
          <div className="relative">
            {/* Línea horizontal */}
            <div className="absolute left-0 right-0 top-5 h-px bg-[var(--border)]" />
            <div className="grid grid-cols-5 gap-4">
              {hitos.map((h) => (
                <div key={h.año} className="flex flex-col items-center gap-3 text-center">
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-black shadow">
                    {h.año.slice(2)}
                  </div>
                  <p className="text-sm font-bold text-[var(--brand-soft)]">{h.año}</p>
                  <p className="text-xs leading-5 text-[var(--text-soft)]">{h.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PILARES ──────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Cómo trabajamos
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[var(--text)]">
            Lo que nos distingue
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pilares.map((p) => (
              <div key={p.numero} className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition hover:border-[var(--accent)]">
                <p className="text-3xl font-black text-[var(--accent)]/30 group-hover:text-[var(--accent)]/60 transition">
                  {p.numero}
                </p>
                <h3 className="mt-3 font-bold text-[var(--text)]">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{p.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="border-t border-[var(--header-border)] bg-[var(--section-alt)] py-14">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-[var(--text)]">¿Tienes un proyecto en Magallanes?</h2>
          <p className="mt-3 text-[var(--text-soft)]">Cuéntanos. Estamos listos para ayudarte.</p>
          <Link href="/cotiza-aqui" className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)]">
            Solicitar cotización
          </Link>
        </div>
      </section>
    </div>
  );
}
