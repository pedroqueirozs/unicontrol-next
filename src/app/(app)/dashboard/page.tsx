import { auth } from "@/auth"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Bem-vindo ao UniControl
        </h2>
        <p className="text-sm text-muted-foreground">
          Olá, {session?.user?.name ?? "usuário"}. O dashboard está em construção.
        </p>
      </div>
    </div>
  )
}
