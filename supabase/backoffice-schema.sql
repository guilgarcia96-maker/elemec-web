-- ============================================================
-- ELEMEC Backoffice — Schema Completo
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Idempotente: seguro de re-ejecutar sobre base existente
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Trigger helper: updated_at ─────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Secuencias de documentos (folios) ──────────────────────
create table if not exists public.document_sequences (
  id           uuid    primary key default gen_random_uuid(),
  tipo         text    not null,
  anio         integer not null,
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

-- ─── admin_users ────────────────────────────────────────────
create table if not exists public.admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  nombre        text not null,
  password_hash text,
  role          text not null default 'ventas'
                  check (role in ('admin','ventas','operaciones','rrhh','contabilidad')),
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── clientes ───────────────────────────────────────────────
create table if not exists public.clientes (
  id                  uuid primary key default gen_random_uuid(),
  razon_social        text not null,
  rut                 text,
  giro                text,
  email               text,
  telefono            text,
  contacto_principal  text,
  direccion           text,
  region              text,
  notas               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── cotizaciones ───────────────────────────────────────────
create table if not exists public.cotizaciones (
  id                    uuid primary key default gen_random_uuid(),
  codigo                text unique,
  nombre                text,
  apellidos             text,
  compania              text,
  rut_empresa           text,
  cargo                 text,
  email                 text,
  movil                 text,
  telefono              text,
  nombre_obra           text,
  fecha_inicio          text,
  direccion             text,
  region                text,
  tipo_obra             text,
  tipo_servicio         text,
  comentarios           text,
  notas                 text,
  -- columnas de dirección extendidas
  comuna                text,
  ciudad                text,
  -- columnas de gestión comercial
  tipo_documento        text,
  sucursal              text,
  giro                  text,
  glosa                 text,
  vendedor              text,
  lista_precio          text,
  observaciones         text,
  contacto              text,
  nombre_dir            text,
  estado                text not null default 'nueva'
                          check (estado in ('proceso','nueva','en_revision','cotizada','ganada','perdida')),
  tipo_registro         text not null default 'backoffice',
  solicitud_id          uuid references public.cotizaciones(id),
  -- columnas backoffice extendidas
  cliente_id            uuid references public.clientes(id),
  ejecutivo_id          uuid references public.admin_users(id),
  monto_estimado        numeric(14,2),
  prioridad             text,
  origen                text,
  moneda                text not null default 'CLP',
  subtotal              numeric(14,2),
  descuentos            numeric(14,2),
  impuestos             numeric(14,2),
  total                 numeric(14,2),
  fecha_validez         date,
  fecha_cierre_estimada date,
  motivo_perdida        text,
  version_actual        integer not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── cotizacion_seguimientos ─────────────────────────────────
create table if not exists public.cotizacion_seguimientos (
  id              uuid primary key default gen_random_uuid(),
  cotizacion_id   uuid not null references public.cotizaciones(id) on delete cascade,
  actor_id        uuid references public.admin_users(id),
  tipo            text not null,
  detalle         text,
  estado_anterior text,
  estado_nuevo    text,
  created_at      timestamptz not null default now()
);

-- ─── cotizacion_adjuntos ─────────────────────────────────────
create table if not exists public.cotizacion_adjuntos (
  id              uuid primary key default gen_random_uuid(),
  cotizacion_id   uuid not null references public.cotizaciones(id) on delete cascade,
  nombre_archivo  text not null,
  mime_type       text,
  tamano_bytes    bigint,
  storage_bucket  text not null default 'backoffice-docs',
  storage_path    text not null,
  descripcion     text,
  subido_por      uuid references public.admin_users(id),
  created_at      timestamptz not null default now()
);

-- ─── postulaciones ───────────────────────────────────────────
create table if not exists public.postulaciones (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  apellidos         text,
  email             text,
  telefono          text,
  cargo_postulado   text,
  area              text,
  experiencia_anos  integer,
  disponibilidad    text,
  ciudad            text,
  region            text,
  estado            text not null default 'recibida'
                      check (estado in ('recibida','en_revision','entrevista','aprobada','rechazada','contratada')),
  resumen           text,
  notas             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── postulacion_adjuntos ────────────────────────────────────
create table if not exists public.postulacion_adjuntos (
  id              uuid primary key default gen_random_uuid(),
  postulacion_id  uuid not null references public.postulaciones(id) on delete cascade,
  nombre_archivo  text not null,
  mime_type       text,
  tamano_bytes    bigint,
  storage_bucket  text not null default 'backoffice-docs',
  storage_path    text not null,
  tipo            text not null default 'cv',
  subido_por      uuid references public.admin_users(id),
  created_at      timestamptz not null default now()
);

-- ─── conciliacion_movimientos ────────────────────────────────
create table if not exists public.conciliacion_movimientos (
  id            uuid primary key default gen_random_uuid(),
  fecha         date not null,
  tipo          text not null check (tipo in ('ingreso','egreso')),
  categoria     text not null,
  subcategoria  text,
  descripcion   text,
  referencia    text,
  centro_costo  text,
  monto         numeric(14,2) not null,
  moneda        text not null default 'CLP',
  estado        text not null default 'pendiente'
                  check (estado in ('pendiente','conciliado','observado')),
  cotizacion_id uuid references public.cotizaciones(id),
  cliente_id    uuid references public.clientes(id),
  creado_por    uuid references public.admin_users(id),
  notas         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── conciliacion_adjuntos ───────────────────────────────────
create table if not exists public.conciliacion_adjuntos (
  id              uuid primary key default gen_random_uuid(),
  movimiento_id   uuid not null references public.conciliacion_movimientos(id) on delete cascade,
  nombre_archivo  text not null,
  mime_type       text,
  tamano_bytes    bigint,
  storage_bucket  text not null default 'backoffice-docs',
  storage_path    text not null,
  tipo            text not null default 'respaldo',
  subido_por      uuid references public.admin_users(id),
  created_at      timestamptz not null default now()
);

-- ─── informes ────────────────────────────────────────────────
create table if not exists public.informes (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,
  tipo            text not null,
  cliente_id      uuid references public.clientes(id),
  cotizacion_id   uuid references public.cotizaciones(id),
  responsable_id  uuid references public.admin_users(id),
  resumen         text,
  estado          text not null default 'borrador'
                    check (estado in ('borrador','emitido','aprobado','archivado')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── informe_adjuntos ────────────────────────────────────────
create table if not exists public.informe_adjuntos (
  id              uuid primary key default gen_random_uuid(),
  informe_id      uuid not null references public.informes(id) on delete cascade,
  nombre_archivo  text not null,
  mime_type       text,
  tamano_bytes    bigint,
  storage_bucket  text not null default 'backoffice-docs',
  storage_path    text not null,
  subido_por      uuid references public.admin_users(id),
  created_at      timestamptz not null default now()
);

-- ─── audit_log ───────────────────────────────────────────────
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  entidad     text not null,
  entidad_id  uuid,
  accion      text not null,
  actor_id    uuid references public.admin_users(id),
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ─── Triggers updated_at ─────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_admin_users_updated_at') then
    create trigger trg_admin_users_updated_at
      before update on public.admin_users
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_clientes_updated_at') then
    create trigger trg_clientes_updated_at
      before update on public.clientes
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_cotizaciones_updated_at') then
    create trigger trg_cotizaciones_updated_at
      before update on public.cotizaciones
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- ─── Trigger de folio automático para cotizaciones ───────────
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

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_postulaciones_updated_at') then
    create trigger trg_postulaciones_updated_at
      before update on public.postulaciones
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_conciliacion_updated_at') then
    create trigger trg_conciliacion_updated_at
      before update on public.conciliacion_movimientos
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_informes_updated_at') then
    create trigger trg_informes_updated_at
      before update on public.informes
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- ─── cotizacion_versiones ───────────────────────────────────
create table if not exists public.cotizacion_versiones (
  id                     uuid primary key default gen_random_uuid(),
  cotizacion_id          uuid not null references public.cotizaciones(id) on delete cascade,
  version_num            integer not null,
  estado                 text not null default 'borrador',
  titulo                 text,
  moneda                 text not null default 'CLP',
  subtotal               numeric(14,2) not null default 0,
  descuentos             numeric(14,2) not null default 0,
  impuestos              numeric(14,2) not null default 0,
  total                  numeric(14,2) not null default 0,
  vigencia_dias          integer,
  condiciones_comerciales text,
  notas_internas         text,
  json_snapshot          jsonb not null default '{}'::jsonb,
  creado_por             uuid references public.admin_users(id),
  created_at             timestamptz not null default now(),
  unique (cotizacion_id, version_num)
);
create index if not exists idx_cotizacion_versiones_cotizacion
  on public.cotizacion_versiones (cotizacion_id, version_num desc);

-- ─── cotizacion_items ────────────────────────────────────────
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

do $$ begin
  if not exists (select 1 from pg_policies where tablename='cotizacion_versiones' and policyname='service_role_all') then
    alter table public.cotizacion_versiones enable row level security;
    create policy service_role_all on public.cotizacion_versiones for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='cotizacion_items' and policyname='service_role_all') then
    alter table public.cotizacion_items enable row level security;
    create policy service_role_all on public.cotizacion_items for all to service_role using (true) with check (true);
  end if;
end $$;

-- ─── Índices ─────────────────────────────────────────────────
create index if not exists idx_cotizaciones_estado      on public.cotizaciones(estado);
create index if not exists idx_cotizaciones_created_at  on public.cotizaciones(created_at desc);
create index if not exists idx_cotizaciones_cliente_id  on public.cotizaciones(cliente_id);
create index if not exists idx_cotizacion_adjuntos_cot  on public.cotizacion_adjuntos(cotizacion_id);
create index if not exists idx_seguimientos_cot         on public.cotizacion_seguimientos(cotizacion_id);
create index if not exists idx_postulaciones_estado     on public.postulaciones(estado);
create index if not exists idx_conciliacion_estado      on public.conciliacion_movimientos(estado);
create index if not exists idx_conciliacion_fecha       on public.conciliacion_movimientos(fecha desc);
create index if not exists idx_audit_log_entidad        on public.audit_log(entidad, entidad_id);

-- ─── Row Level Security ──────────────────────────────────────
alter table public.admin_users              enable row level security;
alter table public.clientes                 enable row level security;
alter table public.cotizaciones             enable row level security;
alter table public.cotizacion_seguimientos  enable row level security;
alter table public.cotizacion_adjuntos      enable row level security;
alter table public.postulaciones            enable row level security;
alter table public.postulacion_adjuntos     enable row level security;
alter table public.conciliacion_movimientos enable row level security;
alter table public.conciliacion_adjuntos    enable row level security;
alter table public.informes                 enable row level security;
alter table public.informe_adjuntos         enable row level security;
alter table public.audit_log                enable row level security;

-- Políticas service_role (la API usa service_role key — acceso total)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='admin_users' and policyname='service_role_all') then
    create policy service_role_all on public.admin_users for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='clientes' and policyname='service_role_all') then
    create policy service_role_all on public.clientes for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='cotizaciones' and policyname='service_role_all') then
    create policy service_role_all on public.cotizaciones for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='cotizacion_seguimientos' and policyname='service_role_all') then
    create policy service_role_all on public.cotizacion_seguimientos for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='cotizacion_adjuntos' and policyname='service_role_all') then
    create policy service_role_all on public.cotizacion_adjuntos for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='postulaciones' and policyname='service_role_all') then
    create policy service_role_all on public.postulaciones for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='postulacion_adjuntos' and policyname='service_role_all') then
    create policy service_role_all on public.postulacion_adjuntos for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='conciliacion_movimientos' and policyname='service_role_all') then
    create policy service_role_all on public.conciliacion_movimientos for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='conciliacion_adjuntos' and policyname='service_role_all') then
    create policy service_role_all on public.conciliacion_adjuntos for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='informes' and policyname='service_role_all') then
    create policy service_role_all on public.informes for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='informe_adjuntos' and policyname='service_role_all') then
    create policy service_role_all on public.informe_adjuntos for all to service_role using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='audit_log' and policyname='service_role_all') then
    create policy service_role_all on public.audit_log for all to service_role using (true) with check (true);
  end if;
end $$;

-- ─── Storage bucket ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
select 'backoffice-docs', 'backoffice-docs', false
where not exists (
  select 1 from storage.buckets where id = 'backoffice-docs'
);

-- ─── Comments ────────────────────────────────────────────────
comment on table public.admin_users              is 'Usuarios internos del backoffice con roles y credenciales.';
comment on table public.clientes                 is 'Empresas y personas cliente de ELEMEC.';
comment on table public.cotizaciones             is 'Solicitudes de cotización recibidas desde el sitio público y gestionadas en backoffice.';
comment on table public.cotizacion_adjuntos      is 'Documentos asociados a cotizaciones.';
comment on table public.cotizacion_seguimientos  is 'Historial de cambios y notas internas por cotización.';
comment on table public.postulaciones            is 'Registro de candidatos y seguimiento de postulaciones.';
comment on table public.conciliacion_movimientos is 'Movimientos para conciliación contable y control interno.';
comment on table public.informes                 is 'Informes técnicos y comerciales vinculados a clientes o cotizaciones.';
comment on table public.audit_log                is 'Registro de auditoría de acciones en el backoffice.';
