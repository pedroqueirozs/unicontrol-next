import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

// O middleware usa apenas o authConfig (sem Prisma) porque roda no Edge runtime,
// que não tem Node.js completo. A validação real de senha acontece no auth.ts.
const { auth } = NextAuth(authConfig)

const PUBLIC_ROUTES = ["/login", "/register"]

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session
  const isPublicRoute = PUBLIC_ROUTES.some((r) => nextUrl.pathname.startsWith(r))

  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)"],
}
