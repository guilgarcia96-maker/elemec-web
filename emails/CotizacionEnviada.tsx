/**
 * Email formal de cotización enviada al cliente.
 * Se envía cuando el estado pasa a "cotizada".
 */

import { baseLayout } from './BaseLayout';

const BRAND_ORANGE = '#f97316';

interface CotizacionEnviadaData {
  nombre: string;
  codigo?: string;
  tipoDocumento?: string;
  nombreObra?: string;
  total?: string;
  moneda?: string;
  trackingToken?: string;
  appUrl?: string;
  /** Indica si se adjuntó PDF al correo */
  incluyePdf?: boolean;
}

function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function cotizacionEnviada(data: CotizacionEnviadaData): string {
  const trackingUrl = data.trackingToken && data.appUrl
    ? `${data.appUrl}/cotizacion/${data.trackingToken}`
    : null;

  const moneda = data.moneda ?? 'CLP';
  const tipoDoc = data.tipoDocumento
    ? `<tr><td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">Tipo documento</td><td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #f0f0f0">${htmlEscape(data.tipoDocumento)}</td></tr>`
    : '';

  const trackingBlock = trackingUrl
    ? `<p style="margin:20px 0 0">
        <a href="${trackingUrl}" style="display:inline-block;background:${BRAND_ORANGE};color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
          Ver mi cotización
        </a>
      </p>`
    : '';

  const pdfNote = data.incluyePdf
    ? `<p style="color:#666;font-size:12px;margin:16px 0 0;padding:10px 12px;background:#fef9f0;border-left:3px solid ${BRAND_ORANGE};border-radius:0 4px 4px 0">
        📎 Se adjunta el documento de cotización en formato PDF.
      </p>`
    : '';

  const content = `
    <p style="color:#111;margin:0 0 12px;font-size:15px">Estimado/a <strong>${htmlEscape(data.nombre)}</strong>,</p>
    <p style="color:#444;margin:0 0 20px;font-size:13px;line-height:1.6">
      A continuación encontrará los detalles de la cotización enviada por <strong>ELEMEC SPA.</strong>
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px">
      <tr>
        <td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">N° Cotización</td>
        <td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #f0f0f0"><strong>${data.codigo ?? 'Pendiente'}</strong></td>
      </tr>
      ${tipoDoc}
      <tr>
        <td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">Proyecto / Obra</td>
        <td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #f0f0f0">${htmlEscape(data.nombreObra ?? '')}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600">Total</td>
        <td style="padding:8px 12px;font-size:16px;color:#ea580c;font-weight:700">$${data.total ?? '0'} ${moneda}</td>
      </tr>
    </table>
    ${pdfNote}
    ${trackingBlock}
    <p style="color:#444;font-size:13px;margin:24px 0 4px">Para consultas o más información:</p>
    <p style="margin:0 0 0">
      <a href="mailto:contacto@elemec.cl" style="color:${BRAND_ORANGE};text-decoration:none">contacto@elemec.cl</a>
      &nbsp;·&nbsp;
      <a href="tel:+56996492917" style="color:${BRAND_ORANGE};text-decoration:none">+56 9 9649 2917</a>
    </p>
  `;

  return baseLayout({ content, subtitle: 'Cotización formal' });
}
