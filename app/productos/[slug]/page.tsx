import Link from "next/link";
import { notFound } from "next/navigation";
import { productos } from "../productosData";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return productos.map((p) => ({ slug: p.slug }));
}

export default async function ProductoDetallePage({ params }: Props) {
  const { slug } = await params;
  const producto = productos.find((p) => p.slug === slug);

  if (!producto) notFound();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Breadcrumb + header */}
      <section className="border-b border-[var(--header-border)] bg-[var(--section-alt)] py-12">
        <div className="mx-auto max-w-4xl px-6">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-xs text-[var(--text-soft)]">
            <Link href="/" className="hover:text-[var(--accent)] transition">
              Inicio
            </Link>
            <span>/</span>
            <Link
              href="/productos"
              className="hover:text-[var(--accent)] transition"
            >
              Productos
            </Link>
            <span>/</span>
            <span className="text-[var(--accent)]">{producto.nombre}</span>
          </nav>

          {/* Icono + título */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${producto.gradiente} text-4xl shadow-lg`}
            >
              {producto.icono}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                ELEMEC
              </p>
              <h1 className="mt-1 text-3xl font-bold text-[var(--text)]">
                {producto.nombre}
              </h1>
            </div>
          </div>

          {producto.badge && (
            <span className="mt-4 inline-block rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-black">
              {producto.badge}
            </span>
          )}
        </div>
      </section>

      {/* Contenido principal */}
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Descripción */}
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)]">
                Descripción
              </h2>
              <p className="mt-4 leading-7 text-[var(--text-soft)]">
                {producto.descripcionLarga}
              </p>
            </div>

            {/* Características */}
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)]">
                Alcance del servicio
              </h2>
              <ul className="mt-4 space-y-3">
                {producto.caracteristicas.map((c) => (
                  <li key={c} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                    <span className="text-sm leading-6 text-[var(--text-soft)]">
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Otros productos */}
      <section className="border-t border-[var(--header-border)] bg-[var(--section-alt)] py-12">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-[var(--text-soft)]">
            Otros productos
          </h2>
          <div className="flex flex-wrap gap-3">
            {productos
              .filter((p) => p.slug !== slug)
              .slice(0, 5)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/productos/${p.slug}`}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <span>{p.icono}</span>
                  {p.nombre}
                </Link>
              ))}
            <Link
              href="/productos"
              className="rounded-lg border border-[var(--accent)]/40 px-4 py-2 text-sm text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
            >
              Ver todos →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-[var(--text)]">
            ¿Necesitas este servicio?
          </h2>
          <p className="mt-3 text-[var(--text-soft)]">
            Cuéntanos tu requerimiento y te cotizamos a la brevedad.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/cotiza-aqui"
              className="rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)]"
            >
              Solicitar cotización
            </Link>
            <Link
              href="/productos"
              className="rounded-lg border border-[var(--border)] px-8 py-3 text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              ← Volver a Productos
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
