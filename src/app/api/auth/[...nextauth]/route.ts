import { handlers } from "@/auth"

// O NextAuth precisa de um route handler em /api/auth/* para processar
// login, logout e callback de provedores. O `handlers` exportado pelo
// auth.ts já tem os métodos GET e POST prontos.
export const { GET, POST } = handlers
