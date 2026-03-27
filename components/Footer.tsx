export default function Footer() {
  return (
    <footer aria-label="Pie de página" className="border-t border-[var(--header-border)] bg-[var(--section-alt)] text-[var(--text-soft)]">
      {/* Mapa Google Maps — ancho completo */}
      <div className="w-full">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2388.5!2d-70.9114!3d-53.1548!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xbdb2!2sArturo+Prat+1602%2C+Punta+Arenas%2C+Magallanes+y+la+Ant%C3%A1rtica+Chilena!5e0!3m2!1ses!2scl!4v1"
          width="100%"
          height="250"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ubicación ELEMEC — Arturo Prat 1602, Punta Arenas"
        />
      </div>

      {/* Barra de contacto compacta */}
      <div className="border-t border-[var(--header-border)] px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          {/* Logo + subtítulo */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-widest text-[var(--brand-soft)]">ELEMEC</span>
            <span className="hidden text-xs tracking-widest sm:inline">OBRAS Y SERVICIOS DE INGENIERÍA</span>
          </div>

          {/* Dirección */}
          <div className="text-sm">
            <span>Arturo Prat 1602, Punta Arenas</span>
            <span className="hidden md:inline"> · Región de Magallanes</span>
          </div>

          {/* Contacto */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a
              href="tel:+56996492917"
              aria-label="Llamar al +56 9 9649 2917"
              className="hover:text-[var(--accent)] transition"
            >
              +56 9 9649 2917
            </a>
            <span className="text-[var(--border)]">·</span>
            <a
              href="tel:+56932202001"
              aria-label="Llamar al +56 9 3220 2001"
              className="hover:text-[var(--accent)] transition"
            >
              +56 9 3220 2001
            </a>
            <span className="text-[var(--border)]">·</span>
            <a
              href="mailto:elemec.magallanes@gmail.com"
              aria-label="Enviar email a elemec.magallanes@gmail.com"
              className="hover:text-[var(--accent)] transition"
            >
              elemec.magallanes@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-[var(--header-border)] px-6 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-soft)]">
          <span>© {new Date().getFullYear()} ELEMEC. Todos los derechos reservados.</span>
          <span>Ingeniería confiable para climas exigentes.</span>
        </div>
      </div>
    </footer>
  );
}
