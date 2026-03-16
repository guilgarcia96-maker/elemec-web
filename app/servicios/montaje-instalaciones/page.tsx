"use client";

import Link from "next/link";
import { useState } from "react";

const alcance = [
  {
    titulo: "Sala de calderas",
    foto: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "salas de calderas industriales, abarcando la instalación mecánica y funcional de calderas y equipos auxiliares, sistemas de tratamiento de agua, quemadores, líneas de alimentación, redes de vapor, agua caliente y retorno de condensado, válvulas de seguridad, instrumentación, automatización y elementos de control, garantizando su correcta integración y continuidad operativa. Ejecutado bajo normativa SEC y estándares de seguridad industrial.",
    beneficios: [
      "Servicio completo llave en mano",
      "Cobertura total vigente por 6 años",
      "Certificación SEC de la instalación",
      "Mantenciones preventivas post-venta",
    ],
  },
  {
    titulo: "Equipos industriales",
    foto: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Montaje y desmontaje de equipos industriales de todo tipo: compresores, bombas, intercambiadores de calor, separadores y maquinaria de proceso. Coordinación con proveedores y supervisión técnica en cada etapa del montaje.",
    beneficios: [
      "Servicio completo llave en mano",
      "Alineación y nivelación de equipos",
      "Conexión a sistemas eléctricos, hidráulicos y neumáticos",
      "Registros técnicos de la intervención",
    ],
  },
  {
    titulo: "Maquinaria pesada",
    foto: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Montaje de maquinaria pesada en plantas industriales, instalaciones portuarias y proyectos de infraestructura. Incluye izaje especializado, posicionamiento estructural y conexión a sistemas auxiliares con equipos y personal certificado.",
    beneficios: [
      "Planificación del izaje y transporte en obra",
      "Coordinación con operadores de grúa certificados",
      "Ajuste de fundaciones y pernos de anclaje",
      "Protocolos de seguridad para trabajos de alto riesgo",
    ],
  },
  {
    titulo: "Matriz de gas y agua",
    foto: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Montaje de matrices y redes de distribución de gas natural, gas licuado y agua potable industrial. Incluye tendido de tuberías, soportería, válvulas, instrumentación y pruebas de hermeticidad según normativa vigente, garantizando la continuidad operativa.",
    beneficios: [
      "Servicio completo llave en mano",
      "Pruebas de presión y hermeticidad certificadas",
      "Soportería técnica y anclajes estructurales",
      "Certificación SEC de la red",
    ],
  },
  {
    titulo: "Sala de tableros",
    foto: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Montaje de salas de tableros eléctricos, centros de control de motores (CCM), tableros de distribución y sistemas de respaldo eléctrico en baja, media y alta tensión. Garantizando la seguridad y la correcta operación e integración de los sistemas.",
    beneficios: [
      "Servicio completo llave en mano",
      "Etiquetado y documentación de circuitos",
      "Planos y memorias de cálculo",
      "Tramitación SEC",
    ],
  },
  {
    titulo: "Generadores eléctricos",
    foto: "https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Montaje de generadores eléctricos y grupos electrógenos de potencia. Instalación de fundaciones, conexiones de combustible, sistemas de escape, tableros de transferencia automática y redes eléctricas asociadas, con puesta en marcha y verificación de parámetros.",
    beneficios: [
      "Montaje sobre fundación o base metálica",
      "Integración con sistemas de transferencia automática (ATS)",
      "Garantia vigente por 2 años",
      "Mantenciones preventivas programadas post-venta",
    ],
  },
  {
    titulo: "Redes de utilidades",
    foto: "https://images.unsplash.com/photo-1606185540834-d6f2d75e6b5e?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Instalación de redes de utilidades industriales: aire comprimido, nitrógeno, vapor, agua desmineralizada, glicol y otros fluidos de proceso. Diseño y montaje con materiales adecuados a cada fluido y condición de operación.",
    beneficios: [
      "Selección de materiales según fluido y presión",
      "Instalación de manifolds y puntos de distribución",
      "Pruebas de presión y calidad de fluido",
      "Identificación y rotulado de líneas",
    ],
  },
  {
    titulo: "Estructuras metálicas",
    foto: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&h=560&q=80",
    descripcion:
      "Montaje de estructuras metálicas industriales, soportería especial, racks de tuberías y plataformas de acceso. Fabricación en taller propio o coordinación con maestranza, con instalación en obra y verificación estructural.",
    beneficios: [
      "Montaje según planos de detalle aprobados",
      "Soldadura certificada",
      "Galvanizado o pintura anticorrosiva para zona austral",
      "Inspección dimensional y de verticalidad",
    ],
  },
];

export default function MontajeIndustrialPage() {
  const [activo, setActivo] = useState(0);
  const item = alcance[activo];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/montaje-calderas2.jpeg')" }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative h-1 bg-[var(--accent)]" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <nav className="mb-6 flex items-center gap-2 text-xs text-white/60">
            <Link href="/" className="hover:text-white transition">Inicio</Link>
            <span>/</span>
            <Link href="/servicios" className="hover:text-white transition">Servicios</Link>
            <span>/</span>
            <span className="text-white/90">Montaje Industrial</span>
          </nav>

          <p className="inline-flex rounded-full border border-[var(--accent)]/60 bg-[var(--accent)]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            Servicio ELEMEC
          </p>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight text-white md:text-6xl">
            Montaje{" "}
            <span className="text-[var(--accent)]">Industrial.</span>
          </h1>
          <p className="mt-5 max-w-xl text-white/70 leading-relaxed">
            Experiencia y calidad en obras de instalación y montaje industrial
            con personal altamente calificado y certificado en la Región de Magallanes.
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
                Descripción.
              </h2>
              <p className="mt-4 leading-7 text-[var(--text-soft)]">
                En ELEMEC contamos con la experiencia, respaldo y calidad en obras de
                instalación de maquinaria y equipos para plantas industriales, centros
                de producción y proyectos de diversa envergadura. Personal altamente
                calificado que cumple con los más altos estándares de seguridad,
                avalados por nuestras certificaciones y trayectoria en las principales
                obras de la Región de Magallanes.
              </p>
            </div>
            {/* métricas */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { valor: "21+", etiqueta: "Proyectos terminados" },
                { valor: "100%", etiqueta: "Proyectos certificados" },
                { valor: "SEC", etiqueta: "Instalador autorizado" },
                { valor: "Austral", etiqueta: "Especialistas en zona" },
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
