"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/quienes-somos", label: "Quiénes Somos" },
  { href: "/servicios", label: "Servicios" },
  { href: "/trabajaconnosotros", label: "Trabaja con Nosotros" },
  { href: "/cotiza-aqui", label: "Cotiza Aquí" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--header-border)] bg-[var(--header-bg)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 items-center">
            <span className="text-xl font-bold tracking-widest text-[var(--brand-soft)]">
              ELEMEC
            </span>
          </div>
          <span className="hidden text-xs tracking-[0.22em] text-[var(--text-soft)] md:block">
            OBRAS Y SERVICIOS DE INGENIERÍA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Navegación principal" className="hidden items-center gap-1 text-sm md:flex">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-md px-3 py-2 transition ${
                  isActive
                    ? "bg-[var(--section-alt)] text-[var(--brand-soft)] font-semibold"
                    : "text-[var(--text-soft)] hover:text-[var(--brand-soft)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile: hamburger placeholder (expandable) */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/cotiza-aqui"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[var(--accent-hover)]"
          >
            Cotizar
          </Link>
        </div>
      </div>

      {/* Mobile nav strip */}
      <nav aria-label="Navegación móvil" className="flex gap-1 overflow-x-auto border-t border-[var(--header-border)] px-4 py-2 md:hidden">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 rounded px-3 py-1.5 text-xs transition ${
                isActive
                  ? "bg-[var(--section-alt)] text-[var(--brand-soft)] font-semibold"
                  : "text-[var(--text-soft)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
