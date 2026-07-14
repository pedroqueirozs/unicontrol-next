import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { Role } from "@/generated/prisma/enums"

// Configuração leve do NextAuth — sem imports de Node.js ou Prisma.
// Usada no middleware (Edge runtime) e como base do auth.ts (Node.js runtime).
// A validação real de senha fica no auth.ts.
// jwt/session ficam aqui (não em auth.ts) para que o middleware também
// tenha acesso a role/companyId na sessão decodificada do token.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [Credentials({})],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role as Role
        token.companyId = user.companyId as string
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as Role
      session.user.companyId = token.companyId as string
      return session
    },
  },
}
