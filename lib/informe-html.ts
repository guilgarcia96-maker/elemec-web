/**
 * Generacion de HTML para informe tecnico — uso server-side.
 * Optimizado para impresion / exportacion a PDF.
 */

/* ── Datos de ELEMEC (emisor) ─────────────────────────── */
const EMISOR = {
  nombre:      'ELEMEC',
  razonSocial: 'ELEMEC SPA.',
  rut:         '76.715.440-2',
  giro:        'Obras y Servicios de Ingenieria',
  direccion:   'Arturo Prat 1602',
  comuna:      'Punta Arenas',
  ciudad:      'Punta Arenas',
  region:      'Region de Magallanes',
  telefono:    '+56 9 9649 2917',
  email:       'contacto@elemec.cl',
  web:         'www.elemec.cl',
};

/* ── Types ───────────────────────────────────────────── */
export interface InformePDFData {
  codigo:              string;
  titulo:              string;
  servicio_tipo:       string;
  obra:                string;
  ubicacion:           string;
  fecha_trabajo:       string;
  cliente_nombre:      string;
  cliente_empresa:     string;
  responsable:         string;
  resumen_ejecutivo:   string;
  alcance:             string;
  descripcion_trabajos: string;
  hallazgos:           string;
  conclusiones:        string;
  recomendaciones:     string;
  fotos:               { descripcion: string; url: string }[];
}

/* ── Helpers ─────────────────────────────────────────── */
function esc(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function paragraphs(text: string): string {
  if (!text) return '';
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => `<p style="margin:0 0 8px;line-height:1.7">${esc(l)}</p>`)
    .join('');
}

/* ── Generador principal ─────────────────────────────── */
export function generateInformeHTML(data: InformePDFData): string {
  const folio = data.codigo || 'BORRADOR';

  // Secciones de contenido
  const sections: { title: string; content: string }[] = [
    { title: 'Resumen Ejecutivo', content: data.resumen_ejecutivo },
    { title: 'Alcance', content: data.alcance },
    { title: 'Descripcion de Trabajos', content: data.descripcion_trabajos },
    { title: 'Hallazgos', content: data.hallazgos },
    { title: 'Conclusiones', content: data.conclusiones },
    { title: 'Recomendaciones', content: data.recomendaciones },
  ].filter((s) => s.content?.trim());

  // Datos del proyecto
  const projectRows = [
    { label: 'Tipo de Servicio', value: data.servicio_tipo },
    { label: 'Obra / Proyecto',  value: data.obra },
    { label: 'Ubicacion',        value: data.ubicacion },
    { label: 'Fecha de Trabajo', value: fmtDate(data.fecha_trabajo) },
    { label: 'Responsable',      value: data.responsable },
    { label: 'Cliente',          value: data.cliente_nombre },
    { label: 'Empresa',          value: data.cliente_empresa },
  ].filter((r) => r.value && r.value !== '—');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Informe Tecnico — ${esc(folio)}</title>
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
      .page-break { page-break-before: always; }
    }
    table { width: 100%; border-collapse: collapse; }
  </style>
</head>
<body>
<div style="max-width:800px;margin:0 auto;padding:20px">

  <!-- BOTON IMPRIMIR -->
  <div class="no-print" style="text-align:right;margin-bottom:16px">
    <button onclick="window.print()" style="background:#f97316;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">
      Imprimir / Guardar PDF
    </button>
  </div>

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
        <div style="font-size:11px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:0.5px">INFORME TECNICO</div>
        <div style="font-size:9px;color:#666;margin-top:2px">RUT: ${EMISOR.rut}</div>
        <div style="font-size:24px;font-weight:900;color:#ea580c;margin-top:4px;letter-spacing:0.05em">${esc(folio)}</div>
      </div>
    </div>
  </div>

  <!-- TITULO DEL INFORME -->
  <div style="background:#f8f9fb;border-left:4px solid #f97316;padding:12px 16px;margin:16px 0;border-radius:0 6px 6px 0">
    <div style="font-size:16px;font-weight:700;color:#111">${esc(data.titulo)}</div>
  </div>

  <!-- DATOS DEL PROYECTO -->
  ${projectRows.length > 0 ? `
  <div style="margin:16px 0">
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:8px">Datos del Proyecto</div>
    <table>
      ${projectRows.map((r) => `
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:6px 10px;font-size:10px;color:#888;font-weight:600;width:140px">${r.label}</td>
          <td style="padding:6px 10px;font-size:11px;color:#111">${esc(r.value)}</td>
        </tr>
      `).join('')}
    </table>
  </div>` : ''}

  <!-- SECCIONES DE CONTENIDO -->
  ${sections.map((s) => `
  <div style="margin:20px 0">
    <h2 style="font-size:13px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:10px">${esc(s.title)}</h2>
    <div style="font-size:11px;color:#333">
      ${paragraphs(s.content)}
    </div>
  </div>
  `).join('')}

  <!-- REGISTRO FOTOGRAFICO -->
  ${data.fotos.length > 0 ? `
  <div class="page-break" style="margin:20px 0">
    <h2 style="font-size:13px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:14px">Registro Fotografico</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      ${data.fotos.map((foto, i) => `
        <div style="border:1px solid #eee;border-radius:6px;overflow:hidden">
          <img src="${esc(foto.url)}" alt="Foto ${i + 1}" style="width:100%;height:220px;object-fit:cover;display:block" />
          <div style="padding:8px 10px">
            <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:4px">Foto ${i + 1}</div>
            <div style="font-size:10px;color:#444;line-height:1.5">${esc(foto.descripcion)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  <!-- FIRMAS -->
  <table style="margin-top:50px;margin-bottom:16px">
    <tr>
      <td style="width:50%;padding-right:20px">
        <div style="border-top:1px solid #999;padding-top:4px;text-align:center;font-size:9px;color:#666">
          Responsable del Informe<br/>ELEMEC
        </div>
      </td>
      <td style="width:50%;padding-left:20px">
        <div style="border-top:1px solid #999;padding-top:4px;text-align:center;font-size:9px;color:#666">
          Recibido por<br/>${esc(data.cliente_nombre || data.cliente_empresa) || '___________________________'}
        </div>
      </td>
    </tr>
  </table>

  <!-- FOOTER -->
  <div style="display:flex;justify-content:space-between;margin-top:30px;border-top:1px solid #eee;padding-top:8px;font-size:8px;color:#bbb">
    <span>Informe tecnico generado por ELEMEC Backoffice</span>
    <span>${EMISOR.web} | ${EMISOR.email}</span>
  </div>

</div>
</body>
</html>`;
}
