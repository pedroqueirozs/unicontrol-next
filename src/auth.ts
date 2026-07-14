import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/auth.config"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Configuração completa — roda apenas no Node.js runtime (API routes, Server Actions).
// Estende o authConfig base adicionando o provider com validação real via Prisma.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            companyId: true,
          },
        })

        if (!user?.password) return null

        const senhaCorreta = await bcrypt.compare(parsed.data.password, user.password)
        if (!senhaCorreta) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        }
      },
    }),
  ],
})
