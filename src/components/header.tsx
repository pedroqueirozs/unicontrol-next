"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, User } from "lucide-react"
import { signOut } from "next-auth/react"

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/goods-shipped": "Mercadorias",
  "/financial": "Financeiro",
  "/reports": "Relatórios",
  "/address": "Endereços",
  "/useful-documents": "Documentos Úteis",
  "/pendencias": "Pendências",
  "/stock": "Estoque",
  "/cadastros": "Cadastros",
  "/settings": "Configurações",
  "/manage-users": "Gerenciar Usuários",
  "/profile": "Meu Perfil",
}

interface HeaderProps {
  userName?: string | null
  onMenuClick: () => void
}

export function Header({ userName, onMenuClick }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const title = ROUTE_TITLES[pathname] ?? "UniControl"
  const firstName = userName?.split(" ")[0] ?? "Usuário"

  return (
    <header className="flex items-center justify-between h-16 px-5 border-b border-border bg-card flex-shrink-0">
      {/* Esquerda: menu mobile + título */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <h1 className="font-bold text-base md:text-lg uppercase text-foreground tracking-wide">
          {title}
        </h1>
      </div>

      {/* Direita: saudação + avatar com dropdown */}
      <div className="relative flex items-center gap-3">
        <span className="hidden md:block text-sm text-muted-foreground">
          Bem-vindo, {firstName}
        </span>

        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="w-10 h-10 rounded-full bg-sidebar flex items-center justify-center hover:opacity-80 transition-opacity"
          aria-label="Menu do usuário"
        >
          <User size={18} className="text-sidebar-foreground" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 top-12 w-48 bg-card border border-border shadow-lg rounded-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                Meu Perfil
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
              >
                Sair
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
