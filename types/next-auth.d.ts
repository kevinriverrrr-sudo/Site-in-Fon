import NextAuth, { DefaultSession, User as NextAuthUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: 'USER' | 'ADMIN';
      status?: 'PENDING' | 'ACTIVE' | 'BANNED';
      dailyLimit?: number;
    } & DefaultSession['user'];
  }

  interface User extends NextAuthUser {
    role?: 'USER' | 'ADMIN';
    status?: 'PENDING' | 'ACTIVE' | 'BANNED';
    dailyLimit?: number;
    emailVerified?: Date | null;
    hashedPassword?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role?: 'USER' | 'ADMIN';
    status?: 'PENDING' | 'ACTIVE' | 'BANNED';
    dailyLimit?: number;
  }
}
