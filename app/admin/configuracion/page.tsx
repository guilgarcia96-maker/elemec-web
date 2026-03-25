import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";

type AprobacionRegla = {
  id: string;
  nombre: string;
  prioridad: number;
  monto_desde: number;
  monto_hasta: number | null;
  margen_minimo: number | null;
  requiere_rol: string;
  activo: boolean;
};

type EngineConfig = {
  id: string;
  nombre: string;
  activo: boolean;
  tolerancia_monto: number;
  tolerancia_dias: number;
  peso_monto: number;
  peso_referencia: number;
  peso_fecha: number;
  score_min_auto: number;
  score_min_sugerencia: number;
};

type TramoMora = {
  id: string;
  codigo: string;
  dias_desde: number;
  dias_hasta: number | null;
  orden: number;
  activo: boolean;
};

const CLP = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default async function ConfiguracionPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: reglas }, { data: engines }, { data: tramos }] = await Promise.all([
    supabase
      .from("cotizacion_aprobacion_reglas")
      .select("*")
      .order("prioridad"),
    supabase
      .from("conciliacion_engine_config")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("cobranza_tramos_mora")
      .select("*")
      .order("orden"),
  ]);

  const aprobacionReglas: AprobacionRegla[] = reglas ?? [];
  const engineList: EngineConfig[] = engines ?? [];
  const tramosArr: TramoMora[] = tramos ?? [];
  const activeEngine = engineList.find((e) => e.activo) ?? engineList[0] ?? null;

  return (
    <AdminShell session={session} active="configuracion">
      <main className="px-3 py-4 md:px-6 md:py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="mt-1 text-sm text-gray-400">
            Parámetros del motor de negocio: aprobaciones, conciliación y cobranza.
          </p>
          {aprobacionReglas.length === 0 && engineList.length === 0 && tramosArr.length === 0 && (
            <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-700">
              Ejecuta{" "}
              <code className="font-mono text-orange-500">backoffice-consolidated-schema.sql</code>{" "}
              en el Editor SQL de Supabase para cargar los parámetros de configuración.
            </div>
          )}
        </div>

        {/* ── Reglas de aprobación ── */}
        <section className="mb-8">
          <h2 className="text-base font-bold mb-1">Reglas de aprobación de cotizaciones</h2>
          <p className="text-xs text-gray-400 mb-4">
            Definen qué rol debe aprobar una cotización según monto o margen.
          </p>
          {aprobacionReglas.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-300">
              Sin reglas cargadas.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Prioridad</th>
                    <th className="px-4 py-3">Monto desde</th>
                    <th className="px-4 py-3">Monto hasta</th>
                    <th className="px-4 py-3">Margen mín.</th>
                    <th className="px-4 py-3">Rol requerido</th>
                    <th className="px-4 py-3 text-center">Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {aprobacionReglas.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-700">{r.nombre}</td>
                      <td className="px-4 py-3 text-gray-400">{r.prioridad}</td>
                      <td className="px-4 py-3 text-gray-500">{CLP(r.monto_desde)}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {r.monto_hasta ? CLP(r.monto_hasta) : "sin límite"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {r.margen_minimo != null ? `${r.margen_minimo}%` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-500">
                          {r.requiere_rol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs font-bold ${
                            r.activo ? "text-green-600" : "text-gray-300"
                          }`}
                        >
                          {r.activo ? "✓" : "✗"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Motor de conciliación ── */}
        <section className="mb-8">
          <h2 className="text-base font-bold mb-1">Motor de conciliación</h2>
          <p className="text-xs text-gray-400 mb-4">
            Parámetros del algoritmo deterministico de scoring para matches cartola&nbsp;↔ movimiento.
          </p>
          {!activeEngine ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-300">
              Sin configuración activa.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700 font-mono">{activeEngine.nombre}</p>
                <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  activo
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/10">
                {[
                  { label: "Tolerancia monto",    value: CLP(activeEngine.tolerancia_monto) },
                  { label: "Tolerancia fecha",     value: `${activeEngine.tolerancia_dias} días` },
                  { label: "Peso · Monto",         value: `${activeEngine.peso_monto} pts` },
                  { label: "Peso · Referencia",    value: `${activeEngine.peso_referencia} pts` },
                  { label: "Peso · Fecha",         value: `${activeEngine.peso_fecha} pts` },
                  { label: "Score auto-match",     value: `≥ ${activeEngine.score_min_auto}` },
                  { label: "Score sugerencia",     value: `≥ ${activeEngine.score_min_sugerencia}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#f8f9fb] px-5 py-4">
                    <p className="text-xs text-gray-300 uppercase tracking-wider">{label}</p>
                    <p className="mt-1 text-base font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Tramos de mora ── */}
        <section className="mb-8">
          <h2 className="text-base font-bold mb-1">Tramos de mora (Aging CxC)</h2>
          <p className="text-xs text-gray-400 mb-4">
            Segmentación de cartera vencida utilizada en la vista v_cxc_aging.
          </p>
          {tramosArr.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-300">
              Sin tramos cargados.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {tramosArr.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-xl border px-5 py-4 min-w-[130px] ${
                    t.activo
                      ? "border-orange-200 bg-orange-50"
                      : "border-gray-200 bg-gray-50 opacity-50"
                  }`}
                >
                  <p className="text-lg font-bold text-gray-900 font-mono">{t.codigo}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {t.dias_desde} – {t.dias_hasta != null ? t.dias_hasta : "∞"} días
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-300 uppercase tracking-widest">
                    Orden {t.orden}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Enforcement CLP ── */}
        <section className="mb-8">
          <h2 className="text-base font-bold mb-1">Política de moneda</h2>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Solo CLP · Fase 1</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Constraints activos en: cotizaciones, versiones, órdenes de venta, facturas (cliente y
                  proveedor), pagos y movimientos de conciliación.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "cotizaciones", "cotizacion_versiones", "ordenes_venta",
                "facturas_cliente", "facturas_proveedor", "pagos_cliente",
                "pagos_proveedor", "conciliacion_movimientos",
              ].map((t) => (
                <span
                  key={t}
                  className="rounded border border-green-200 bg-green-50 px-2 py-0.5 font-mono text-xs text-green-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Impuestos mixtos ── */}
        <section>
          <h2 className="text-base font-bold mb-1">Impuestos mixtos (ítems de cotización)</h2>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm">
            <p className="text-gray-500 mb-3">
              Cada ítem en <code className="font-mono text-orange-500">cotizacion_items</code> puede
              clasificarse como:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="font-semibold text-blue-700">afecta</p>
                <p className="mt-1 text-xs text-gray-400">IVA 19% · Campo <code className="font-mono">monto_afecto</code> + <code className="font-mono">monto_iva</code></p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
                <p className="font-semibold text-purple-700">exenta</p>
                <p className="mt-1 text-xs text-gray-400">IVA 0% · Campo <code className="font-mono">monto_exento</code></p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-300">
              Constraint <code className="font-mono">ck_cotizacion_items_iva_consistente</code> impide
              combinaciones inválidas.
            </p>
          </div>
        </section>
      </main>
    </AdminShell>
  );
}
