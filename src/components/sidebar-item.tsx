"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  href: string
  onClick?: () => void
}

export function SidebarItem({ icon: Icon, label, href, onClick }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 transition-opacity hover:opacity-70
        ${isActive
          ? "border-l-4 border-sidebar-accent font-semibold"
          : "border-l-4 border-transparent"
        }`}
    >
      <Icon size={20} />
      <span className="text-sm">{label}</span>
    </Link>
  )
}
