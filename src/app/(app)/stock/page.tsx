"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Boxes, PackagePlus, PackageMinus, History } from "lucide-react"
import type { StockProduct, StockMovement } from "./types"
import { ProductsTab } from "./products-tab"
import { MovementInTab } from "./movement-in-tab"
import { MovementOutTab } from "./movement-out-tab"
import { HistoryTab } from "./history-tab"
import { ProductModal } from "./product-modal"
import { LabelPrintModal } from "./label-print-modal"
import { AdjustStockModal } from "./adjust-stock-modal"

type Tab = "estoque" | "entrada" | "saida" | "historico"

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "estoque", label: "Estoque", icon: <Boxes size={20} /> },
  { key: "entrada", label: "Entrada", icon: <PackagePlus size={20} /> },
  { key: "saida", label: "Saída", icon: <PackageMinus size={20} /> },
  { key: "historico", label: "Histórico", icon: <History size={20} /> },
]

export default function StockPage() {
  const [activeTab, setActiveTab] = useState<Tab>("saida")
  const [products, setProducts] = useState<StockProduct[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  // Product modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<StockProduct | null>(null)
  const [savingProduct, setSavingProduct] = useState(false)

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<StockProduct | null>(null)

  // Label print
  const [printProduct, setPrintProduct] = useState<StockProduct | null>(null)

  // Stock adjustment
  const [adjustProduct, setAdjustProduct] = useState<StockProduct | null>(null)
  const [savingAdjust, setSavingAdjust] = useState(false)

  // Reverse (estorno) confirm
  const [confirmReverse, setConfirmReverse] = useState<StockMovement | null>(null)
  const [reversing, setReversing] = useState(false)

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [pr, mr] = await Promise.all([
        fetch("/api/stock/products"),
        fetch("/api/stock/movements"),
      ])
      if (!pr.ok || !mr.ok) throw new Error()
      const [productsData, movementsData] = await Promise.all([pr.json(), mr.json()])
      setProducts(productsData)
      setMovements(movementsData)
    } catch {
      toast.error("Erro ao carregar os dados.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Save product (create or edit)
  async function handleSaveProduct(data: {
    name: string
    sku?: string | null
    unit: string
    minStock: number
    description?: string | null
    ncm?: string | null
    price?: number | null
    costPrice?: number | null
  }) {
    setSavingProduct(true)
    try {
      if (editProduct) {
        const res = await fetch(`/api/stock/products/${editProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        const updated: StockProduct = await res.json()
        setProducts((prev) => prev.map((p) => (p.id === editProduct.id ? updated : p)).sort((a, b) => a.name.localeCompare(b.name)))
        toast.success("Produto atualizado.")
      } else {
        const res = await fetch("/api/stock/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        const created: StockProduct = await res.json()
        setProducts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
        toast.success("Produto cadastrado.")
      }
      setModalOpen(false)
      setEditProduct(null)
    } catch {
      toast.error("Erro ao salvar produto.")
    } finally {
      setSavingProduct(false)
    }
  }

  // Delete product
  async function handleDeleteProduct(product: StockProduct) {
    try {
      const res = await fetch(`/api/stock/products/${product.id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Erro ao remover produto.")
        return
      }
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      setConfirmDelete(null)
      toast.success("Produto removido.")
    } catch {
      toast.error("Erro ao remover produto.")
    }
  }

  // Register batch movement in (single atomic request for the whole batch)
  async function handleMovementInBatch(
    items: { product: StockProduct; quantity: number }[],
    reason: string
  ) {
    const res = await fetch("/api/stock/movements/in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        reason: reason || null,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? "Erro ao registrar entrada.")
      throw new Error()
    }
    await loadData()
    toast.success(`Entrada de ${items.length} produto(s) registrada com sucesso!`)
  }

  // Register batch movement out
  async function handleMovementOutBatch(
    items: { product: StockProduct; quantity: number }[],
    reason: string
  ) {
    const res = await fetch("/api/stock/movements/out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        reason: reason || null,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? "Erro ao registrar saída.")
      throw new Error()
    }
    await loadData()
    toast.success(`Saída de ${items.length} produto(s) registrada com sucesso!`)
  }

  // Adjust stock (physical count)
  async function handleAdjustStock(countedStock: number, reason: string) {
    if (!adjustProduct) return
    setSavingAdjust(true)
    try {
      const res = await fetch("/api/stock/movements/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: adjustProduct.id, countedStock, reason }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Erro ao ajustar estoque.")
        return
      }
      await loadData()
      setAdjustProduct(null)
      toast.success("Estoque ajustado com sucesso.")
    } finally {
      setSavingAdjust(false)
    }
  }

  // Reverse (estorno) a movement
  async function handleReverseMovement(movement: StockMovement) {
    setReversing(true)
    try {
      const res = await fetch(`/api/stock/movements/${movement.id}/reverse`, { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Erro ao estornar lançamento.")
        return
      }
      await loadData()
      setConfirmReverse(null)
      toast.success("Lançamento estornado com sucesso.")
    } finally {
      setReversing(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Boxes size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-base font-semibold transition whitespace-nowrap min-h-[48px] ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="flex gap-3">
            <div className="h-12 flex-1 rounded-xl bg-muted" />
            <div className="h-12 w-44 rounded-xl bg-muted" />
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="h-12 bg-muted/70 border-b border-border" />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 border-b border-border last:border-0 bg-muted/30" />
            ))}
          </div>
        </div>
      )}

      {/* Tab content */}
      {!loading && (
        <div>
          {activeTab === "estoque" && (
            <ProductsTab
              products={products}
              onAdd={() => { setEditProduct(null); setModalOpen(true) }}
              onEdit={(p) => { setEditProduct(p); setModalOpen(true) }}
              onDelete={(p) => setConfirmDelete(p)}
              onPrint={(p) => setPrintProduct(p)}
              onAdjust={(p) => setAdjustProduct(p)}
            />
          )}
          {activeTab === "entrada" && (
            <MovementInTab products={products} onRegisterBatch={handleMovementInBatch} />
          )}
          {activeTab === "saida" && (
            <MovementOutTab products={products} onRegisterBatch={handleMovementOutBatch} />
          )}
          {activeTab === "historico" && (
            <HistoryTab movements={movements} onReverse={(m) => setConfirmReverse(m)} />
          )}
        </div>
      )}

      {/* Label print modal */}
      <LabelPrintModal product={printProduct} onClose={() => setPrintProduct(null)} />

      {/* Adjust stock modal */}
      <AdjustStockModal
        product={adjustProduct}
        onClose={() => setAdjustProduct(null)}
        onSave={handleAdjustStock}
        loading={savingAdjust}
      />

      {/* Product modal */}
      <ProductModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null) }}
        onSave={handleSaveProduct}
        editItem={editProduct}
        loading={savingProduct}
      />

      {/* Confirm delete */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-card w-full md:max-w-sm md:rounded-2xl rounded-t-2xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmDelete.currentStock > 0 ? (
              <>
                <h2 className="font-semibold text-foreground mb-1">Não é possível excluir</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  <strong className="text-foreground">{confirmDelete.name}</strong> ainda tem{" "}
                  <strong className="text-destructive">{confirmDelete.currentStock} {confirmDelete.unit}</strong> em
                  estoque. Zere o estoque antes de excluir, para não perder o rastreamento de uma mercadoria que
                  ainda existe fisicamente.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setAdjustProduct(confirmDelete); setConfirmDelete(null) }}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition min-h-[44px]"
                  >
                    Ajustar estoque
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-4 py-2.5 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition min-h-[44px]"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-semibold text-foreground mb-1">Excluir produto?</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  O produto <strong className="text-foreground">{confirmDelete.name}</strong> será removido
                  do cadastro. As movimentações no histórico não serão apagadas.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDeleteProduct(confirmDelete)}
                    className="flex-1 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:opacity-90 transition min-h-[44px]"
                  >
                    Excluir
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-4 py-2.5 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition min-h-[44px]"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
