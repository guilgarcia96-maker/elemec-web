import Link from "next/link";
import { productos } from "./productosData";

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
        </div>
      </section>

      {/* Grid de productos estilo integral.cl */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {productos.map((p) => (
              <Link
                key={p.slug}
                href={`/productos/${p.slug}`}
                className="group flex flex-col"
              >
                {/* Imagen / placeholder cuadrado */}
                <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${p.gradiente} transition duration-300 group-hover:brightness-75`}
                  />
                  {/* Overlay naranja al hover */}
                  <div className="absolute inset-0 bg-[var(--accent)]/0 transition duration-300 group-hover:bg-[var(--accent)]/20" />
                  {/* Icono centrado */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl transition duration-300 group-hover:scale-110">
                      {p.icono}
                    </span>
                  </div>
                  {/* Badge */}
                  {p.badge && (
                    <span className="absolute right-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-black">
                      {p.badge}
                    </span>
                  )}
                  {/* "Ver más" en hover */}
                  <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center pb-3 transition duration-300 group-hover:translate-y-0">
                    <span className="text-xs font-semibold text-white">
                      Ver más →
                    </span>
                  </div>
                </div>
                {/* Nombre del producto */}
                <p className="mt-2 text-center text-sm font-semibold leading-tight text-[var(--text)] transition group-hover:text-[var(--accent)]">
                  {p.nombre}
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
