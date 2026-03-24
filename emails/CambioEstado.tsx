/**
 * Email genérico de notificación de cambio de estado en una cotización.
 * Configurable para distintas transiciones.
 */

import { baseLayout } from './BaseLayout';

const BRAND_ORANGE = '#f97316';

/** Mapeo de estados internos a etiquetas legibles */
const ESTADO_LABELS: Record<string, string> = {
  nueva: 'Nueva',
  proceso: 'En proceso',
  en_revision: 'En revisión',
  cotizada: 'Cotizada',
  ganada: 'Ganada',
  perdida: 'Perdida',
};

/** Colores de fondo para cada estado */
const ESTADO_COLORS: Record<string, string> = {
  nueva: '#3b82f6',
  proceso: '#eab308',
  en_revision: '#8b5cf6',
  cotizada: '#f97316',
  ganada: '#22c55e',
  perdida: '#ef4444',
};

interface CambioEstadoData {
  nombre: string;
  codigo?: string;
  estadoAnterior: string;
  estadoNuevo: string;
  fecha: string;
  comentario?: string;
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

function estadoBadge(estado: string): string {
  const label = ESTADO_LABELS[estado] ?? estado;
  const color = ESTADO_COLORS[estado] ?? '#666';
  return `<span style="display:inline-block;background:${color};color:#fff;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600">${label}</span>`;
}

export function cambioEstado(data: CambioEstadoData): string {
  const trackingUrl = data.trackingToken && data.appUrl
    ? `${data.appUrl}/cotizacion/${data.trackingToken}`
    : null;

  const comentarioBlock = data.comentario
    ? `<div style="margin:16px 0;padding:12px;background:#f8f9fb;border-left:3px solid #ddd;border-radius:0 4px 4px 0">
        <p style="margin:0 0 4px;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Comentario</p>
        <p style="margin:0;font-size:13px;color:#333;line-height:1.5">${htmlEscape(data.comentario)}</p>
      </div>`
    : '';

  const trackingBlock = trackingUrl
    ? `<p style="margin:20px 0 0">
        <a href="${trackingUrl}" style="display:inline-block;background:${BRAND_ORANGE};color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
          Ver mi cotización
        </a>
      </p>`
    : '';

  const content = `
    <p style="color:#111;margin:0 0 12px;font-size:15px">Estimado/a <strong>${htmlEscape(data.nombre)}</strong>,</p>
    <p style="color:#444;margin:0 0 20px;font-size:13px;line-height:1.6">
      Le informamos que el estado de su cotización${data.codigo ? ` <strong>${htmlEscape(data.codigo)}</strong>` : ''} ha sido actualizado.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px">
      <tr>
        <td style="padding:10px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">Estado anterior</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">${estadoBadge(data.estadoAnterior)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;font-size:12px;color:#888;font-weight:600;border-bottom:1px solid #f0f0f0">Nuevo estado</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">${estadoBadge(data.estadoNuevo)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;font-size:12px;color:#888;font-weight:600">Fecha de actualización</td>
        <td style="padding:10px 12px;font-size:13px;color:#111">${data.fecha}</td>
      </tr>
    </table>
    ${comentarioBlock}
    ${trackingBlock}
  `;

  return baseLayout({ content, subtitle: 'Actualización de cotización' });
}
