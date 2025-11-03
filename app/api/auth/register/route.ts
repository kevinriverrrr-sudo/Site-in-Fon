import { prisma } from '@/lib/prisma';
import { generateToken, getBaseUrl } from '@/lib/utils';
import { sendMail } from '@/lib/mail';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = RegisterSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        role: 'USER',
        status: 'PENDING',
        dailyLimit: 30
      }
    });

    const token = generateToken(32);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
        type: 'VERIFY_EMAIL'
      }
    });

    const baseUrl = getBaseUrl();
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    await sendMail({
      to: email,
      subject: 'Verify your email',
      html: `
        <p>Welcome! Please verify your email to activate your account.</p>
        <p><a href="${verifyUrl}">Click here to verify your email</a></p>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <code>${verifyUrl}</code>
      `,
      text: `Verify your account: ${verifyUrl}`
    });

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (err: any) {
    const message = err?.message || 'Invalid request';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}
