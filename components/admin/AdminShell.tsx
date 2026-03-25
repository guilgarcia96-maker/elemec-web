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
    href: "/admin/informes",
    label: "Informes",
    sub: "Informes tecnicos con IA",
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
  active?: "dashboard" | "cotizaciones" | "postulaciones" | "conciliacion" | "gastos" | "informes" | "cobranza" | "configuracion";
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar sidebar al navegar
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[#f8f9fb] text-gray-900">
      {/* Barra superior móvil */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center px-4 z-40 md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition"
          aria-label="Menú"
        >
          <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <span className="ml-3 font-bold text-lg text-orange-500 tracking-wide">ELEMEC</span>
        <span className="ml-1.5 text-[10px] text-gray-400 uppercase tracking-widest self-end mb-1">Backoffice</span>
      </div>

      {/* Overlay backdrop (solo móvil) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-56 bg-white border-r border-gray-200 z-50
          flex flex-col overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:shrink-0 md:sticky
        `}
      >
        <div className="px-5 py-5 border-b border-gray-200">
          <p className="text-base font-bold text-orange-500 tracking-wide">ELEMEC</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">
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
                    ? "bg-orange-50 text-orange-600 border-l-3 border-orange-500"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span className="font-semibold">{item.label}</span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    isActive ? "text-orange-400" : "text-gray-400"
                  }`}
                >
                  {item.sub}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 truncate">{session.nombre}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
            {session.role}
          </p>
          <form action="/api/admin/logout" method="POST" className="mt-3">
            <button
              type="submit"
              className="text-xs text-gray-400 hover:text-gray-700 transition"
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
