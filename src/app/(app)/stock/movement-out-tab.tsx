"use client"

import { useState, useRef, useEffect } from "react"
import { PackageMinus, ScanLine, Trash2, CheckCircle2, ChevronRight, Plus, Minus } from "lucide-react"
import type { StockProduct } from "./types"
import { QuantityStepper } from "./quantity-stepper"

type CartItem = { product: StockProduct; quantity: number }

interface Props {
  products: StockProduct[]
  onRegisterBatch: (items: CartItem[], reason: string) => Promise<void>
}

export function MovementOutTab({ products, onRegisterBatch }: Props) {
  const [mode, setMode] = useState<"idle" | "active">("idle")
  const [reason, setReason] = useState("")
  const [reasonError, setReasonError] = useState(false)

  // Product selection
  const [searchText, setSearchText] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [flashMsg, setFlashMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null)

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

  function flash(text: string, type: "ok" | "err") {
    setFlashMsg({ text, type })
    setTimeout(() => setFlashMsg(null), 2500)
  }

  // Filter products as you type — busca por nome, SKU (legado) e código automático,
  // igual à busca da aba Entrada.
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
    setQuantity(1)
    setTimeout(() => { quantityRef.current?.focus(); quantityRef.current?.select() }, 50)
  }

  function clearSelection() {
    setSelectedProduct(null)
    setSearchText("")
    setQuantity(1)
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") { setShowDropdown(false); return }
    if (e.key !== "Enter") return
    e.preventDefault()
    const val = searchText.trim()
    if (!val) return

    // Bipador: o código impresso na etiqueta é o "code" (auto), então tem prioridade
    // sobre um match parcial por nome/SKU — evita ambiguidade quando o operador bipa.
    const numericVal = parseInt(val, 10)
    const exact = products.find((p) =>
      (!isNaN(numericVal) && p.code === numericVal) ||
      (p.sku && p.sku.toLowerCase() === val.toLowerCase())
    )
    if (exact) { selectProduct(exact); return }
    if (results.length === 1) { selectProduct(results[0]); return }

    flash(`"${val}" não encontrado no cadastro.`, "err")
    setSearchText("")
  }

  function addToCart() {
    if (!selectedProduct || quantity < 1) return
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === selectedProduct.id)
      if (existing) {
        flash(`${selectedProduct.name} → ${existing.quantity + quantity}×`, "ok")
        return prev.map((i) =>
          i.product.id === selectedProduct.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      flash(`${selectedProduct.name} adicionado`, "ok")
      return [...prev, { product: selectedProduct, quantity }]
    })
    clearSelection()
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    )
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
    setFlashMsg(null)
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

  // ── IDLE ──────────────────────────────────────────────────────────────────────
  if (mode === "idle") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <PackageMinus size={40} className="text-destructive" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Saída de Estoque</h2>
          <p className="text-lg text-muted-foreground max-w-sm">
            Registre a saída de produtos de um pedido. Bipe ou adicione todos os itens antes de confirmar.
          </p>
        </div>
        <button
          ref={startButtonRef}
          onClick={() => setMode("active")}
          className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-destructive text-white text-2xl font-bold hover:opacity-90 transition shadow-lg min-h-[80px] focus:outline-none focus:ring-4 focus:ring-destructive/40"
        >
          <PackageMinus size={28} /> INICIAR PREPARAÇÃO <ChevronRight size={24} />
        </button>
      </div>
    )
  }

  // ── ACTIVE ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">

      {/* Reason */}
      <div className="rounded-2xl border-2 border-border bg-card p-6 flex flex-col gap-3">
        <label htmlFor="out-reason" className="text-sm font-bold text-foreground/70 uppercase tracking-widest">
          Motivo / Destino da Saída <span className="text-destructive">*</span>
        </label>
        <input
          ref={reasonRef}
          id="out-reason"
          type="text"
          value={reason}
          onChange={(e) => { setReason(e.target.value.toUpperCase()); setReasonError(false) }}
          placeholder="Ex: Pedido NF 1234, Pedido Cliente XYZ..."
          className={`h-16 rounded-xl border-2 bg-background px-5 text-xl text-foreground placeholder:text-muted-foreground outline-none transition-colors ${
            reasonError ? "border-destructive" : "border-border focus:border-ring"
          }`}
          onKeyDown={(e) => { if (e.key === "Enter") searchRef.current?.focus() }}
        />
        {reasonError && (
          <p className="text-base text-destructive font-medium">Informe o motivo antes de confirmar.</p>
        )}
      </div>

      {/* Bipador panel */}
      <div className="rounded-2xl bg-sidebar p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <ScanLine size={22} className="text-sidebar-foreground/70" />
          <h2 className="text-xl font-bold text-sidebar-foreground">Bipador / Conferência</h2>
        </div>
        <p className="text-base text-sidebar-foreground/60">
          Bipe o código de barras ou digite nome / SKU para buscar.
        </p>

        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            value={searchText}
            autoComplete="off"
            placeholder="Bipe ou digite nome / SKU..."
            className="w-full h-16 rounded-xl border-2 border-sidebar-foreground/20 bg-sidebar-foreground/10 px-5 text-2xl text-sidebar-foreground placeholder:text-sidebar-foreground/40 outline-none focus:border-sidebar-accent focus:ring-2 focus:ring-sidebar-accent transition-colors font-mono"
            onChange={(e) => {
              setSearchText(e.target.value)
              setSelectedProduct(null)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            onKeyDown={handleSearchKeyDown}
          />

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
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-5 py-3 flex-1">
              <p className="text-xl font-bold text-destructive">{selectedProduct.name}</p>
              <p className="text-sm text-sidebar-foreground/60 mt-0.5">
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
                className="h-16 px-6 rounded-xl bg-destructive text-white text-lg font-bold hover:opacity-90 transition whitespace-nowrap"
              >
                + ADICIONAR
              </button>
            </div>
          </div>
        )}

        {/* Flash feedback */}
        {flashMsg && (
          <div className={`text-lg font-semibold px-5 py-3 rounded-xl ${
            flashMsg.type === "ok"
              ? "bg-details-green/20 text-details-green"
              : "bg-destructive/20 text-destructive"
          }`}>
            {flashMsg.text}
          </div>
        )}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
          <div className="px-6 py-4 bg-muted/50 border-b border-border flex items-center justify-between">
            <p className="text-sm font-bold text-foreground/70 uppercase tracking-widest">
              Itens do Pedido
            </p>
            <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
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
              <div className="min-w-0 mr-4">
                <p className="text-xl font-bold text-foreground">{item.product.name}</p>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">{item.product.sku}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => updateQty(item.product.id, -1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition text-foreground"
                >
                  <Minus size={16} />
                </button>
                <span className="text-3xl font-black text-destructive w-12 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQty(item.product.id, 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition text-foreground"
                >
                  <Plus size={16} />
                </button>
                <span className="text-base text-muted-foreground w-6">{item.product.unit}</span>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                >
                  <Trash2 size={17} />
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
          className="flex-1 h-14 rounded-xl bg-destructive text-white text-xl font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <CheckCircle2 size={22} />
          {submitting ? "Registrando..." : `CONFIRMAR SAÍDA (${totalUnits} unidade${totalUnits !== 1 ? "s" : ""})`}
        </button>
      </div>
    </div>
  )
}
