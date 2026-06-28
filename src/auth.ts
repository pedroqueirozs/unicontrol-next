import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma/enums"

// Schema de validação das credenciais recebidas no login
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT strategy: a sessão fica criptografada no cookie do browser.
  // Não precisa de tabela Session no banco para credentials provider.
  session: { strategy: "jwt" },

  // Rota customizada de login (em vez do /auth/signin padrão do NextAuth)
  pages: { signIn: "/login" },

  providers: [
    Credentials({
      // authorize é chamado ao tentar logar — deve retornar o usuário ou null
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

        // Usuário não encontrado ou sem senha cadastrada
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

  callbacks: {
    // jwt: chamado ao criar/atualizar o token. Aqui adicionamos role e companyId.
    jwt({ token, user }) {
      if (user) {
        token.role = user.role as Role
        token.companyId = user.companyId as string
      }
      return token
    },

    // session: chamado ao ler a sessão no cliente. Expõe o que o token tem.
    session({ session, token }) {
      session.user.role = token.role as Role
      session.user.companyId = token.companyId as string
      return session
    },
  },
})
