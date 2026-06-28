"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Search, Phone, Mail, MapPin, ExternalLink, Building2, Truck } from "lucide-react"
import { toast } from "sonner"
import { ContactModal, type ContactFormData, type ContactRecord } from "@/components/contact-modal"
import { CarrierModal, type CarrierFormData, type CarrierRecord } from "@/components/carrier-modal"

// ─── Tipos e constantes ───────────────────────────────────────────────────────

type Tab = "clients" | "suppliers" | "carriers"

const TAB_LABELS: Record<Tab, string> = {
  clients: "Clientes",
  suppliers: "Fornecedores",
  carriers: "Transportadoras",
}

const API_URL: Record<Tab, string> = {
  clients: "/api/clients",
  suppliers: "/api/suppliers",
  carriers: "/api/carriers",
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CadastrosPage() {
  const [tab, setTab] = useState<Tab>("clients")
  const [records, setRecords] = useState<(ContactRecord | CarrierRecord)[]>([])
  const [filtered, setFiltered] = useState<(ContactRecord | CarrierRecord)[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ContactRecord | CarrierRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const isCarriers = tab === "carriers"

  const fetchRecords = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(API_URL[tab])
      if (!res.ok) throw new Error()
      setRecords(await res.json())
    } catch {
      toast.error("Erro ao carregar dados.")
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  // Filtragem: clientes/fornecedores por nome ou CNPJ; transportadoras só por nome
  useEffect(() => {
    const q = search.toLowerCase().trim()
    if (!q) { setFiltered(records); return }

    setFiltered(records.filter((r) => {
      if (r.name.toLowerCase().includes(q)) return true
      if (!isCarriers && "cnpj" in r && r.cnpj) {
        return (r as ContactRecord).cnpj.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
      }
      return false
    }))
  }, [search, records, isCarriers])

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(r: ContactRecord | CarrierRecord) { setEditing(r); setModalOpen(true) }

  async function handleSaveContact(data: ContactFormData) {
    setIsSaving(true)
    try {
      const url = editing ? `${API_URL[tab]}/${editing.id}` : API_URL[tab]
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? "Erro ao salvar."); return }
      toast.success(editing ? "Cadastro atualizado!" : "Cadastro criado!")
      setModalOpen(false)
      fetchRecords()
    } catch { toast.error("Erro inesperado.") }
    finally { setIsSaving(false) }
  }

  async function handleSaveCarrier(data: CarrierFormData) {
    setIsSaving(true)
    try {
      const url = editing ? `/api/carriers/${editing.id}` : "/api/carriers"
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? "Erro ao salvar."); return }
      toast.success(editing ? "Transportadora atualizada!" : "Transportadora criada!")
      setModalOpen(false)
      fetchRecords()
    } catch { toast.error("Erro inesperado.") }
    finally { setIsSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const res = await fetch(`${API_URL[tab]}/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Cadastro removido.")
      setDeleteTarget(null)
      fetchRecords()
    } catch { toast.error("Erro ao remover.") }
  }

  const newLabel = isCarriers ? "Nova Transportadora" : `Novo ${TAB_LABELS[tab].slice(0, -1)}`

  return (
    <div className="flex flex-col gap-5">
      {/* Abas */}
      <div className="flex gap-1 border-b border-border">
        {(["clients", "suppliers", "carriers"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch("") }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-sidebar-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Barra de busca + botão */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={isCarriers ? "Buscar por nome..." : "Buscar por nome ou CNPJ/CPF..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 h-10 rounded-md bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus size={16} />
          {newLabel}
        </button>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          {search ? "Nenhum resultado para a busca." : `Nenhum registro cadastrado ainda.`}
        </div>
      ) : isCarriers ? (
        <CarriersView
          records={filtered as CarrierRecord[]}
          onEdit={openEdit}
          onDelete={(r) => setDeleteTarget({ id: r.id, name: r.name })}
        />
      ) : (
        <ContactsView
          records={filtered as ContactRecord[]}
          onEdit={openEdit}
          onDelete={(r) => setDeleteTarget({ id: r.id, name: r.name })}
        />
      )}

      {/* Modais */}
      {modalOpen && !isCarriers && (
        <ContactModal
          type={tab === "clients" ? "client" : "supplier"}
          record={editing as ContactRecord | null}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveContact}
          isLoading={isSaving}
        />
      )}
      {modalOpen && isCarriers && (
        <CarrierModal
          record={editing as CarrierRecord | null}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveCarrier}
          isLoading={isSaving}
        />
      )}

      {/* Confirmação de exclusão */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDeleteTarget(null)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Confirmar exclusão</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tem certeza que deseja remover{" "}
                  <span className="font-medium text-foreground">{deleteTarget.name}</span>?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-md text-sm font-semibold bg-destructive text-white hover:opacity-90 transition-opacity"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sub-componentes de visualização ─────────────────────────────────────────

function ContactsView({
  records,
  onEdit,
  onDelete,
}: {
  records: ContactRecord[]
  onEdit: (r: ContactRecord) => void
  onDelete: (r: ContactRecord) => void
}) {
  return (
    <>
      {/* Tabela desktop */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Código</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">CNPJ/CPF</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Insc. Estadual</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Cidade / UF</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Telefone</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id} className={`border-t border-border hover:bg-muted/30 transition-colors ${i % 2 !== 0 ? "bg-muted/10" : ""}`}>
                <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{r.code}</td>
                <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.cnpj}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.stateRegistration || "Isento"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.city && r.state ? `${r.city} / ${r.state}` : r.city || r.state || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.phone || "—"}</td>
                <td className="px-4 py-3">
                  <RowActions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {records.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
                <p className="font-semibold text-foreground text-base leading-tight mt-0.5">{r.name}</p>
                <p className="text-sm text-muted-foreground">{r.cnpj}</p>
                <p className="text-xs text-muted-foreground">IE: {r.stateRegistration || "Isento"}</p>
              </div>
              <RowActions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} mobile />
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {(r.city || r.state) && (
                <span className="flex items-center gap-1.5"><MapPin size={13} />{r.city && r.state ? `${r.city} / ${r.state}` : r.city || r.state}</span>
              )}
              {r.phone && <span className="flex items-center gap-1.5"><Phone size={13} />{r.phone}</span>}
              {r.email && <span className="flex items-center gap-1.5"><Mail size={13} />{r.email}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function CarriersView({
  records,
  onEdit,
  onDelete,
}: {
  records: CarrierRecord[]
  onEdit: (r: CarrierRecord) => void
  onDelete: (r: CarrierRecord) => void
}) {
  return (
    <>
      {/* Tabela desktop */}
      <div className="hidden md:block rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tipo</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">CNPJ</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Cidade / UF</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Telefone</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Rastreio</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id} className={`border-t border-border hover:bg-muted/30 transition-colors ${i % 2 !== 0 ? "bg-muted/10" : ""}`}>
                <td className="px-4 py-3">
                  <CarrierTypeBadge type={r.type} />
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.cnpj || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.city && r.state ? `${r.city} / ${r.state}` : r.city || r.state || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.phone || "—"}</td>
                <td className="px-4 py-3">
                  {r.trackingUrl ? (
                    <a
                      href={r.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sidebar-accent hover:underline text-xs"
                    >
                      <ExternalLink size={12} /> Rastrear
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <RowActions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {records.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <CarrierTypeBadge type={r.type} />
                <p className="font-semibold text-foreground text-base leading-tight">{r.name}</p>
                {r.cnpj && <p className="text-sm text-muted-foreground">{r.cnpj}</p>}
              </div>
              <RowActions onEdit={() => onEdit(r)} onDelete={() => onDelete(r)} mobile />
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {(r.city || r.state) && (
                <span className="flex items-center gap-1.5"><MapPin size={13} />{r.city && r.state ? `${r.city} / ${r.state}` : r.city || r.state}</span>
              )}
              {r.phone && <span className="flex items-center gap-1.5"><Phone size={13} />{r.phone}</span>}
              {r.email && <span className="flex items-center gap-1.5"><Mail size={13} />{r.email}</span>}
              {r.trackingUrl && (
                <a href={r.trackingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sidebar-accent">
                  <ExternalLink size={13} /> Link de rastreio
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function CarrierTypeBadge({ type }: { type: string }) {
  return type === "empresa" ? (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
      <Building2 size={11} /> Empresa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
      <Truck size={11} /> Simples
    </span>
  )
}

function RowActions({
  onEdit,
  onDelete,
  mobile,
}: {
  onEdit: () => void
  onDelete: () => void
  mobile?: boolean
}) {
  const base = mobile
    ? "p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
    : "p-1.5 rounded"

  return (
    <div className={`flex items-center gap-1 ${mobile ? "" : "justify-end"}`}>
      <button onClick={onEdit} className={`${base} hover:bg-muted text-muted-foreground hover:text-foreground transition-colors`} aria-label="Editar">
        <Pencil size={mobile ? 16 : 15} />
      </button>
      <button onClick={onDelete} className={`${base} hover:bg-muted text-muted-foreground hover:text-destructive transition-colors`} aria-label="Excluir">
        <Trash2 size={mobile ? 16 : 15} />
      </button>
    </div>
  )
}
