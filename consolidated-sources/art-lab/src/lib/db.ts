import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaVersion: string | undefined
}

const SCHEMA_VERSION = 'v3-comments-fixed'

// Re-crear el cliente si cambió el schema (evita caché HMR con modelo antiguo)
if (globalForPrisma.prisma && globalForPrisma.prismaVersion !== SCHEMA_VERSION) {
  try {
    globalForPrisma.prisma.$disconnect().catch(() => null)
  } catch {
    /* noop */
  }
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.prismaVersion = SCHEMA_VERSION
}
// bust 1785693121706
