import Link from "next/link";

/* ─────────────────────────────────────────────────────────────
   VERSIÓN 3 — Enfoque "Visual bold + sectores + equipo"
   Estructura: Hero dividido (texto | imagen) → Cifras en franja →
   Sectores que atendemos → Misión en grande → CTA
───────────────────────────────────────────────────────────── */

const cifras = [
  { valor: "2007", label: "Año de fundación" },
  { valor: "18+", label: "Años de experiencia" },
  { valor: "100%", label: "Cobertura regional" },
  { valor: "<24h", label: "Tiempo de respuesta" },
  { valor: "95%", label: "Cumplimiento de plazos" },
];

const sectores = [
  { icono: "🏥", nombre: "Salud", descripcion: "Hospitales, clínicas y recintos críticos en Magallanes." },
  { icono: "🏭", nombre: "Industria", descripcion: "Plantas de proceso, faenas y utilidades industriales." },
  { icono: "🏛️", nombre: "Sector Público", descripcion: "Obras y mantenciones para organismos del Estado." },
  { icono: "🏗️", nombre: "Construcción", descripcion: "Instalaciones para obras en ejecución y edificaciones." },
  { icono: "⚡", nombre: "Energía", descripcion: "Proyectos eléctricos y de generación para la industria." },
  { icono: "🌡️", nombre: "Térmico", descripcion: "Gas, calefacción y vapor para operación continua." },
];

export default function QuienesSomosV3() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ── HERO DIVIDIDO ────────────────────────────────────── */}
      <section className="grid md:grid-cols-2 md:min-h-[80vh]">
        {/* Columna izquierda — texto */}
        <div className="flex flex-col justify-center bg-[var(--section-alt)] px-10 py-20 md:px-16">
          <div className="h-1 w-12 bg-[var(--accent)] mb-8" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Quiénes somos
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-[var(--text)] md:text-5xl">
            Ingeniería<br />
            <span className="text-[var(--brand-soft)]">confiable.</span><br />
            Desde 2007.
          </h1>
          <p className="mt-6 max-w-md leading-7 text-[var(--text-soft)]">
            Fundada por Guillermo García en Punta Arenas, ELEMEC es la empresa
            de referencia en servicios de ingeniería industrial para la Región
            de Magallanes y Tierra del Fuego.
          </p>
          <p className="mt-4 max-w-md leading-7 text-[var(--text-soft)]">
            Gas, calefacción, electricidad, vapor y utilidades industriales.
            Un solo proveedor. 18 años de trayectoria. Clientes públicos y privados.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cotiza-aqui" className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[var(--accent-hover)]">
              Solicitar cotización
            </Link>
            <Link href="/servicios" className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
              Ver servicios →
            </Link>
          </div>
        </div>

        {/* Columna derecha — imagen */}
        <div
          className="relative min-h-64 bg-cover bg-center md:min-h-full"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/40" />
          {/* Badge sobre imagen */}
          <div className="absolute bottom-8 left-8 right-8 rounded-xl border border-white/20 bg-black/60 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              Región de Magallanes
            </p>
            <p className="mt-1 text-sm text-white/80">
              Punta Arenas · Porvenir · Isla Dawson · Tierra del Fuego
            </p>
          </div>
        </div>
      </section>

      {/* ── FRANJA DE CIFRAS ─────────────────────────────────── */}
      <section className="bg-[var(--accent)] py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
            {cifras.map((c) => (
              <div key={c.label} className="text-center">
                <p className="text-3xl font-black text-black md:text-4xl">{c.valor}</p>
                <p className="mt-1 text-xs font-semibold text-black/70">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTORES QUE ATENDEMOS ───────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Clientes
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[var(--text)]">
            Sectores que atendemos
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--text-soft)]">
            Trabajamos con clientes públicos y privados en los sectores más exigentes
            de la región austral de Chile.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectores.map((s) => (
              <div
                key={s.nombre}
                className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]"
              >
                <span className="text-3xl">{s.icono}</span>
                <div>
                  <h3 className="font-bold text-[var(--text)]">{s.nombre}</h3>
                  <p className="mt-1 text-sm leading-5 text-[var(--text-soft)]">{s.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISIÓN EN GRANDE ─────────────────────────────────── */}
      <section className="border-y border-[var(--header-border)] bg-[var(--section-alt)] py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Nuestra misión
          </p>
          <p className="mt-6 text-2xl font-semibold leading-relaxed text-[var(--text)] md:text-3xl md:leading-relaxed">
            Proveer servicios de ingeniería confiables y seguros para la industria
            y el sector público de Magallanes, contribuyendo a la{" "}
            <span className="text-[var(--brand-soft)]">
              continuidad operacional
            </span>{" "}
            de nuestros clientes con soluciones a medida y cumplimiento normativo riguroso.
          </p>
        </div>
      </section>

      {/* ── POR QUÉ ELEMEC ───────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Por qué elegirnos
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[var(--text)]">
            La diferencia ELEMEC
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                titulo: "Empresa local con visión técnica",
                texto: "Somos de Punta Arenas. Entendemos el territorio, el clima y las necesidades reales de la industria austral. No somos una franquicia ni una sucursal.",
              },
              {
                titulo: "Cobertura total en la región",
                texto: "Operamos en toda la Región de Magallanes y Tierra del Fuego. Desde la ciudad hasta las faenas más remotas, con logística propia y respuesta ágil.",
              },
              {
                titulo: "Un solo proveedor para todo",
                texto: "Gas, electricidad, calefacción, vapor, aislación. Gestionamos tu instalación completa. Sin necesidad de coordinar múltiples empresas.",
              },
            ].map((item) => (
              <div key={item.titulo} className="border-t-2 border-[var(--accent)] pt-5">
                <h3 className="font-bold text-[var(--text)]">{item.titulo}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{item.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="border-t border-[var(--header-border)] bg-[var(--section-alt)] py-14">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-[var(--text)]">¿Listo para trabajar juntos?</h2>
          <p className="mt-3 text-[var(--text-soft)]">Cuéntanos tu proyecto. Respondemos en menos de 24 horas.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/cotiza-aqui" className="rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)]">
              Solicitar cotización
            </Link>
            <Link href="/servicios" className="rounded-lg border border-[var(--border)] px-8 py-3 text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
              Ver servicios
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
