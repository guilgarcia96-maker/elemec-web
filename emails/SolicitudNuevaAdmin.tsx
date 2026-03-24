/**
 * Email de notificación al equipo admin cuando llega una nueva solicitud de cotización.
 * Reemplaza el HTML inline de app/api/cotizacion/route.ts.
 */

import { baseLayout } from './BaseLayout';

interface SolicitudNuevaAdminData {
  /** Pares campo→valor para mostrar en la tabla */
  campos: Array<{ label: string; value: string }>;
  /** Nombres de archivos adjuntos (si los hay) */
  archivos?: string[];
  /** URL del panel admin para ver el detalle */
  adminDetailUrl?: string;
  /** Fecha/hora de envío formateada */
  fechaEnvio: string;
}

function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function solicitudNuevaAdmin(data: SolicitudNuevaAdminData): string {
  const tableRows = data.campos
    .filter((c) => c.value)
    .map(
      (c) =>
        `<tr>
          <td style="padding:6px 12px;font-weight:600;color:#555;white-space:nowrap;border-bottom:1px solid #f0f0f0;font-size:12px">${c.label}</td>
          <td style="padding:6px 12px;color:#111;border-bottom:1px solid #f0f0f0;font-size:13px">${htmlEscape(c.value)}</td>
        </tr>`
    )
    .join('');

  const archivosRow =
    data.archivos && data.archivos.length > 0
      ? `<tr>
          <td style="padding:6px 12px;font-weight:600;color:#555;white-space:nowrap;font-size:12px">Archivos adjuntos</td>
          <td style="padding:6px 12px;font-size:13px;color:#111">${data.archivos.map((f) => htmlEscape(f)).join('<br/>')}</td>
        </tr>`
      : '';

  const adminLink = data.adminDetailUrl
    ? `<p style="margin:20px 0 0">
        <a href="${data.adminDetailUrl}" style="display:inline-block;background:#1a1a2e;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
          Ver en panel de administración
        </a>
      </p>`
    : '';

  const content = `
    <table style="width:100%;border-collapse:collapse;margin:0 0 12px">
      ${tableRows}
      ${archivosRow}
    </table>
    <p style="color:#999;font-size:12px;margin:12px 0 0">
      Enviado el ${data.fechaEnvio}
    </p>
    ${adminLink}
  `;

  return baseLayout({ content, subtitle: 'Nueva solicitud de cotización' });
}
