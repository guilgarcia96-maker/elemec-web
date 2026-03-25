/**
 * Email de confirmación al cliente después de enviar una solicitud de cotización.
 * "Hemos recibido tu solicitud de cotización"
 */

import { baseLayout } from './BaseLayout';

const BRAND_ORANGE = '#f97316';

interface SolicitudRecibidaData {
  nombre: string;
  empresa?: string;
  servicio?: string;
  obra?: string;
  trackingToken?: string;
  appUrl?: string;
}

function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function solicitudRecibidaCliente(data: SolicitudRecibidaData): string {
  const trackingUrl = data.trackingToken && data.appUrl
    ? `${data.appUrl}/cotizacion/${data.trackingToken}`
    : null;

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Nombre', value: data.nombre },
  ];
  if (data.empresa) rows.push({ label: 'Empresa', value: data.empresa });
  if (data.servicio) rows.push({ label: 'Servicio solicitado', value: data.servicio });
  if (data.obra) rows.push({ label: 'Obra / Proyecto', value: data.obra });

  const tableRows = rows
    .map(
      (r) =>
        `<tr>
          <td style="padding:8px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0;white-space:nowrap">${r.label}</td>
          <td style="padding:8px 12px;font-size:13px;color:#111;border-bottom:1px solid #f0f0f0">${htmlEscape(r.value)}</td>
        </tr>`
    )
    .join('');

  const trackingBlock = trackingUrl
    ? `<p style="margin:20px 0 0">
        <a href="${trackingUrl}" style="display:inline-block;background:${BRAND_ORANGE};color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
          Ver estado de mi solicitud
        </a>
      </p>
      <p style="margin:8px 0 0;font-size:11px;color:#999">
        También puedes copiar este enlace: <a href="${trackingUrl}" style="color:${BRAND_ORANGE}">${trackingUrl}</a>
      </p>`
    : '';

  const content = `
    <p style="color:#111;margin:0 0 12px;font-size:15px">Estimado/a <strong>${htmlEscape(data.nombre)}</strong>,</p>
    <p style="color:#444;margin:0 0 20px;font-size:13px;line-height:1.6">
      Hemos recibido tu solicitud de cotización. Nuestro equipo la revisará y te contactará a la brevedad.
    </p>
    <p style="color:#666;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px">Resumen de tu solicitud</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px">
      ${tableRows}
    </table>
    ${trackingBlock}
    <p style="color:#444;font-size:13px;margin:24px 0 0;line-height:1.6">
      Si tienes alguna consulta, no dudes en contactarnos respondiendo a este correo o escribiendo a
      <a href="mailto:elemec.magallanes@gmail.com" style="color:${BRAND_ORANGE};text-decoration:none">elemec.magallanes@gmail.com</a>.
    </p>
  `;

  return baseLayout({ content, subtitle: 'Solicitud de cotización recibida' });
}
