import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  if (!token || !email) {
    return new Response('Invalid verification link', { status: 400 });
  }

  const record = await prisma.verificationToken.findFirst({
    where: {
      token,
      identifier: email,
      type: 'VERIFY_EMAIL'
    }
  });

  if (!record || record.expires < new Date()) {
    return new Response('Verification link is invalid or has expired', { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date(), status: 'ACTIVE' }
    }),
    prisma.verificationToken.delete({ where: { id: record.id } })
  ]);

  return new Response('Email verified. You can close this window and sign in.', { status: 200 });
}
