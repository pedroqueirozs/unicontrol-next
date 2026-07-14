import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { isAdminLevel } from "@/lib/roles"
import { NextResponse } from "next/server"

// O proxy usa apenas o authConfig (sem Prisma) porque roda no Edge runtime,
// que não tem Node.js completo. A validação real de senha acontece no auth.ts.
const { auth } = NextAuth(authConfig)

// Telas de login/registro: se já estiver logado, não fazem sentido — redireciona pro dashboard.
const AUTH_ROUTES = ["/login", "/register"]

// Rotas acessíveis sempre, estando logado ou não (ex: link de rastreio
// compartilhado com o cliente — precisa abrir normalmente mesmo se quem
// clicar também for um usuário interno já logado no sistema).
const ALWAYS_PUBLIC_ROUTES = ["/rastreio"]

// Módulos restritos a admin/administrativo (RN-18). Qualquer outra role
// tentando acessar digitando a URL diretamente é redirecionada — a proteção
// não pode depender só de esconder o link na sidebar.
const ADMIN_ONLY_ROUTES = ["/financial", "/settings", "/manage-users"]

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session
  const isAuthRoute = AUTH_ROUTES.some((r) => nextUrl.pathname.startsWith(r))
  const isAlwaysPublicRoute = ALWAYS_PUBLIC_ROUTES.some((r) => nextUrl.pathname.startsWith(r))
  const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some((r) => nextUrl.pathname.startsWith(r))

  if (isAlwaysPublicRoute) {
    return NextResponse.next()
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (isLoggedIn && isAdminOnlyRoute && !isAdminLevel(session.user.role)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  // Exclui /api porque as rotas do NextAuth (/api/auth/*) precisam ser acessíveis
  // sem autenticação (o próprio POST de login passaria por aqui e seria barrado).
  // Rotas de API autenticadas fazem sua própria verificação de sessão no route handler.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)"],
}
