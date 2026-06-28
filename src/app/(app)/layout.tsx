import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AppShell } from "@/components/app-shell"
import type { Role } from "@/generated/prisma/enums"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <AppShell
      role={session.user.role as Role}
      userName={session.user.name}
    >
      {children}
    </AppShell>
  )
}
