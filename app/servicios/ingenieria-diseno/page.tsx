"use client";

import Link from "next/link";
import { useState } from "react";

const alcance = [
  {
    titulo: "Diseño de instalaciones",
    foto: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Diseño integral de redes de gas, agua potable, vapor y electricidad para instalaciones industriales y edificaciones. Incluye planos técnicos, esquemas P&ID, diagramas unifilares y especificaciones de materiales conforme a normativa vigente.",
    beneficios: [
      "Planos aptos para tramitación SEC y permisos municipales",
      "Compatibilidad entre disciplinas desde el diseño",
      "Reducción de imprevistos en obra",
      "Especificaciones de materiales locales",
    ],
  },
  {
    titulo: "Memorias de cálculo",
    foto: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Elaboración de memorias de cálculo estructurales, hidráulicas, eléctricas y térmicas, junto con planos de detalle para presentación ante organismos técnicos y fiscalizadores. Toda la documentación respaldada por profesional competente.",
    beneficios: [
      "Cálculo estructural y de cargas según norma chilena",
      "Dimensionamiento de tuberías, ductos y conductores",
      "Planos firmados por profesional habilitado",
      "Entregables en formato editable y PDF",
    ],
  },
  {
    titulo: "Tramitaciones SEC",
    foto: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Gestión completa de proyectos eléctricos y de gas ante la Superintendencia de Electricidad y Combustibles (SEC). Desde la preparación de expedientes hasta la obtención de la declaración de instalación aprobada y el certificado final.",
    beneficios: [
      "Declaraciones de instalación eléctrica y de gas",
      "Seguimiento de observaciones SEC",
      "Coordinación con inspectores fiscalizadores",
      "Historial de tramitaciones exitosas en Magallanes",
    ],
  },
  {
    titulo: "Modulación y layout",
    foto: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Desarrollo del layout de equipos en obra, optimizando espacios, accesos de mantención y flujos operacionales. Coordinación temprana con contratistas para evitar interferencias entre disciplinas y asegurar instalabilidad.",
    beneficios: [
      "Optimización de espacios en sala de máquinas",
      "Accesos de mantención correctamente dimensionados",
      "Coordinación multidisciplinaria en plano",
      "Reducción de retrabajos en obra",
    ],
  },
  {
    titulo: "Ingeniería de detalle",
    foto: "https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Desarrollo de ingeniería de detalle para proyectos industriales complejos. Incluye especificaciones técnicas, hojas de datos de equipos, isométricos de tuberías y coordinación con proveedores y constructores para garantizar la correcta ejecución.",
    beneficios: [
      "Isométricos y detalles constructivos en 2D",
      "Hojas de datos de equipos y accesorios",
      "Especificaciones técnicas de adquisición",
      "Respaldo técnico durante la ejecución de obra",
    ],
  },
  {
    titulo: "Cierre técnico",
    foto: "https://images.unsplash.com/photo-1568992688065-536aad8a12f6?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Entrega del dossier técnico de obra completo: planos as-built actualizados, protocolos de prueba y puesta en marcha, certificados de calidad, manuales de operación y toda la documentación exigida para la recepción formal del proyecto.",
    beneficios: [
      "Planos as-built en formato digital y físico",
      "Protocolos de pruebas hidráulicas y eléctricas",
      "Manuales de operación y mantenimiento",
      "Dossier listo para entrega a mandante",
    ],
  },
];

export default function IngenieriaDisenoPage() {
  const [activo, setActivo] = useState(0);
  const item = alcance[activo];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/icono-ingenieria.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative h-1 bg-[var(--accent)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <nav className="mb-6 flex items-center gap-2 text-xs text-white/60">
            <Link href="/" className="hover:text-white transition">Inicio</Link>
            <span>/</span>
            <Link href="/servicios" className="hover:text-white transition">Servicios</Link>
            <span>/</span>
            <span className="text-white/90">Ingeniería y Diseño</span>
          </nav>

          <p className="inline-flex rounded-full border border-[var(--accent)]/60 bg-[var(--accent)]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Servicio ELEMEC
          </p>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight text-white md:text-6xl">
            Ingeniería{" "}
            <span className="text-[var(--accent)]">&amp; Diseño.</span>
          </h1>
          <p className="mt-5 max-w-xl text-white/70 leading-relaxed">
            Departamento técnico con más de 18 años ejecutando proyectos en
            Magallanes — diseño, cálculo, tramitaciones y eficiencia operacional.
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
            son los beneficios concretos para tu proyecto.
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
                  <p className="text-xs opacity-40">{item.titulo}</p>
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
                    <span className="text-sm leading-6 text-[var(--text-soft)]">
                      {b}
                    </span>
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
