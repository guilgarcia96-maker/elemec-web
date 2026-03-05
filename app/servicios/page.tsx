import Link from "next/link";
import { servicios } from "./serviciosData";

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
            clientes de manera eficiente y segura.
          </p>
        </div>
      </section>

      {/* Grid de servicios */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {servicios.map((s) => (
              <Link
                key={s.slug}
                href={`/servicios/${s.slug}`}
                className="group flex flex-col"
              >
                {/* Imagen / placeholder cuadrado */}
                <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                  {s.iconoImg ? (
                    <>
                      {/* Foto real con filtro industrial */}
                      <img
                        src={s.iconoImg}
                        alt={s.titulo}
                        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        style={{ filter: "brightness(1.05) saturate(0.9)" }}
                      />
                      {/* Tinte naranja de marca */}
                      <div className="absolute inset-0 bg-orange-600/10 mix-blend-multiply" />
                    </>
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${s.gradiente} transition duration-300 group-hover:brightness-75`}
                    />
                  )}
                  {/* Overlay naranja al hover */}
                  <div className="absolute inset-0 bg-[var(--accent)]/0 transition duration-300 group-hover:bg-[var(--accent)]/20" />
                  {/* Icono centrado (solo si no hay foto) */}
                  {!s.iconoImg && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl transition duration-300 group-hover:scale-110">
                        {s.icono}
                      </span>
                    </div>
                  )}
                  {/* Badge */}
                  {s.badge && (
                    <span className="absolute right-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-black">
                      {s.badge}
                    </span>
                  )}
                  {/* "Ver más" en hover */}
                  <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center pb-3 transition duration-300 group-hover:translate-y-0">
                    <span className="text-xs font-semibold text-white">
                      Ver más →
                    </span>
                  </div>
                </div>
                {/* Nombre del servicio */}
                <p className="mt-2 text-center text-sm font-semibold leading-tight text-[var(--text)] transition group-hover:text-[var(--accent)]">
                  {s.titulo}
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
