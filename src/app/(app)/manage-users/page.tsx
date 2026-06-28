"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  UserPlus,
  Trash2,
  Link2,
  Copy,
  Check,
  Users,
  Mail,
  Calendar,
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react"
import type { Role } from "@/generated/prisma/enums"

type Member = {
  id: string
  name: string | null
  email: string
  role: Role
  createdAt: string
}

type Invite = {
  id: string
  token: string
  role: Role
  expiresAt: string
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  expedicao: "Expedição",
  vendas: "Vendas",
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-sidebar/15 text-sidebar",
  expedicao: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  vendas: "bg-green-500/10 text-green-600 dark:text-green-400",
}

function RoleBadge({ role }: { role: Role }) {
  const colors = ROLE_COLORS[role] ?? "bg-muted text-muted-foreground"
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${colors}`}>
      <ShieldCheck size={10} />
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(iso))
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date()
}

export default function ManageUsersPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  // Gerar convite
  const [showGenModal, setShowGenModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"expedicao" | "vendas">("expedicao")
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Remover membro
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [removingMember, setRemovingMember] = useState(false)

  // Revogar convite
  const [inviteToRevoke, setInviteToRevoke] = useState<Invite | null>(null)
  const [revokingInvite, setRevokingInvite] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [membersRes, invitesRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/invites"),
    ])
    if (membersRes.ok) {
      const data = await membersRes.json()
      setMembers(data.members)
      setCurrentUserId(data.currentUserId)
    }
    if (invitesRes.ok) setInvites(await invitesRes.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleGenerateInvite() {
    setGeneratingInvite(true)
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selectedRole }),
    })

    if (!res.ok) {
      toast.error("Erro ao gerar convite.")
      setGeneratingInvite(false)
      return
    }

    const invite: Invite = await res.json()
    const link = `${window.location.origin}/register?token=${invite.token}`
    setGeneratedLink(link)
    setGeneratingInvite(false)
    setInvites((prev) => [invite, ...prev])
  }

  async function handleCopyLink() {
    if (!generatedLink) return
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCloseGenModal() {
    setShowGenModal(false)
    setGeneratedLink(null)
    setCopied(false)
    setSelectedRole("expedicao")
  }

  async function handleRemoveMember() {
    if (!memberToRemove) return
    setRemovingMember(true)

    const res = await fetch(`/api/users/${memberToRemove.id}`, { method: "DELETE" })

    if (!res.ok) {
      const json = await res.json().catch(() => null)
      toast.error(json?.error ?? "Erro ao remover membro.")
    } else {
      toast.success(`${memberToRemove.name ?? memberToRemove.email} foi removido.`)
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id))
    }

    setMemberToRemove(null)
    setRemovingMember(false)
  }

  async function handleRevokeInvite() {
    if (!inviteToRevoke) return
    setRevokingInvite(true)

    const res = await fetch(`/api/invites/${inviteToRevoke.id}`, { method: "DELETE" })

    if (!res.ok) {
      toast.error("Erro ao revogar convite.")
    } else {
      toast.success("Convite revogado.")
      setInvites((prev) => prev.filter((i) => i.id !== inviteToRevoke.id))
    }

    setInviteToRevoke(null)
    setRevokingInvite(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Carregando...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Membros da equipe ── */}
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Users size={18} className="text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Membros da equipe</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {members.length}
          </span>
        </div>

        {/* Tabela desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">E-mail</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cargo</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Membro desde</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-foreground">
                    {member.name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{member.email}</td>
                  <td className="px-5 py-3">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatDate(member.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {member.id !== currentUserId && (
                      <button
                        onClick={() => setMemberToRemove(member)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remover membro"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards mobile */}
        <div className="md:hidden flex flex-col divide-y divide-border">
          {members.map((member) => (
            <div key={member.id} className="px-4 py-4 flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground text-sm">
                    {member.name ?? "Sem nome"}
                  </span>
                  <RoleBadge role={member.role} />
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail size={11} />
                  {member.email}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar size={11} />
                  Desde {formatDate(member.createdAt)}
                </span>
              </div>
              {member.id !== currentUserId && (
                <button
                  onClick={() => setMemberToRemove(member)}
                  className="flex-shrink-0 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Convites pendentes ── */}
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Convites pendentes</h2>
            {invites.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {invites.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowGenModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity min-h-[44px]"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Gerar convite</span>
          </button>
        </div>

        {invites.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhum convite pendente
          </p>
        ) : (
          <>
            {/* Tabela desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cargo</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Criado em</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Expira em</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite) => (
                    <tr
                      key={invite.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <RoleBadge role={invite.role} />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(invite.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(invite.expiresAt)}
                      </td>
                      <td className="px-5 py-3">
                        {isExpired(invite.expiresAt) ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                            Expirado
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                            Ativo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setInviteToRevoke(invite)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Revogar convite"
                        >
                          <X size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards mobile */}
            <div className="md:hidden flex flex-col divide-y divide-border">
              {invites.map((invite) => (
                <div key={invite.id} className="px-4 py-4 flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <RoleBadge role={invite.role} />
                      {isExpired(invite.expiresAt) ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                          Expirado
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                          Ativo
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar size={11} />
                      Expira em {formatDate(invite.expiresAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => setInviteToRevoke(invite)}
                    className="flex-shrink-0 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Modal: Gerar convite ── */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-2xl sm:rounded-xl border border-border shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">
                {generatedLink ? "Link de convite gerado" : "Gerar convite"}
              </h2>
              <button
                onClick={handleCloseGenModal}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">
              {generatedLink ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe o link abaixo com o novo membro. O convite expira em{" "}
                    <strong className="text-foreground">7 dias</strong>.
                  </p>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
                    <span className="text-xs text-foreground break-all flex-1 font-mono leading-relaxed">
                      {generatedLink}
                    </span>
                    <button
                      onClick={handleCopyLink}
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                      title={copied ? "Copiado!" : "Copiar link"}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>

                  <button
                    onClick={handleCloseGenModal}
                    className="w-full h-11 bg-accent text-accent-foreground font-semibold rounded-md hover:opacity-90 transition-opacity"
                  >
                    Fechar
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-foreground">
                      Cargo do novo membro
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["expedicao", "vendas"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSelectedRole(role)}
                          className={`h-11 rounded-lg border text-sm font-medium transition-colors ${
                            selectedRole === role
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                          }`}
                        >
                          {ROLE_LABELS[role]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateInvite}
                    disabled={generatingInvite}
                    className="w-full h-11 bg-accent text-accent-foreground font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-progress"
                  >
                    {generatingInvite ? "Gerando..." : "Gerar link"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog: Confirmar remoção de membro ── */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card rounded-2xl sm:rounded-xl border border-border shadow-xl">
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} className="text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Remover membro</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tem certeza que deseja remover{" "}
                    <strong className="text-foreground">
                      {memberToRemove.name ?? memberToRemove.email}
                    </strong>
                    ? O acesso será revogado imediatamente.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setMemberToRemove(null)}
                  className="flex-1 h-11 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRemoveMember}
                  disabled={removingMember}
                  className="flex-1 h-11 bg-destructive text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
                >
                  {removingMember ? "Removendo..." : "Remover"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog: Confirmar revogação de convite ── */}
      {inviteToRevoke && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card rounded-2xl sm:rounded-xl border border-border shadow-xl">
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} className="text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Revogar convite</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O link de convite será desativado e não poderá mais ser
                    utilizado para criar uma conta.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setInviteToRevoke(null)}
                  className="flex-1 h-11 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRevokeInvite}
                  disabled={revokingInvite}
                  className="flex-1 h-11 bg-destructive text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
                >
                  {revokingInvite ? "Revogando..." : "Revogar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
