import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[var(--bg)] px-6 text-center text-[var(--text)]">
      {/* Número grande */}
      <p className="text-[8rem] font-extrabold leading-none text-[var(--accent)] md:text-[10rem]">
        404
      </p>

      {/* Separador */}
      <div className="mx-auto mt-4 h-1 w-20 rounded bg-[var(--accent)]" />

      {/* Título */}
      <h1 className="mt-6 text-2xl font-bold text-[var(--text)] md:text-3xl">
        Página no encontrada
      </h1>

      {/* Subtítulo */}
      <p className="mt-3 max-w-md text-[var(--text-soft)]">
        La página que buscas no existe o fue movida.
      </p>

      {/* Acciones */}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)]"
        >
          Volver al inicio
        </Link>
        <Link
          href="/servicios"
          className="rounded-lg border border-[var(--border)] px-6 py-3 font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Ver servicios
        </Link>
      </div>
    </div>
  );
}
