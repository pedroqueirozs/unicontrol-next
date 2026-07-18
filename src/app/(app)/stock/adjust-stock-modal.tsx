"use client"

import { useEffect, useState } from "react"
import { X, ClipboardCheck } from "lucide-react"
import type { StockProduct } from "./types"

interface Props {
  product: StockProduct | null
  onClose: () => void
  onSave: (countedStock: number, reason: string) => Promise<void>
  loading: boolean
}

export function AdjustStockModal({ product, onClose, onSave, loading }: Props) {
  const [countedStock, setCountedStock] = useState(0)
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (product) {
      setCountedStock(product.currentStock)
      setReason("")
      setError("")
    }
  }, [product])

  if (!product) return null

  const delta = countedStock - product.currentStock

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError("Informe o motivo do ajuste.")
      return
    }
    if (delta === 0) {
      setError("A quantidade informada já é igual ao estoque atual.")
      return
    }
    await onSave(countedStock, reason.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Ajustar estoque</h2>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <p className="text-base font-semibold text-foreground">{product.name}</p>
          <p className="text-sm text-muted-foreground">
            Estoque atual no sistema: <strong className="text-foreground">{product.currentStock} {product.unit}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="counted-stock" className="text-sm font-semibold text-foreground/80">
              Quantidade contada fisicamente
            </label>
            <input
              id="counted-stock"
              type="number"
              min={0}
              value={countedStock}
              onChange={(e) => { setCountedStock(Math.max(0, Number(e.target.value))); setError("") }}
              className="h-14 rounded-xl border-2 border-border bg-background px-4 text-xl font-bold text-foreground text-center outline-none focus:border-ring"
            />
          </div>

          {delta !== 0 && (
            <p className={`text-sm font-semibold ${delta > 0 ? "text-details-green" : "text-destructive"}`}>
              {delta > 0 ? `+${delta}` : delta} {product.unit} em relação ao sistema
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="adjust-reason" className="text-sm font-semibold text-foreground/80">
              Motivo do ajuste <span className="text-destructive">*</span>
            </label>
            <input
              id="adjust-reason"
              type="text"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError("") }}
              placeholder="Ex: Contagem física de 18/07, divergência encontrada"
              className="h-14 rounded-xl border-2 border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-muted transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Confirmar ajuste"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
