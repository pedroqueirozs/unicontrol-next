"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Flag,
  Trash2,
  Pencil,
  Plus,
  X,
  ExternalLink,
  Copy,
  Check,
  Search,
  Package,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react"
import { FormInput } from "@/components/form-input"

// ── Types ─────────────────────────────────────────────────────────────────────

type Carrier = {
  id: string
  name: string
  type: "empresa" | "simples"
  trackingUrl: string | null
}

type Client = {
  id: string
  code: string
  name: string
  cnpj: string
  city: string | null
  state: string | null
}

type NoteEntry = { id: string; text: string; createdAt: string }

type Shipment = {
  id: string
  name: string
  documentNumber: string
  city: string
  uf: string
  transporter: string
  shippingDate: string
  deliveryForecast: string | null
  deliveryDate: string | null
  flagged: boolean
  clientId: string
  clientCode: string
  trackingCodes: string[]
  notesHistory: NoteEntry[]
  createdAt: string
  updatedAt: string
}

type SituationType = "Entregue" | "Atrasada" | "No Prazo" | "—"
type FilterTab = "todos" | "no-prazo" | "atrasada" | "entregue"

// ── Helpers ───────────────────────────────────────────────────────────────────

function toInputDate(iso: string | null | undefined): string {
  if (!iso) return ""
  return iso.split("T")[0]
}

function todayInputDate(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getSituation(shipment: Shipment): SituationType {
  if (shipment.deliveryDate) return "Entregue"
  if (!shipment.deliveryForecast) return "—"
  const forecast = toInputDate(shipment.deliveryForecast)
  if (todayInputDate() > forecast) return "Atrasada"
  return "No Prazo"
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(iso))
}

const SITUATION_COLORS: Record<string, string> = {
  Entregue: "bg-details-green/15 text-details-green",
  Atrasada: "bg-destructive/10 text-destructive",
  "No Prazo": "bg-primary/10 text-primary",
  "—": "bg-muted text-muted-foreground",
}

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]

const PAGE_SIZE = 50

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1),
  documentNumber: z.string().min(1, "Nota fiscal é obrigatória"),
  city: z.string().min(1),
  uf: z.string().min(1),
  transporter: z.string().min(1, "Selecione uma transportadora"),
  shippingDate: z.string().min(1, "Data de envio obrigatória"),
  deliveryForecast: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GoodsShippedPage() {
  // Data
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [filter, setFilter] = useState<FilterTab>("todos")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Shipment | null>(null)
  const [detailItem, setDetailItem] = useState<Shipment | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Shipment | null>(null)

  // Quick deliver dialog
  const [deliverDialog, setDeliverDialog] = useState<{ shipment: Shipment; date: string } | null>(null)
  const [delivering, setDelivering] = useState(false)

  // Client search
  const [clientSearch, setClientSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientDrop, setShowClientDrop] = useState(false)
  const clientSearchRef = useRef<HTMLDivElement>(null)

  // Tracking codes
  const [trackingCodes, setTrackingCodes] = useState<string[]>([])
  const [trackingInput, setTrackingInput] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [copiedShareLink, setCopiedShareLink] = useState(false)

  // Notes
  const [newNoteText, setNewNoteText] = useState("")
  const [addingNote, setAddingNote] = useState(false)

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const watchedTransporter = watch("transporter")
  const watchedShippingDate = watch("shippingDate")
  const selectedCarrier = carriers.find((c) => c.name === watchedTransporter) ?? null
  const isSimples = selectedCarrier?.type === "simples"

  // Auto-set deliveryDate when carrier is "simples"
  useEffect(() => {
    if (isSimples && watchedShippingDate) {
      setValue("deliveryDate", watchedShippingDate)
      setValue("deliveryForecast", null)
    }
  }, [isSimples, watchedShippingDate, setValue])

  // Close client dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (clientSearchRef.current && !clientSearchRef.current.contains(e.target as Node)) {
        setShowClientDrop(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  // Load initial data
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [sr, cr, clr] = await Promise.all([
          fetch("/api/goods-shipped"),
          fetch("/api/carriers"),
          fetch("/api/clients"),
        ])
        if (!sr.ok || !cr.ok || !clr.ok) throw new Error()
        const [shipmentsData, carriersData, clientsData] = await Promise.all([
          sr.json(),
          cr.json(),
          clr.json(),
        ])
        setShipments(shipmentsData)
        setCarriers(carriersData)
        setClients(clientsData)
      } catch {
        toast.error("Erro ao carregar os dados.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filtered shipments
  const trimmedSearch = search.trim().toLowerCase()
  const filtered = shipments.filter((s) => {
    const sit = getSituation(s)
    if (filter === "entregue" && sit !== "Entregue") return false
    if (filter === "atrasada" && sit !== "Atrasada") return false
    if (filter === "no-prazo" && sit !== "No Prazo") return false

    if (!trimmedSearch) return true
    return (
      s.name.toLowerCase().includes(trimmedSearch) ||
      s.documentNumber.toLowerCase().includes(trimmedSearch) ||
      s.city.toLowerCase().includes(trimmedSearch) ||
      s.transporter.toLowerCase().includes(trimmedSearch) ||
      s.clientCode.toLowerCase().includes(trimmedSearch) ||
      s.trackingCodes.some((code) => code.toLowerCase().includes(trimmedSearch))
    )
  })

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "no-prazo", label: "No Prazo" },
    { key: "atrasada", label: "Atrasadas" },
    { key: "entregue", label: "Entregues" },
  ]

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleFilterChange(tab: FilterTab) {
    setFilter(tab)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  // Client search results
  const trimmed = clientSearch.trim().toLowerCase()
  const clientResults =
    trimmed.length >= 1
      ? clients
          .filter(
            (c) =>
              c.name.toLowerCase().includes(trimmed) ||
              (c.cnpj ?? "").toLowerCase().includes(trimmed) ||
              c.code.toLowerCase().includes(trimmed)
          )
          .slice(0, 8)
      : []

  function handleSelectClient(client: Client) {
    setSelectedClient(client)
    setValue("name", client.name)
    setValue("city", client.city ?? "")
    setValue("uf", client.state ?? "SP")
    setClientSearch("")
    setShowClientDrop(false)
  }

  function handleClearClient() {
    setSelectedClient(null)
    setValue("name", "")
    setValue("city", "")
    setValue("uf", "")
  }

  // Tracking codes
  function addTracking() {
    const code = trackingInput.trim().toUpperCase()
    if (!code || trackingCodes.includes(code)) return
    setTrackingCodes((prev) => [...prev, code])
    setTrackingInput("")
  }

  function removeTracking(code: string) {
    setTrackingCodes((prev) => prev.filter((c) => c !== code))
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Rastreio pelos Correios usa nossa página personalizada (consulta a API
  // real e mostra a linha do tempo); as demais transportadoras (ex: Braspress)
  // usam o link estático cadastrado no carrier, já preenchido com a NF.
  function isCorreiosShipment(shipment: Shipment): boolean {
    return shipment.transporter === "Correios"
  }

  // Compute tracking URL for a shipment's carrier (ex: Braspress) — link
  // estático cadastrado no carrier, preenchido com a NF quando aplicável.
  function getTrackingUrl(shipment: Shipment): string | null {
    const carrier = carriers.find((c) => c.name === shipment.transporter)
    if (!carrier?.trackingUrl) return null
    if (carrier.trackingUrl.endsWith("=")) return carrier.trackingUrl + shipment.documentNumber
    return carrier.trackingUrl
  }

  // URL do botão "Rastrear": nossa página personalizada para Correios,
  // ou o link da transportadora para as demais.
  function getTrackButtonUrl(shipment: Shipment): string | null {
    if (isCorreiosShipment(shipment)) {
      return shipment.trackingCodes.length > 0 ? `/rastreio/${shipment.id}` : null
    }
    return getTrackingUrl(shipment)
  }

  async function copyShareLink(shipment: Shipment) {
    const url = isCorreiosShipment(shipment)
      ? shipment.trackingCodes.length > 0
        ? `${window.location.origin}/rastreio/${shipment.id}`
        : null
      : getTrackingUrl(shipment)

    if (!url) {
      toast.error("Nenhum link de rastreio disponível para este envio.")
      return
    }

    await navigator.clipboard.writeText(url)
    setCopiedShareLink(true)
    setTimeout(() => setCopiedShareLink(false), 2000)
  }

  // Open form for new entry
  function openNewForm() {
    setEditItem(null)
    setSelectedClient(null)
    setClientSearch("")
    setTrackingCodes([])
    setTrackingInput("")
    reset({
      name: "",
      documentNumber: "",
      city: "",
      uf: "SP",
      transporter: "",
      shippingDate: "",
      deliveryForecast: "",
      deliveryDate: "",
      notes: "",
    })
    setShowForm(true)
  }

  // Open form for editing
  function openEditForm(item: Shipment) {
    setEditItem(item)
    const found = clients.find((c) => c.id === item.clientId)
    setSelectedClient(
      found ?? {
        id: item.clientId,
        code: item.clientCode,
        name: item.name,
        cnpj: "",
        city: item.city,
        state: item.uf,
      }
    )
    setClientSearch("")
    setTrackingCodes(item.trackingCodes ?? [])
    setTrackingInput("")
    reset({
      name: item.name,
      documentNumber: item.documentNumber,
      city: item.city,
      uf: item.uf,
      transporter: item.transporter,
      shippingDate: toInputDate(item.shippingDate),
      deliveryForecast: toInputDate(item.deliveryForecast),
      deliveryDate: toInputDate(item.deliveryDate),
      notes: "",
    })
    setShowForm(true)
    setDetailItem(null)
    setNewNoteText("")
  }

  function closeForm() {
    setShowForm(false)
    setEditItem(null)
    setSelectedClient(null)
    setClientSearch("")
    setTrackingCodes([])
    setTrackingInput("")
    reset()
  }

  // Submit form
  async function onSubmit(data: FormData) {
    if (!selectedClient) {
      toast.error("Selecione um cliente do cadastro antes de salvar.")
      return
    }

    const pendingCode = trackingInput.trim().toUpperCase()
    const finalCodes =
      pendingCode && !trackingCodes.includes(pendingCode)
        ? [...trackingCodes, pendingCode]
        : trackingCodes

    const payload = {
      name: selectedClient.name,
      documentNumber: data.documentNumber,
      city: selectedClient.city ?? data.city,
      uf: selectedClient.state ?? data.uf,
      transporter: data.transporter,
      shippingDate: data.shippingDate,
      deliveryForecast: isSimples ? null : data.deliveryForecast || null,
      deliveryDate: isSimples ? data.shippingDate : data.deliveryDate || null,
      clientId: selectedClient.id,
      clientCode: selectedClient.code,
      trackingCodes: finalCodes,
      ...(editItem ? {} : { notes: data.notes || null }),
    }

    try {
      if (editItem) {
        const res = await fetch(`/api/goods-shipped/${editItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const updated: Shipment = await res.json()
        setShipments((prev) => prev.map((s) => (s.id === editItem.id ? updated : s)))
        toast.success("Registro atualizado com sucesso!")
      } else {
        const res = await fetch("/api/goods-shipped", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const created: Shipment = await res.json()
        setShipments((prev) => [created, ...prev])
        toast.success("Mercadoria cadastrada com sucesso!")
      }
      closeForm()
    } catch {
      toast.error("Erro ao salvar. Tente novamente.")
    }
  }

  // Toggle flag
  async function toggleFlag(item: Shipment, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/goods-shipped/${item.id}/flag`, { method: "PATCH" })
      if (!res.ok) throw new Error()
      const { flagged } = await res.json()
      setShipments((prev) => prev.map((s) => (s.id === item.id ? { ...s, flagged } : s)))
      if (detailItem?.id === item.id) setDetailItem((prev) => (prev ? { ...prev, flagged } : prev))
    } catch {
      toast.error("Erro ao atualizar alerta.")
    }
  }

  // Delete
  async function handleDelete(item: Shipment) {
    try {
      const res = await fetch(`/api/goods-shipped/${item.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setShipments((prev) => prev.filter((s) => s.id !== item.id))
      setConfirmDelete(null)
      toast.success("Registro removido.")
    } catch {
      toast.error("Erro ao remover registro.")
    }
  }

  // Quick deliver
  async function handleDeliver() {
    if (!deliverDialog) return
    setDelivering(true)
    try {
      const res = await fetch(`/api/goods-shipped/${deliverDialog.shipment.id}/deliver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryDate: deliverDialog.date }),
      })
      if (!res.ok) throw new Error()
      const updated: Shipment = await res.json()
      setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      if (detailItem?.id === updated.id) setDetailItem(updated)
      setDeliverDialog(null)
      toast.success("Mercadoria marcada como entregue!")
    } catch {
      toast.error("Erro ao marcar como entregue.")
    } finally {
      setDelivering(false)
    }
  }

  // Add note
  async function handleAddNote() {
    if (!detailItem || !newNoteText.trim()) return
    setAddingNote(true)
    try {
      const res = await fetch(`/api/goods-shipped/${detailItem.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newNoteText.trim() }),
      })
      if (!res.ok) throw new Error()
      const { notesHistory } = await res.json()
      const updated = { ...detailItem, notesHistory: notesHistory as NoteEntry[] }
      setDetailItem(updated)
      setShipments((prev) => prev.map((s) => (s.id === detailItem.id ? updated : s)))
      setNewNoteText("")
      toast.success("Observação adicionada.")
    } catch {
      toast.error("Erro ao adicionar observação.")
    } finally {
      setAddingNote(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">Mercadorias Enviadas</h1>
        <button
          onClick={showForm ? closeForm : openNewForm}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition min-h-[44px]"
        >
          {showForm ? (
            <><X size={16} /> Fechar</>
          ) : (
            <><Plus size={16} /> Nova Mercadoria</>
          )}
        </button>
      </div>

      {/* ── Form ───────────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 md:p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">
            {editItem ? "Editar Mercadoria" : "Cadastrar Mercadoria"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

            {/* Client search */}
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground mb-3">Selecione o cliente</p>
              {selectedClient ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 flex-wrap">
                    <span className="text-sm font-semibold text-primary">{selectedClient.name}</span>
                    {selectedClient.cnpj && (
                      <span className="text-xs text-muted-foreground">{selectedClient.cnpj}</span>
                    )}
                    {selectedClient.city && (
                      <span className="text-xs text-muted-foreground">
                        {selectedClient.city}/{selectedClient.state}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearClient}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 min-h-[44px] px-2"
                  >
                    <X size={14} /> limpar
                  </button>
                </div>
              ) : (
                <div ref={clientSearchRef} className="relative max-w-md">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition">
                    <Search size={15} className="text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value)
                        setShowClientDrop(true)
                      }}
                      onFocus={() => setShowClientDrop(true)}
                      placeholder="Buscar por nome, código ou CNPJ..."
                      className="flex-1 py-2.5 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    />
                    {clientSearch && (
                      <button
                        type="button"
                        onClick={() => { setClientSearch(""); setShowClientDrop(false) }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {showClientDrop && clientResults.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                      {clientResults.map((c) => (
                        <li
                          key={c.id}
                          onMouseDown={() => handleSelectClient(c)}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.code}
                              {c.cnpj && ` · ${c.cnpj}`}
                              {c.city && ` · ${c.city}/${c.state}`}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {showClientDrop && trimmed.length >= 1 && clientResults.length === 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg px-4 py-3">
                      <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormInput
                label="Nome do Cliente"
                id="f-name"
                disabled
                {...register("name")}
                error={errors.name?.message}
              />
              <FormInput
                label="Nota Fiscal / Documento"
                id="f-doc"
                {...register("documentNumber")}
                error={errors.documentNumber?.message}
              />
              <FormInput
                label="Cidade"
                id="f-city"
                disabled
                {...register("city")}
                error={errors.city?.message}
              />

              <div className="flex flex-col gap-1">
                <label htmlFor="f-uf" className="text-sm font-medium text-foreground">UF</label>
                <select
                  id="f-uf"
                  disabled
                  {...register("uf")}
                  className="h-11 rounded-md border border-border bg-input-bg px-3 text-base text-foreground outline-none focus:border-ring transition-colors disabled:opacity-60"
                >
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="f-carrier" className="text-sm font-medium text-foreground">Transportadora</label>
                <select
                  id="f-carrier"
                  {...register("transporter")}
                  className="h-11 rounded-md border border-border bg-input-bg px-3 text-base text-foreground outline-none focus:border-ring transition-colors"
                >
                  <option value="">Selecione...</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}{c.type === "simples" ? " (simples)" : ""}
                    </option>
                  ))}
                </select>
                {errors.transporter && (
                  <span className="text-xs text-destructive">{errors.transporter.message}</span>
                )}
              </div>

              <FormInput
                label="Data de Envio"
                id="f-ship"
                type="date"
                {...register("shippingDate")}
                error={errors.shippingDate?.message}
              />

              {!isSimples && (
                <FormInput
                  label="Previsão de Entrega"
                  id="f-forecast"
                  type="date"
                  {...register("deliveryForecast")}
                  error={errors.deliveryForecast?.message}
                />
              )}

              {!isSimples && (
                <FormInput
                  label="Data da Entrega"
                  id="f-delivery"
                  type="date"
                  {...register("deliveryDate")}
                  error={errors.deliveryDate?.message}
                />
              )}

              {!editItem && (
                <div className="md:col-span-2 lg:col-span-3">
                  <FormInput
                    label="Observação inicial (opcional)"
                    id="f-notes"
                    {...register("notes")}
                    error={errors.notes?.message}
                  />
                </div>
              )}
            </div>

            {/* Tracking codes */}
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground mb-3">
                Códigos de Rastreio{" "}
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTracking() } }}
                  placeholder="Ex: AA123456789BR"
                  className="flex-1 h-10 text-sm border border-border rounded-md px-3 font-mono bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
                />
                <button
                  type="button"
                  onClick={addTracking}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition shrink-0 min-h-[44px]"
                >
                  Adicionar
                </button>
              </div>
              {trackingCodes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {trackingCodes.map((code) => (
                    <span
                      key={code}
                      className="flex items-center gap-1.5 bg-card border border-border text-foreground text-sm font-mono px-3 py-1 rounded-full"
                    >
                      {code}
                      <button
                        type="button"
                        onClick={() => removeTracking(code)}
                        className="text-muted-foreground hover:text-destructive flex items-center justify-center"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="flex gap-3 flex-wrap">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60 min-h-[44px]"
              >
                {isSubmitting ? "Salvando..." : editItem ? "Atualizar" : "Cadastrar"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2.5 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search + Filter tabs ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por cliente, NF, cidade, transportadora ou rastreio..."
              className="w-full h-11 pl-10 pr-10 rounded-lg border border-border bg-background text-base text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors"
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {search && (
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              {filtered.length} de {shipments.length} registros
            </p>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition min-h-[44px] ${
                filter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package size={40} className="mx-auto mb-2 opacity-30" />
          {search ? (
            <p>Nenhum registro encontrado para <strong className="text-foreground">&ldquo;{search}&rdquo;</strong>.</p>
          ) : (
            <p>Nenhum registro encontrado.</p>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">NF</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Cidade/UF</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Transportadora</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Envio</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Previsão</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Entregue</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Situação</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground/70 text-xs uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => {
                  const sit = getSituation(item)
                  const trackUrl = getTrackButtonUrl(item)
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setDetailItem(item)}
                      className={`border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition ${
                        item.flagged ? "bg-destructive/5 hover:bg-destructive/10" : ""
                      }`}
                    >
                      <td
                        className={`px-4 py-3 font-medium text-foreground ${
                          item.flagged ? "border-l-4 border-l-destructive pl-3" : ""
                        }`}
                      >
                        {item.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground/80">{item.documentNumber}</td>
                      <td className="px-4 py-3 text-foreground/80">{item.city}/{item.uf}</td>
                      <td className="px-4 py-3 text-foreground/80">{item.transporter}</td>
                      <td className="px-4 py-3 text-foreground/80">{formatDate(item.shippingDate)}</td>
                      <td className="px-4 py-3 text-foreground/80">{formatDate(item.deliveryForecast)}</td>
                      <td className="px-4 py-3 text-foreground/80">{formatDate(item.deliveryDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${SITUATION_COLORS[sit] ?? ""}`}>
                          {sit}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => toggleFlag(item, e)}
                            title={item.flagged ? "Remover alerta" : "Marcar em atenção"}
                            className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded transition ${
                              item.flagged
                                ? "text-destructive"
                                : "text-muted-foreground hover:text-destructive"
                            }`}
                          >
                            <Flag size={15} fill={item.flagged ? "currentColor" : "none"} />
                          </button>

                          {sit !== "Entregue" && (
                            <button
                              onClick={() => setDeliverDialog({ shipment: item, date: todayInputDate() })}
                              title="Marcar como entregue"
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded text-muted-foreground hover:text-details-green transition"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          {trackUrl && (
                            <a
                              href={trackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Rastrear"
                              onClick={(e) => e.stopPropagation()}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded text-muted-foreground hover:text-primary transition"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}

                          <button
                            onClick={() => openEditForm(item)}
                            title="Editar"
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            onClick={() => setConfirmDelete(item)}
                            title="Remover"
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition"
                          >
                            <Trash2 size={15} />
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
            {paginated.map((item) => {
              const sit = getSituation(item)
              const trackUrl = getTrackButtonUrl(item)
              return (
                <div
                  key={item.id}
                  onClick={() => setDetailItem(item)}
                  className={`rounded-xl border bg-card p-4 cursor-pointer transition ${
                    item.flagged
                      ? "border-l-4 border-l-destructive border-t-border border-r-border border-b-border bg-destructive/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">NF: {item.documentNumber}</p>
                    </div>
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${SITUATION_COLORS[sit] ?? ""}`}>
                      {sit}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1.5 text-sm mb-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Cidade: </span>
                      <span className="text-foreground">{item.city}/{item.uf}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Transportadora: </span>
                      <span className="text-foreground">{item.transporter}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Envio: </span>
                      <span className="text-foreground">{formatDate(item.shippingDate)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Previsão: </span>
                      <span className="text-foreground">{formatDate(item.deliveryForecast)}</span>
                    </div>
                    {item.deliveryDate && (
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground">Entregue em: </span>
                        <span className="text-details-green font-medium">{formatDate(item.deliveryDate)}</span>
                      </div>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1 pt-2 border-t border-border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => toggleFlag(item, e)}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        item.flagged ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      <Flag size={16} fill={item.flagged ? "currentColor" : "none"} />
                    </button>

                    {sit !== "Entregue" && (
                      <button
                        onClick={() => setDeliverDialog({ shipment: item, date: todayInputDate() })}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-details-green"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}

                    {trackUrl && (
                      <a
                        href={trackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}

                    <button
                      onClick={() => openEditForm(item)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => setConfirmDelete(item)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} registros
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

      {/* ── Detail Modal ─────────────────────────────────────────────────────────── */}
      {detailItem && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
          onClick={() => { setDetailItem(null); setNewNoteText("") }}
        >
          <div
            className="bg-card w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-foreground text-base">{detailItem.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    NF {detailItem.documentNumber} · {detailItem.city}/{detailItem.uf} · Envio: {formatDate(detailItem.shippingDate)}
                  </p>
                </div>
                <button
                  onClick={() => { setDetailItem(null); setNewNoteText("") }}
                  className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                {getSituation(detailItem) !== "Entregue" && (
                  <button
                    onClick={() => {
                      setDeliverDialog({ shipment: detailItem, date: todayInputDate() })
                      setDetailItem(null)
                      setNewNoteText("")
                    }}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-details-green/10 text-details-green hover:bg-details-green/20 transition min-h-[44px]"
                  >
                    <CheckCircle2 size={15} /> Marcar como entregue
                  </button>
                )}
                <button
                  onClick={() => openEditForm(detailItem)}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition min-h-[44px]"
                >
                  <Pencil size={15} /> Editar
                </button>
                <button
                  onClick={() => copyShareLink(detailItem)}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition min-h-[44px]"
                >
                  {copiedShareLink ? (
                    <>
                      <Check size={15} className="text-details-green" /> Link copiado!
                    </>
                  ) : (
                    <>
                      <Share2 size={15} /> Copiar link de rastreio
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-5">
              {/* Tracking codes + Rastrear */}
              {(() => {
                const trackUrl = getTrackButtonUrl(detailItem)
                if (detailItem.trackingCodes.length === 0 && !trackUrl) return null
                return (
                  <div>
                    {detailItem.trackingCodes.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Códigos de Rastreio
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {detailItem.trackingCodes.map((code) => (
                            <span
                              key={code}
                              className="flex items-center gap-1.5 bg-muted border border-border text-foreground text-sm font-mono px-3 py-1 rounded-full"
                            >
                              {code}
                              <button
                                onClick={() => copyCode(code)}
                                className="text-muted-foreground hover:text-foreground flex items-center justify-center"
                              >
                                {copiedCode === code ? (
                                  <Check size={13} className="text-details-green" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                    {trackUrl && (
                      <a
                        href={trackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <ExternalLink size={14} /> Rastrear
                      </a>
                    )}
                  </div>
                )
              })()}

              {/* Notes history */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Histórico de Observações
                </p>

                {detailItem.notesHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic mb-3">Nenhuma observação registrada.</p>
                ) : (
                  <div className="flex flex-col gap-2 mb-3 max-h-56 overflow-y-auto">
                    {[...detailItem.notesHistory].reverse().map((entry) => (
                      <div key={entry.id} className="bg-muted/60 border border-border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {new Intl.DateTimeFormat("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(entry.createdAt))}
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{entry.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-border pt-3">
                  <textarea
                    className="w-full min-h-[80px] rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors resize-none"
                    placeholder="Adicionar observação..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddNote}
                      disabled={addingNote || !newNoteText.trim()}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60 min-h-[44px]"
                    >
                      {addingNote ? "Salvando..." : "Adicionar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Deliver Dialog ─────────────────────────────────────────────────── */}
      {deliverDialog && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
          onClick={() => setDeliverDialog(null)}
        >
          <div
            className="bg-card w-full md:max-w-sm md:rounded-2xl rounded-t-2xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-foreground mb-1">Marcar como Entregue</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {deliverDialog.shipment.name} — NF {deliverDialog.shipment.documentNumber}
            </p>
            <div className="flex flex-col gap-1 mb-5">
              <label htmlFor="deliver-date" className="text-sm font-medium text-foreground">
                Data de Entrega
              </label>
              <input
                id="deliver-date"
                type="date"
                value={deliverDialog.date}
                onChange={(e) =>
                  setDeliverDialog((prev) => (prev ? { ...prev, date: e.target.value } : prev))
                }
                className="h-11 rounded-md border border-border bg-input-bg px-3 text-base text-foreground outline-none focus:border-ring transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeliver}
                disabled={delivering || !deliverDialog.date}
                className="flex-1 py-2.5 rounded-lg bg-details-green text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60 min-h-[44px]"
              >
                {delivering ? "Salvando..." : "Confirmar Entrega"}
              </button>
              <button
                onClick={() => setDeliverDialog(null)}
                className="px-4 py-2.5 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ────────────────────────────────────────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-card w-full md:max-w-sm md:rounded-2xl rounded-t-2xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-foreground mb-1">Remover Mercadoria</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Tem certeza que deseja remover{" "}
              <strong className="text-foreground">{confirmDelete.name}</strong> — NF{" "}
              {confirmDelete.documentNumber}? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:opacity-90 transition min-h-[44px]"
              >
                Remover
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
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
