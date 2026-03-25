/**
 * Email enviado al cliente cuando se emite un informe técnico.
 */

import { baseLayout } from './BaseLayout';

const BRAND_ORANGE = '#f97316';

interface InformeEmitidoData {
  nombre: string;
  codigo?: string;
  titulo: string;
  obra?: string;
  servicio?: string;
  fechaTrabajo?: string;
  trackingUrl?: string;
}

function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function informeEmitido(data: InformeEmitidoData): string {
  const trackingBlock = data.trackingUrl
    ? `<p style="margin:20px 0 0">
        <a href="${data.trackingUrl}" style="display:inline-block;background:${BRAND_ORANGE};color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
          Ver informe
        </a>
      </p>`
    : '';

  const obraRow = data.obra
    ? `<tr>
        <td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">Proyecto / Obra</td>
        <td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #f0f0f0">${htmlEscape(data.obra)}</td>
      </tr>`
    : '';

  const servicioRow = data.servicio
    ? `<tr>
        <td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">Tipo de servicio</td>
        <td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #f0f0f0">${htmlEscape(data.servicio)}</td>
      </tr>`
    : '';

  const fechaRow = data.fechaTrabajo
    ? `<tr>
        <td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">Fecha de trabajos</td>
        <td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #f0f0f0">${htmlEscape(data.fechaTrabajo)}</td>
      </tr>`
    : '';

  const content = `
    <p style="color:#111;margin:0 0 12px;font-size:15px">Estimado/a <strong>${htmlEscape(data.nombre)}</strong>,</p>
    <p style="color:#444;margin:0 0 20px;font-size:13px;line-height:1.6">
      Le informamos que se ha emitido el siguiente informe técnico por parte de <strong>ELEMEC SPA</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px">
      <tr>
        <td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">N° Informe</td>
        <td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #f0f0f0"><strong>${htmlEscape(data.codigo ?? 'Pendiente')}</strong></td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">Título</td>
        <td style="padding:8px 12px;font-size:13px;color:${BRAND_ORANGE};font-weight:700;border-bottom:1px solid #f0f0f0">${htmlEscape(data.titulo)}</td>
      </tr>
      ${obraRow}
      ${servicioRow}
      ${fechaRow}
    </table>
    ${trackingBlock}
    <p style="color:#444;font-size:13px;margin:24px 0 4px">Para consultas o más información:</p>
    <p style="margin:0 0 0">
      <a href="mailto:contacto@elemec.cl" style="color:${BRAND_ORANGE};text-decoration:none">contacto@elemec.cl</a>
      &nbsp;·&nbsp;
      <a href="tel:+56996492917" style="color:${BRAND_ORANGE};text-decoration:none">+56 9 9649 2917</a>
    </p>
  `;

  return baseLayout({ content, subtitle: 'Informe técnico emitido' });
}
