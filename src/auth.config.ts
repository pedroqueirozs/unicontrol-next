import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

// Configuração leve do NextAuth — sem imports de Node.js ou Prisma.
// Usada apenas no middleware (Edge runtime).
// A validação real de senha fica no auth.ts (Node.js runtime).
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [Credentials({})],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
  },
}
