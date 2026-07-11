"use client"

import { useState } from "react"
import { Package, Plus, Pencil, Trash2, Printer, AlertTriangle, Hash, Search, X, ChevronLeft, ChevronRight } from "lucide-react"
import type { StockProduct } from "./types"

const PAGE_SIZE = 50

function formatCode(code: number | null) {
  if (code === null) return "--"
  return "#" + String(code).padStart(4, "0")
}

interface Props {
  products: StockProduct[]
  onAdd: () => void
  onEdit: (product: StockProduct) => void
  onDelete: (product: StockProduct) => void
  onPrint: (product: StockProduct) => void
}

export function ProductsTab({ products, onAdd, onEdit, onDelete, onPrint }: Props) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const lowStock = products.filter((p) => p.currentStock < p.minStock)

  const trimmed = search.trim().toLowerCase()
  const numericSearch = parseInt(trimmed, 10)
  const filtered = trimmed
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          (p.sku && p.sku.toLowerCase().includes(trimmed)) ||
          (!isNaN(numericSearch) && p.code === numericSearch) ||
          formatCode(p.code).toLowerCase().includes(trimmed)
      )
    : products

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nome, código ou SKU…"
            className="w-full h-12 pl-10 pr-10 rounded-xl border border-border bg-background text-base text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} de {products.length}
          </p>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground hover:opacity-90 transition min-h-[48px]"
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-base text-destructive">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <span>
            <strong>{lowStock.length}</strong> produto(s) abaixo do estoque mínimo:{" "}
            {lowStock.map((p) => p.name).join(", ")}
          </span>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">Nenhum produto cadastrado ainda.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">Nenhum produto encontrado para <strong className="text-foreground">&ldquo;{search}&rdquo;</strong>.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-4 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Cód.</th>
                  <th className="px-5 py-4 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Produto</th>
                  <th className="px-5 py-4 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">SKU</th>
                  <th className="px-5 py-4 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Unidade</th>
                  <th className="px-5 py-4 text-right font-semibold text-foreground/70 text-xs uppercase tracking-wide">Em Estoque</th>
                  <th className="px-5 py-4 text-right font-semibold text-foreground/70 text-xs uppercase tracking-wide">Mínimo</th>
                  <th className="px-5 py-4 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => {
                  const isLow = p.currentStock < p.minStock
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-border last:border-0 transition ${
                        isLow ? "bg-destructive/5" : "hover:bg-muted/40"
                      }`}
                    >
                      <td className={`px-5 py-4 font-mono text-sm font-semibold text-primary ${isLow ? "border-l-4 border-l-destructive pl-4" : ""}`}>
                        {formatCode(p.code)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-base text-foreground">
                        {p.name}
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-foreground/80">{p.sku ?? "—"}</td>
                      <td className="px-5 py-4 text-base text-foreground/80">{p.unit}</td>
                      <td className={`px-5 py-4 text-right font-black text-2xl ${isLow ? "text-destructive" : "text-foreground"}`}>
                        {p.currentStock}
                      </td>
                      <td className="px-5 py-4 text-right text-base text-foreground/80">{p.minStock}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => onPrint(p)} title="Imprimir etiqueta" className="min-w-[40px] min-h-[40px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition">
                            <Printer size={16} />
                          </button>
                          <button onClick={() => onEdit(p)} title="Editar" className="min-w-[40px] min-h-[40px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => onDelete(p)} title="Excluir" className="min-w-[40px] min-h-[40px] flex items-center justify-center text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {paginated.map((p) => {
              const isLow = p.currentStock < p.minStock
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border bg-card p-5 ${
                    isLow
                      ? "border-l-4 border-l-destructive border-t-border border-r-border border-b-border bg-destructive/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Hash size={12} className="text-primary" />
                        <span className="text-sm font-mono font-semibold text-primary">{formatCode(p.code)}</span>
                      </div>
                      <p className="text-lg font-bold text-foreground leading-tight">{p.name}</p>
                      {p.sku && <p className="text-sm font-mono text-foreground/70 mt-0.5">SKU: {p.sku}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-3xl font-black ${isLow ? "text-destructive" : "text-foreground"}`}>
                        {p.currentStock}
                      </p>
                      <p className="text-sm text-muted-foreground">{p.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">Mínimo: <strong className="text-foreground">{p.minStock}</strong></p>
                    <div className="flex gap-1">
                      <button onClick={() => onPrint(p)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground rounded-lg hover:bg-muted transition">
                        <Printer size={18} />
                      </button>
                      <button onClick={() => onEdit(p)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground rounded-lg hover:bg-muted transition">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => onDelete(p)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} produtos
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-border hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 text-sm font-medium text-foreground">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-border hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
