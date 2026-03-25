/**
 * Generación de HTML para informe técnico — uso server-side.
 * Plantilla profesional optimizada para impresión / exportación a PDF.
 * Soporta @page CSS, contadores de página, portada completa y registro fotográfico.
 */

/* ── Datos de ELEMEC (emisor) ─────────────────────────── */
const EMISOR = {
  nombre:      'ELEMEC',
  razonSocial: 'ELEMEC SPA.',
  rut:         '76.715.440-2',
  giro:        'Obras y Servicios de Ingeniería',
  subtitulo:   'OBRAS Y SERVICIOS DE INGENIERÍA',
  direccion:   'Arturo Prat 1602',
  comuna:      'Punta Arenas',
  ciudad:      'Punta Arenas',
  region:      'Región de Magallanes',
  telefono:    '+56 9 9649 2917',
  email:       'contacto@elemec.cl',
  web:         'www.elemec.cl',
};

/* ── Types ───────────────────────────────────────────── */
export interface InformePDFData {
  // Encabezado
  codigo:          string;
  titulo:          string;
  servicio_tipo:   string;
  fecha_trabajo:   string;
  ubicacion:       string;
  // Cliente
  cliente_nombre:  string;
  cliente_empresa: string;
  obra:            string;
  // Responsable
  responsable_nombre: string;
  // Secciones dinámicas
  secciones: Array<{
    titulo:    string;
    contenido: string;
    tipo:      'texto' | 'fotos' | 'conclusion';
  }>;
  // Fotos
  fotos: Array<{
    url:        string;
    descripcion: string;
    orden:      number;
  }>;
  // Metadata
  fecha_emision: string;
  estado:        string;
}

/* ── Helpers ─────────────────────────────────────────── */
function esc(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return iso;
}

function paragraphs(text: string): string {
  if (!text?.trim()) return '';
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => `<p>${esc(l)}</p>`)
    .join('');
}

function servicioLabel(tipo: string): string {
  const map: Record<string, string> = {
    montaje:      'Montaje e Instalaciones',
    mantenimiento: 'Mantención de Equipos',
    aislacion:    'Aislación Térmica',
    ingenieria:   'Ingeniería y Diseño',
    otro:         'Otro Servicio',
  };
  return map[tipo] ?? tipo;
}

/* ── Generador principal ─────────────────────────────── */
export function generateInformeHTML(data: InformePDFData): string {
  const folio         = data.codigo || 'BORRADOR';
  const titulo        = data.titulo || 'Informe Técnico';
  const tituloCorto   = titulo.length > 55 ? titulo.substring(0, 52) + '…' : titulo;
  const servicioTipo  = servicioLabel(data.servicio_tipo);
  const fechaTrabajo  = fmtDate(data.fecha_trabajo);
  const fechaEmision  = fmtDate(data.fecha_emision);

  // Separar secciones por tipo
  const seccionesTexto     = data.secciones.filter((s) => s.tipo === 'texto'     && s.contenido?.trim());
  const seccionesConclusion = data.secciones.filter((s) => s.tipo === 'conclusion' && s.contenido?.trim());
  const tieneFotos         = data.fotos.length > 0;

  // Fotos ordenadas
  const fotosOrdenadas = [...data.fotos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Informe Técnico — ${esc(folio)}</title>
  <style>
    /* ── Reset & base ─────────────────────────────────── */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: system-ui, -apple-system, 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #111827;
      background: #fff;
      line-height: 1.6;
    }

    /* ── Print / page setup ───────────────────────────── */
    @page {
      size: A4;
      margin: 20mm 15mm 25mm 15mm;
    }
    @page :first {
      margin: 0;
    }
    @media print {
      html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }

    /* ── CSS counters para numeración de páginas ─────── */
    body { counter-reset: page-counter; }

    /* ── Portada (primera página) ─────────────────────── */
    .cover {
      width: 210mm;
      min-height: 297mm;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      position: relative;
      background: #fff;
      overflow: hidden;
    }
    .cover-accent-top {
      height: 8mm;
      background: #f97316;
      width: 100%;
    }
    .cover-body {
      flex: 1;
      padding: 16mm 18mm 12mm 18mm;
      display: flex;
      flex-direction: column;
    }
    .cover-logo-area {
      margin-bottom: 14mm;
    }
    .cover-logo-name {
      font-size: 38pt;
      font-weight: 800;
      color: #f97316;
      letter-spacing: 0.08em;
      line-height: 1;
    }
    .cover-logo-sub {
      font-size: 8pt;
      color: #6b7280;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .cover-company-data {
      font-size: 8.5pt;
      color: #6b7280;
      line-height: 1.7;
      margin-top: 6px;
    }
    .cover-divider {
      width: 100%;
      height: 1px;
      background: #e5e7eb;
      margin: 10mm 0;
    }
    .cover-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 10mm 0;
    }
    .cover-doc-type {
      display: inline-block;
      background: #fff7ed;
      border: 1.5px solid #f97316;
      border-radius: 20px;
      padding: 4px 18px;
      font-size: 8pt;
      font-weight: 700;
      color: #ea580c;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 10mm;
    }
    .cover-title {
      font-size: 24pt;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 6mm;
    }
    .cover-subtitle {
      font-size: 14pt;
      font-weight: 400;
      color: #374151;
      max-width: 140mm;
      line-height: 1.4;
      margin-bottom: 8mm;
    }
    .cover-folio-badge {
      border: 2px solid #f97316;
      border-radius: 8px;
      padding: 6px 20px;
      display: inline-block;
      margin-bottom: 12mm;
    }
    .cover-folio-label {
      font-size: 7pt;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }
    .cover-folio-code {
      font-size: 20pt;
      font-weight: 900;
      color: #f97316;
      letter-spacing: 0.06em;
    }
    .cover-info-box {
      width: 100%;
      max-width: 150mm;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 8mm;
    }
    .cover-info-header {
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      padding: 5px 14px;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #9ca3af;
    }
    .cover-info-row {
      display: flex;
      padding: 5px 14px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 9pt;
    }
    .cover-info-row:last-child { border-bottom: none; }
    .cover-info-label {
      min-width: 90px;
      color: #6b7280;
      font-size: 8pt;
    }
    .cover-info-value {
      color: #111827;
      font-weight: 500;
      font-size: 9pt;
    }
    .cover-footer {
      padding: 8mm 18mm;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 8pt;
      color: #9ca3af;
    }
    .cover-accent-bottom {
      height: 4mm;
      background: #f97316;
      width: 100%;
    }

    /* ── Contenedor del documento (páginas 2+) ────────── */
    .document {
      max-width: 180mm;
      margin: 0 auto;
    }

    /* ── Running header (páginas 2+) ─────────────────── */
    .running-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #f97316;
      padding-bottom: 6px;
      margin-bottom: 14mm;
      font-size: 8pt;
    }
    .rh-left {
      font-weight: 800;
      color: #f97316;
      letter-spacing: 0.08em;
      font-size: 10pt;
    }
    .rh-center {
      color: #6b7280;
      text-align: center;
      flex: 1;
      margin: 0 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rh-right {
      font-weight: 600;
      color: #374151;
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      white-space: nowrap;
    }

    /* ── Running footer (todas las páginas 2+) ────────── */
    @page {
      @bottom-left {
        content: "ELEMEC SPA · RUT 76.715.440-2";
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 7pt;
        color: #9ca3af;
        border-top: 1px solid #f97316;
        padding-top: 4px;
      }
      @bottom-center {
        content: "Confidencial";
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 7pt;
        color: #9ca3af;
        border-top: 1px solid #f97316;
        padding-top: 4px;
      }
      @bottom-right {
        content: "Página " counter(page);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 7pt;
        color: #9ca3af;
        border-top: 1px solid #f97316;
        padding-top: 4px;
      }
    }
    @page :first {
      @bottom-left { content: none; border-top: none; }
      @bottom-center { content: none; border-top: none; }
      @bottom-right { content: none; border-top: none; }
    }

    /* Fallback footer para pantalla (navegador) */
    .page-footer {
      display: none;
    }
    @media screen {
      .page-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1.5px solid #f97316;
        padding-top: 6px;
        margin-top: 30px;
        font-size: 7.5pt;
        color: #9ca3af;
      }
    }

    /* ── Secciones de contenido ───────────────────────── */
    .section {
      margin: 0 0 10mm 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 700;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 0.10em;
      border-left: 4px solid #f97316;
      padding-left: 10px;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .section-body {
      font-size: 11pt;
      color: #374151;
      line-height: 1.7;
      text-align: justify;
    }
    .section-body p {
      margin-bottom: 7px;
    }
    .section-body p:last-child { margin-bottom: 0; }

    /* ── Secciones de conclusión ──────────────────────── */
    .section-conclusion {
      background: #fff7ed;
      border-left: 6px solid #f97316;
      border-radius: 0 8px 8px 0;
      padding: 10px 14px;
      margin: 0 0 8mm 0;
      page-break-inside: avoid;
    }
    .section-conclusion .section-title {
      border-left: none;
      padding-left: 0;
      color: #c2410c;
    }
    .section-conclusion .section-body {
      color: #374151;
    }

    /* ── Cuadro datos del proyecto ────────────────────── */
    .project-box {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 10mm;
      page-break-inside: avoid;
    }
    .project-box-header {
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      padding: 6px 14px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #9ca3af;
    }
    .project-box table {
      width: 100%;
      border-collapse: collapse;
    }
    .project-box td {
      padding: 5px 14px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
    }
    .project-box tr:last-child td { border-bottom: none; }
    .project-box .td-label {
      font-size: 8pt;
      color: #9ca3af;
      font-weight: 600;
      width: 120px;
      white-space: nowrap;
    }
    .project-box .td-value {
      font-size: 9.5pt;
      color: #111827;
      font-weight: 500;
    }

    /* ── Registro fotográfico ─────────────────────────── */
    .photo-section {
      page-break-before: always;
      margin-bottom: 10mm;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6mm;
      margin-top: 6mm;
    }
    .photo-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .photo-card img {
      width: 100%;
      height: 55mm;
      object-fit: cover;
      display: block;
    }
    .photo-caption {
      padding: 6px 10px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .photo-caption-number {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.10em;
      color: #9ca3af;
      margin-bottom: 2px;
    }
    .photo-caption-desc {
      font-size: 8.5pt;
      color: #6b7280;
      font-style: italic;
      line-height: 1.4;
    }

    /* ── Bloque de firmas ─────────────────────────────── */
    .signatures {
      margin-top: 18mm;
      page-break-inside: avoid;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20mm;
    }
    .sig-block {
      text-align: center;
    }
    .sig-line {
      border-bottom: 1.5px dotted #9ca3af;
      height: 18mm;
      margin-bottom: 6px;
    }
    .sig-role {
      font-size: 8pt;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .sig-name {
      font-size: 9pt;
      color: #111827;
      font-weight: 600;
      margin-top: 2px;
    }
    .sig-company {
      font-size: 8pt;
      color: #6b7280;
      margin-top: 1px;
    }

    /* ── Utilidades ───────────────────────────────────── */
    .page-break-before { page-break-before: always; }
    table { border-collapse: collapse; }
  </style>
</head>
<body>

<!-- ════════════════════════════════════════════════════
     PORTADA (página 1 — full bleed)
     ════════════════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-accent-top"></div>

  <div class="cover-body">
    <!-- Logo ELEMEC + datos empresa -->
    <div class="cover-logo-area">
      <div class="cover-logo-name">${EMISOR.nombre}</div>
      <div class="cover-logo-sub">${EMISOR.subtitulo}</div>
      <div class="cover-company-data">
        RUT ${EMISOR.rut} &nbsp;·&nbsp; ${EMISOR.direccion}, ${EMISOR.comuna}
        &nbsp;·&nbsp; ${EMISOR.telefono}
      </div>
    </div>

    <div class="cover-divider"></div>

    <!-- Título central -->
    <div class="cover-main">
      <div class="cover-doc-type">${esc(servicioTipo)}</div>

      <div class="cover-title">INFORME TÉCNICO</div>

      <div class="cover-subtitle">${esc(titulo)}</div>

      <div class="cover-folio-badge">
        <div class="cover-folio-label">Folio</div>
        <div class="cover-folio-code">${esc(folio)}</div>
      </div>

      <!-- Cuadro cliente -->
      <div class="cover-info-box">
        <div class="cover-info-header">Datos del Cliente</div>
        ${data.cliente_empresa ? `<div class="cover-info-row"><span class="cover-info-label">Empresa</span><span class="cover-info-value">${esc(data.cliente_empresa)}</span></div>` : ''}
        ${data.cliente_nombre  ? `<div class="cover-info-row"><span class="cover-info-label">Contacto</span><span class="cover-info-value">${esc(data.cliente_nombre)}</span></div>`  : ''}
        ${data.obra            ? `<div class="cover-info-row"><span class="cover-info-label">Obra / Proyecto</span><span class="cover-info-value">${esc(data.obra)}</span></div>`            : ''}
      </div>

      <!-- Cuadro documento -->
      <div class="cover-info-box">
        <div class="cover-info-header">Información del Documento</div>
        ${data.ubicacion      ? `<div class="cover-info-row"><span class="cover-info-label">Ubicación</span><span class="cover-info-value">${esc(data.ubicacion)}</span></div>`      : ''}
        ${fechaTrabajo !== '—' ? `<div class="cover-info-row"><span class="cover-info-label">Fecha Trabajo</span><span class="cover-info-value">${fechaTrabajo}</span></div>` : ''}
        <div class="cover-info-row"><span class="cover-info-label">Fecha Emisión</span><span class="cover-info-value">${fechaEmision !== '—' ? fechaEmision : fmtDate(new Date().toISOString().split('T')[0])}</span></div>
        ${data.responsable_nombre ? `<div class="cover-info-row"><span class="cover-info-label">Responsable</span><span class="cover-info-value">${esc(data.responsable_nombre)}</span></div>` : ''}
        <div class="cover-info-row"><span class="cover-info-label">Estado</span><span class="cover-info-value" style="text-transform:capitalize">${esc(data.estado || 'Borrador')}</span></div>
      </div>
    </div>
  </div>

  <div class="cover-footer">
    <span>${EMISOR.razonSocial} &nbsp;·&nbsp; RUT ${EMISOR.rut}</span>
    <span>${EMISOR.direccion}, ${EMISOR.comuna} &nbsp;·&nbsp; ${EMISOR.telefono}</span>
  </div>
  <div class="cover-accent-bottom"></div>
</div>

<!-- ════════════════════════════════════════════════════
     CONTENIDO DEL INFORME (páginas 2+)
     ════════════════════════════════════════════════════ -->
<div class="document">

  <!-- Header de páginas internas -->
  <div class="running-header">
    <span class="rh-left">${EMISOR.nombre}</span>
    <span class="rh-center">${esc(tituloCorto)}</span>
    <span class="rh-right">${esc(folio)}</span>
  </div>

  <!-- Datos del proyecto -->
  <div class="project-box">
    <div class="project-box-header">Datos del Proyecto</div>
    <table>
      ${[
        { label: 'Tipo de Servicio', value: servicioTipo },
        { label: 'Obra / Proyecto',  value: data.obra },
        { label: 'Ubicación',        value: data.ubicacion },
        { label: 'Fecha de Trabajo', value: fechaTrabajo },
        { label: 'Responsable',      value: data.responsable_nombre },
        { label: 'Cliente',          value: data.cliente_nombre },
        { label: 'Empresa',          value: data.cliente_empresa },
        { label: 'Fecha de Emisión', value: fechaEmision },
      ]
        .filter((r) => r.value && r.value !== '—')
        .map((r) => `
      <tr>
        <td class="td-label">${esc(r.label)}</td>
        <td class="td-value">${esc(r.value)}</td>
      </tr>`)
        .join('')}
    </table>
  </div>

  <!-- Secciones de texto -->
  ${seccionesTexto.map((s) => `
  <div class="section">
    <div class="section-title">${esc(s.titulo)}</div>
    <div class="section-body">${paragraphs(s.contenido)}</div>
  </div>`).join('')}

  <!-- Registro fotográfico -->
  ${tieneFotos ? `
  <div class="photo-section">
    <div class="section-title">Registro Fotográfico</div>
    <div class="photo-grid">
      ${fotosOrdenadas.map((foto, i) => `
      <div class="photo-card">
        <img src="${esc(foto.url)}" alt="Foto ${i + 1}" loading="eager" />
        <div class="photo-caption">
          <div class="photo-caption-number">Foto ${i + 1}</div>
          ${foto.descripcion ? `<div class="photo-caption-desc">${esc(foto.descripcion)}</div>` : ''}
        </div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  <!-- Secciones de conclusión / recomendaciones -->
  ${seccionesConclusion.length > 0 ? `
  <div class="page-break-before" style="margin-top:0">
    ${seccionesConclusion.map((s) => `
    <div class="section-conclusion">
      <div class="section-title">${esc(s.titulo)}</div>
      <div class="section-body">${paragraphs(s.contenido)}</div>
    </div>`).join('')}
  </div>` : ''}

  <!-- Bloque de firmas -->
  <div class="signatures">
    <div class="signatures-grid">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-role">Firma y Timbre Emisor</div>
        <div class="sig-name">${esc(data.responsable_nombre) || 'Responsable ELEMEC'}</div>
        <div class="sig-company">${EMISOR.razonSocial}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-role">Firma y Timbre Receptor</div>
        <div class="sig-name">${esc(data.cliente_nombre) || '___________________________'}</div>
        <div class="sig-company">${esc(data.cliente_empresa) || ''}</div>
      </div>
    </div>
  </div>

  <!-- Footer de pantalla (fallback, no imprime gracias a @page) -->
  <div class="page-footer">
    <span>ELEMEC SPA · RUT ${EMISOR.rut}</span>
    <span>Confidencial</span>
    <span>${EMISOR.web} | ${EMISOR.email}</span>
  </div>

</div><!-- /.document -->

</body>
</html>`;
}
