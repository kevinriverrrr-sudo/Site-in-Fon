import { PrismaClient } from '@prisma/client'

// Ensure the PrismaClient is a singleton in development to avoid exhausting
// database connections during Next.js hot reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
