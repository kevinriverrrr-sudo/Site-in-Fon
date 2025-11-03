import nodemailer from 'nodemailer';

export type MailOptions = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

function getTransport() {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Boolean(process.env.SMTP_SECURE === 'true'),
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });
  }
  // Development: do not actually send; log to console
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  } as any);
}

export async function sendMail({ to, subject, html, text }: MailOptions) {
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  const transport = getTransport();
  const info = await transport.sendMail({ from, to, subject, html, text });
  if (process.env.NODE_ENV !== 'production') {
    // Log the message content for local testing
    // @ts-ignore
    const output = info.message?.toString?.() ?? '';
    console.log(`\n[mail] To: ${to}\nSubject: ${subject}\n` + output);
  }
  return info;
}
