import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import ClienteRespuestaButtons from "./ClienteRespuestaButtons";

const ESTADO_STEPS = [
  { key: "recibida", label: "Recibida" },
  { key: "en_revision", label: "En revisión" },
  { key: "cotizada", label: "Cotizada" },
  { key: "resultado", label: "Resultado" },
] as const;

// Mapeo de estados internos a pasos del timeline
function getStepIndex(estado: string): number {
  switch (estado) {
    case "proceso":
    case "nueva":
      return 0;
    case "en_revision":
      return 1;
    case "cotizada":
      return 2;
    case "ganada":
    case "perdida":
      return 3;
    default:
      return 0;
  }
}

export default async function CotizacionTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: cotizacion } = await supabase
    .from("cotizaciones")
    .select("id, codigo, nombre, apellidos, compania, nombre_obra, tipo_servicio, estado, created_at, updated_at, total, tracking_token")
    .eq("tracking_token", token)
    .single();

  if (!cotizacion) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="rounded-xl border border-[var(--header-border)] bg-[var(--section-alt)] p-10">
          <h1 className="text-2xl font-bold text-[var(--text-body)]">Cotización no encontrada</h1>
          <p className="mt-3 text-[var(--text-soft)]">
            El enlace que utilizas no corresponde a ninguna cotización activa.
            Verifica que el enlace sea correcto o contacta a nuestro equipo.
          </p>
          <a
            href="mailto:elemec.magallanes@gmail.com"
            className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Contactar a ELEMEC
          </a>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(cotizacion.estado);
  const nombreContacto = [cotizacion.nombre, cotizacion.apellidos].filter(Boolean).join(" ");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Encabezado */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-[var(--text-body)]">Seguimiento de cotización</h1>
        {cotizacion.codigo && (
          <p className="mt-1 text-sm font-mono text-orange-500">{cotizacion.codigo}</p>
        )}
      </div>

      {/* Timeline de estado */}
      <div className="rounded-xl border border-[var(--header-border)] bg-[var(--section-alt)] p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          {ESTADO_STEPS.map((step, i) => {
            const isCompleted = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div key={step.key} className="flex flex-col items-center relative flex-1">
                {/* Línea conectora */}
                {i > 0 && (
                  <div
                    className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                      isCompleted || isCurrent ? "bg-orange-500" : "bg-[var(--header-border)]"
                    }`}
                    style={{ zIndex: 0 }}
                  />
                )}
                {/* Círculo */}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                    isCompleted
                      ? "border-orange-500 bg-orange-500 text-white"
                      : isCurrent
                      ? "border-orange-500 bg-white text-orange-500"
                      : "border-[var(--header-border)] bg-[var(--section-alt)] text-[var(--text-soft)]"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {/* Etiqueta */}
                <span
                  className={`mt-2 text-xs text-center ${
                    isCurrent ? "font-semibold text-orange-500" : "text-[var(--text-soft)]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Resultado final si corresponde */}
        {cotizacion.estado === "ganada" && (
          <div className="rounded-lg border border-green-500/30 bg-green-50 p-4 text-center">
            <p className="text-lg font-bold text-green-700">Cotización aprobada</p>
            <p className="mt-1 text-sm text-green-600">
              Gracias por confiar en ELEMEC. Nuestro equipo se pondrá en contacto para coordinar los próximos pasos.
            </p>
          </div>
        )}

        {cotizacion.estado === "perdida" && (
          <div className="rounded-lg border border-red-300/30 bg-red-50 p-4 text-center">
            <p className="text-lg font-bold text-red-700">Cotización no aceptada</p>
            <p className="mt-1 text-sm text-red-600">
              Lamentamos que esta cotización no haya sido aceptada. Si necesita más información, no dude en contactarnos.
            </p>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="mt-6 rounded-xl border border-[var(--header-border)] bg-[var(--section-alt)] p-6 md:p-8">
        <h2 className="text-sm font-semibold text-[var(--text-body)] mb-4">Resumen</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {nombreContacto && (
            <div>
              <dt className="text-[var(--text-soft)]">Contacto</dt>
              <dd className="mt-0.5 font-medium text-[var(--text-body)]">{nombreContacto}</dd>
            </div>
          )}
          {cotizacion.compania && (
            <div>
              <dt className="text-[var(--text-soft)]">Empresa</dt>
              <dd className="mt-0.5 font-medium text-[var(--text-body)]">{cotizacion.compania}</dd>
            </div>
          )}
          {cotizacion.nombre_obra && (
            <div>
              <dt className="text-[var(--text-soft)]">Proyecto</dt>
              <dd className="mt-0.5 font-medium text-[var(--text-body)]">{cotizacion.nombre_obra}</dd>
            </div>
          )}
          {cotizacion.tipo_servicio && (
            <div>
              <dt className="text-[var(--text-soft)]">Tipo de servicio</dt>
              <dd className="mt-0.5 font-medium text-[var(--text-body)]">{cotizacion.tipo_servicio}</dd>
            </div>
          )}
          {cotizacion.total != null && cotizacion.estado === "cotizada" && (
            <div>
              <dt className="text-[var(--text-soft)]">Monto total</dt>
              <dd className="mt-0.5 font-mono font-bold text-orange-500">
                ${Number(cotizacion.total).toLocaleString("es-CL", { maximumFractionDigits: 0 })}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-[var(--text-soft)]">Fecha de solicitud</dt>
            <dd className="mt-0.5 font-medium text-[var(--text-body)]">
              {new Date(cotizacion.created_at).toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })}
            </dd>
          </div>
          {cotizacion.updated_at && (
            <div>
              <dt className="text-[var(--text-soft)]">Última actualización</dt>
              <dd className="mt-0.5 font-medium text-[var(--text-body)]">
                {new Date(cotizacion.updated_at).toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Botones de acción — solo cuando estado es cotizada */}
      {cotizacion.estado === "cotizada" && (
        <ClienteRespuestaButtons cotizacionId={cotizacion.id} token={token} />
      )}

      {/* Pie */}
      <div className="mt-8 text-center text-xs text-[var(--text-soft)]">
        <p>Si tiene consultas, escribanos a <a href="mailto:elemec.magallanes@gmail.com" className="text-orange-500 underline">elemec.magallanes@gmail.com</a></p>
      </div>
    </div>
  );
}
