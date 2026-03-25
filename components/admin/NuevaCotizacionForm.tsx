'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import CotizacionPreview, { type CotizacionPreviewData } from './CotizacionPreview';

/* ─── Types ──────────────────────────────────────────────────────────── */

interface LineItem {
  descripcion: string;
  cantidad:    number;
  um:          string;
  precio_un:   number;
  desc_pct:    number;
  tipo_imp:    'afecta' | 'exenta';
}

interface DocRef {
  documento:  string;
  numero:     string;
  fecha:      string;
  cod_ref:    string;
  comentario: string;
}

/* ─── Constants ──────────────────────────────────────────────────────── */

const TIPO_DOC_LABELS: Record<string, string> = {
  boleta_electronica:              'Boleta Electrónica',
  boleta_exenta_electronica:       'Boleta Exenta Electrónica',
  factura_exportacion_electronica: 'Factura de Exportación Electrónica',
  factura_electronica:             'Factura Electrónica',
  factura_exenta_electronica:      'Factura Exenta Electrónica',
  factura:                         'Factura',
  factura_exenta:                  'Factura Exenta',
};

const REGIONES = [
  'Arica y Parinacota','Tarapacá','Antofagasta','Atacama','Coquimbo',
  'Valparaíso','Región Metropolitana',"O'Higgins",'Maule','Ñuble',
  'Biobío','La Araucanía','Los Ríos','Los Lagos','Aysén','Magallanes',
];

const TIPOS_SERVICIO = [
  { value:'montaje_instalaciones',          label:'Montaje e Instalaciones' },
  { value:'mantencion_equipos',             label:'Mantención de Equipos' },
  { value:'ingenieria_diseno',              label:'Ingeniería y Diseño' },
  { value:'aislacion_termica',              label:'Aislación Térmica' },
  { value:'servicios_basicos_industriales', label:'Servicios Básicos Industriales' },
  { value:'otro',                           label:'Otro' },
];

const DOCS_REF = ['Factura','Boleta','Nota de Crédito','Nota de Débito','Orden de Compra','Guía de Despacho','Otro'];
const COD_REFS = ['34','61','56'];
const COND_VENTA = ['Contado','30 días','60 días','90 días','Crédito','Contra entrega'];
const UMS = ['UN','m²','m³','m','kg','hr','gl','lt','cj','set'];
const PRIORIDADES = [{ value:'alta',label:'Alta' },{ value:'media',label:'Media' },{ value:'baja',label:'Baja' }];
const ORIGENES = [
  { value:'web',label:'Web / Formulario' },{ value:'directo',label:'Contacto Directo' },
  { value:'referido',label:'Referido' },{ value:'licitacion',label:'Licitación' },{ value:'otro',label:'Otro' },
];

const IVA_RATE = 0.19;

/* ─── Helpers ────────────────────────────────────────────────────────── */

const today = () => new Date().toISOString().split('T')[0];

function fmt(n: number) {
  return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function inputCls(extra = '') {
  return `w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 ${extra}`;
}

function selectCls(extra = '') {
  return `w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 ${extra}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
      <span className="h-1 w-4 rounded bg-orange-500" />
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">{children}</h3>
    </div>
  );
}

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="mb-1 block text-xs text-gray-500">
      {children}{req && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const rem = max - value.length;
  return (
    <p className={`mt-1 text-right text-[10px] ${rem < 20 ? 'text-red-400' : 'text-gray-400'}`}>
      Caracteres restantes: {rem}
    </p>
  );
}

function emptyItem(): LineItem {
  return { descripcion: '', cantidad: 0, um: 'UN', precio_un: 0, desc_pct: 0, tipo_imp: 'afecta' };
}

function emptyRef(): DocRef {
  return { documento: '', numero: '', fecha: today(), cod_ref: '', comentario: '' };
}

function calcItem(item: LineItem) {
  const bruto    = item.cantidad * item.precio_un;
  const descuento = bruto * (item.desc_pct / 100);
  const neto     = bruto - descuento;
  return { bruto, descuento, neto };
}

/* ─── InitialData ────────────────────────────────────────────────────── */

interface InitialData {
  cliente?:        string;
  nombreObra?:     string;
  email?:          string;
  region?:         string;
  tipoServicio?:   string;
  contactoNombre?: string;
  direccion?:      string;
  telefono?:       string;
  movil?:          string;
  rutEmpresa?:     string;
  cargo?:          string;
  prioridad?:      string;
  fromFolio?:      string;
  giro?:           string;
  comuna?:         string;
  ciudad?:         string;
  glosa?:          string;
  vendedor?:       string;
  listaPrecio?:    string;
  observaciones?:  string;
  nombreDir?:      string;
  origen?:         string;
  sucursal?:       string;
  tipoDocumento?:  string;
  condVenta?:      string;
  fecha?:          string;
  fechaVigencia?:  string;
  comision?:       string;
  moneda?:         string;
  tipoCambio?:     string;
  fechaVenc?:      string;
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function NuevaCotizacionForm({
  tipo,
  fromSolicitudId,
  editingId,
  initialData,
  initialItems,
  initialRefs,
}: {
  tipo: string;
  fromSolicitudId?: string;
  editingId?: string;
  initialData?: InitialData;
  initialItems?: Array<Record<string, unknown>>;
  initialRefs?: Array<Record<string, unknown>>;
}) {
  const router    = useRouter();
  const tipoEfectivo = tipo || initialData?.tipoDocumento || '';
  const tipoLabel = TIPO_DOC_LABELS[tipoEfectivo] ?? tipoEfectivo;

  /* ── Form header state ────── */
  const [sucursal,       setSucursal]       = useState(initialData?.sucursal ?? '');
  const [cliente,        setCliente]        = useState(initialData?.cliente ?? '');
  const [fecha,          setFecha]          = useState(initialData?.fecha ?? today());
  const [fechaVigencia,  setFechaVigencia]  = useState(initialData?.fechaVigencia ?? today());
  const [giro,           setGiro]           = useState(initialData?.giro ?? '');
  const [direccion,      setDireccion]      = useState(initialData?.direccion ?? '');
  const [comuna,         setComuna]         = useState(initialData?.comuna ?? '');
  const [ciudad,         setCiudad]         = useState(initialData?.ciudad ?? '');
  const [contactoNombre, setContactoNombre] = useState(initialData?.contactoNombre ?? '');
  const [nombreDir,      setNombreDir]      = useState(initialData?.nombreDir ?? '');
  const [telefono,       setTelefono]       = useState(initialData?.telefono ?? '');
  const [email,          setEmail]          = useState(initialData?.email ?? '');
  const [rutEmpresa,     setRutEmpresa]     = useState(initialData?.rutEmpresa ?? '');
  const [movil,          setMovil]          = useState(initialData?.movil ?? '');
  const [cargo,          setCargo]          = useState(initialData?.cargo ?? '');
  const [glosa,          setGlosa]          = useState(initialData?.glosa ?? '');
  const [vendedor,       setVendedor]       = useState(initialData?.vendedor ?? '');
  const [comision,       setComision]       = useState(initialData?.comision ?? '');
  const [listaPrecio,    setListaPrecio]    = useState(initialData?.listaPrecio ?? '');
  const [observaciones,  setObservaciones]  = useState(initialData?.observaciones ?? '');

  /* ── Extra commercial fields ── */
  const [region,         setRegion]         = useState(initialData?.region ?? '');
  const [tipoServicio,   setTipoServicio]   = useState(initialData?.tipoServicio ?? '');
  const [prioridad,      setPrioridad]      = useState(initialData?.prioridad ?? '');
  const [origen,         setOrigen]         = useState(initialData?.origen ?? '');
  const [nombreObra,     setNombreObra]     = useState(initialData?.nombreObra ?? '');

  /* ── Condición de venta ────── */
  const [condVenta,      setCondVenta]      = useState(initialData?.condVenta ?? '');
  const [fechaVenc,      setFechaVenc]      = useState(initialData?.fechaVenc ?? today());

  /* ── Moneda ─────────────────── */
  const [otraMoneda,     setOtraMoneda]     = useState(initialData?.moneda ? initialData.moneda !== 'CLP' : false);
  const [moneda,         setMoneda]         = useState(initialData?.moneda && initialData.moneda !== 'CLP' ? initialData.moneda : 'USD');
  const [tipoCambio,     setTipoCambio]     = useState(initialData?.tipoCambio ?? '');

  /* ── Referencias ────────────── */
  const [refs, setRefs] = useState<DocRef[]>(() => {
    if (initialRefs && initialRefs.length > 0) {
      return initialRefs.map(r => ({
        documento:  String(r.documento ?? ''),
        numero:     String(r.numero ?? ''),
        fecha:      String(r.fecha ?? today()),
        cod_ref:    String(r.cod_ref ?? ''),
        comentario: String(r.comentario ?? ''),
      }));
    }
    return [emptyRef()];
  });

  /* ── Line items ─────────────── */
  const [items, setItems] = useState<LineItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map(it => ({
        descripcion: String(it.descripcion ?? ''),
        cantidad:    Number(it.cantidad ?? 0),
        um:          String(it.unidad ?? it.um ?? 'UN'),
        precio_un:   Number(it.precio_unitario ?? it.precio_un ?? 0),
        desc_pct:    Number(it.descuento_pct ?? it.desc_pct ?? 0),
        tipo_imp:    (String(it.tipo_impuesto ?? it.tipo_imp ?? 'afecta')) as 'afecta' | 'exenta',
      }));
    }
    return [emptyItem()];
  });

  /* ── Preview state ───────────── */
  const [showPreview, setShowPreview] = useState(false);

  /* ── Submit state ────────────── */
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  /* ── Totals ──────────────────── */
  const totals = items.reduce(
    (acc, item) => {
      const { neto } = calcItem(item);
      if (item.tipo_imp === 'afecta') acc.afecto += neto;
      else acc.exento += neto;
      return acc;
    },
    { afecto: 0, exento: 0 }
  );
  const iva   = totals.afecto * IVA_RATE;
  const total = totals.afecto + totals.exento + iva;

  /* ── Ref helpers ─────────────── */
  const updateRef = useCallback((i: number, field: keyof DocRef, val: string) => {
    setRefs(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }, []);
  const addRef    = () => setRefs(p => [...p, emptyRef()]);
  const removeRef = (i: number) => setRefs(p => p.filter((_, idx) => idx !== i));

  /* ── Item helpers ────────────── */
  const updateItem = useCallback((i: number, field: keyof LineItem, val: string | number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }, []);
  const addItem    = () => setItems(p => [...p, emptyItem()]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));

  /* ── Submit helpers ──────────── */
  function buildBody(estado: string) {
    return {
      estado,
      // Header
      tipo_documento:  tipoEfectivo || undefined,
      sucursal:        sucursal || undefined,
      nombre:          contactoNombre || undefined,
      compania:        cliente || undefined,
      giro:            giro || undefined,
      direccion:       direccion || undefined,
      comuna:          comuna || undefined,
      ciudad:          ciudad || undefined,
      contacto:        contactoNombre || undefined,
      nombre_dir:      nombreDir || undefined,
      telefono:        telefono || undefined,
      email:           email || undefined,
      rut_empresa:     rutEmpresa || undefined,
      cargo:           cargo || undefined,
      movil:           movil || undefined,
      glosa:           glosa || undefined,
      vendedor:        vendedor || undefined,
      comision_pct:    comision ? parseFloat(comision) : undefined,
      lista_precio:    listaPrecio || undefined,
      observaciones:   observaciones || undefined,
      // Project / commercial
      nombre_obra:     nombreObra || undefined,
      region:          region || undefined,
      tipo_servicio:   tipoServicio || undefined,
      prioridad:       prioridad || undefined,
      origen:          origen || undefined,
      // Solicitud linkage
      solicitud_id:    fromSolicitudId || undefined,
      // Version
      fecha:           fecha,
      fecha_vigencia:  fechaVigencia,
      moneda:          otraMoneda ? moneda : 'CLP',
      tipo_cambio:     otraMoneda && tipoCambio ? parseFloat(tipoCambio) : undefined,
      condicion_venta: condVenta || undefined,
      fecha_vencimiento: fechaVenc,
      // Totals (calculated)
      subtotal:        totals.afecto + totals.exento,
      impuestos:       iva,
      total:           total,
      // Line items
      items: items
        .filter(it => it.descripcion.trim() !== '')
        .map((it, i) => ({
          item_num:        i + 1,
          descripcion:     it.descripcion,
          unidad:          it.um,
          cantidad:        it.cantidad,
          precio_unitario: it.precio_un,
          descuento_pct:   it.desc_pct,
          tipo_impuesto:   it.tipo_imp,
          impuesto_pct:    it.tipo_imp === 'afecta' ? 19 : 0,
          subtotal:        calcItem(it).neto,
          total:           calcItem(it).neto * (it.tipo_imp === 'afecta' ? 1 + IVA_RATE : 1),
        })),
      // References
      referencias: refs
        .filter(r => r.documento !== '')
        .map(r => ({ ...r })),
    };
  }

  async function postCotizacion(estado: string) {
    setLoading(true);
    setError('');
    try {
      const payload = buildBody(estado);
      const targetId = editingId ?? fromSolicitudId;

      if (targetId) {
        // Modo edición: actualizar cotización existente con PUT
        const putRes = await fetch('/api/admin/cotizaciones', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetId, ...payload }),
        });
        if (!putRes.ok) {
          const d = await putRes.json();
          setError(d.error ?? 'Error al actualizar');
          setLoading(false);
          return;
        }
        router.push(`/admin/cotizaciones/${targetId}`);
      } else {
        // Modo creación: nueva cotización con POST
        const res = await fetch('/api/admin/cotizaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? 'Error al guardar');
          setLoading(false);
          return;
        }
        const { id } = await res.json();
        router.push(`/admin/cotizaciones/${id}`);
      }
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await postCotizacion('cotizada');
  }

  async function handleDraft() {
    await postCotizacion('proceso');
  }

  /* ── Render ──────────────────── */
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 py-4 md:px-6 md:py-10">

      {/* ── Page title ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">Ingreso de documento de cotización</h1>
          {tipoLabel && (
            <span className="rounded border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {tipoLabel}
            </span>
          )}
        </div>
        <Link
          href="/admin/cotizaciones"
          className="flex items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
        >
          ← Volver al listado
        </Link>
      </div>

      {(editingId || fromSolicitudId) && (
        <div className="flex items-center gap-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-600">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>
            {editingId ? 'Completando' : 'Desarrollando'} cotización{' '}
            <Link href={`/admin/cotizaciones/${editingId ?? fromSolicitudId}`} className="font-semibold underline hover:text-orange-700">
              {initialData?.fromFolio ?? `#${(editingId ?? fromSolicitudId ?? '').slice(0, 8)}…`}
            </Link>
            {' '}— los cambios se guardan directamente en esta cotización.
          </span>
        </div>
      )}

      {error && (
        <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ═══════════════════════════════════════════════════════════
            SECCIÓN 1 — CABECERA DEL DOCUMENTO
        ═══════════════════════════════════════════════════════════ */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">

            {/* Sucursal */}
            <div>
              <Label>Sucursal</Label>
              <input value={sucursal} onChange={e => setSucursal(e.target.value)}
                className={inputCls()} placeholder="Sucursal" />
            </div>

            {/* Fecha */}
            <div>
              <Label req>Fecha</Label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                className={inputCls()} required />
            </div>

            {/* Folio */}
            <div>
              <Label>Folio</Label>
              <input className={inputCls()} placeholder="(Auto)" disabled value="" readOnly />
            </div>

            {/* Fecha Vigencia */}
            <div>
              <Label>Fecha Vigencia</Label>
              <input type="date" value={fechaVigencia} onChange={e => setFechaVigencia(e.target.value)}
                className={inputCls()} />
            </div>

            {/* Cliente */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <Label req>Cliente</Label>
              <input value={cliente} onChange={e => setCliente(e.target.value)}
                className={inputCls()} placeholder="Nombre o razón social del cliente" required />
            </div>

            {/* Giro */}
            <div className="col-span-2">
              <Label>Giro</Label>
              <input value={giro} onChange={e => setGiro(e.target.value)}
                className={inputCls()} placeholder="Giro comercial" />
            </div>

            {/* Dirección */}
            <div className="col-span-2">
              <Label>Dirección</Label>
              <input value={direccion} onChange={e => setDireccion(e.target.value)}
                className={inputCls()} placeholder="Dirección" />
            </div>

            {/* Comuna */}
            <div>
              <Label>Comuna</Label>
              <input value={comuna} onChange={e => setComuna(e.target.value)}
                className={inputCls()} placeholder="Comuna" />
            </div>

            {/* Ciudad */}
            <div>
              <Label>Ciudad</Label>
              <input value={ciudad} onChange={e => setCiudad(e.target.value)}
                className={inputCls()} placeholder="Ciudad" />
            </div>

            {/* Región */}
            <div>
              <Label>Región</Label>
              <select value={region} onChange={e => setRegion(e.target.value)} className={selectCls()}>
                <option value="">— Seleccione —</option>
                {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Nombre Obra / Proyecto */}
            <div className="col-span-2 sm:col-span-3">
              <Label req>Nombre Dirección / Proyecto</Label>
              <input value={nombreObra} onChange={e => setNombreObra(e.target.value)}
                className={inputCls()} placeholder="Nombre de la obra o proyecto" required />
            </div>

            {/* Contacto */}
            <div>
              <Label>Contacto</Label>
              <input value={contactoNombre} onChange={e => setContactoNombre(e.target.value)}
                className={inputCls()} placeholder="Nombre del contacto" />
            </div>

            {/* Teléfono */}
            <div>
              <Label>Teléfono</Label>
              <input value={telefono} onChange={e => setTelefono(e.target.value)}
                className={inputCls()} placeholder="+56 2 xxxx xxxx" />
            </div>

            {/* Email */}
            <div className="col-span-2">
              <Label>Email</Label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={inputCls()} placeholder="correo@empresa.cl" />
            </div>

            {/* RUT Empresa */}
            <div>
              <Label>RUT Empresa</Label>
              <input value={rutEmpresa} onChange={e => setRutEmpresa(e.target.value)}
                className={inputCls()} placeholder="76.715.440-2" />
            </div>

            {/* Cargo */}
            <div>
              <Label>Cargo</Label>
              <input value={cargo} onChange={e => setCargo(e.target.value)}
                className={inputCls()} placeholder="Cargo del contacto" />
            </div>

            {/* Móvil */}
            <div>
              <Label>Móvil</Label>
              <input value={movil} onChange={e => setMovil(e.target.value)}
                className={inputCls()} placeholder="+56 9 xxxx xxxx" />
            </div>

          </div>

          {/* Glosa */}
          <div className="mt-4">
            <Label>Glosa</Label>
            <input
              value={glosa}
              onChange={e => { if (e.target.value.length <= 255) setGlosa(e.target.value); }}
              className={inputCls()}
              placeholder="Glosa del documento"
            />
            <CharCount value={glosa} max={255} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECCIÓN 2 — VENDEDOR / LISTA DE PRECIOS
        ═══════════════════════════════════════════════════════════ */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <SectionTitle>Vendedor</SectionTitle>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <div className="col-span-2">
              <Label>Vendedor</Label>
              <input value={vendedor} onChange={e => setVendedor(e.target.value)}
                className={inputCls()} placeholder="Nombre del vendedor" />
            </div>
            <div>
              <Label>Comisión %</Label>
              <input type="number" value={comision} onChange={e => setComision(e.target.value)}
                className={inputCls()} placeholder="0.00" min="0" max="100" step="0.01" />
            </div>
            <div>
              <Label>Lista de Precios</Label>
              <input value={listaPrecio} onChange={e => setListaPrecio(e.target.value)}
                className={inputCls()} placeholder="Lista de Precios" />
            </div>
            <div>
              <Label>Tipo de servicio</Label>
              <select value={tipoServicio} onChange={e => setTipoServicio(e.target.value)} className={selectCls()}>
                <option value="">— Seleccione —</option>
                {TIPOS_SERVICIO.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <Label>Prioridad</Label>
              <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className={selectCls()}>
                <option value="">— Seleccione —</option>
                {PRIORIDADES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <Label>Origen</Label>
              <select value={origen} onChange={e => setOrigen(e.target.value)} className={selectCls()}>
                <option value="">— Seleccione —</option>
                {ORIGENES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          {/* Observaciones */}
          <div className="mt-4">
            <Label>Observaciones</Label>
            <textarea
              value={observaciones}
              onChange={e => { if (e.target.value.length <= 6000) setObservaciones(e.target.value); }}
              rows={3}
              className={inputCls()}
              placeholder="Escriba las observaciones de la cotización..."
            />
            <CharCount value={observaciones} max={6000} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECCIÓN 3 — REFERENCIAS DEL DOCUMENTO (opcional)
        ═══════════════════════════════════════════════════════════ */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <SectionTitle>Referencias del documento (opcional)</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="pb-2 pr-2 font-medium w-6">#</th>
                  <th className="pb-2 pr-2 font-medium">Documento</th>
                  <th className="pb-2 pr-2 font-medium">Número</th>
                  <th className="pb-2 pr-2 font-medium">Fecha</th>
                  <th className="pb-2 pr-2 font-medium">Cod.Ref.</th>
                  <th className="pb-2 pr-2 font-medium">Comentario</th>
                  <th className="pb-2 font-medium w-6" />
                </tr>
              </thead>
              <tbody className="space-y-1">
                {refs.map((ref, i) => (
                  <tr key={i} className="align-top">
                    <td className="pr-2 pt-1 text-gray-400">{i + 1}</td>
                    <td className="pr-2">
                      <select value={ref.documento} onChange={e => updateRef(i, 'documento', e.target.value)}
                        className={selectCls('text-xs py-1')}>
                        <option value="">—</option>
                        {DOCS_REF.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </td>
                    <td className="pr-2">
                      <input value={ref.numero} onChange={e => updateRef(i, 'numero', e.target.value)}
                        className={inputCls('text-xs py-1')} placeholder="Nro." />
                    </td>
                    <td className="pr-2">
                      <input type="date" value={ref.fecha} onChange={e => updateRef(i, 'fecha', e.target.value)}
                        className={inputCls('text-xs py-1')} />
                    </td>
                    <td className="pr-2">
                      <select value={ref.cod_ref} onChange={e => updateRef(i, 'cod_ref', e.target.value)}
                        className={selectCls('text-xs py-1')}>
                        <option value="">—</option>
                        {COD_REFS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="pr-2">
                      <input value={ref.comentario} onChange={e => updateRef(i, 'comentario', e.target.value)}
                        className={inputCls('text-xs py-1')} placeholder="Comentario" />
                    </td>
                    <td>
                      {refs.length > 1 && (
                        <button type="button" onClick={() => removeRef(i)}
                          className="mt-1 text-red-400 hover:text-red-300 text-base leading-none">×</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addRef}
            className="mt-3 flex items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100">
            + Agregar referencia
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECCIÓN 4 — INGRESO EN OTRA MONEDA
        ═══════════════════════════════════════════════════════════ */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <SectionTitle>Ingreso en otra moneda</SectionTitle>
            <label className="flex items-center gap-2 cursor-pointer ml-4">
              <div
                onClick={() => setOtraMoneda(v => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${otraMoneda ? 'bg-orange-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${otraMoneda ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className="text-xs text-gray-500">{otraMoneda ? 'Habilitado' : 'Habilitar'}</span>
            </label>
          </div>
          {otraMoneda && (
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <Label>Moneda</Label>
                <select value={moneda} onChange={e => setMoneda(e.target.value)} className={selectCls()}>
                  {['USD','EUR','UF','UTM'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <Label>Tipo de cambio</Label>
                <input type="number" value={tipoCambio} onChange={e => setTipoCambio(e.target.value)}
                  className={inputCls()} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECCIÓN 5 — DETALLE DEL DOCUMENTO (LINE ITEMS)
        ═══════════════════════════════════════════════════════════ */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <SectionTitle>Detalle del documento</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-xs">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-200">
                  <th className="pb-2 pr-2 font-medium w-6">#</th>
                  <th className="pb-2 pr-2 font-medium">Descripción ítem</th>
                  <th className="pb-2 pr-2 font-medium w-20">Cantidad</th>
                  <th className="pb-2 pr-2 font-medium w-16">U.M.</th>
                  <th className="pb-2 pr-2 font-medium w-24">Precio Un. $</th>
                  <th className="pb-2 pr-2 font-medium w-20">Desc. %</th>
                  <th className="pb-2 pr-2 font-medium w-24">Impuesto</th>
                  <th className="pb-2 pr-2 font-medium w-24 text-right">Total $</th>
                  <th className="pb-2 font-medium w-6" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const { neto } = calcItem(item);
                  const totalItem = neto * (item.tipo_imp === 'afecta' ? 1 + IVA_RATE : 1);
                  return (
                    <tr key={i} className="border-b border-gray-100 align-top">
                      <td className="pr-2 pt-2 text-gray-400">{i + 1}</td>
                      <td className="pr-2 pt-1">
                        <input
                          value={item.descripcion}
                          onChange={e => updateItem(i, 'descripcion', e.target.value)}
                          className={inputCls('text-xs py-1')}
                          placeholder="Descripción del ítem o servicio"
                        />
                      </td>
                      <td className="pr-2 pt-1">
                        <input
                          type="number" min="0" step="0.0001"
                          value={item.cantidad || ''}
                          onChange={e => updateItem(i, 'cantidad', parseFloat(e.target.value) || 0)}
                          className={inputCls('text-xs py-1 text-right')}
                          placeholder="0"
                        />
                      </td>
                      <td className="pr-2 pt-1">
                        <select
                          value={item.um}
                          onChange={e => updateItem(i, 'um', e.target.value)}
                          className={selectCls('text-xs py-1')}
                        >
                          {UMS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="pr-2 pt-1">
                        <input
                          type="number" min="0" step="0.01"
                          value={item.precio_un || ''}
                          onChange={e => updateItem(i, 'precio_un', parseFloat(e.target.value) || 0)}
                          className={inputCls('text-xs py-1 text-right')}
                          placeholder="0"
                        />
                      </td>
                      <td className="pr-2 pt-1">
                        <input
                          type="number" min="0" max="100" step="0.01"
                          value={item.desc_pct || ''}
                          onChange={e => updateItem(i, 'desc_pct', parseFloat(e.target.value) || 0)}
                          className={inputCls('text-xs py-1 text-right')}
                          placeholder="0"
                        />
                      </td>
                      <td className="pr-2 pt-1">
                        <select
                          value={item.tipo_imp}
                          onChange={e => updateItem(i, 'tipo_imp', e.target.value as 'afecta' | 'exenta')}
                          className={selectCls('text-xs py-1')}
                        >
                          <option value="afecta">Afecta (19%)</option>
                          <option value="exenta">Exenta</option>
                        </select>
                      </td>
                      <td className="pr-2 pt-2 text-right font-mono text-gray-700">
                        {fmt(totalItem)}
                      </td>
                      <td className="pt-1.5">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)}
                            className="text-red-400 hover:text-red-300 text-base leading-none">×</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button type="button" onClick={addItem}
            className="mt-3 flex items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100">
            + Agregar ítem
          </button>

          {/* ── Totals footer ── */}
          <div className="mt-5 flex justify-end">
            <div className="w-72 rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs">
              <div className="flex justify-between py-1 text-gray-500">
                <span>Desc.%</span><span className="font-mono">0.000000</span>
              </div>
              <div className="flex justify-between py-1 text-gray-500">
                <span>Desc.$</span><span className="font-mono">0.00</span>
              </div>
              <div className="flex justify-between py-1 text-gray-500">
                <span>Rec.%</span><span className="font-mono">0.000000</span>
              </div>
              <div className="flex justify-between py-1 text-gray-500">
                <span>Rec.$</span><span className="font-mono">0.00</span>
              </div>
              <div className="mt-2 border-t border-gray-200 pt-2">
                <div className="flex justify-between py-0.5 text-gray-600">
                  <span>Afecto</span><span className="font-mono">{fmt(totals.afecto)}</span>
                </div>
                <div className="flex justify-between py-0.5 text-gray-600">
                  <span>Exento</span><span className="font-mono">{fmt(totals.exento)}</span>
                </div>
                <div className="flex justify-between py-0.5 text-gray-600">
                  <span>IVA 19%</span><span className="font-mono">{fmt(iva)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1 text-sm font-bold text-orange-500">
                  <span>Total</span><span className="font-mono">{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECCIÓN 6 — CONDICIÓN DE VENTA
        ═══════════════════════════════════════════════════════════ */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <SectionTitle>Condición de Venta</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2">
              <Label>Condición de Venta</Label>
              <select value={condVenta} onChange={e => setCondVenta(e.target.value)} className={selectCls()}>
                <option value="">— Seleccione —</option>
                {COND_VENTA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Fecha de Vencimiento</Label>
              <input type="date" value={fechaVenc} onChange={e => setFechaVenc(e.target.value)}
                className={inputCls()} />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            BOTONERA DE ACCIONES
        ═══════════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-5 py-4">
          <div className="flex gap-2">
            <Link
              href="/admin/cotizaciones"
              className="rounded border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100"
            >
              Cancelar
            </Link>
            <button
              type="button"
              className="rounded border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100"
              onClick={() => {
                setItems([emptyItem()]);
                setRefs([emptyRef()]);
              }}
            >
              Limpiar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleDraft}
              className="rounded border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-600 hover:bg-orange-100 disabled:opacity-50"
            >
              Guardar en proceso
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-orange-300 bg-orange-500/10 px-4 py-2 text-xs font-medium text-orange-500 hover:bg-orange-100"
              onClick={() => setShowPreview(true)}
            >
              Vista Previa
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded bg-green-700 px-5 py-2 text-xs font-bold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                'REGISTRAR COTIZACIÓN'
              )}
            </button>
          </div>
        </div>

      </form>

      {/* ── Preview modal ── */}
      {showPreview && (
        <CotizacionPreview
          onClose={() => setShowPreview(false)}
          data={{
            tipo: tipoEfectivo,
            tipoLabel,
            fecha,
            fechaVigencia,
            cliente,
            giro,
            direccion,
            comuna,
            ciudad,
            region,
            contacto:      contactoNombre,
            nombreDir,
            telefono,
            email,
            rutEmpresa,
            cargo,
            movil,
            nombreObra,
            sucursal,
            glosa,
            vendedor,
            comision,
            listaPrecio,
            observaciones,
            condVenta,
            fechaVenc,
            moneda:        otraMoneda ? moneda : 'CLP',
            tipoCambio,
            items,
            refs,
          } satisfies CotizacionPreviewData}
        />
      )}

    </div>
  );
}