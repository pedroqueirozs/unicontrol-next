"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import type { Role } from "@/generated/prisma/enums"

interface AppShellProps {
  children: React.ReactNode
  role: Role
  userName?: string | null
}

// Componente cliente que gerencia o estado de aberto/fechado da sidebar no mobile.
// O layout pai é um Server Component — ele passa os dados da sessão para cá.
export function AppShell({ children, role, userName }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          userName={userName}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
