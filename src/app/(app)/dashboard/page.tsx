"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  AlertTriangle,
  Truck,
  Flag,
  AlertCircle,
  Building2,
  PackageOpen,
  MapPin,
  Package,
  ClipboardList,
  ArrowRight,
} from "lucide-react"

type DashboardData = {
  user: { name: string }
  goodsShipped: {
    onTime: number
    overdue: number
    deliveredThisMonth: number
    flagged: number
  }
  pendings: {
    clientsOpen: number
    suppliersOpen: number
  }
  lowStock: Array<{
    id: string
    code: number | null
    name: string
    unit: string
    minStock: number
    currentStock: number
  }>
}

function getGreeting(name: string): string {
  const h = new Date().getHours()
  const base = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"
  const firstName = name.split(" ")[0]
  return `${base}, ${firstName}!`
}

function getTodayStr(): string {
  const s = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getMonthName(): string {
  return new Date().toLocaleDateString("pt-BR", { month: "long" })
}

function formatCode(code: number | null): string {
  return code !== null ? `#${String(code).padStart(4, "0")}` : "—"
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-14" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  value: number
  label: string
  href?: string
  valueColor: string
}

function StatCard({ icon, iconBg, iconColor, value, label, href, valueColor }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {href && (
          <Link
            href={href}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors min-h-[32px] px-1"
          >
            Ver <ArrowRight size={12} />
          </Link>
        )}
      </div>
      <div>
        <p className={`text-4xl font-black ${valueColor}`}>{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Quick access button ───────────────────────────────────────────────────────

function QuickLink({
  href,
  icon,
  label,
  iconBg,
  iconColor,
}: {
  href: string
  icon: React.ReactNode
  label: string
  iconBg: string
  iconColor: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 hover:bg-muted/50 transition-colors group min-h-[100px] justify-center"
    >
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconBg} group-hover:scale-105 transition-transform`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  )
}

// ── Low stock item ────────────────────────────────────────────────────────────

function LowStockItem({
  code,
  name,
  unit,
  currentStock,
  minStock,
}: {
  code: number | null
  name: string
  unit: string
  currentStock: number
  minStock: number
}) {
  const pct = minStock > 0 ? Math.min(100, Math.round((currentStock / minStock) * 100)) : 0
  const barColor = currentStock === 0 ? "bg-destructive" : "bg-amber-500"
  const valueColor = currentStock === 0 ? "text-destructive font-bold" : "text-amber-600 dark:text-amber-400 font-bold"
  const labelBg = currentStock === 0 ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-semibold text-primary shrink-0">{formatCode(code)}</span>
          <span className="text-sm font-semibold text-foreground truncate">{name}</span>
          <span className="text-xs text-muted-foreground shrink-0">{unit}</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${labelBg}`}>
          {currentStock === 0 ? "Sem estoque" : `${pct}% do mínimo`}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0 w-28 text-right">
          atual <span className={valueColor}>{currentStock}</span>
          {" "}/ mín {minStock}
        </span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const gs = data?.goodsShipped
  const pendings = data?.pendings
  const monthName = getMonthName()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full">

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div>
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting(data?.user.name ?? "usuário")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{getTodayStr()}</p>
          </>
        )}
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={<CheckCircle2 size={18} />}
              iconBg="bg-details-green/10"
              iconColor="text-details-green"
              value={gs?.onTime ?? 0}
              label="Mercadorias no prazo"
              href="/goods-shipped"
              valueColor="text-details-green"
            />
            <StatCard
              icon={<AlertTriangle size={18} />}
              iconBg={gs?.overdue ? "bg-destructive/10" : "bg-details-green/10"}
              iconColor={gs?.overdue ? "text-destructive" : "text-details-green"}
              value={gs?.overdue ?? 0}
              label="Atrasadas"
              href={gs?.overdue ? "/goods-shipped" : undefined}
              valueColor={gs?.overdue ? "text-destructive" : "text-details-green"}
            />
            <StatCard
              icon={<Truck size={18} />}
              iconBg="bg-blue-500/10"
              iconColor="text-blue-500"
              value={gs?.deliveredThisMonth ?? 0}
              label={`Entregues em ${monthName}`}
              valueColor="text-blue-500"
            />
            <StatCard
              icon={<Flag size={18} />}
              iconBg={gs?.flagged ? "bg-amber-500/10" : "bg-details-green/10"}
              iconColor={gs?.flagged ? "text-amber-500" : "text-details-green"}
              value={gs?.flagged ?? 0}
              label="Com atenção 🚩"
              href={gs?.flagged ? "/goods-shipped" : undefined}
              valueColor={gs?.flagged ? "text-amber-500" : "text-details-green"}
            />
          </>
        )}
      </div>

      {/* ── Pendências ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground/70 uppercase tracking-widest">
            Pendências em aberto
          </h2>
          <Link
            href="/pendencias"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Ver todas <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/pendencias"
              className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10 shrink-0">
                <AlertCircle size={18} className="text-destructive" />
              </div>
              <div>
                <p className={`text-2xl font-black ${pendings?.clientsOpen ? "text-destructive" : "text-details-green"}`}>
                  {pendings?.clientsOpen ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pendings?.clientsOpen === 1 ? "pendência" : "pendências"} com clientes
                </p>
              </div>
            </Link>

            <Link
              href="/pendencias"
              className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 shrink-0">
                <Building2 size={18} className="text-amber-500" />
              </div>
              <div>
                <p className={`text-2xl font-black ${pendings?.suppliersOpen ? "text-amber-500" : "text-details-green"}`}>
                  {pendings?.suppliersOpen ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pendings?.suppliersOpen === 1 ? "pendência" : "pendências"} com fornecedores
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* ── Estoque baixo ─────────────────────────────────────────────────── */}
      {(loading || (data?.lowStock && data.lowStock.length > 0)) && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground/70 uppercase tracking-widest">
                Estoque abaixo do mínimo
              </h2>
              {!loading && data?.lowStock && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                  {data.lowStock.length}
                </span>
              )}
            </div>
            <Link
              href="/stock"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Ver estoque <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data?.lowStock.map((item) => (
                <LowStockItem key={item.id} {...item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Atalhos rápidos ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold text-foreground/70 uppercase tracking-widest mb-4">
          Atalhos rápidos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink
            href="/goods-shipped"
            icon={<Package size={18} />}
            label="Mercadorias"
            iconBg="bg-primary/10"
            iconColor="text-primary"
          />
          <QuickLink
            href="/address"
            icon={<MapPin size={18} />}
            label="Endereços"
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
          />
          <QuickLink
            href="/stock"
            icon={<PackageOpen size={18} />}
            label="Estoque"
            iconBg="bg-details-green/10"
            iconColor="text-details-green"
          />
          <QuickLink
            href="/pendencias"
            icon={<ClipboardList size={18} />}
            label="Pendências"
            iconBg="bg-amber-500/10"
            iconColor="text-amber-500"
          />
        </div>
      </div>

    </div>
  )
}
