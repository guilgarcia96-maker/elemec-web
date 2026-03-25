/**
 * Layout base compartido para todas las plantillas de correo ELEMEC.
 * Retorna un HTML completo envolviendo el contenido proporcionado.
 */

const BRAND_ORANGE = '#f97316';
const BRAND_DARK = '#111827';

interface BaseLayoutOptions {
  /** Contenido HTML del cuerpo del correo */
  content: string;
  /** Título mostrado debajo del logo (opcional) */
  subtitle?: string;
}

export function baseLayout({ content, subtitle }: BaseLayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ELEMEC</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',system-ui,-apple-system,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_DARK};padding:20px 24px">
              <p style="color:${BRAND_ORANGE};font-size:22px;font-weight:700;letter-spacing:0.1em;margin:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif">ELEMEC</p>
              <p style="color:rgba(255,255,255,0.4);font-size:10px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px">Servicios Industriales</p>
              ${subtitle ? `<p style="color:rgba(255,255,255,0.7);font-size:11px;margin:8px 0 0">${subtitle}</p>` : ''}
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px;background:#ffffff">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;background:#fafafa;border-top:1px solid #e5e7eb">
              <p style="margin:0 0 4px;font-size:11px;color:#999">ELEMEC SPA. &nbsp;·&nbsp; RUT 76.715.440-2</p>
              <p style="margin:0 0 4px;font-size:11px;color:#999">Arturo Prat 1602, Punta Arenas &nbsp;·&nbsp; Región de Magallanes</p>
              <p style="margin:0;font-size:11px;color:#999">
                <a href="mailto:elemec.magallanes@gmail.com" style="color:${BRAND_ORANGE};text-decoration:none">elemec.magallanes@gmail.com</a>
                &nbsp;·&nbsp;
                <a href="tel:+56996492917" style="color:${BRAND_ORANGE};text-decoration:none">+56 9 9649 2917</a>
                &nbsp;·&nbsp;
                <a href="https://www.elemec.cl" style="color:${BRAND_ORANGE};text-decoration:none">www.elemec.cl</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
