"use client"

import { useState } from "react"
import { History, PackagePlus, PackageMinus } from "lucide-react"
import type { StockMovement } from "./types"

interface Props {
  movements: StockMovement[]
}

type FilterType = "todos" | "entrada" | "saida"

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso))
}

export function HistoryTab({ movements }: Props) {
  const [filter, setFilter] = useState<FilterType>("todos")

  const filtered = filter === "todos" ? movements : movements.filter((m) => m.type === filter)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <History size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{filtered.length} registro(s)</span>
        </div>

        <div className="flex gap-1.5">
          {(["todos", "entrada", "saida"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px] capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "todos" ? "Todos" : f === "entrada" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <History size={40} className="mx-auto mb-2 opacity-30" />
          <p>Nenhuma movimentação registrada.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Data</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Produto</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">SKU</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground/70 text-xs uppercase tracking-wide">Qtd.</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Motivo</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Operador</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                    <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.type === "entrada"
                          ? "bg-details-green/15 text-details-green"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {m.type === "entrada" ? <PackagePlus size={11} /> : <PackageMinus size={11} />}
                        {m.type === "entrada" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{m.productName}</td>
                    <td className="px-4 py-3 font-mono text-foreground/80">{m.productSku}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${
                      m.type === "entrada" ? "text-details-green" : "text-destructive"
                    }`}>
                      {m.type === "entrada" ? "+" : "-"}{m.quantity}
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{m.reason ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground/80">{m.operatorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{m.productName}</p>
                    <p className="text-xs font-mono text-foreground/70">{m.productSku}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-lg font-bold ${m.type === "entrada" ? "text-details-green" : "text-destructive"}`}>
                      {m.type === "entrada" ? "+" : "-"}{m.quantity}
                    </span>
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.type === "entrada"
                        ? "bg-details-green/15 text-details-green"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {m.type === "entrada" ? "Entrada" : "Saída"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-xs pt-2 border-t border-border">
                  <div><span className="text-muted-foreground">Data: </span><span className="text-foreground">{formatDateTime(m.createdAt)}</span></div>
                  <div><span className="text-muted-foreground">Operador: </span><span className="text-foreground">{m.operatorName}</span></div>
                  {m.reason && (
                    <div className="col-span-2"><span className="text-muted-foreground">Motivo: </span><span className="text-foreground">{m.reason}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
