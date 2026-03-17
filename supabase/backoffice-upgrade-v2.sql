-- ============================================================
-- ELEMEC BACKOFFICE - UPGRADE V2
-- Ejecutar DESPUÉS de haber corrido backoffice-schema.sql
-- Idempotente: seguro re-ejecutar en cualquier momento.
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ── Secuencias de documentos ────────────────────────────────
create table if not exists public.document_sequences (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  anio integer not null,
  ultimo_numero integer not null default 0,
  unique (tipo, anio)
);

create or replace function public.next_document_code(p_tipo text, p_prefix text)
returns text language plpgsql as $$
declare
  v_year integer := extract(year from now())::integer;
  v_next integer;
begin
  insert into public.document_sequences (tipo, anio, ultimo_numero)
  values (p_tipo, v_year, 0) on conflict (tipo, anio) do nothing;
  update public.document_sequences
  set ultimo_numero = ultimo_numero + 1
  where tipo = p_tipo and anio = v_year
  returning ultimo_numero into v_next;
  return format('%s-%s-%s', p_prefix, v_year, lpad(v_next::text, 5, '0'));
end; $$;

-- ── Roles ───────────────────────────────────────────────────
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text,
  created_at timestamptz not null default now()
);
insert into public.roles (codigo, nombre, descripcion) values
  ('admin',        'Administrador', 'Acceso total'),
  ('ventas',       'Ventas',        'Gestión comercial y cotizaciones'),
  ('operaciones',  'Operaciones',   'Ejecución y seguimiento técnico'),
  ('rrhh',         'RRHH',          'Gestión de postulaciones y talento'),
  ('contabilidad', 'Contabilidad',  'Finanzas, conciliación y cierres')
on conflict (codigo) do nothing;

-- ── Permisos por usuario ────────────────────────────────────
create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.admin_users(id) on delete cascade,
  modulo text not null,
  accion text not null,
  allowed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, modulo, accion)
);

-- ── Contactos de clientes ───────────────────────────────────
create table if not exists public.cliente_contactos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nombre text not null,
  cargo text,
  email citext,
  telefono text,
  es_principal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cliente_contactos_cliente on public.cliente_contactos (cliente_id);
create or replace trigger trg_cliente_contactos_updated_at
  before update on public.cliente_contactos
  for each row execute function public.set_updated_at();

-- ── Catálogo de servicios ───────────────────────────────────
create table if not exists public.servicios_catalogo (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_servicios_catalogo_updated_at
  before update on public.servicios_catalogo
  for each row execute function public.set_updated_at();

create table if not exists public.servicios_alcances (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references public.servicios_catalogo(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (servicio_id, codigo)
);

-- ── Columnas enterprise en cotizaciones ─────────────────────
alter table public.cotizaciones
  add column if not exists codigo text,
  add column if not exists cliente_id uuid,
  add column if not exists contacto_id uuid,
  add column if not exists ejecutivo_id uuid,
  add column if not exists prioridad text,
  add column if not exists moneda text default 'CLP',
  add column if not exists subtotal numeric(14,2),
  add column if not exists descuentos numeric(14,2),
  add column if not exists impuestos numeric(14,2),
  add column if not exists total numeric(14,2),
  add column if not exists margen_estimado numeric(5,2),
  add column if not exists probabilidad_cierre integer,
  add column if not exists origen text,
  add column if not exists canal text,
  add column if not exists fecha_validez date,
  add column if not exists fecha_cierre_estimada date,
  add column if not exists motivo_perdida text,
  add column if not exists aprobado_por uuid,
  add column if not exists aprobado_at timestamptz,
  add column if not exists version_actual integer not null default 1;

-- FK cotizaciones (idempotente)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cotizaciones_cliente_fk') then
    alter table public.cotizaciones add constraint cotizaciones_cliente_fk
      foreign key (cliente_id) references public.clientes(id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cotizaciones_contacto_fk') then
    alter table public.cotizaciones add constraint cotizaciones_contacto_fk
      foreign key (contacto_id) references public.cliente_contactos(id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cotizaciones_ejecutivo_fk') then
    alter table public.cotizaciones add constraint cotizaciones_ejecutivo_fk
      foreign key (ejecutivo_id) references public.admin_users(id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cotizaciones_aprobado_por_fk') then
    alter table public.cotizaciones add constraint cotizaciones_aprobado_por_fk
      foreign key (aprobado_por) references public.admin_users(id);
  end if;
end $$;

create unique index if not exists uq_cotizaciones_codigo  on public.cotizaciones (codigo);
create index if not exists idx_cotizaciones_cliente     on public.cotizaciones (cliente_id);
create index if not exists idx_cotizaciones_ejecutivo   on public.cotizaciones (ejecutivo_id);

create or replace trigger trg_cotizaciones_updated_at
  before update on public.cotizaciones
  for each row execute function public.set_updated_at();

create or replace function public.set_cotizacion_code()
returns trigger language plpgsql as $$
begin
  if new.codigo is null or btrim(new.codigo) = '' then
    new.codigo := public.next_document_code('cotizacion', 'COT');
  end if;
  return new;
end; $$;
create or replace trigger trg_cotizaciones_set_code
  before insert on public.cotizaciones
  for each row execute function public.set_cotizacion_code();

-- ── Versiones de cotización ──────────────────────────────────
create table if not exists public.cotizacion_versiones (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references public.cotizaciones(id) on delete cascade,
  version_num integer not null,
  estado text not null default 'borrador',
  titulo text,
  alcance_resumen text,
  moneda text not null default 'CLP',
  subtotal numeric(14,2) not null default 0,
  descuentos numeric(14,2) not null default 0,
  impuestos numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  vigencia_dias integer,
  condiciones_comerciales text,
  notas_internas text,
  json_snapshot jsonb not null default '{}'::jsonb,
  creado_por uuid references public.admin_users(id),
  created_at timestamptz not null default now(),
  unique (cotizacion_id, version_num)
);
create index if not exists idx_cotizacion_versiones_cotizacion
  on public.cotizacion_versiones (cotizacion_id, version_num desc);

-- ── Ítems de versión ────────────────────────────────────────
create table if not exists public.cotizacion_items (
  id uuid primary key default gen_random_uuid(),
  cotizacion_version_id uuid not null references public.cotizacion_versiones(id) on delete cascade,
  item_num integer not null,
  servicio_id uuid references public.servicios_catalogo(id),
  alcance_id uuid references public.servicios_alcances(id),
  sku text,
  descripcion text not null,
  unidad text,
  cantidad numeric(14,4) not null default 1,
  precio_unitario numeric(14,2) not null default 0,
  descuento_pct numeric(5,2) not null default 0,
  impuesto_pct numeric(5,2) not null default 19,
  subtotal numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (cotizacion_version_id, item_num)
);
create index if not exists idx_cotizacion_items_version on public.cotizacion_items (cotizacion_version_id);

-- ── Reglas y flujo de aprobación ────────────────────────────
create table if not exists public.cotizacion_aprobacion_reglas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  prioridad integer not null default 100,
  monto_desde numeric(14,2) not null default 0,
  monto_hasta numeric(14,2),
  margen_minimo numeric(5,2),
  requiere_rol text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.cotizacion_aprobaciones (
  id uuid primary key default gen_random_uuid(),
  cotizacion_version_id uuid not null references public.cotizacion_versiones(id) on delete cascade,
  nivel integer not null,
  regla_id uuid references public.cotizacion_aprobacion_reglas(id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente','aprobada','rechazada','omitida')),
  aprobado_por uuid references public.admin_users(id),
  aprobado_at timestamptz,
  comentario text,
  created_at timestamptz not null default now(),
  unique (cotizacion_version_id, nivel)
);

-- ── Tareas de cotización ────────────────────────────────────
create table if not exists public.cotizacion_tareas (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references public.cotizaciones(id) on delete cascade,
  titulo text not null,
  descripcion text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','en_progreso','completada','cancelada')),
  prioridad text not null default 'media'
    check (prioridad in ('baja','media','alta','critica')),
  asignado_a uuid references public.admin_users(id),
  vencimiento_at timestamptz,
  completada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_cotizacion_tareas_updated_at
  before update on public.cotizacion_tareas
  for each row execute function public.set_updated_at();

-- ── Ciclo comercial: OV / Facturas / Pagos cliente ──────────
create table if not exists public.ordenes_venta (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  cotizacion_id uuid references public.cotizaciones(id),
  cliente_id uuid not null references public.clientes(id),
  fecha_emision date not null default current_date,
  fecha_compromiso date,
  estado text not null default 'abierta'
    check (estado in ('abierta','parcial','cerrada','cancelada')),
  moneda text not null default 'CLP',
  subtotal numeric(14,2) not null default 0,
  impuestos numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  observaciones text,
  created_by uuid references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace function public.set_orden_venta_code()
returns trigger language plpgsql as $$
begin
  if new.codigo is null or btrim(new.codigo) = '' then
    new.codigo := public.next_document_code('orden_venta','OV');
  end if; return new;
end; $$;
create or replace trigger trg_ordenes_venta_set_code
  before insert on public.ordenes_venta
  for each row execute function public.set_orden_venta_code();
create or replace trigger trg_ordenes_venta_updated_at
  before update on public.ordenes_venta
  for each row execute function public.set_updated_at();

create table if not exists public.ordenes_venta_items (
  id uuid primary key default gen_random_uuid(),
  orden_venta_id uuid not null references public.ordenes_venta(id) on delete cascade,
  item_num integer not null,
  descripcion text not null,
  unidad text,
  cantidad numeric(14,4) not null default 1,
  precio_unitario numeric(14,2) not null default 0,
  descuento_pct numeric(5,2) not null default 0,
  impuesto_pct numeric(5,2) not null default 19,
  subtotal numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  unique (orden_venta_id, item_num)
);

create table if not exists public.facturas_cliente (
  id uuid primary key default gen_random_uuid(),
  numero text unique,
  orden_venta_id uuid references public.ordenes_venta(id),
  cotizacion_id uuid references public.cotizaciones(id),
  cliente_id uuid not null references public.clientes(id),
  fecha_emision date not null,
  fecha_vencimiento date,
  moneda text not null default 'CLP',
  subtotal numeric(14,2) not null default 0,
  impuestos numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  saldo numeric(14,2) not null default 0,
  estado text not null default 'emitida'
    check (estado in ('borrador','emitida','parcial','pagada','vencida','anulada')),
  metodo_envio text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_facturas_cliente_estado     on public.facturas_cliente (estado);
create index if not exists idx_facturas_cliente_vencimiento on public.facturas_cliente (fecha_vencimiento);
create or replace trigger trg_facturas_cliente_updated_at
  before update on public.facturas_cliente
  for each row execute function public.set_updated_at();

create table if not exists public.factura_cliente_items (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas_cliente(id) on delete cascade,
  item_num integer not null,
  descripcion text not null,
  cantidad numeric(14,4) not null default 1,
  precio_unitario numeric(14,2) not null default 0,
  impuesto_pct numeric(5,2) not null default 19,
  subtotal numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  unique (factura_id, item_num)
);

create table if not exists public.pagos_cliente (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  cliente_id uuid not null references public.clientes(id),
  fecha_pago date not null,
  moneda text not null default 'CLP',
  monto_total numeric(14,2) not null,
  medio_pago text,
  referencia text,
  estado text not null default 'registrado'
    check (estado in ('registrado','aplicado','revertido')),
  notas text,
  registrado_por uuid references public.admin_users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.pago_cliente_aplicaciones (
  id uuid primary key default gen_random_uuid(),
  pago_id uuid not null references public.pagos_cliente(id) on delete cascade,
  factura_id uuid not null references public.facturas_cliente(id) on delete cascade,
  monto_aplicado numeric(14,2) not null,
  created_at timestamptz not null default now(),
  unique (pago_id, factura_id)
);

-- ── ATS: Vacantes ───────────────────────────────────────────
create table if not exists public.vacantes (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  titulo text not null,
  area text not null,
  ubicacion text,
  modalidad text,
  tipo_contrato text,
  seniority text,
  descripcion text,
  requisitos text,
  renta_min numeric(14,2),
  renta_max numeric(14,2),
  estado text not null default 'abierta'
    check (estado in ('borrador','abierta','pausada','cerrada','cancelada')),
  publicada_at timestamptz,
  cierre_at timestamptz,
  responsable_id uuid references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_vacantes_updated_at
  before update on public.vacantes
  for each row execute function public.set_updated_at();

-- ── Columnas enterprise en postulaciones ────────────────────
alter table public.postulaciones
  add column if not exists codigo text,
  add column if not exists vacante_id uuid,
  add column if not exists rut text,
  add column if not exists fecha_nacimiento date,
  add column if not exists area text,
  add column if not exists experiencia_anos integer,
  add column if not exists disponibilidad text,
  add column if not exists pretension_renta numeric(14,2),
  add column if not exists ciudad text,
  add column if not exists region text,
  add column if not exists linkedin_url text,
  add column if not exists portfolio_url text,
  add column if not exists fuente text,
  add column if not exists score_total numeric(5,2),
  add column if not exists consentimiento_datos boolean not null default false;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'postulaciones_vacante_fk') then
    alter table public.postulaciones add constraint postulaciones_vacante_fk
      foreign key (vacante_id) references public.vacantes(id);
  end if;
end $$;

create index if not exists idx_postulaciones_vacante on public.postulaciones (vacante_id);
create index if not exists idx_postulaciones_email   on public.postulaciones (email);

-- ── ATS: Etapas, Entrevistas, Evaluaciones, Ofertas ─────────
create table if not exists public.postulacion_etapas (
  id uuid primary key default gen_random_uuid(),
  postulacion_id uuid not null references public.postulaciones(id) on delete cascade,
  etapa text not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','en_progreso','completada','omitida')),
  fecha_inicio timestamptz,
  fecha_fin timestamptz,
  responsable_id uuid references public.admin_users(id),
  observacion text,
  created_at timestamptz not null default now()
);

create table if not exists public.postulacion_entrevistas (
  id uuid primary key default gen_random_uuid(),
  postulacion_id uuid not null references public.postulaciones(id) on delete cascade,
  tipo text not null check (tipo in ('telefonica','tecnica','psicolaboral','gerencial','cliente')),
  estado text not null default 'programada'
    check (estado in ('programada','realizada','cancelada','reprogramada')),
  entrevistador_id uuid references public.admin_users(id),
  fecha_programada timestamptz,
  duracion_min integer,
  resultado text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_postulacion_entrevistas_updated_at
  before update on public.postulacion_entrevistas
  for each row execute function public.set_updated_at();

create table if not exists public.postulacion_evaluaciones (
  id uuid primary key default gen_random_uuid(),
  postulacion_id uuid not null references public.postulaciones(id) on delete cascade,
  entrevista_id uuid references public.postulacion_entrevistas(id) on delete set null,
  evaluador_id uuid references public.admin_users(id),
  competencia text not null,
  puntaje numeric(5,2) not null,
  comentario text,
  created_at timestamptz not null default now()
);

create table if not exists public.postulacion_ofertas (
  id uuid primary key default gen_random_uuid(),
  postulacion_id uuid not null references public.postulaciones(id) on delete cascade,
  estado text not null default 'borrador'
    check (estado in ('borrador','enviada','aceptada','rechazada','vencida')),
  sueldo_base numeric(14,2),
  bono numeric(14,2),
  fecha_ingreso date,
  fecha_vencimiento date,
  terms text,
  enviada_at timestamptz,
  respondida_at timestamptz,
  created_by uuid references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_postulacion_ofertas_updated_at
  before update on public.postulacion_ofertas
  for each row execute function public.set_updated_at();

-- ── Plan de cuentas / Centros de costo / Períodos ───────────
create table if not exists public.plan_cuentas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  tipo text not null check (tipo in ('activo','pasivo','patrimonio','ingreso','gasto','costo')),
  naturaleza text not null check (naturaleza in ('deudora','acreedora')),
  acepta_movimientos boolean not null default true,
  parent_id uuid references public.plan_cuentas(id),
  nivel integer,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_plan_cuentas_updated_at
  before update on public.plan_cuentas
  for each row execute function public.set_updated_at();

create table if not exists public.centros_costo (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_centros_costo_updated_at
  before update on public.centros_costo
  for each row execute function public.set_updated_at();

create table if not exists public.periodos_contables (
  id uuid primary key default gen_random_uuid(),
  anio integer not null,
  mes integer not null check (mes between 1 and 12),
  fecha_inicio date not null,
  fecha_fin date not null,
  estado text not null default 'abierto' check (estado in ('abierto','cerrado','bloqueado')),
  unique (anio, mes)
);

-- ── Asientos contables ───────────────────────────────────────
create table if not exists public.asientos_contables (
  id uuid primary key default gen_random_uuid(),
  numero text unique,
  fecha date not null,
  periodo_id uuid references public.periodos_contables(id),
  origen text not null,
  referencia_tipo text,
  referencia_id uuid,
  descripcion text,
  estado text not null default 'borrador'
    check (estado in ('borrador','contabilizado','anulado')),
  total_debe numeric(14,2) not null default 0,
  total_haber numeric(14,2) not null default 0,
  creado_por uuid references public.admin_users(id),
  contabilizado_por uuid references public.admin_users(id),
  contabilizado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_asientos_contables_updated_at
  before update on public.asientos_contables
  for each row execute function public.set_updated_at();

create table if not exists public.asiento_detalles (
  id uuid primary key default gen_random_uuid(),
  asiento_id uuid not null references public.asientos_contables(id) on delete cascade,
  line_num integer not null,
  cuenta_id uuid not null references public.plan_cuentas(id),
  centro_costo_id uuid references public.centros_costo(id),
  tercero_tipo text,
  tercero_id uuid,
  glosa text,
  debe numeric(14,2) not null default 0,
  haber numeric(14,2) not null default 0,
  moneda text not null default 'CLP',
  tipo_cambio numeric(14,6),
  created_at timestamptz not null default now(),
  unique (asiento_id, line_num)
);
create index if not exists idx_asiento_detalles_asiento on public.asiento_detalles (asiento_id);

-- ── Cuentas bancarias / Cartolas ────────────────────────────
create table if not exists public.cuentas_bancarias (
  id uuid primary key default gen_random_uuid(),
  banco text not null,
  tipo_cuenta text not null,
  numero_cuenta text not null,
  moneda text not null default 'CLP',
  titular text,
  rut_titular text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (banco, numero_cuenta)
);

create table if not exists public.cartolas_bancarias (
  id uuid primary key default gen_random_uuid(),
  cuenta_bancaria_id uuid not null references public.cuentas_bancarias(id),
  periodo_desde date,
  periodo_hasta date,
  saldo_inicial numeric(14,2),
  saldo_final numeric(14,2),
  origen_archivo text,
  hash_archivo text,
  imported_by uuid references public.admin_users(id),
  imported_at timestamptz not null default now(),
  estado text not null default 'importada'
    check (estado in ('importada','en_conciliacion','conciliada','cerrada'))
);

create table if not exists public.cartola_movimientos (
  id uuid primary key default gen_random_uuid(),
  cartola_id uuid not null references public.cartolas_bancarias(id) on delete cascade,
  fecha date not null,
  descripcion text,
  referencia text,
  monto numeric(14,2) not null,
  tipo text not null check (tipo in ('abono','cargo')),
  saldo numeric(14,2),
  contraparte text,
  hash_unico text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','conciliado','observado','descartado')),
  created_at timestamptz not null default now(),
  unique (cartola_id, hash_unico)
);
create index if not exists idx_cartola_movimientos_estado on public.cartola_movimientos (estado);

-- ── Conciliación: matches ────────────────────────────────────
create table if not exists public.conciliacion_matches (
  id uuid primary key default gen_random_uuid(),
  cartola_movimiento_id uuid not null references public.cartola_movimientos(id) on delete cascade,
  conciliacion_movimiento_id uuid not null references public.conciliacion_movimientos(id) on delete cascade,
  tipo_match text not null check (tipo_match in ('exacto','monto','referencia','manual')),
  score numeric(5,2),
  monto_aplicado numeric(14,2) not null,
  reconciliado_por uuid references public.admin_users(id),
  reconciliado_at timestamptz not null default now(),
  observacion text,
  unique (cartola_movimiento_id, conciliacion_movimiento_id)
);

-- ── Proveedores / CxP ───────────────────────────────────────
create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  rut text,
  razon_social text not null,
  giro text,
  email citext,
  telefono text,
  direccion text,
  region text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_proveedores_updated_at
  before update on public.proveedores
  for each row execute function public.set_updated_at();

create table if not exists public.facturas_proveedor (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores(id),
  folio text,
  fecha_emision date not null,
  fecha_vencimiento date,
  moneda text not null default 'CLP',
  neto numeric(14,2) not null default 0,
  iva numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  saldo numeric(14,2) not null default 0,
  estado text not null default 'emitida'
    check (estado in ('emitida','parcial','pagada','vencida','anulada')),
  centro_costo_id uuid references public.centros_costo(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (proveedor_id, folio)
);
create or replace trigger trg_facturas_proveedor_updated_at
  before update on public.facturas_proveedor
  for each row execute function public.set_updated_at();

create table if not exists public.pagos_proveedor (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores(id),
  fecha_pago date not null,
  monto numeric(14,2) not null,
  moneda text not null default 'CLP',
  medio_pago text,
  referencia text,
  estado text not null default 'registrado'
    check (estado in ('registrado','aplicado','revertido')),
  created_at timestamptz not null default now()
);

create table if not exists public.pago_proveedor_aplicaciones (
  id uuid primary key default gen_random_uuid(),
  pago_id uuid not null references public.pagos_proveedor(id) on delete cascade,
  factura_proveedor_id uuid not null references public.facturas_proveedor(id) on delete cascade,
  monto_aplicado numeric(14,2) not null,
  created_at timestamptz not null default now(),
  unique (pago_id, factura_proveedor_id)
);

-- ── Eventos webhook ──────────────────────────────────────────
create table if not exists public.eventos_webhook (
  id uuid primary key default gen_random_uuid(),
  origen text not null,
  tipo_evento text not null,
  payload jsonb not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','procesado','error')),
  intentos integer not null default 0,
  ultimo_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

-- ── Storage bucket ───────────────────────────────────────────
insert into storage.buckets (id, name, public)
select 'backoffice-docs', 'backoffice-docs', false
where not exists (select 1 from storage.buckets where id = 'backoffice-docs');

-- ============================================================
-- PARAMETRIZACION FINAL (NEGOCIO)
-- ============================================================

-- 1) Regla de aprobación > 50MM CLP
insert into public.cotizacion_aprobacion_reglas
  (nombre, prioridad, monto_desde, monto_hasta, margen_minimo, requiere_rol, activo)
select 'Aprobacion admin > 50MM CLP', 10, 50000000, null, null, 'admin', true
where not exists (
  select 1 from public.cotizacion_aprobacion_reglas where nombre = 'Aprobacion admin > 50MM CLP'
);

-- 2) Impuestos mixtos en cotizacion_items
alter table public.cotizacion_items
  add column if not exists tipo_impuesto text not null default 'afecta',
  add column if not exists monto_exento  numeric(14,2) not null default 0,
  add column if not exists monto_afecto  numeric(14,2) not null default 0,
  add column if not exists monto_iva     numeric(14,2) not null default 0;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ck_cotizacion_items_tipo_impuesto') then
    alter table public.cotizacion_items
      add constraint ck_cotizacion_items_tipo_impuesto check (tipo_impuesto in ('afecta','exenta'));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ck_cotizacion_items_iva_consistente') then
    alter table public.cotizacion_items
      add constraint ck_cotizacion_items_iva_consistente check (
        (tipo_impuesto = 'afecta' and impuesto_pct in (19, 19.00))
        or (tipo_impuesto = 'exenta' and impuesto_pct = 0)
      );
  end if;
end $$;

-- 3) Solo CLP (enforcement)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ck_cotizaciones_moneda_clp') then
    alter table public.cotizaciones add constraint ck_cotizaciones_moneda_clp check (moneda = 'CLP');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_cotizacion_versiones_moneda_clp') then
    alter table public.cotizacion_versiones add constraint ck_cotizacion_versiones_moneda_clp check (moneda = 'CLP');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_ordenes_venta_moneda_clp') then
    alter table public.ordenes_venta add constraint ck_ordenes_venta_moneda_clp check (moneda = 'CLP');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_facturas_cliente_moneda_clp') then
    alter table public.facturas_cliente add constraint ck_facturas_cliente_moneda_clp check (moneda = 'CLP');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_pagos_cliente_moneda_clp') then
    alter table public.pagos_cliente add constraint ck_pagos_cliente_moneda_clp check (moneda = 'CLP');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_conciliacion_movimientos_moneda_clp') then
    alter table public.conciliacion_movimientos add constraint ck_conciliacion_movimientos_moneda_clp check (moneda = 'CLP');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_facturas_proveedor_moneda_clp') then
    alter table public.facturas_proveedor add constraint ck_facturas_proveedor_moneda_clp check (moneda = 'CLP');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_pagos_proveedor_moneda_clp') then
    alter table public.pagos_proveedor add constraint ck_pagos_proveedor_moneda_clp check (moneda = 'CLP');
  end if;
end $$;

-- 4) Aging CxC
create table if not exists public.cobranza_tramos_mora (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  dias_desde integer not null,
  dias_hasta integer,
  orden integer not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.cobranza_tramos_mora (codigo, dias_desde, dias_hasta, orden)
select '0-30', 0, 30, 1 where not exists (select 1 from public.cobranza_tramos_mora where codigo = '0-30');
insert into public.cobranza_tramos_mora (codigo, dias_desde, dias_hasta, orden)
select '31-90', 31, 89, 2 where not exists (select 1 from public.cobranza_tramos_mora where codigo = '31-90');
insert into public.cobranza_tramos_mora (codigo, dias_desde, dias_hasta, orden)
select '90-180', 90, 180, 3 where not exists (select 1 from public.cobranza_tramos_mora where codigo = '90-180');
insert into public.cobranza_tramos_mora (codigo, dias_desde, dias_hasta, orden)
select '180+', 181, null, 4 where not exists (select 1 from public.cobranza_tramos_mora where codigo = '180+');

create or replace view public.v_cxc_aging as
select
  f.id as factura_id, f.numero, f.cliente_id, c.razon_social,
  f.fecha_emision, f.fecha_vencimiento, f.total, f.saldo,
  greatest((current_date - coalesce(f.fecha_vencimiento, current_date)), 0)::integer as dias_mora,
  case
    when greatest((current_date - coalesce(f.fecha_vencimiento, current_date)), 0) between 0 and 30   then '0-30'
    when greatest((current_date - coalesce(f.fecha_vencimiento, current_date)), 0) between 31 and 89  then '31-90'
    when greatest((current_date - coalesce(f.fecha_vencimiento, current_date)), 0) between 90 and 180 then '90-180'
    else '180+'
  end as tramo_mora
from public.facturas_cliente f
left join public.clientes c on c.id = f.cliente_id
where f.estado in ('emitida','parcial','vencida') and f.saldo > 0;

-- 5) Motor de conciliación
create table if not exists public.conciliacion_engine_config (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  activo boolean not null default true,
  tolerancia_monto numeric(14,2) not null default 500,
  tolerancia_dias integer not null default 2,
  peso_monto integer not null default 50,
  peso_referencia integer not null default 30,
  peso_fecha integer not null default 20,
  score_min_auto numeric(5,2) not null default 85,
  score_min_sugerencia numeric(5,2) not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_conciliacion_engine_config_updated_at
  before update on public.conciliacion_engine_config
  for each row execute function public.set_updated_at();

insert into public.conciliacion_engine_config
  (nombre, activo, tolerancia_monto, tolerancia_dias, peso_monto, peso_referencia, peso_fecha, score_min_auto, score_min_sugerencia)
select 'DEFAULT_V1', true, 500, 2, 50, 30, 20, 85, 60
where not exists (select 1 from public.conciliacion_engine_config where nombre = 'DEFAULT_V1');

create or replace function public.conciliacion_score_candidato(
  p_monto_bank numeric, p_monto_int numeric,
  p_ref_bank text, p_ref_int text,
  p_fecha_bank date, p_fecha_int date
)
returns numeric language plpgsql as $$
declare
  cfg record;
  v_score numeric := 0;
  v_diff_monto numeric := abs(coalesce(p_monto_bank,0) - coalesce(p_monto_int,0));
  v_diff_dias integer := abs(coalesce(p_fecha_bank, current_date) - coalesce(p_fecha_int, current_date));
  v_ref_match boolean := false;
begin
  select * into cfg from public.conciliacion_engine_config
  where activo = true order by created_at desc limit 1;
  if cfg is null then return 0; end if;
  if v_diff_monto <= cfg.tolerancia_monto then v_score := v_score + cfg.peso_monto; end if;
  if coalesce(p_ref_bank,'') <> '' and coalesce(p_ref_int,'') <> ''
     and position(lower(p_ref_int) in lower(p_ref_bank)) > 0 then
    v_ref_match := true;
  end if;
  if v_ref_match then v_score := v_score + cfg.peso_referencia; end if;
  if v_diff_dias <= cfg.tolerancia_dias then v_score := v_score + cfg.peso_fecha; end if;
  return least(v_score, 100);
end; $$;
