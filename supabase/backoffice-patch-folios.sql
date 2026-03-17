-- ============================================================
-- ELEMEC BACKOFFICE — Parche: Folios automáticos de cotizaciones
-- ============================================================
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Idempotente: seguro de re-ejecutar, no rompe datos existentes.
-- ============================================================

-- 1) Tabla de secuencias de documentos
create table if not exists public.document_sequences (
  id            uuid    primary key default gen_random_uuid(),
  tipo          text    not null,
  anio          integer not null,
  ultimo_numero integer not null default 0,
  unique (tipo, anio)
);

-- 2) Función generadora de folio: COT-2026-00001, COT-2026-00002, ...
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

-- 3) Columnas faltantes en cotizaciones (ignoradas si ya existen)
alter table public.cotizaciones
  add column if not exists codigo         text,
  add column if not exists comuna         text,
  add column if not exists ciudad         text,
  add column if not exists tipo_documento text,
  add column if not exists sucursal       text,
  add column if not exists giro           text,
  add column if not exists glosa          text,
  add column if not exists vendedor       text,
  add column if not exists lista_precio   text,
  add column if not exists observaciones  text,
  add column if not exists contacto       text,
  add column if not exists nombre_dir     text,
  add column if not exists condicion_venta text,
  add column if not exists fecha_vencimiento date,
  add column if not exists moneda         text not null default 'CLP',
  add column if not exists subtotal       numeric(14,2),
  add column if not exists descuentos     numeric(14,2),
  add column if not exists impuestos      numeric(14,2),
  add column if not exists total          numeric(14,2),
  add column if not exists version_actual integer not null default 1;

-- Índice único en codigo (ignorado si ya existe)
create unique index if not exists uq_cotizaciones_codigo on public.cotizaciones (codigo);

-- Estado 'proceso' (borrador: del cliente o del backoffice a medio completar)
alter table public.cotizaciones drop constraint if exists cotizaciones_estado_check;
alter table public.cotizaciones
  add constraint cotizaciones_estado_check
  check (estado in ('proceso','nueva','en_revision','cotizada','ganada','perdida'));

-- Columnas para distinguir origen del registro y vincular solicitudes
alter table public.cotizaciones
  add column if not exists tipo_registro text not null default 'backoffice',
  add column if not exists solicitud_id  uuid references public.cotizaciones(id);

-- 4) Función y trigger que asigna el folio al insertar
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

-- 5) Tablas cotizacion_versiones y cotizacion_items (si no existen)
create table if not exists public.cotizacion_versiones (
  id                      uuid primary key default gen_random_uuid(),
  cotizacion_id           uuid not null references public.cotizaciones(id) on delete cascade,
  version_num             integer not null,
  estado                  text not null default 'borrador',
  titulo                  text,
  moneda                  text not null default 'CLP',
  subtotal                numeric(14,2) not null default 0,
  descuentos              numeric(14,2) not null default 0,
  impuestos               numeric(14,2) not null default 0,
  total                   numeric(14,2) not null default 0,
  vigencia_dias           integer,
  condiciones_comerciales text,
  notas_internas          text,
  json_snapshot           jsonb not null default '{}'::jsonb,
  creado_por              uuid references public.admin_users(id),
  created_at              timestamptz not null default now(),
  unique (cotizacion_id, version_num)
);
create index if not exists idx_cotizacion_versiones_cotizacion
  on public.cotizacion_versiones (cotizacion_id, version_num desc);

create table if not exists public.cotizacion_items (
  id                    uuid primary key default gen_random_uuid(),
  cotizacion_version_id uuid not null references public.cotizacion_versiones(id) on delete cascade,
  item_num              integer not null,
  descripcion           text not null,
  unidad                text,
  cantidad              numeric(14,4) not null default 1,
  precio_unitario       numeric(14,2) not null default 0,
  descuento_pct         numeric(5,2)  not null default 0,
  impuesto_pct          numeric(5,2)  not null default 19,
  subtotal              numeric(14,2) not null default 0,
  total                 numeric(14,2) not null default 0,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  unique (cotizacion_version_id, item_num)
);
create index if not exists idx_cotizacion_items_version
  on public.cotizacion_items (cotizacion_version_id);

-- 6) RLS: acceso total para service_role (igual que el resto del schema)
alter table public.cotizacion_versiones enable row level security;
alter table public.cotizacion_items     enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='cotizacion_versiones' and policyname='service_role_all') then
    create policy service_role_all on public.cotizacion_versiones for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='cotizacion_items' and policyname='service_role_all') then
    create policy service_role_all on public.cotizacion_items for all to service_role using (true) with check (true);
  end if;
end $$;

-- ============================================================
-- Listo. Las próximas cotizaciones generarán folio automático
-- con formato COT-YYYY-NNNNN (ej: COT-2026-00001).
-- ============================================================
