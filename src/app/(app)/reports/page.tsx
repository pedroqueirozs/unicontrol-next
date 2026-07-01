import { Hammer } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10">
        <Hammer size={32} className="text-amber-500" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Módulo em construção</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          O módulo Relatórios está sendo desenvolvido e estará disponível em breve.
        </p>
      </div>
    </div>
  )
}
