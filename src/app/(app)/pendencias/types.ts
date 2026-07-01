export type PendingStatus = "aberta" | "em_andamento" | "resolvida"

export type PendingUpdate = {
  id: string
  text: string
  createdAt: string
}

export type Pending = {
  id: string
  type: "client" | "supplier"
  name: string
  city: string | null
  document: string
  openedAt: string
  status: PendingStatus
  updates: PendingUpdate[]
  clientId: string | null
  supplierId: string | null
  createdAt: string
  updatedAt: string
}

export const STATUS_CONFIG: Record<PendingStatus, { label: string; classes: string }> = {
  aberta: {
    label: "Aberta",
    classes: "bg-destructive/10 text-destructive",
  },
  em_andamento: {
    label: "Em andamento",
    classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  resolvida: {
    label: "Resolvida",
    classes: "bg-details-green/10 text-details-green",
  },
}
