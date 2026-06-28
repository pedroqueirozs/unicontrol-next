import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Prisma v7 requer um adapter explícito de banco de dados.
// O PrismaPg conecta via pg (driver nativo do PostgreSQL para Node.js).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

// Em desenvolvimento, o Next.js reinicia o módulo a cada mudança de código.
// Sem esse padrão, cada reload criaria uma nova conexão com o banco até
// esgotar o pool de conexões. O globalThis persiste entre reloads no dev.
const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
