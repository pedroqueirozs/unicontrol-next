"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Search, Phone, Mail, MapPin } from "lucide-react"
import { toast } from "sonner"
import { ContactModal, type ContactFormData, type ContactRecord } from "@/components/contact-modal"

type Tab = "clients" | "suppliers"

const TAB_LABELS: Record<Tab, string> = {
  clients: "Clientes",
  suppliers: "Fornecedores",
}

const API_URL: Record<Tab, string> = {
  clients: "/api/clients",
  suppliers: "/api/suppliers",
}

export default function CadastrosPage() {
  const [tab, setTab] = useState<Tab>("clients")
  const [records, setRecords] = useState<ContactRecord[]>([])
  const [filtered, setFiltered] = useState<ContactRecord[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ContactRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactRecord | null>(null)

  const fetchRecords = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(API_URL[tab])
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRecords(data)
    } catch {
      toast.error("Erro ao carregar dados.")
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Filtra por nome ou CNPJ/CPF
  useEffect(() => {
    const q = search.toLowerCase().trim()
    if (!q) {
      setFiltered(records)
      return
    }
    setFiltered(
      records.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cnpj.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
      )
    )
  }, [search, records])

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(record: ContactRecord) {
    setEditing(record)
    setModalOpen(true)
  }

  async function handleSave(data: ContactFormData) {
    setIsSaving(true)
    try {
      const url = editing
        ? `${API_URL[tab]}/${editing.id}`
        : API_URL[tab]
      const method = editing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? "Erro ao salvar.")
        return
      }

      toast.success(editing ? "Cadastro atualizado!" : "Cadastro criado!")
      setModalOpen(false)
      fetchRecords()
    } catch {
      toast.error("Erro inesperado.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const res = await fetch(`${API_URL[tab]}/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      toast.success("Cadastro removido.")
      setDeleteTarget(null)
      fetchRecords()
    } catch {
      toast.error("Erro ao remover.")
    }
  }

  const typeLabel = TAB_LABELS[tab]

  return (
    <div className="flex flex-col gap-5">
      {/* Abas */}
      <div className="flex gap-1 border-b border-border">
        {(["clients", "suppliers"] as Tab[]).map((t) => (
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
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder={`Buscar por nome ou CNPJ/CPF...`}
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
          Novo {typeLabel.slice(0, -1)}
        </button>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          {search
            ? "Nenhum resultado para a busca."
            : `Nenhum ${typeLabel.slice(0, -1).toLowerCase()} cadastrado ainda.`}
        </div>
      ) : (
        <>
          {/* Tabela — desktop (md+) */}
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
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">E-mail</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-t border-border hover:bg-muted/30 transition-colors ${
                      i % 2 === 0 ? "" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{r.code}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.cnpj}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.stateRegistration || "Isento"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.city && r.state ? `${r.city} / ${r.state}` : r.city || r.state || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.email || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile (abaixo de md) */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
                    <p className="font-semibold text-foreground text-base leading-tight mt-0.5">
                      {r.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{r.cnpj}</p>
                    <p className="text-xs text-muted-foreground">
                      IE: {r.stateRegistration || "Isento"}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(r)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {(r.city || r.state) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {r.city && r.state ? `${r.city} / ${r.state}` : r.city || r.state}
                    </span>
                  )}
                  {r.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} />
                      {r.phone}
                    </span>
                  )}
                  {r.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} />
                      {r.email}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal de cadastro/edição */}
      {modalOpen && (
        <ContactModal
          type={tab === "clients" ? "client" : "supplier"}
          record={editing}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          isLoading={isSaving}
        />
      )}

      {/* Confirmação de exclusão */}
      {deleteTarget && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setDeleteTarget(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Confirmar exclusão
                </h2>
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
