"use client"

import { useState } from "react"
import { X, Clock } from "lucide-react"
import type { Pending, PendingStatus } from "./types"
import { STATUS_CONFIG } from "./types"

interface Props {
  item: Pending | null
  onClose: () => void
  onStatusChange: (id: string, status: PendingStatus) => Promise<void>
  onAddUpdate: (id: string, text: string) => Promise<void>
}

const STATUS_OPTIONS: { value: PendingStatus; label: string }[] = [
  { value: "aberta", label: "Aberta" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "resolvida", label: "Resolvida" },
]

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export function DetailModal({ item, onClose, onStatusChange, onAddUpdate }: Props) {
  const [newText, setNewText] = useState("")
  const [savingUpdate, setSavingUpdate] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

  if (!item) return null

  async function handleStatusChange(status: PendingStatus) {
    if (status === item!.status) return
    setSavingStatus(true)
    await onStatusChange(item!.id, status)
    setSavingStatus(false)
  }

  async function handleAddUpdate() {
    if (!newText.trim()) return
    setSavingUpdate(true)
    await onAddUpdate(item!.id, newText.trim())
    setNewText("")
    setSavingUpdate(false)
  }

  const sortedUpdates = [...item.updates].reverse()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground leading-tight">{item.name}</h2>
              {item.city && <p className="text-sm text-muted-foreground mt-0.5">{item.city}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                {item.document} · Aberta em {new Date(item.openedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0">
              <X size={20} />
            </button>
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {STATUS_OPTIONS.map((opt) => {
              const cfg = STATUS_CONFIG[opt.value]
              const active = item.status === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={savingStatus}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all min-h-[36px] ${
                    active
                      ? `${cfg.classes} border-current`
                      : "text-muted-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
            {savingStatus && <span className="text-xs text-muted-foreground">Salvando…</span>}
          </div>
        </div>

        {/* Updates history */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <p className="text-xs font-bold text-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
            <Clock size={12} /> Histórico
          </p>

          {sortedUpdates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atualização ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedUpdates.map((upd) => (
                <div key={upd.id} className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-2">{formatDateTime(upd.createdAt)}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{upd.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add update */}
        <div className="p-5 border-t border-border shrink-0">
          <p className="text-xs font-bold text-foreground/60 uppercase tracking-widest mb-3">Nova atualização</p>
          <textarea
            rows={3}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Descreva o que aconteceu…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-ring transition-colors"
          />
          <div className="flex justify-end gap-3 mt-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition min-h-[44px]">
              Fechar
            </button>
            <button
              onClick={handleAddUpdate}
              disabled={savingUpdate || !newText.trim()}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60 min-h-[44px]"
            >
              {savingUpdate ? "Salvando…" : "Adicionar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
