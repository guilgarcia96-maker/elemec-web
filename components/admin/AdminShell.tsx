"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AdminSession } from "@/lib/admin-auth";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    sub: "Panel de control",
  },
  {
    href: "/admin/cotizaciones",
    label: "Cotizaciones",
    sub: "Solicitudes recibidas",
  },
  {
    href: "/admin/postulaciones",
    label: "Postulaciones",
    sub: "Pipeline de RRHH",
  },
  {
    href: "/admin/conciliacion",
    label: "Conciliación",
    sub: "Movimientos contables",
  },
  {
    href: "/admin/gastos",
    label: "Gastos",
    sub: "Control de gastos y OCR",
  },
  {
    href: "/admin/cobranza",
    label: "Cobranza",
    sub: "Aging CxC y mora",
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    sub: "Reglas y motor",
  },
];

export default function AdminShell({
  session,
  children,
  active,
}: {
  session: AdminSession;
  children: React.ReactNode;
  active?: "dashboard" | "cotizaciones" | "postulaciones" | "conciliacion" | "gastos" | "cobranza" | "configuracion";
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar sidebar al navegar
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[#0f0f1a] text-white">
      {/* Barra superior móvil */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#13131f] border-b border-white/10 flex items-center px-4 z-40 md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition"
          aria-label="Menú"
        >
          <svg className="h-6 w-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <span className="ml-3 font-bold text-lg text-[#e2b44b] tracking-wide">ELEMEC</span>
        <span className="ml-1.5 text-[10px] text-white/35 uppercase tracking-widest self-end mb-1">Backoffice</span>
      </div>

      {/* Overlay backdrop (solo móvil) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-56 bg-[#13131f] border-r border-white/10 z-50
          flex flex-col overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:shrink-0 md:sticky
        `}
      >
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-base font-bold text-[#e2b44b] tracking-wide">ELEMEC</p>
          <p className="text-[10px] text-white/35 mt-0.5 uppercase tracking-widest">
            Backoffice
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {NAV.map((item) => {
            const isActive =
              item.href === "/admin"
                ? active === "dashboard"
                : active === item.href.replace("/admin/", "");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex flex-col px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-[#e2b44b]/10 text-[#e2b44b] border border-[#e2b44b]/30"
                    : "text-white/55 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="font-semibold">{item.label}</span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    isActive ? "text-[#e2b44b]/60" : "text-white/30"
                  }`}
                >
                  {item.sub}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs font-medium text-white/70 truncate">{session.nombre}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
            {session.role}
          </p>
          <form action="/api/admin/logout" method="POST" className="mt-3">
            <button
              type="submit"
              className="text-xs text-white/35 hover:text-white/80 transition"
            >
              Cerrar sesión →
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex-1 min-w-0 pt-14 md:pt-0">{children}</div>
    </div>
  );
}
