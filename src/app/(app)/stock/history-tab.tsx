"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { History, PackagePlus, PackageMinus, RotateCcw, ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react"
import type { StockMovement } from "./types"

const PAGE_SIZE = 50

interface Props {
  onReversed: () => void
}

type FilterType = "todos" | "entrada" | "saida" | "estorno" | "ajuste"

const TYPE_BADGE: Record<StockMovement["type"], { label: string; icon: React.ReactNode; className: string }> = {
  entrada: { label: "Entrada", icon: <PackagePlus size={11} />, className: "bg-details-green/15 text-details-green" },
  saida: { label: "Saída", icon: <PackageMinus size={11} />, className: "bg-destructive/10 text-destructive" },
  estorno: { label: "Estorno", icon: <RotateCcw size={11} />, className: "bg-primary/10 text-primary" },
  ajuste: { label: "Ajuste", icon: <ClipboardCheck size={11} />, className: "bg-amber-500/15 text-amber-600" },
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso))
}

function canReverse(m: StockMovement) {
  return (m.type === "entrada" || m.type === "saida") && !m.reversedAt
}

export function HistoryTab({ onReversed }: Props) {
  const [filter, setFilter] = useState<FilterType>("todos")
  const [page, setPage] = useState(1)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [confirmReverse, setConfirmReverse] = useState<StockMovement | null>(null)
  const [reversing, setReversing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (filter !== "todos") params.set("type", filter)
      const res = await fetch(`/api/stock/movements?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMovements(data.movements)
      setTotal(data.total)
    } catch {
      toast.error("Erro ao carregar histórico.")
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    load()
  }, [load])

  function handleFilterChange(f: FilterType) {
    setFilter(f)
    setPage(1)
  }

  async function handleReverseMovement(movement: StockMovement) {
    setReversing(true)
    try {
      const res = await fetch(`/api/stock/movements/${movement.id}/reverse`, { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Erro ao estornar lançamento.")
        return
      }
      await load()
      onReversed()
      setConfirmReverse(null)
      toast.success("Lançamento estornado com sucesso.")
    } finally {
      setReversing(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function balanceLabel(m: StockMovement) {
    if (m.previousStock === null || m.newStock === null) return null
    return `${m.previousStock} → ${m.newStock}`
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <History size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{total} registro(s)</span>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(["todos", "entrada", "saida", "estorno", "ajuste"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px] capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "todos" ? "Todos" : f === "entrada" ? "Entradas" : f === "saida" ? "Saídas" : f === "estorno" ? "Estornos" : "Ajustes"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="h-12 bg-muted/70 border-b border-border" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 border-b border-border last:border-0 bg-muted/30" />
            ))}
          </div>
        </div>
      ) : movements.length === 0 ? (
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
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Saldo (antes → depois)</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Motivo</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Operador</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Ação</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const badge = TYPE_BADGE[m.type]
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                      <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                        {m.reversedAt && (
                          <span className="block mt-1 text-xs text-muted-foreground">Estornada</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{m.productName}</td>
                      <td className="px-4 py-3 font-mono text-foreground/80">{m.productSku}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        m.direction > 0 ? "text-details-green" : "text-destructive"
                      }`}>
                        {m.direction > 0 ? "+" : "-"}{m.quantity}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground/80 whitespace-nowrap">
                        {balanceLabel(m) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">{m.reason ?? "—"}</td>
                      <td className="px-4 py-3 text-foreground/80">{m.operatorName}</td>
                      <td className="px-4 py-3">
                        {canReverse(m) && (
                          <button
                            onClick={() => setConfirmReverse(m)}
                            title="Estornar"
                            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <RotateCcw size={12} /> Estornar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {movements.map((m) => {
              const badge = TYPE_BADGE[m.type]
              return (
                <div key={m.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{m.productName}</p>
                      <p className="text-xs font-mono text-foreground/70">{m.productSku}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-lg font-bold ${m.direction > 0 ? "text-details-green" : "text-destructive"}`}>
                        {m.direction > 0 ? "+" : "-"}{m.quantity}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 text-xs pt-2 border-t border-border">
                    <div><span className="text-muted-foreground">Data: </span><span className="text-foreground">{formatDateTime(m.createdAt)}</span></div>
                    <div><span className="text-muted-foreground">Operador: </span><span className="text-foreground">{m.operatorName}</span></div>
                    {balanceLabel(m) && (
                      <div className="col-span-2"><span className="text-muted-foreground">Saldo: </span><span className="text-foreground font-mono">{balanceLabel(m)}</span></div>
                    )}
                    {m.reason && (
                      <div className="col-span-2"><span className="text-muted-foreground">Motivo: </span><span className="text-foreground">{m.reason}</span></div>
                    )}
                    {m.reversedAt && (
                      <div className="col-span-2 text-muted-foreground">Estornada</div>
                    )}
                  </div>
                  {canReverse(m) && (
                    <button
                      onClick={() => setConfirmReverse(m)}
                      className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary min-h-[44px]"
                    >
                      <RotateCcw size={14} /> Estornar
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total} movimentações
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-border hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 text-sm font-medium text-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-border hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm reverse (estorno) */}
      {confirmReverse && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
          onClick={() => setConfirmReverse(null)}
        >
          <div
            className="bg-card w-full md:max-w-sm md:rounded-2xl rounded-t-2xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-foreground mb-1">Estornar movimentação?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              A {confirmReverse.type === "entrada" ? "entrada" : "saída"} de{" "}
              <strong className="text-foreground">{confirmReverse.quantity} {confirmReverse.productName}</strong> será
              revertida e uma nova movimentação de estorno será registrada no histórico.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleReverseMovement(confirmReverse)}
                disabled={reversing}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition min-h-[44px] disabled:opacity-50"
              >
                {reversing ? "Estornando..." : "Estornar"}
              </button>
              <button
                onClick={() => setConfirmReverse(null)}
                className="px-4 py-2.5 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
