import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Envía un correo electrónico usando Resend.
 * Usa RESEND_FROM_EMAIL como remitente o el default de onboarding.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes('XXXXXXXXXXXXXXXX')) {
    console.warn('[email] RESEND_API_KEY no configurada, omitiendo envío');
    return { success: false, error: 'RESEND_API_KEY no configurada' };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'ELEMEC <onboarding@resend.dev>';

  try {
    const { error } = await resend.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });

    if (error) {
      console.error('[email] Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al enviar correo';
    console.error('[email] excepción:', message);
    return { success: false, error: message };
  }
}
