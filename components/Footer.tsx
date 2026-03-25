import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--header-border)] bg-[var(--section-alt)] text-[var(--text-soft)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-3">
        {/* Columna 1: Empresa */}
        <div>
          <p className="text-lg font-bold tracking-widest text-[var(--brand-soft)]">
            ELEMEC
          </p>
          <p className="mt-1 text-xs tracking-widest">
            OBRAS Y SERVICIOS DE INGENIERÍA
          </p>
          <p className="mt-4 text-sm leading-6">
            Bernardo O&apos;Higgins 1234, Punta Arenas
            <br />
            Región de Magallanes, Chile
          </p>
          <p className="mt-3 text-sm">
            <a
              href="tel:+56996492917"
              className="hover:text-[var(--accent)] transition"
            >
              +56 9 9649 2917
            </a>
          </p>
          <p className="text-sm">
            <a
              href="tel:+56932202001"
              className="hover:text-[var(--accent)] transition"
            >
              +56 9 3220 2001
            </a>
          </p>
          <p className="text-sm">
            <a
              href="mailto:elemec.magallanes@gmail.com"
              className="hover:text-[var(--accent)] transition"
            >
              elemec.magallanes@gmail.com
            </a>
          </p>
        </div>

        {/* Columna 2: Navegación */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--brand-soft)]">
            Navegación
          </p>
          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/" className="hover:text-[var(--accent)] transition">
              Inicio
            </Link>
            <Link
              href="/servicios"
              className="hover:text-[var(--accent)] transition"
            >
              Servicios
            </Link>
            <Link
              href="/productos"
              className="hover:text-[var(--accent)] transition"
            >
              Productos
            </Link>
            <Link
              href="/trabajaconnosotros"
              className="hover:text-[var(--accent)] transition"
            >
              Trabaja con Nosotros
            </Link>
            <Link
              href="/cotiza-aqui"
              className="hover:text-[var(--accent)] transition"
            >
              Cotiza Aquí
            </Link>
          </nav>
        </div>

        {/* Columna 3: Newsletter */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--brand-soft)]">
            Newsletter ELEMEC
          </p>
          <p className="mb-3 text-sm">
            Recibe novedades sobre proyectos y servicios.
          </p>
          <form className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="Ingrese su email"
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-soft)]"
            />
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" className="mt-0.5" />
              <span>
                Acepto recibir correos sobre los productos y servicios de
                ELEMEC.
              </span>
            </label>
            <button
              type="button"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[var(--accent-hover)]"
            >
              SUSCRIBIRME
            </button>
          </form>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-[var(--header-border)] px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-soft)]">
          <span>© {new Date().getFullYear()} ELEMEC. Todos los derechos reservados.</span>
          <span>Ingeniería confiable para climas exigentes.</span>
        </div>
      </div>
    </footer>
  );
}
