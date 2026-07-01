"use client"

import { useState } from "react"
import { Trash2, ChevronRight } from "lucide-react"
import type { Pending, PendingStatus } from "./types"
import { STATUS_CONFIG } from "./types"

interface Props {
  items: Pending[]
  onRowClick: (item: Pending) => void
  onDelete: (id: string) => Promise<void>
}

const FILTERS: { label: string; value: PendingStatus | "all" }[] = [
  { label: "Todas", value: "all" },
  { label: "Abertas", value: "aberta" },
  { label: "Em andamento", value: "em_andamento" },
  { label: "Resolvidas", value: "resolvida" },
]

function StatusBadge({ status }: { status: PendingStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

export function PendingTab({ items, onRowClick, onDelete }: Props) {
  const [filter, setFilter] = useState<PendingStatus | "all">("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter)

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm("Deseja excluir esta pendência? Esta ação não pode ser desfeita.")) return
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const count = f.value === "all" ? items.length : items.filter((i) => i.status === f.value).length
          const active = filter === f.value
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all min-h-[40px] ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs font-bold ${active ? "opacity-80" : "opacity-60"}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Nenhuma pendência encontrada.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left font-semibold text-foreground/70 px-4 py-3">Nome</th>
                  <th className="text-left font-semibold text-foreground/70 px-4 py-3">Cidade</th>
                  <th className="text-left font-semibold text-foreground/70 px-4 py-3">Documento</th>
                  <th className="text-left font-semibold text-foreground/70 px-4 py-3">Abertura</th>
                  <th className="text-left font-semibold text-foreground/70 px-4 py-3">Status</th>
                  <th className="text-left font-semibold text-foreground/70 px-4 py-3">Atualizações</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onRowClick(item)}
                    className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.city ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.document}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(item.openedAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.updates.length}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        disabled={deletingId === item.id}
                        className="text-muted-foreground hover:text-destructive transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onRowClick(item)}
                className="rounded-xl border border-border bg-card p-4 cursor-pointer active:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate">{item.name}</p>
                    {item.city && <p className="text-xs text-muted-foreground mt-0.5">{item.city}</p>}
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                </div>

                <div className="flex items-center gap-2 flex-wrap mt-3">
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-muted-foreground">{item.document}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{formatDate(item.openedAt)}</span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {item.updates.length} {item.updates.length === 1 ? "atualização" : "atualizações"}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    disabled={deletingId === item.id}
                    className="text-muted-foreground hover:text-destructive transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
