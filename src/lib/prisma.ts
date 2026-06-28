import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Em dev, o Next.js reinicia módulos a cada mudança de código (hot reload).
// Sem o singleton, cada reload criaria um novo PrismaPg (e um novo pg.Pool),
// abrindo conexões TCP com o banco remoto sem fechar as anteriores —
// acumulando conexões perdidas e degradando performance ao longo do tempo.
// Preservamos tanto o adapter quanto o client no globalThis para evitar isso.
const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient>
  prismaAdapter: PrismaPg
}

const adapter =
  globalForPrisma.prismaAdapter ??
  new PrismaPg({ connectionString: process.env.DATABASE_URL! })

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaAdapter = adapter
}
