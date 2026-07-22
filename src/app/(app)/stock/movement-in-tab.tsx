"use client"

import { useState, useRef, useEffect } from "react"
import { PackagePlus, ScanLine, X, Trash2, CheckCircle2, ChevronRight } from "lucide-react"
import type { StockProduct } from "./types"
import { QuantityStepper } from "./quantity-stepper"

type CartItem = { product: StockProduct; quantity: number }

interface Props {
  products: StockProduct[]
  onRegisterBatch: (items: CartItem[], reason: string) => Promise<void>
}

export function MovementInTab({ products, onRegisterBatch }: Props) {
  const [mode, setMode] = useState<"idle" | "active">("idle")
  const [reason, setReason] = useState("")
  const [reasonError, setReasonError] = useState(false)

  // Product selection
  const [searchText, setSearchText] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [errorMsg, setErrorMsg] = useState("")

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const quantityRef = useRef<HTMLInputElement>(null)
  const reasonRef = useRef<HTMLInputElement>(null)
  const startButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (mode === "active") setTimeout(() => reasonRef.current?.focus(), 100)
    if (mode === "idle") setTimeout(() => startButtonRef.current?.focus(), 50)
  }, [mode])

  // Filter products — searches by name, SKU (legacy) and auto code
  const trimmed = searchText.trim().toLowerCase()
  const numericTrimmed = parseInt(trimmed, 10)
  const results =
    trimmed.length >= 1
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(trimmed) ||
            (p.sku && p.sku.toLowerCase().includes(trimmed)) ||
            (!isNaN(numericTrimmed) && p.code === numericTrimmed)
        ).slice(0, 5)
      : []

  function selectProduct(product: StockProduct) {
    setSelectedProduct(product)
    setSearchText(product.name)
    setShowDropdown(false)
    setErrorMsg("")
    setQuantity(1)
    setTimeout(() => { quantityRef.current?.focus(); quantityRef.current?.select() }, 50)
  }

  function clearSelection() {
    setSelectedProduct(null)
    setSearchText("")
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      const val = searchText.trim()
      const numericVal = parseInt(val, 10)
      // Exact match: auto code or SKU
      const exact = products.find((p) =>
        (!isNaN(numericVal) && p.code === numericVal) ||
        (p.sku && p.sku.toLowerCase() === val.toLowerCase())
      )
      if (exact) { selectProduct(exact); return }
      if (results.length === 1) { selectProduct(results[0]); return }
      if (trimmed) {
        setErrorMsg("Produto não encontrado. Tente o nome ou escaneie o código.")
        setTimeout(() => setErrorMsg(""), 3000)
      }
    }
    if (e.key === "Escape") setShowDropdown(false)
  }

  function addToCart() {
    if (!selectedProduct || quantity < 1) return
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === selectedProduct.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === selectedProduct.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...prev, { product: selectedProduct, quantity }]
    })
    clearSelection()
    setQuantity(1)
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  function cancel() {
    setMode("idle")
    setReason("")
    setReasonError(false)
    setCart([])
    clearSelection()
    setQuantity(1)
  }

  async function confirmAll() {
    if (!reason.trim()) { setReasonError(true); reasonRef.current?.focus(); return }
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      await onRegisterBatch(cart, reason)
      cancel()
    } finally {
      setSubmitting(false)
    }
  }

  const totalUnits = cart.reduce((acc, i) => acc + i.quantity, 0)

  // ── IDLE STATE ────────────────────────────────────────────────────────────────
  if (mode === "idle") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-details-green/15 flex items-center justify-center">
            <PackagePlus size={40} className="text-details-green" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Entrada de Estoque</h2>
          <p className="text-lg text-muted-foreground max-w-sm">
            Registre a entrada de produtos recebidos. Adicione todos os itens da nota antes de confirmar.
          </p>
        </div>
        <button
          ref={startButtonRef}
          onClick={() => setMode("active")}
          className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-details-green text-white text-2xl font-bold hover:opacity-90 transition shadow-lg min-h-[80px] focus:outline-none focus:ring-4 focus:ring-details-green/40"
        >
          <PackagePlus size={28} /> INICIAR ENTRADA <ChevronRight size={24} />
        </button>
      </div>
    )
  }

  // ── ACTIVE STATE ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">

      {/* Reason */}
      <div className="rounded-2xl border-2 border-border bg-card p-6 flex flex-col gap-3">
        <label htmlFor="in-reason" className="text-sm font-bold text-foreground/70 uppercase tracking-widest">
          Motivo da Entrada <span className="text-destructive">*</span>
        </label>
        <input
          ref={reasonRef}
          id="in-reason"
          type="text"
          value={reason}
          onChange={(e) => { setReason(e.target.value.toUpperCase()); setReasonError(false) }}
          placeholder="Ex: NF 12345, Compra Fornecedor XYZ..."
          className={`h-16 rounded-xl border-2 bg-background px-5 text-xl text-foreground placeholder:text-muted-foreground outline-none transition-colors ${
            reasonError ? "border-destructive" : "border-border focus:border-ring"
          }`}
          onKeyDown={(e) => { if (e.key === "Enter") searchRef.current?.focus() }}
        />
        {reasonError && (
          <p className="text-base text-destructive font-medium">Informe o motivo antes de confirmar.</p>
        )}
      </div>

      {/* Product search */}
      <div className="rounded-2xl border-2 border-border bg-card p-6 flex flex-col gap-5">
        <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest">
          Produto — Bipe o código ou pesquise
        </label>

        <div className="relative">
          <div className={`flex items-center gap-3 h-16 rounded-xl border-2 px-5 transition-colors ${
            selectedProduct
              ? "border-details-green bg-details-green/5"
              : "border-border bg-background focus-within:border-ring"
          }`}>
            <ScanLine size={24} className="text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={searchText}
              autoComplete="off"
              placeholder="Bipe ou digite nome / SKU..."
              className="flex-1 bg-transparent text-xl text-foreground placeholder:text-muted-foreground outline-none"
              onChange={(e) => {
                setSearchText(e.target.value)
                setSelectedProduct(null)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              onKeyDown={handleSearchKeyDown}
            />
            {searchText && (
              <button type="button" onClick={clearSelection} className="text-muted-foreground hover:text-foreground p-1">
                <X size={20} />
              </button>
            )}
          </div>

          {showDropdown && results.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-card border-2 border-border rounded-xl shadow-xl overflow-hidden">
              {results.map((p) => (
                <li
                  key={p.id}
                  onMouseDown={() => selectProduct(p)}
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-lg font-semibold text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {p.sku} · Atual: {p.currentStock} {p.unit}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedProduct && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="rounded-xl bg-details-green/10 border border-details-green/30 px-5 py-3 flex-1">
              <p className="text-xl font-bold text-details-green">{selectedProduct.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {selectedProduct.sku} · Estoque atual: {selectedProduct.currentStock} {selectedProduct.unit}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                inputRef={quantityRef}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToCart() } }}
              />
              <button
                onClick={addToCart}
                className="h-16 px-6 rounded-xl bg-primary text-primary-foreground text-lg font-bold hover:opacity-90 transition whitespace-nowrap"
              >
                + ADICIONAR
              </button>
            </div>
          </div>
        )}

        {errorMsg && <p className="text-base text-destructive font-medium">{errorMsg}</p>}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
          <div className="px-6 py-4 bg-muted/50 border-b border-border flex items-center justify-between">
            <p className="text-sm font-bold text-foreground/70 uppercase tracking-widest">
              Produtos Adicionados
            </p>
            <span className="text-sm font-semibold text-foreground bg-primary/10 text-primary px-3 py-1 rounded-full">
              {cart.length} produto{cart.length > 1 ? "s" : ""} · {totalUnits} unidade{totalUnits > 1 ? "s" : ""}
            </span>
          </div>
          {cart.map((item, idx) => (
            <div
              key={item.product.id}
              className={`flex items-center justify-between px-6 py-5 ${
                idx < cart.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div>
                <p className="text-xl font-bold text-foreground">{item.product.name}</p>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">{item.product.sku}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-black text-details-green">
                  {item.quantity}
                  <span className="text-base font-normal text-muted-foreground ml-1">{item.product.unit}</span>
                </span>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={cancel}
          className="h-14 px-8 rounded-xl border-2 border-border text-foreground text-lg font-semibold hover:bg-muted transition"
        >
          Cancelar
        </button>
        <button
          onClick={confirmAll}
          disabled={submitting || cart.length === 0}
          className="flex-1 h-14 rounded-xl bg-details-green text-white text-xl font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <CheckCircle2 size={22} />
          {submitting ? "Registrando..." : `CONFIRMAR ENTRADA (${totalUnits} unidade${totalUnits !== 1 ? "s" : ""})`}
        </button>
      </div>
    </div>
  )
}
