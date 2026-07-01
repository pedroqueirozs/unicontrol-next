"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, AlertCircle, Building2 } from "lucide-react"
import { toast } from "sonner"
import type { Pending, PendingStatus } from "./types"
import { PendingTab } from "./pending-tab"
import { CreatePendingModal } from "./create-modal"
import { DetailModal } from "./detail-modal"

type Tab = "client" | "supplier"

export default function PendingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("client")
  const [clients, setClients] = useState<Pending[]>([])
  const [suppliers, setSuppliers] = useState<Pending[]>([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  const [selectedItem, setSelectedItem] = useState<Pending | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [clientRes, supplierRes] = await Promise.all([
      fetch("/api/pendencias?type=client"),
      fetch("/api/pendencias?type=supplier"),
    ])
    if (clientRes.ok) setClients(await clientRes.json())
    if (supplierRes.ok) setSuppliers(await supplierRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleCreate(data: {
    name: string; city?: string | null; document: string
    openedAt: string; initialDescription: string; contactId?: string
  }) {
    setCreateLoading(true)
    const body = {
      type: activeTab,
      name: data.name,
      city: data.city || null,
      document: data.document,
      openedAt: data.openedAt,
      initialDescription: data.initialDescription,
      clientId: activeTab === "client" ? (data.contactId ?? null) : null,
      supplierId: activeTab === "supplier" ? (data.contactId ?? null) : null,
    }
    const res = await fetch("/api/pendencias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setCreateLoading(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error ?? "Erro ao criar pendência")
      return
    }
    toast.success("Pendência criada com sucesso!")
    setCreateOpen(false)
    await loadData()
  }

  async function handleStatusChange(id: string, status: PendingStatus) {
    const res = await fetch(`/api/pendencias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", status }),
    })
    if (!res.ok) { toast.error("Erro ao atualizar status"); return }
    const updated: Pending = await res.json()
    setSelectedItem(updated)
    if (updated.type === "client") {
      setClients((prev) => prev.map((i) => (i.id === id ? updated : i)))
    } else {
      setSuppliers((prev) => prev.map((i) => (i.id === id ? updated : i)))
    }
  }

  async function handleAddUpdate(id: string, text: string) {
    const res = await fetch(`/api/pendencias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", text }),
    })
    if (!res.ok) { toast.error("Erro ao adicionar atualização"); return }
    const updated: Pending = await res.json()
    setSelectedItem(updated)
    if (updated.type === "client") {
      setClients((prev) => prev.map((i) => (i.id === id ? updated : i)))
    } else {
      setSuppliers((prev) => prev.map((i) => (i.id === id ? updated : i)))
    }
    toast.success("Atualização adicionada!")
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/pendencias/${id}`, { method: "DELETE" })
    if (!res.ok && res.status !== 204) { toast.error("Erro ao excluir pendência"); return }
    toast.success("Pendência excluída")
    setClients((prev) => prev.filter((i) => i.id !== id))
    setSuppliers((prev) => prev.filter((i) => i.id !== id))
  }

  const tabs: { value: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { value: "client", label: "Clientes", icon: <AlertCircle size={16} />, count: clients.length },
    { value: "supplier", label: "Fornecedores", icon: <Building2 size={16} />, count: suppliers.length },
  ]

  const activeItems = activeTab === "client" ? clients : suppliers

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Pendências</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition min-h-[44px]"
        >
          <Plus size={16} /> Nova pendência
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 px-5 py-3 text-base font-semibold border-b-2 transition-all min-h-[48px] -mb-px ${
              activeTab === tab.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Carregando…
        </div>
      ) : (
        <PendingTab
          items={activeItems}
          onRowClick={setSelectedItem}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      <CreatePendingModal
        open={createOpen}
        type={activeTab}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
        loading={createLoading}
      />

      <DetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onStatusChange={handleStatusChange}
        onAddUpdate={handleAddUpdate}
      />
    </div>
  )
}
