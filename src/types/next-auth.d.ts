import type { DefaultSession } from "next-auth"
import type { Role } from "@/generated/prisma/enums"

// Estende os tipos padrão do NextAuth para incluir role e companyId.
// Sem isso, session.user.role geraria erro de TypeScript.
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      companyId: string
    } & DefaultSession["user"]
  }

  interface User {
    role?: Role
    companyId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: Role
    companyId?: string
  }
}
