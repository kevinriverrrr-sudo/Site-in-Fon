import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const ResetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, token, password } = ResetSchema.parse(body);

    const record = await prisma.verificationToken.findFirst({
      where: { identifier: email, token, type: 'PASSWORD_RESET' }
    });

    if (!record || record.expires < new Date()) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { hashedPassword } }),
      prisma.verificationToken.delete({ where: { id: record.id } })
    ]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    const message = err?.message || 'Invalid request';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}
