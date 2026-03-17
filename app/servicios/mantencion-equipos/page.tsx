"use client";

import Link from "next/link";
import { useState } from "react";

const alcance = [
  {
    titulo: "Calderas",
    foto: "https://images.unsplash.com/photo-1535961652354-923cb08225a7?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Mantención preventiva y correctiva de calderas industriales y comerciales. Revisión de presión, sistema de seguridades, líneas de vapor y condensado. Intervenciones realizadas por técnicos certificados con experiencia en la Región de Magallanes.",
    beneficios: [
      "Inspección completa de cuerpo, tapas y accesorios",
      "Limpieza de intercambiadores y tubos de fuego",
      "Verificación de válvulas de seguridad y controles",
      "Informe técnico entregado al cierre de cada intervención",
    ],
  },
  {
    titulo: "Quemadores",
    foto: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Revisión, limpieza y calibración de quemadores a gas y petróleo en calderas, generadores de vapor y equipos de calefacción. Ajuste de mezcla aire-combustible para maximizar eficiencia y reducir consumo energético.",
    beneficios: [
      "Calibración de mezcla aire-combustible",
      "Limpieza de boquillas, electrodos y fotocélula",
      "Análisis de gases de combustión incluido",
      "Compatibilidad con quemadores Weishaupt, Riello y Sookook",
    ],
  },
  {
    titulo: "Calefacción central",
    foto: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Mantención integral de sistemas de calefacción central en edificios, hospitales, hoteles e instalaciones industriales. Revisión de bombas circuladoras, válvulas de zona, radiadores, expansores y redes de distribución.",
    beneficios: [
      "Purga y carga del circuito hidráulico",
      "Revisión de bombas circuladoras y sellos",
      "Control de temperatura y termostatos",
      "Plan de mantención anual con contrato disponible",
    ],
  },
  {
    titulo: "Redes de gas",
    foto: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Inspección de redes de gas natural y GLP para detección de fugas, revisión de reguladores, válvulas de corte y estado general de la instalación. Personal con licencia SEC vigente para intervenciones en gas.",
    beneficios: [
      "Detección de fugas con equipos electrónicos certificados",
      "Revisión de reguladores y presiones de trabajo",
      "Pruebas de hermeticidad documentadas",
      "Informe de estado y recomendaciones incluido",
    ],
  },
  {
    titulo: "Instalaciones eléctricas",
    foto: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Mantención de instalaciones eléctricas industriales: tableros de distribución, motores, arrancadores, líneas de alimentación y sistemas de iluminación. Revisión termográfica e inspección de conexiones disponibles.",
    beneficios: [
      "Apretado de conexiones y limpieza de tableros",
      "Verificación de protecciones y diferenciales",
      "Revisión de motores y centros de control",
      "Registro fotográfico del estado de la instalación",
    ],
  },
  {
    titulo: "Registro e informes",
    foto: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Cada intervención de mantención queda registrada en un informe técnico detallado con el estado de los equipos, trabajos realizados, materiales utilizados y recomendaciones para próximas mantenciones. Trazabilidad completa para el cliente.",
    beneficios: [
      "Informe técnico entregado al cierre de cada visita",
      "Historial de intervenciones por equipo",
      "Alertas de equipos con vida útil crítica",
      "Acceso al historial técnico en cualquier momento",
    ],
  },
];

export default function MantencionEquiposPage() {
  const [activo, setActivo] = useState(0);
  const item = alcance[activo];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/icono-mantencion.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative h-1 bg-[var(--accent)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <nav className="mb-6 flex items-center gap-2 text-xs text-white/60">
            <Link href="/" className="hover:text-white transition">Inicio</Link>
            <span>/</span>
            <Link href="/servicios" className="hover:text-white transition">Servicios</Link>
            <span>/</span>
            <span className="text-white/90">Mantención de Equipos y Redes</span>
          </nav>

          <p className="inline-flex rounded-full border border-[var(--accent)]/60 bg-[var(--accent)]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Servicio ELEMEC
          </p>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight text-white md:text-6xl">
            Mantención de{" "}
            <span className="text-[var(--accent)]">Equipos y Redes.</span>
          </h1>
          <p className="mt-5 max-w-xl text-white/70 leading-relaxed">
            En faena o en nuestras dependencias — protocolos de calidad total
            con técnicos certificados y respuesta en menos de 24 horas.
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
                Mantención preventiva y correctiva con respuesta inmediata.
              </h2>
              <p className="mt-4 leading-7 text-[var(--text-soft)]">
                Entregamos servicios de mantención para equipos industriales, redes
                eléctricas, hidráulicas y de gas, con técnicos certificados disponibles
                en faena o en nuestras instalaciones. Protocolos de calidad total y
                respuesta en menos de 24 horas para minimizar tiempos de parada en planta.
              </p>
            </div>
            {/* métricas */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { valor: "<24h", etiqueta: "Tiempo de respuesta" },
                { valor: "18+", etiqueta: "Años de experiencia" },
                { valor: "SEC", etiqueta: "Técnicos certificados" },
                { valor: "100%", etiqueta: "Protocolos de calidad" },
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
