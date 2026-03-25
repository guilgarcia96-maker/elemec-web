/**
 * Generación de HTML para cotización — uso server-side.
 * Replica fielmente el diseño de CotizacionPreview.tsx con CSS inline.
 * Optimizado para impresión / exportación a PDF.
 */

/* ─── Datos de ELEMEC (emisor) ─────────────────────────── */
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
  email:       'elemec.magallanes@gmail.com',
  web:         'www.elemec.cl',
};

const IVA_RATE = 0.19;

/* ─── Types ───────────────────────────────────────────── */
export interface CotizacionLineItem {
  descripcion:  string;
  cantidad:     number;
  unidad:       string;
  precio_unitario: number;
  descuento_pct:   number;
  tipo_impuesto:   'afecta' | 'exenta';
}

export interface CotizacionDocRef {
  documento:  string;
  numero:     string;
  fecha:      string;
  cod_ref:    string;
  comentario: string;
}

export interface CotizacionPDFData {
  // Documento
  codigo?:        string;
  tipo?:          string;
  tipoLabel?:     string;
  fecha:          string;
  fechaVigencia?: string;
  fechaVencimiento?: string;
  condicionVenta?: string;
  // Receptor
  cliente:        string;
  rutEmpresa?:    string;
  giro?:          string;
  direccion?:     string;
  comuna?:        string;
  ciudad?:        string;
  region?:        string;
  contacto?:      string;
  cargo?:         string;
  telefono?:      string;
  movil?:         string;
  email?:         string;
  // Proyecto / Comercial
  nombreObra?:    string;
  sucursal?:      string;
  vendedor?:      string;
  comisionPct?:   number;
  listaPrecio?:   string;
  moneda?:        string;
  tipoCambio?:    string;
  // Contenido
  glosa?:         string;
  observaciones?: string;
  items:          CotizacionLineItem[];
  referencias?:   CotizacionDocRef[];
}

/* ─── Helpers ─────────────────────────────────────────── */
function fmt(n: number): string {
  return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function esc(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function calcItem(item: CotizacionLineItem) {
  const bruto     = item.cantidad * item.precio_unitario;
  const descuento = bruto * (item.descuento_pct / 100);
  const neto      = bruto - descuento;
  return { bruto, descuento, neto };
}

/* ─── Generador principal ─────────────────────────────── */
export function generateCotizacionHTML(data: CotizacionPDFData): string {
  const validItems = data.items.filter((it) => it.descripcion?.trim());

  // Totales
  const totals = validItems.reduce(
    (acc, item) => {
      const { neto } = calcItem(item);
      if (item.tipo_impuesto === 'afecta') acc.afecto += neto;
      else acc.exento += neto;
      return acc;
    },
    { afecto: 0, exento: 0 }
  );
  const iva   = totals.afecto * IVA_RATE;
  const total = totals.afecto + totals.exento + iva;

  const moneda = data.moneda ?? 'CLP';
  const folio  = data.codigo ?? 'BORRADOR';
  const folioLabel = data.codigo ? '' : '<div style="font-size:8px;color:#888">Folio asignado al guardar</div>';

  // Receptor rows
  const receptorRows = [
    { label: 'Cliente',   value: data.cliente },
    { label: 'RUT',       value: data.rutEmpresa },
    { label: 'Giro',      value: data.giro },
    { label: 'Dirección', value: [data.direccion, data.comuna, data.ciudad].filter(Boolean).join(', ') },
    { label: 'Región',    value: data.region },
    { label: 'Contacto',  value: data.contacto },
    { label: 'Cargo',     value: data.cargo },
    { label: 'Teléfono',  value: data.telefono },
    { label: 'Móvil',     value: data.movil },
    { label: 'Email',     value: data.email },
  ].filter((r) => r.value);

  // Proyecto rows
  const proyectoRows = [
    { label: 'Proyecto',    value: data.nombreObra },
    { label: 'Sucursal',    value: data.sucursal },
    { label: 'Vendedor',    value: data.vendedor },
    { label: 'Comisión',    value: data.comisionPct ? `${data.comisionPct}%` : undefined },
    { label: 'Lista Prec.', value: data.listaPrecio },
    { label: 'Moneda',      value: moneda === 'CLP' ? 'CLP (Peso Chileno)' : `${moneda}${data.tipoCambio ? ` — TC: ${data.tipoCambio}` : ''}` },
  ].filter((r) => r.value);

  // Referencias
  const validRefs = (data.referencias ?? []).filter((r) => r.documento);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Cotización — ${esc(data.tipoLabel ?? 'Cotización')} ${esc(folio)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #111;
      background: #fff;
    }
    @page { size: A4; margin: 15mm 15mm 20mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    table { width: 100%; border-collapse: collapse; }
  </style>
</head>
<body>
<div style="max-width:800px;margin:0 auto;padding:20px">

  <!-- HEADER -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #ea580c;padding-bottom:12px;margin-bottom:12px">
    <div>
      <div style="font-size:22px;font-weight:700;color:#f97316;letter-spacing:0.1em">${EMISOR.nombre}</div>
      <div style="font-size:9px;color:#666;letter-spacing:1px;text-transform:uppercase;margin-top:2px">${EMISOR.giro}</div>
      <div style="font-size:10px;color:#444;line-height:1.6;margin-top:6px">
        <div>RUT: <strong style="color:#333">${EMISOR.rut}</strong></div>
        <div>${EMISOR.direccion}, ${EMISOR.comuna}</div>
        <div>${EMISOR.region} — ${EMISOR.ciudad}</div>
        <div>${EMISOR.telefono} | ${EMISOR.email}</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="display:inline-block;border:2px solid #ea580c;border-radius:6px;padding:10px 18px;text-align:center;min-width:180px">
        <div style="font-size:11px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:0.5px">${esc(data.tipoLabel ?? 'COTIZACIÓN')}</div>
        <div style="font-size:9px;color:#666;margin-top:2px">RUT: ${EMISOR.rut}</div>
        <div style="font-size:28px;font-weight:900;color:#ea580c;margin-top:4px;letter-spacing:0.05em">${esc(folio)}</div>
        ${folioLabel}
      </div>
    </div>
  </div>

  <!-- DATES ROW -->
  <table style="margin:10px 0">
    <tr>
      ${[
        { label: 'Fecha Emisión', value: fmtDate(data.fecha) },
        { label: 'Fecha Vigencia', value: fmtDate(data.fechaVigencia) },
        { label: 'Cond. de Venta', value: esc(data.condicionVenta) || '—' },
        { label: 'Fecha Vencimiento', value: fmtDate(data.fechaVencimiento) },
      ].map((d) => `
        <td style="border:1px solid #ddd;border-radius:4px;padding:6px 8px;text-align:center;width:25%">
          <div style="font-size:8px;color:#888;text-transform:uppercase;letter-spacing:0.5px">${d.label}</div>
          <div style="font-size:11px;font-weight:600;color:#111;margin-top:2px">${d.value}</div>
        </td>
      `).join('')}
    </tr>
  </table>

  <!-- PARTIES -->
  <table style="margin:14px 0">
    <tr>
      <!-- Receptor -->
      <td style="width:50%;vertical-align:top;padding-right:8px">
        <div style="border:1px solid #ddd;border-radius:6px;padding:10px 12px">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:8px">Datos del Receptor</div>
          ${receptorRows.map((r) => `
            <div style="display:flex;gap:6px;margin-bottom:3px">
              <span style="font-size:8px;color:#888;min-width:55px">${r.label}:</span>
              <span style="font-size:10px;color:#111;font-weight:500">${esc(r.value)}</span>
            </div>
          `).join('')}
        </div>
      </td>
      <!-- Proyecto / Comercial -->
      <td style="width:50%;vertical-align:top;padding-left:8px">
        <div style="border:1px solid #ddd;border-radius:6px;padding:10px 12px">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:8px">Proyecto / Comercial</div>
          ${proyectoRows.map((r) => `
            <div style="display:flex;gap:6px;margin-bottom:3px">
              <span style="font-size:8px;color:#888;min-width:55px">${r.label}:</span>
              <span style="font-size:10px;color:#111;font-weight:500">${esc(r.value)}</span>
            </div>
          `).join('')}
        </div>
      </td>
    </tr>
  </table>

  ${data.glosa ? `
  <!-- GLOSA -->
  <div style="background:#f8f9fb;border-left:3px solid #1a1a2e;padding:6px 10px;margin:10px 0;font-size:11px;color:#333;border-radius:0 4px 4px 0;font-style:italic">
    <strong style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#888;font-style:normal">Glosa: </strong>
    ${esc(data.glosa)}
  </div>` : ''}

  ${validRefs.length > 0 ? `
  <!-- REFERENCIAS -->
  <div style="margin:14px 0">
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:6px">Referencias del Documento</div>
    <table>
      <thead>
        <tr style="background:#f3f4f6">
          ${['#', 'Documento', 'Número', 'Fecha', 'Cód. Ref.', 'Comentario'].map((h) =>
            `<th style="padding:4px 8px;text-align:left;font-size:8px;font-weight:600;text-transform:uppercase;color:#666">${h}</th>`
          ).join('')}
        </tr>
      </thead>
      <tbody>
        ${validRefs.map((ref, i) => `
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:4px 8px;font-size:10px;color:#888">${i + 1}</td>
            <td style="padding:4px 8px;font-size:10px">${esc(ref.documento)}</td>
            <td style="padding:4px 8px;font-size:10px">${esc(ref.numero)}</td>
            <td style="padding:4px 8px;font-size:10px">${fmtDate(ref.fecha)}</td>
            <td style="padding:4px 8px;font-size:10px">${esc(ref.cod_ref)}</td>
            <td style="padding:4px 8px;font-size:10px">${esc(ref.comentario)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- ITEMS TABLE -->
  <div style="margin:14px 0">
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:6px">Detalle del Documento</div>
    <table>
      <thead>
        <tr style="background:#ea580c;color:#fff">
          ${['#', 'Descripción del ítem', 'Cant.', 'U.M.', 'Precio Un. $', 'Desc. %', 'Impuesto', 'Total $'].map((h, i) =>
            `<th style="padding:6px 8px;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:${i >= 4 ? 'right' : 'left'}">${h}</th>`
          ).join('')}
        </tr>
      </thead>
      <tbody>
        ${validItems.length === 0 ? `
          <tr><td colspan="8" style="text-align:center;padding:20px;color:#aaa;font-size:11px">Sin ítems ingresados</td></tr>
        ` : validItems.map((item, i) => {
          const { neto } = calcItem(item);
          const totalItem = neto * (item.tipo_impuesto === 'afecta' ? 1 + IVA_RATE : 1);
          const bgColor = i % 2 === 1 ? '#f8f9fb' : '#fff';
          const impBg = item.tipo_impuesto === 'afecta' ? 'background:#eff6ff;color:#2563eb' : 'background:#f0fdf4;color:#16a34a';
          const impLabel = item.tipo_impuesto === 'afecta' ? 'Afecta' : 'Exenta';
          return `
          <tr style="border-bottom:1px solid #eee;background:${bgColor}">
            <td style="padding:5px 8px;font-size:9px;color:#888">${i + 1}</td>
            <td style="padding:5px 8px;font-size:10px;color:#222">${esc(item.descripcion)}</td>
            <td style="padding:5px 8px;font-size:10px;text-align:right;font-family:monospace">${item.cantidad}</td>
            <td style="padding:5px 8px;font-size:10px;text-align:center;color:#666">${esc(item.unidad)}</td>
            <td style="padding:5px 8px;font-size:10px;text-align:right;font-family:monospace">${fmt(item.precio_unitario)}</td>
            <td style="padding:5px 8px;font-size:10px;text-align:right;font-family:monospace">${item.descuento_pct > 0 ? `${item.descuento_pct}%` : '—'}</td>
            <td style="padding:5px 8px;font-size:9px;text-align:center">
              <span style="border-radius:4px;padding:2px 6px;font-size:8px;font-weight:500;${impBg}">${impLabel}</span>
            </td>
            <td style="padding:5px 8px;font-size:10px;text-align:right;font-family:monospace;font-weight:600">${fmt(totalItem)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- TOTALS -->
  <div style="display:flex;justify-content:flex-end;margin-top:10px">
    <div style="width:240px;border:1px solid #ddd;border-radius:6px;overflow:hidden">
      ${[
        { label: 'Neto Afecto', value: fmt(totals.afecto) },
        { label: 'Neto Exento', value: fmt(totals.exento) },
        { label: 'IVA (19%)',   value: fmt(iva) },
      ].map((r) => `
        <div style="display:flex;justify-content:space-between;padding:5px 10px;font-size:10px;border-bottom:1px solid #eee;color:#555">
          <span>${r.label}</span>
          <span style="font-family:monospace">${r.value}</span>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;padding:8px 10px;font-size:13px;font-weight:700;background:#ea580c;color:#fff">
        <span>TOTAL</span>
        <span style="font-family:monospace">$${fmt(total)}</span>
      </div>
    </div>
  </div>

  ${data.observaciones ? `
  <!-- OBSERVACIONES -->
  <div style="border:1px solid #ddd;border-radius:6px;padding:10px 12px;margin:14px 0">
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:6px">Observaciones</div>
    <div style="font-size:10px;color:#444;white-space:pre-wrap;line-height:1.6">${esc(data.observaciones)}</div>
  </div>` : ''}

  <!-- SIGNATURES -->
  <div style="page-break-inside:avoid;margin-top:80px">
    <table style="width:100%;margin-bottom:16px">
      <tr>
        <td style="width:45%;padding-right:30px;vertical-align:bottom">
          <div style="height:80px"></div>
          <div style="border-top:1px solid #666;padding-top:6px;text-align:center">
            <div style="font-size:9px;font-weight:600;color:#444">Firma y Timbre Emisor</div>
            <div style="font-size:9px;color:#888;margin-top:2px">ELEMEC</div>
          </div>
        </td>
        <td style="width:10%"></td>
        <td style="width:45%;padding-left:30px;vertical-align:bottom">
          <div style="height:80px"></div>
          <div style="border-top:1px solid #666;padding-top:6px;text-align:center">
            <div style="font-size:9px;font-weight:600;color:#444">Firma y Timbre Receptor</div>
            <div style="font-size:9px;color:#888;margin-top:2px">${esc(data.cliente) || '___________________________'}</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- FOOTER -->
  <div style="display:flex;justify-content:space-between;margin-top:30px;border-top:1px solid #eee;padding-top:8px;font-size:8px;color:#bbb">
    <span>Documento de cotización generado por ELEMEC Backoffice</span>
    <span>${EMISOR.web} | ${EMISOR.email}</span>
  </div>

</div>
</body>
</html>`;
}
