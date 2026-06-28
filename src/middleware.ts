import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Rotas que não precisam de autenticação
const PUBLIC_ROUTES = ["/login", "/register"]

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session
  const isPublicRoute = PUBLIC_ROUTES.some((r) => nextUrl.pathname.startsWith(r))

  // Usuário autenticado tentando acessar login/register → redireciona para o app
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  // Usuário não autenticado tentando acessar rota protegida → vai para o login
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  // Aplica o middleware em todas as rotas, exceto arquivos estáticos e internos do Next.js
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)"],
}
