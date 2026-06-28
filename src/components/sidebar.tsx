"use client"

import Image from "next/image"
import {
  LayoutDashboard,
  PackagePlus,
  DollarSign,
  AlignJustify,
  MapPin,
  Folder,
  ClipboardList,
  Boxes,
  BookUser,
  Settings,
  UserCog,
} from "lucide-react"
import { SidebarItem } from "@/components/sidebar-item"
import type { Role } from "@/generated/prisma/enums"

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", roles: ["admin"] },
  { label: "Mercadorias", icon: PackagePlus, href: "/goods-shipped", roles: ["admin"] },
  { label: "Financeiro", icon: DollarSign, href: "/financial", roles: ["admin"] },
  { label: "Relatórios", icon: AlignJustify, href: "/reports", roles: ["admin"] },
  { label: "Endereços", icon: MapPin, href: "/address", roles: ["admin", "expedicao"] },
  { label: "Documentos Úteis", icon: Folder, href: "/useful-documents", roles: ["admin", "expedicao"] },
  { label: "Pendências", icon: ClipboardList, href: "/pendencias", roles: ["admin"] },
  { label: "Estoque", icon: Boxes, href: "/stock", roles: ["admin", "expedicao"] },
  { label: "Cadastros", icon: BookUser, href: "/cadastros", roles: ["admin"] },
  { label: "Configurações", icon: Settings, href: "/settings", roles: ["admin"] },
  { label: "Gerenciar Usuários", icon: UserCog, href: "/manage-users", roles: ["admin"] },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  role: Role
}

export function Sidebar({ isOpen, onClose, role }: SidebarProps) {
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(role)
  )

  return (
    <>
      {/* Backdrop mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          flex flex-col h-screen w-64 flex-shrink-0
          bg-sidebar text-sidebar-foreground rounded-r-2xl
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center px-6 border-b border-white/10">
          <Image
            src="/unicontrol-logo-light.svg"
            alt="UniControl"
            width={160}
            height={48}
            priority
          />
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="flex flex-col gap-1">
            {visibleItems.map((item) => (
              <li key={item.href}>
                <SidebarItem
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  onClick={onClose}
                />
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
