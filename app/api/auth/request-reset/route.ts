import { prisma } from '@/lib/prisma';
import { generateToken, getBaseUrl } from '@/lib/utils';
import { sendMail } from '@/lib/mail';
import { z } from 'zod';

const RequestSchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = RequestSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Do not reveal if user does not exist - but send success
    if (!user) return new Response(JSON.stringify({ success: true }), { status: 200 });

    if (user.status === 'BANNED') {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    const token = generateToken(32);
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
        type: 'PASSWORD_RESET'
      }
    });

    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    await sendMail({
      to: email,
      subject: 'Reset your password',
      html: `
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
      text: `Reset your password: ${resetUrl}`
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    const message = err?.message || 'Invalid request';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}
