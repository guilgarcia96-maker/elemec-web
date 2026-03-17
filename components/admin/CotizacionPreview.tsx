'use client';

import { useEffect, useRef } from 'react';

/* ─── Types mirrored from NuevaCotizacionForm ── */
export interface PreviewLineItem {
  descripcion: string;
  cantidad:    number;
  um:          string;
  precio_un:   number;
  desc_pct:    number;
  tipo_imp:    'afecta' | 'exenta';
}

export interface PreviewDocRef {
  documento:  string;
  numero:     string;
  fecha:      string;
  cod_ref:    string;
  comentario: string;
}

export interface CotizacionPreviewData {
  // Document
  tipo:          string;
  tipoLabel:     string;
  fecha:         string;
  fechaVigencia: string;
  // Emisor (ELEMEC)
  // (hardcoded in component, editable below)
  // Receptor
  cliente:       string;
  giro:          string;
  direccion:     string;
  comuna:        string;
  ciudad:        string;
  region:        string;
  contacto:      string;
  nombreDir:     string;
  telefono:      string;
  email:         string;
  // Project
  nombreObra:    string;
  // Commercial
  sucursal:      string;
  glosa:         string;
  vendedor:      string;
  comision:      string;
  listaPrecio:   string;
  observaciones: string;
  condVenta:     string;
  fechaVenc:     string;
  // Currency
  moneda:        string;
  tipoCambio:    string;
  // Items
  items:         PreviewLineItem[];
  refs:          PreviewDocRef[];
}

/* ─── ELEMEC company data ─────────────────────────────── */
const EMISOR = {
  nombre:      'ELEMEC',
  razonSocial: 'ELEMEC SPA.',
  rut:         '76.715.440-2',
  giro:        'Obras y Servicios de Ingeniería',
  direccion:   'Arturo Prat 1602',
  comuna:      'Punta Arenas',
  ciudad:      'Punta Arenas',
  region:      'Región de Magallanes',
  telefono:    '+56 9 9649 2917',
  email:       'contacto@elemec.cl',
  web:         'www.elemec.cl',
};

const IVA_RATE = 0.19;

/* ─── Helpers ────────────────────────────────────── */
function fmt(n: number) {
  return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function calcItem(item: PreviewLineItem) {
  const bruto     = item.cantidad * item.precio_un;
  const descuento = bruto * (item.desc_pct / 100);
  const neto      = bruto - descuento;
  return { bruto, descuento, neto };
}

/* ─── Component ──────────────────────────────────── */
export default function CotizacionPreview({
  data,
  onClose,
}: {
  data: CotizacionPreviewData;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  /* close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /* totals */
  const totals = data.items.reduce(
    (acc, item) => {
      const { neto } = calcItem(item);
      if (item.tipo_imp === 'afecta') acc.afecto += neto;
      else acc.exento += neto;
      return acc;
    },
    { afecto: 0, exento: 0 }
  );
  const iva       = totals.afecto * IVA_RATE;
  const total     = totals.afecto + totals.exento + iva;
  const validItems = data.items.filter(it => it.descripcion.trim() !== '');

  function handlePrint() {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Cotización — ${data.tipoLabel}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #111;
            background: #fff;
          }
          @page { size: A4; margin: 15mm 15mm 20mm; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          .doc { width: 100%; }

          /* header */
          .doc-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 12px; }
          .company-name { font-size: 22px; font-weight: 700; color: #f97316; letter-spacing: 0.1em; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; }
          .company-tagline { font-size: 9px; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
          .company-details { font-size: 10px; color: #444; line-height: 1.6; margin-top: 6px; }
          .doc-badge { text-align: right; }
          .doc-badge-box { display: inline-block; border: 2px solid #ea580c; border-radius: 6px; padding: 10px 18px; text-align: center; min-width: 180px; }
          .doc-badge-type { font-size: 11px; font-weight: 700; color: #ea580c; text-transform: uppercase; letter-spacing: 0.5px; }
          .doc-badge-rut { font-size: 9px; color: #666; margin-top: 2px; }
          .doc-badge-folio { font-size: 28px; font-weight: 900; color: #ea580c; margin-top: 4px; }
          .doc-badge-folio-label { font-size: 9px; color: #888; }

          /* parties */
          .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 14px 0; }
          .party-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px 12px; }
          .party-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 8px; }
          .party-row { display: flex; gap: 6px; margin-bottom: 3px; }
          .party-label { font-size: 9px; color: #888; min-width: 60px; }
          .party-value { font-size: 10px; color: #111; font-weight: 500; flex: 1; }

          /* dates row */
          .dates-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 10px 0; }
          .date-box { border: 1px solid #ddd; border-radius: 4px; padding: 6px 8px; text-align: center; }
          .date-label { font-size: 8px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
          .date-value { font-size: 11px; font-weight: 600; color: #111; margin-top: 2px; }

          /* glosa */
          .glosa-box { background: #f8f9fb; border-left: 3px solid #1a1a2e; padding: 6px 10px; margin: 10px 0; font-size: 11px; color: #333; border-radius: 0 4px 4px 0; }

          /* items table */
          .items-section { margin: 14px 0; }
          .items-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { background: #ea580c; color: #fff; }
          thead th { padding: 6px 8px; font-size: 9px; font-weight: 600; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; }
          thead th.right { text-align: right; }
          tbody tr:nth-child(even) { background: #f8f9fb; }
          tbody tr { border-bottom: 1px solid #eee; }
          tbody td { padding: 5px 8px; font-size: 10px; color: #222; vertical-align: top; }
          tbody td.right { text-align: right; font-family: monospace; }
          tbody td.center { text-align: center; }
          .empty-items { text-align: center; padding: 20px; color: #aaa; font-size: 11px; }

          /* totals */
          .totals-row { display: flex; justify-content: flex-end; margin-top: 10px; }
          .totals-box { width: 240px; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
          .totals-row-item { display: flex; justify-content: space-between; padding: 5px 10px; font-size: 10px; border-bottom: 1px solid #eee; }
          .totals-row-item.total { background: #ea580c; color: #fff; font-weight: 700; font-size: 13px; border-bottom: none; }
          .totals-num { font-family: monospace; }

          /* refs */
          .refs-section { margin: 14px 0; }
          .refs-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 6px; }

          /* obs */
          .obs-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px 12px; margin: 14px 0; }
          .obs-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
          .obs-text { font-size: 10px; color: #444; white-space: pre-wrap; line-height: 1.6; }

          /* cond venta */
          .cond-row { display: flex; gap: 20px; margin: 10px 0; }
          .cond-item { border: 1px solid #ddd; border-radius: 4px; padding: 6px 12px; }
          .cond-label { font-size: 8px; color: #888; text-transform: uppercase; }
          .cond-value { font-size: 11px; font-weight: 600; color: #111; margin-top: 2px; }

          /* footer */
          .doc-footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; }

          /* signatures */
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
          .sig-line { border-top: 1px solid #999; padding-top: 4px; text-align: center; font-size: 9px; color: #666; }
        </style>
      </head>
      <body>
        <div class="doc">
          ${printContent}
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm print:hidden"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Modal shell ── */}
      <div className="relative mt-4 mb-8 w-full max-w-4xl rounded-xl bg-white shadow-2xl">

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3 rounded-t-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Vista previa — {data.tipoLabel || 'Cotización'}</span>
            <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
              Borrador
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded bg-[#1a1a2e] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2a2a4e] transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* ── Document ── */}
        <div className="p-6 bg-white rounded-b-xl">
          <div ref={printRef}>
            <DocumentBody data={data} totals={totals} iva={iva} total={total} validItems={validItems} />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Document body (shared between preview and print) ── */
function DocumentBody({
  data,
  totals,
  iva,
  total,
  validItems,
}: {
  data: CotizacionPreviewData;
  totals: { afecto: number; exento: number };
  iva: number;
  total: number;
  validItems: PreviewLineItem[];
}) {
  return (
    <div className="doc text-gray-800">

      {/* ── HEADER ── */}
      <div className="doc-header flex justify-between items-start border-b-2 border-[#ea580c] pb-3 mb-3">
        {/* Emisor */}
        <div>
          <div className="company-name text-[22px] font-bold text-[#f97316] tracking-widest">
            {EMISOR.nombre}
          </div>
          <div className="company-tagline text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">
            {EMISOR.giro}
          </div>
          <div className="company-details text-[10px] text-gray-500 mt-2 leading-relaxed">
            <div>RUT: <strong className="text-gray-700">{EMISOR.rut}</strong></div>
            <div>{EMISOR.direccion}, {EMISOR.comuna}</div>
            <div>{EMISOR.region} — {EMISOR.ciudad}</div>
            <div>{EMISOR.telefono} | {EMISOR.email}</div>
          </div>
        </div>

        {/* Document badge */}
        <div className="doc-badge text-right">
          <div className="doc-badge-box inline-block border-2 border-[#ea580c] rounded-lg px-5 py-3 text-center min-w-[180px]">
            <div className="doc-badge-type text-[11px] font-bold text-[#ea580c] uppercase tracking-wide">
              {data.tipoLabel || 'COTIZACIÓN'}
            </div>
            <div className="doc-badge-rut text-[9px] text-gray-400 mt-0.5">RUT: {EMISOR.rut}</div>
            <div className="doc-badge-folio text-2xl font-bold text-[#ea580c] mt-1 tracking-widest">BORRADOR</div>
            <div className="doc-badge-folio-label text-[8px] text-gray-400">Folio asignado al guardar</div>
          </div>
        </div>
      </div>

      {/* ── DATES ROW ── */}
      <div className="dates-row grid grid-cols-4 gap-2 my-3">
        {[
          { label: 'Fecha Emisión', value: fmtDate(data.fecha) },
          { label: 'Fecha Vigencia', value: fmtDate(data.fechaVigencia) },
          { label: 'Cond. de Venta', value: data.condVenta || '—' },
          { label: 'Fecha Vencimiento', value: fmtDate(data.fechaVenc) },
        ].map(({ label, value }) => (
          <div key={label} className="date-box border border-gray-200 rounded px-2 py-1.5 text-center">
            <div className="date-label text-[8px] text-gray-400 uppercase tracking-wide">{label}</div>
            <div className="date-value text-[11px] font-semibold text-gray-800 mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* ── PARTIES ── */}
      <div className="parties grid grid-cols-2 gap-4 my-3">
        {/* Receptor */}
        <div className="party-box border border-gray-200 rounded-lg p-3">
          <div className="party-title text-[9px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1 mb-2">
            Datos del Receptor
          </div>
          {[
            { label: 'Cliente',   value: data.cliente },
            { label: 'Giro',      value: data.giro },
            { label: 'Dirección', value: [data.direccion, data.comuna, data.ciudad].filter(Boolean).join(', ') },
            { label: 'Región',    value: data.region },
            { label: 'Contacto',  value: data.contacto },
            { label: 'Teléfono',  value: data.telefono },
            { label: 'Email',     value: data.email },
          ].filter(r => r.value).map(({ label, value }) => (
            <div key={label} className="party-row flex gap-1.5 mb-1">
              <span className="party-label text-[8px] text-gray-400 min-w-[55px]">{label}:</span>
              <span className="party-value text-[10px] text-gray-800 font-medium flex-1">{value}</span>
            </div>
          ))}
        </div>

        {/* Proyecto / Vendedor */}
        <div className="party-box border border-gray-200 rounded-lg p-3">
          <div className="party-title text-[9px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1 mb-2">
            Proyecto / Comercial
          </div>
          {[
            { label: 'Proyecto',    value: data.nombreObra },
            { label: 'Sucursal',    value: data.sucursal },
            { label: 'Vendedor',    value: data.vendedor },
            { label: 'Comisión',    value: data.comision ? `${data.comision}%` : '' },
            { label: 'Lista Prec.', value: data.listaPrecio },
            { label: 'Moneda',      value: data.moneda === 'CLP' ? 'CLP (Peso Chileno)' : `${data.moneda}${data.tipoCambio ? ` — TC: ${data.tipoCambio}` : ''}` },
          ].filter(r => r.value).map(({ label, value }) => (
            <div key={label} className="party-row flex gap-1.5 mb-1">
              <span className="party-label text-[8px] text-gray-400 min-w-[55px]">{label}:</span>
              <span className="party-value text-[10px] text-gray-800 font-medium flex-1">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── GLOSA ── */}
      {data.glosa && (
        <div className="glosa-box bg-gray-50 border-l-[3px] border-[#1a1a2e] px-3 py-2 my-3 rounded-r text-[11px] text-gray-600 italic">
          <strong className="text-[9px] uppercase tracking-wider text-gray-400 not-italic">Glosa: </strong>
          {data.glosa}
        </div>
      )}

      {/* ── REFERENCIAS ── */}
      {data.refs.some(r => r.documento) && (
        <div className="refs-section my-3">
          <div className="refs-title text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Referencias del Documento
          </div>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                {['#','Documento','Número','Fecha','Cód. Ref.','Comentario'].map(h => (
                  <th key={h} className="px-2 py-1 text-left text-[8px] font-semibold uppercase text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.refs.filter(r => r.documento).map((ref, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-2 py-1 text-gray-400">{i + 1}</td>
                  <td className="px-2 py-1">{ref.documento}</td>
                  <td className="px-2 py-1">{ref.numero}</td>
                  <td className="px-2 py-1">{fmtDate(ref.fecha)}</td>
                  <td className="px-2 py-1">{ref.cod_ref}</td>
                  <td className="px-2 py-1">{ref.comentario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ITEMS TABLE ── */}
      <div className="items-section my-3">
        <div className="items-title text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
          Detalle del Documento
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#ea580c] text-white">
              {['#','Descripción del ítem','Cant.','U.M.','Precio Un. $','Desc. %','Impuesto','Total $'].map((h, i) => (
                <th key={h} className={`px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide ${i >= 4 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {validItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-items text-center py-5 text-[11px] text-gray-400">
                  Sin ítems ingresados
                </td>
              </tr>
            ) : validItems.map((item, i) => {
              const { neto } = calcItem(item);
              const totalItem = neto * (item.tipo_imp === 'afecta' ? 1 + IVA_RATE : 1);
              return (
                <tr key={i} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                  <td className="px-2 py-1.5 text-[9px] text-gray-400">{i + 1}</td>
                  <td className="px-2 py-1.5 text-[10px] text-gray-800">{item.descripcion}</td>
                  <td className="px-2 py-1.5 text-[10px] text-right font-mono">{item.cantidad}</td>
                  <td className="px-2 py-1.5 text-[10px] text-center text-gray-500">{item.um}</td>
                  <td className="px-2 py-1.5 text-[10px] text-right font-mono">{fmt(item.precio_un)}</td>
                  <td className="px-2 py-1.5 text-[10px] text-right font-mono">{item.desc_pct > 0 ? `${item.desc_pct}%` : '—'}</td>
                  <td className="px-2 py-1.5 text-[9px] text-center">
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${item.tipo_imp === 'afecta' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      {item.tipo_imp === 'afecta' ? 'Afecta' : 'Exenta'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-[10px] text-right font-mono font-semibold">{fmt(totalItem)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── TOTALS ── */}
      <div className="totals-row flex justify-end mt-3">
        <div className="totals-box w-56 border border-gray-200 rounded-lg overflow-hidden">
          {[
            { label: 'Neto Afecto',  value: fmt(totals.afecto) },
            { label: 'Neto Exento',  value: fmt(totals.exento) },
            { label: 'IVA (19%)',    value: fmt(iva) },
          ].map(({ label, value }) => (
            <div key={label} className="totals-row-item flex justify-between border-b border-gray-100 px-3 py-1.5 text-[10px] text-gray-600">
              <span>{label}</span>
              <span className="totals-num font-mono">{value}</span>
            </div>
          ))}
          <div className="totals-row-item total flex justify-between bg-[#ea580c] px-3 py-2 text-sm font-bold text-white">
            <span>TOTAL</span>
            <span className="totals-num font-mono">${fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* ── OBSERVACIONES ── */}
      {data.observaciones && (
        <div className="obs-box border border-gray-200 rounded-lg p-3 my-4">
          <div className="obs-title text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            Observaciones
          </div>
          <div className="obs-text text-[10px] text-gray-500 whitespace-pre-wrap leading-relaxed">
            {data.observaciones}
          </div>
        </div>
      )}

      {/* ── SIGNATURES ── */}
      <div className="signatures grid grid-cols-2 gap-16 mt-12 mb-4">
        <div>
          <div className="sig-line border-t border-gray-400 pt-1 text-center text-[9px] text-gray-500">
            Firma y Timbre Emisor<br />ELEMEC
          </div>
        </div>
        <div>
          <div className="sig-line border-t border-gray-400 pt-1 text-center text-[9px] text-gray-500">
            Firma y Timbre Receptor<br />{data.cliente || '___________________________'}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="doc-footer flex justify-between mt-6 border-t border-gray-100 pt-2 text-[8px] text-gray-300">
        <span>Documento de cotización generado por ELEMEC Backoffice</span>
        <span>{EMISOR.web} | {EMISOR.email}</span>
      </div>

    </div>
  );
}
