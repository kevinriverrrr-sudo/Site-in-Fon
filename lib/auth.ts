import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {},
  providers: [
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.hashedPassword) return null;

        const valid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!valid) return null;

        if (!user.emailVerified) {
          throw new Error('Email not verified. Please check your inbox for the verification link.');
        }
        if (user.status === 'BANNED') {
          throw new Error('Your account has been banned.');
        }

        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email,
          image: user.image ?? undefined,
          role: user.role,
          status: user.status,
          dailyLimit: user.dailyLimit
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.dailyLimit = (user as any).dailyLimit;
      } else if (token?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.dailyLimit = dbUser.dailyLimit;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) || session.user.id;
        session.user.role = token.role as any;
        session.user.status = token.status as any;
        session.user.dailyLimit = token.dailyLimit as any;
      }
      return session;
    },
    async signIn({ user }) {
      // Redundant checks to prevent login if banned/unverified
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser) return false;
      if (!dbUser.emailVerified) return false;
      if (dbUser.status === 'BANNED') return false;
      return true;
    }
  },
  cookies: {
    // Use default cookies
  },
  secret: process.env.NEXTAUTH_SECRET
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
