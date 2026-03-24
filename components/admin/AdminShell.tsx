import Link from "next/link";
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
  return (
    <div className="flex min-h-screen bg-[#0f0f1a] text-white">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/10 bg-[#13131f] flex flex-col sticky top-0 h-screen overflow-y-auto">
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

      {/* Content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
