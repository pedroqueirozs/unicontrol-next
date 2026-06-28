"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Search, X, Minus, Plus, Trash2, FileDown } from "lucide-react"
import { generateDocx, type PrintQueueItem, type CompanySender } from "@/lib/docx-generator"

type SearchResult = {
  id: string
  type: "client" | "supplier"
  code: string
  name: string
  cnpj: string
  city: string | null
  state: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  zipCode: string | null
}

type QueueItem = SearchResult & { quantity: number }

function queueKey(item: Pick<SearchResult, "id" | "type">) {
  return `${item.type}-${item.id}`
}

const TYPE_LABELS = { client: "Cliente", supplier: "Fornecedor" }
const TYPE_COLORS = {
  client: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  supplier: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
}

function TypeBadge({ type }: { type: "client" | "supplier" }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  )
}

export default function AddressPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [generating, setGenerating] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }
    setSearching(true)
    const res = await fetch(`/api/address/search?q=${encodeURIComponent(q)}`)
    if (res.ok) {
      const data = await res.json()
      setResults(data)
      setShowDropdown(true)
    }
    setSearching(false)
  }, [])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 300)
  }

  function handleClearSearch() {
    setQuery("")
    setResults([])
    setShowDropdown(false)
  }

  function handleSelectResult(result: SearchResult) {
    const key = queueKey(result)
    setQueue((prev) => {
      const existing = prev.find((i) => queueKey(i) === key)
      if (existing) {
        return prev.map((i) =>
          queueKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...result, quantity: 1 }]
    })
    setShowDropdown(false)
    setQuery("")
    setResults([])
  }

  function handleAdjustQuantity(key: string, delta: number) {
    setQueue((prev) =>
      prev.map((i) =>
        queueKey(i) === key
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      )
    )
  }

  function handleRemove(key: string) {
    setQueue((prev) => prev.filter((i) => queueKey(i) !== key))
  }

  async function handleGenerate() {
    if (queue.length === 0) return
    setGenerating(true)

    try {
      const companyRes = await fetch("/api/company")
      if (!companyRes.ok) throw new Error("Erro ao carregar dados da empresa.")
      const company = await companyRes.json()

      // Busca o logo se existir
      let logoBuffer: ArrayBuffer | null = null
      let logoType: "png" | "jpg" = "jpg"
      if (company.logoUrl) {
        try {
          const logoRes = await fetch(company.logoUrl)
          logoBuffer = await logoRes.arrayBuffer()
          logoType = company.logoUrl.endsWith(".png") ? "png" : "jpg"
        } catch {
          // Continua sem logo
        }
      }

      const sender: CompanySender = {
        name: company.name ?? "",
        street: company.street ?? "",
        district: company.district ?? "",
        city: company.city ?? "",
        state: company.state ?? "",
        zip: company.zip ?? "",
        phone: company.phone ?? "",
        whatsapp: company.whatsapp ?? "",
      }

      const addresses: PrintQueueItem[] = queue.map((item) => ({
        id: item.id,
        sourceType: item.type,
        name: item.name,
        code: item.code,
        street: item.street ?? "",
        number: item.number ?? "",
        complement: item.complement ?? "",
        neighborhood: item.neighborhood ?? "",
        city: item.city ?? "",
        state: item.state ?? "",
        zipCode: item.zipCode ?? "",
        amount: item.quantity,
      }))

      const blob = await generateDocx(addresses, sender, logoBuffer, logoType)

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "Endereços.docx"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar documento.")
    }

    setGenerating(false)
  }

  const totalLabels = queue.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="flex flex-col gap-6">

      {/* ── Busca ── */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Buscar destinatário</p>
        <p className="text-xs text-muted-foreground -mt-1">
          Pesquise por nome ou código. Clique no resultado para adicionar à fila de impressão.
        </p>

        <div ref={containerRef} className="relative w-full max-w-sm">
          <div className="flex items-center gap-2 h-11 px-3 rounded-md border border-border bg-input-bg focus-within:border-ring transition-colors">
            <Search size={15} className="text-muted-foreground flex-shrink-0" />
            <input
              value={query}
              onChange={handleQueryChange}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              placeholder="Nome ou código do cliente / fornecedor..."
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
            {searching && (
              <span className="text-xs text-muted-foreground">...</span>
            )}
            {query && !searching && (
              <button onClick={handleClearSearch} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute top-12 left-0 w-full min-w-[380px] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              {results.map((result) => (
                <button
                  key={queueKey(result)}
                  onClick={() => handleSelectResult(result)}
                  className="w-full flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {result.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {result.cnpj}
                      </span>
                    </div>
                    {(result.city || result.state) && (
                      <span className="text-xs text-muted-foreground">
                        {[result.city, result.state].filter(Boolean).join(" - ")}
                      </span>
                    )}
                  </div>
                  <TypeBadge type={result.type} />
                </button>
              ))}
            </div>
          )}

          {showDropdown && results.length === 0 && query.length >= 2 && !searching && (
            <div className="absolute top-12 left-0 w-full bg-card border border-border rounded-xl shadow-xl z-50 px-4 py-3 text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          )}
        </div>
      </div>

      {/* ── Fila de impressão ── */}
      {queue.length > 0 && (
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="font-semibold text-foreground">Fila de impressão</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalLabels} etiqueta{totalLabels !== 1 ? "s" : ""} a gerar.
              </p>
            </div>
            <button
              onClick={() => setQueue([])}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Limpar tudo
            </button>
          </div>

          {/* Tabela desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Código</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Destinatário</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Endereço</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cidade / UF</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Complemento</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">CEP</th>
                  <th className="text-center px-5 py-3 font-medium text-muted-foreground">Quantidade</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => {
                  const key = queueKey(item)
                  const address = [item.street, item.number].filter(Boolean).join(", ")
                  const cityUf = [item.city, item.state].filter(Boolean).join(" - ")
                  return (
                    <tr key={key} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3"><TypeBadge type={item.type} /></td>
                      <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{item.code}</td>
                      <td className="px-5 py-3 font-medium text-foreground">{item.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{address || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{cityUf || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{item.complement || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{item.zipCode || "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAdjustQuantity(key, -1)}
                            disabled={item.quantity <= 1}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center font-medium text-foreground tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleAdjustQuantity(key, 1)}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleRemove(key)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden flex flex-col divide-y divide-border">
            {queue.map((item) => {
              const key = queueKey(item)
              const address = [item.street, item.number].filter(Boolean).join(", ")
              const cityUf = [item.city, item.state].filter(Boolean).join(" - ")
              return (
                <div key={key} className="px-4 py-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TypeBadge type={item.type} />
                        <span className="text-xs text-muted-foreground font-mono">{item.code}</span>
                      </div>
                      <span className="font-medium text-foreground text-sm">{item.name}</span>
                      {address && <span className="text-xs text-muted-foreground">{address}</span>}
                      {cityUf && <span className="text-xs text-muted-foreground">{cityUf}</span>}
                      {item.zipCode && <span className="text-xs text-muted-foreground">CEP: {item.zipCode}</span>}
                    </div>
                    <button
                      onClick={() => handleRemove(key)}
                      className="flex-shrink-0 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Quantidade:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdjustQuantity(key, -1)}
                        disabled={item.quantity <= 1}
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-30"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-medium text-foreground tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleAdjustQuantity(key, 1)}
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Botão gerar ── */}
      {queue.length > 0 && (
        <div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 h-11 px-6 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-progress"
          >
            <FileDown size={18} />
            {generating ? "Gerando..." : "Gerar endereços"}
          </button>
        </div>
      )}

    </div>
  )
}
