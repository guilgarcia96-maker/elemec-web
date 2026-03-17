"use client";

import Link from "next/link";
import { useState } from "react";

const alcance = [
  {
    titulo: "Redes de agua",
    foto: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Diseño, instalación y mantención de redes de agua potable e industrial para plantas productivas, recintos hospitalarios, educacionales e instalaciones industriales en general. Incluye trazado, pruebas hidráulicas y entrega documentada.",
    beneficios: [
      "Redes certificadas conforme a normativa NCh",
      "Pruebas de presión e impermeabilidad incluidas",
      "Planos as-built al término de la obra",
      "Mantención preventiva programada",
    ],
  },
  {
    titulo: "Gas natural y GLP",
    foto: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Instalación de redes de gas natural y GLP con tramitaciones SEC completamente gestionadas por ELEMEC. Desde el diseño del trazado hasta la declaración aprobada, asegurando cumplimiento normativo y seguridad operacional.",
    beneficios: [
      "Tramitaciones SEC incluidas sin costo adicional",
      "Especialistas en gas con licencia vigente",
      "Trabajo en instalaciones en operación",
      "Pruebas de hermeticidad certificadas",
    ],
  },
  {
    titulo: "Instalaciones eléctricas",
    foto: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Instalaciones eléctricas de baja tensión, tableros de distribución y centros de control para uso industrial y comercial. Personal con licencia SEC vigente. Incluye declaración de instalación eléctrica y puesta en servicio.",
    beneficios: [
      "Instaladores con licencia SEC clase A y B",
      "Declaración de instalación eléctrica incluida",
      "Tableros certificados con protecciones normadas",
      "Puesta en servicio acompañada y documentada",
    ],
  },
  {
    titulo: "Calefacción central",
    foto: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Diseño e instalación de sistemas de calefacción central para edificios e instalaciones industriales en la Región de Magallanes. Soluciones eficientes a base de agua caliente, vapor o aire forzado, adaptadas al clima extremo austral.",
    beneficios: [
      "Diseño optimizado para clima patagónico",
      "Compatibilidad con calderas a gas, petróleo o leña",
      "Cálculo de cargas térmicas incluido",
      "Servicio de mantención anual disponible",
    ],
  },
  {
    titulo: "Contrato unificado",
    foto: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Gestión unificada de todos los servicios básicos bajo un solo contrato con ELEMEC como único responsable. Se elimina la necesidad de coordinar múltiples proveedores, reduciendo tiempos, costos y riesgos operacionales.",
    beneficios: [
      "Un solo punto de contacto para todos los servicios",
      "Coordinación interproveedor eliminada",
      "Reducción de costos administrativos y de gestión",
      "Trazabilidad total de cada intervención",
    ],
  },
  {
    titulo: "Mantención integrada",
    foto: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Servicio de mantención preventiva y correctiva integrada para todos los servicios básicos instalados. Respuesta en menos de 24 horas ante fallas críticas. Registro técnico de cada intervención y reportes periódicos al cliente.",
    beneficios: [
      "Respuesta en menos de 24 horas ante emergencias",
      "Planes de mantención preventiva personalizados",
      "Registro y trazabilidad de cada intervención",
      "Reportes técnicos periódicos al cliente",
    ],
  },
];

export default function ServiciosBasicosPage() {
  const [activo, setActivo] = useState(0);
  const item = alcance[activo];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/icono-servicios-basicos.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative h-1 bg-[var(--accent)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <nav className="mb-6 flex items-center gap-2 text-xs text-white/60">
            <Link href="/" className="hover:text-white transition">Inicio</Link>
            <span>/</span>
            <Link href="/servicios" className="hover:text-white transition">Servicios</Link>
            <span>/</span>
            <span className="text-white/90">Servicios Básicos Industriales</span>
          </nav>

          <p className="inline-flex rounded-full border border-[var(--accent)]/60 bg-[var(--accent)]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Servicio ELEMEC
          </p>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight text-white md:text-6xl">
            Servicios Básicos{" "}
            <span className="text-[var(--accent)]">Industriales.</span>
          </h1>
          <p className="mt-5 max-w-xl text-white/70 leading-relaxed">
            Agua, gas, electricidad y calefacción integrados en un solo contrato —
            sin múltiples proveedores, sin brechas de responsabilidad.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/cotiza-aqui"
              className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-bold text-black transition hover:bg-[var(--accent-hover)]"
            >
              Solicitar cotización
            </Link>
            <Link
              href="/servicios"
              className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>

      {/* ── DESCRIPCIÓN ────────────────────────────────────────── */}
      <section className="border-b border-[var(--header-border)] bg-[var(--section-alt)] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            {/* texto */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                Sobre el servicio
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-snug text-[var(--text)]">
                Un solo contrato para todos los servicios básicos de tu planta.
              </h2>
              <p className="mt-4 leading-7 text-[var(--text-soft)]">
                Gestionamos la instalación y mantención de todos los sistemas básicos
                industriales — agua, gas, electricidad y calefacción — bajo un solo equipo
                responsable. Coordinación eficiente, sin brechas de responsabilidad y con
                certificación SEC en cada instalación.
              </p>
            </div>
            {/* métricas */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { valor: "4", etiqueta: "Servicios en uno" },
                { valor: "SEC", etiqueta: "Instalador autorizado" },
                { valor: "18+", etiqueta: "Años de experiencia" },
                { valor: "100%", etiqueta: "Proyectos certificados" },
              ].map(({ valor, etiqueta }) => (
                <div
                  key={etiqueta}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center"
                >
                  <p className="text-3xl font-extrabold text-[var(--accent)]">{valor}</p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">{etiqueta}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ALCANCE INTERACTIVO ────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
            ¿Qué incluye?
          </p>
          <h2 className="mt-2 text-4xl font-bold text-[var(--text)]">
            Alcance del servicio
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--text-soft)]">
            Selecciona un área para conocer en detalle qué se incluye y cuáles
            son los beneficios concretos para tu instalación.
          </p>

          {/* Botones de selección */}
          <div className="mt-10 -mx-6 px-6 overflow-x-auto md:mx-0 md:px-0 md:overflow-visible">
            <div className="flex gap-2 md:flex-wrap w-max md:w-auto pb-2 md:pb-0">
              {alcance.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setActivo(i)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition md:px-5 md:py-2 md:text-sm ${
                    activo === i
                      ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                >
                  {a.titulo}
                </button>
              ))}
            </div>
          </div>

          {/* Panel de contenido */}
          <div className="mt-8 grid gap-8 md:grid-cols-2 md:items-start rounded-2xl border border-[var(--border)] bg-[var(--section-alt)] p-8">
            {/* Foto del servicio */}
            <div className="overflow-hidden rounded-xl">
              {item.foto ? (
                <img
                  src={item.foto}
                  alt={item.titulo}
                  className="h-full w-full object-cover"
                  style={{ minHeight: "260px" }}
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)]"
                  style={{ minHeight: "260px" }}
                >
                  <svg className="h-10 w-10 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 19.5h16.5M12 3v.75M12 3l-3 3M12 3l3 3" />
                  </svg>
                  <p className="text-xs font-medium opacity-50">Foto próximamente</p>
                </div>
              )}
            </div>

            {/* Descripción y beneficios */}
            <div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-1">{item.titulo}</h3>
              <div className="h-1 w-8 rounded bg-[var(--accent)] mb-4" />
              <p className="text-sm text-[var(--text-soft)] leading-6 mb-6">{item.descripcion}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-4">
                Beneficios clave
              </p>
              <ul className="space-y-3">
                {item.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-black text-xs font-bold">
                      ✓
                    </span>
                    <span className="text-sm leading-6 text-[var(--text-soft)]">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--header-border)] bg-[var(--section-alt)] py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-[var(--text)]">
            ¿Necesitas este servicio en Magallanes?
          </h2>
          <p className="mt-4 text-[var(--text-soft)]">
            Contáctanos y te responderemos en menos de 24 horas.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/cotiza-aqui"
              className="rounded-lg bg-[var(--accent)] px-8 py-4 text-sm font-bold text-black transition hover:bg-[var(--accent-hover)]"
            >
              Solicitar cotización
            </Link>
            <Link
              href="/servicios"
              className="rounded-lg border border-[var(--border)] px-8 py-4 text-sm font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
