import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

type LowStockRaw = {
  id: string
  code: bigint | null
  name: string
  unit: string
  minStock: bigint
  currentStock: bigint
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const { companyId } = session.user

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const [onTime, overdue, deliveredThisMonth, flagged, clientsOpen, suppliersOpen, lowStockRaw] =
    await Promise.all([
      prisma.goodsShipped.count({
        where: {
          companyId,
          deliveryDate: null,
          OR: [{ deliveryForecast: { gte: startOfToday } }, { deliveryForecast: null }],
        },
      }),
      prisma.goodsShipped.count({
        where: {
          companyId,
          deliveryDate: null,
          deliveryForecast: { lt: startOfToday },
        },
      }),
      prisma.goodsShipped.count({
        where: {
          companyId,
          deliveryDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.goodsShipped.count({
        where: { companyId, flagged: true, deliveryDate: null },
      }),
      prisma.pending.count({
        where: { companyId, type: "client", status: { not: "resolvida" } },
      }),
      prisma.pending.count({
        where: { companyId, type: "supplier", status: { not: "resolvida" } },
      }),
      prisma.$queryRaw<LowStockRaw[]>`
        SELECT id, code, name, unit, "minStock", "currentStock"
        FROM "StockProduct"
        WHERE "companyId" = ${companyId} AND "currentStock" < "minStock"
        ORDER BY "currentStock" ASC
        LIMIT 8
      `,
    ])

  const lowStock = lowStockRaw.map((r) => ({
    id: r.id,
    code: r.code !== null ? Number(r.code) : null,
    name: r.name,
    unit: r.unit,
    minStock: Number(r.minStock),
    currentStock: Number(r.currentStock),
  }))

  return NextResponse.json({
    user: { name: session.user.name ?? "usuário" },
    goodsShipped: { onTime, overdue, deliveredThisMonth, flagged },
    pendings: { clientsOpen, suppliersOpen },
    lowStock,
  })
}
