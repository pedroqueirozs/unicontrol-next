import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { User, Building2, Mail, ShieldCheck, Calendar, MapPin, Phone } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  administrativo: "Administrativo",
  expedicao: "Expedição",
  vendas: "Vendas",
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true,
      company: {
        select: {
          name: true,
          city: true,
          state: true,
          street: true,
          district: true,
          zip: true,
          phone: true,
          whatsapp: true,
        },
      },
    },
  })

  if (!user) redirect("/login")

  const roleLabel = ROLE_LABELS[user.role] ?? user.role
  const memberSince = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(user.createdAt)

  const companyLocation = [user.company.city, user.company.state]
    .filter(Boolean)
    .join(" / ")

  const companyAddress = [
    user.company.street,
    user.company.district,
    companyLocation,
    user.company.zip,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto w-full">

      {/* Dados do usuário */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-sidebar flex items-center justify-center flex-shrink-0">
            <User size={26} className="text-sidebar-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground leading-tight">
              {user.name ?? "Sem nome"}
            </h2>
            <span className="inline-flex items-center gap-1.5 mt-1 text-xs px-2 py-0.5 rounded-full bg-sidebar/15 text-sidebar font-medium">
              <ShieldCheck size={11} />
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={<Mail size={15} />} label="E-mail" value={user.email} />
          <InfoRow icon={<Calendar size={15} />} label="Membro desde" value={memberSince} />
        </div>
      </div>

      {/* Dados da empresa */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={18} className="text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Empresa</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <InfoRow icon={<Building2 size={15} />} label="Razão Social" value={user.company.name} />
          </div>

          {companyAddress && (
            <div className="sm:col-span-2">
              <InfoRow icon={<MapPin size={15} />} label="Endereço" value={companyAddress} />
            </div>
          )}

          {user.company.phone && (
            <InfoRow icon={<Phone size={15} />} label="Telefone" value={user.company.phone} />
          )}

          {user.company.whatsapp && (
            <InfoRow icon={<Phone size={15} />} label="WhatsApp" value={user.company.whatsapp} />
          )}
        </div>
      </div>

    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value?: string | null
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm text-foreground font-medium pl-5">
        {value || "—"}
      </span>
    </div>
  )
}
