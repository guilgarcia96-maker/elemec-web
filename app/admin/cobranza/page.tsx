import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";

type AgingRow = {
  factura_id: string;
  numero: string | null;
  cliente_id: string;
  razon_social: string | null;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  total: number;
  saldo: number;
  dias_mora: number;
  tramo_mora: "0-30" | "31-90" | "90-180" | "180+";
};

type TramoSummary = { label: string; tramo: string; color: string; textColor: string };

const TRAMOS: TramoSummary[] = [
  { label: "0 – 30 días",   tramo: "0-30",   color: "bg-blue-500/10 border-blue-500/30",   textColor: "text-blue-300" },
  { label: "31 – 90 días",  tramo: "31-90",  color: "bg-yellow-500/10 border-yellow-500/30", textColor: "text-yellow-300" },
  { label: "90 – 180 días", tramo: "90-180", color: "bg-orange-500/10 border-orange-500/30", textColor: "text-orange-300" },
  { label: "180+ días",     tramo: "180+",   color: "bg-red-500/10 border-red-500/30",      textColor: "text-red-300" },
];

const CLP = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default async function CobranzaPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Query the v_cxc_aging view; falls back to empty array if not yet created
  const { data: aging } = await supabase
    .from("v_cxc_aging")
    .select("*")
    .order("dias_mora", { ascending: false });

  const rows: AgingRow[] = aging ?? [];

  // Aggregate by tramo
  const totalesPorTramo = Object.fromEntries(
    TRAMOS.map(({ tramo }) => [
      tramo,
      {
        count: rows.filter((r) => r.tramo_mora === tramo).length,
        saldo: rows.filter((r) => r.tramo_mora === tramo).reduce((a, r) => a + (r.saldo ?? 0), 0),
      },
    ])
  );

  const totalSaldo = rows.reduce((a, r) => a + (r.saldo ?? 0), 0);

  return (
    <AdminShell session={session} active="cobranza">
      <main className="px-3 py-4 md:px-6 md:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Cobranza · Aging CxC</h1>
          <p className="mt-1 text-sm text-white/40">
            Facturas con saldo pendiente, clasificadas por tramo de mora.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {TRAMOS.map(({ label, tramo, color, textColor }) => {
            const { count, saldo } = totalesPorTramo[tramo];
            return (
              <div key={tramo} className={`rounded-xl border p-4 ${color}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${textColor}`}>
                  {label}
                </p>
                <p className="mt-2 text-2xl font-bold text-white">{CLP(saldo)}</p>
                <p className="mt-1 text-xs text-white/40">
                  {count} factura{count !== 1 ? "s" : ""}
                </p>
              </div>
            );
          })}
        </div>

        {/* Total row */}
        <div className="mb-6 rounded-xl border border-[#e2b44b]/30 bg-[#e2b44b]/5 px-5 py-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#e2b44b]">Total saldo pendiente (CxC)</p>
          <p className="text-xl font-bold text-[#e2b44b]">{CLP(totalSaldo)}</p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center">
            <p className="text-sm text-white/40">
              No hay facturas pendientes, o ejecuta{" "}
              <code className="text-[#e2b44b]">backoffice-consolidated-schema.sql</code> en Supabase
              para crear la vista <code className="text-[#e2b44b]">v_cxc_aging</code>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs text-white/40 uppercase tracking-wider">
                  <th className="px-4 py-3">Nº Factura</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 hidden md:table-cell">Emisión</th>
                  <th className="px-4 py-3 hidden md:table-cell">Vencimiento</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Total</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3 text-center">Días mora</th>
                  <th className="px-4 py-3 hidden md:table-cell">Tramo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const tramo = TRAMOS.find((t) => t.tramo === r.tramo_mora);
                  return (
                    <tr key={r.factura_id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3 font-mono text-[#e2b44b]">
                        {r.numero ?? r.factura_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-white/80 max-w-[200px] truncate">
                        {r.razon_social ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-white/50 hidden md:table-cell">
                        {r.fecha_emision
                          ? new Date(r.fecha_emision).toLocaleDateString("es-CL")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-white/50 hidden md:table-cell">
                        {r.fecha_vencimiento
                          ? new Date(r.fecha_vencimiento).toLocaleDateString("es-CL")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-white/70 hidden md:table-cell">{CLP(r.total)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-white">{CLP(r.saldo)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                            r.dias_mora > 180
                              ? "bg-red-500/20 text-red-300"
                              : r.dias_mora > 90
                              ? "bg-orange-500/20 text-orange-300"
                              : r.dias_mora > 30
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {r.dias_mora}d
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            tramo?.color ?? ""
                          } ${tramo?.textColor ?? ""}`}
                        >
                          {r.tramo_mora}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminShell>
  );
}
