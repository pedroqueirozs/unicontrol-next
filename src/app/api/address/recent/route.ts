import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const companyId = session.user.companyId

  const select = {
    id: true,
    code: true,
    name: true,
    cnpj: true,
    street: true,
    number: true,
    complement: true,
    neighborhood: true,
    city: true,
    state: true,
    zipCode: true,
    createdAt: true,
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const todayFilter = { companyId, createdAt: { gte: startOfDay } }

  const [clients, suppliers] = await Promise.all([
    prisma.client.findMany({ where: todayFilter, orderBy: { createdAt: "desc" }, take: 10, select }),
    prisma.supplier.findMany({ where: todayFilter, orderBy: { createdAt: "desc" }, take: 10, select }),
  ])

  const recent = [
    ...clients.map((c) => ({ ...c, type: "client" as const })),
    ...suppliers.map((s) => ({ ...s, type: "supplier" as const })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map(({ createdAt: _, ...rest }) => rest) // remove createdAt from response

  return NextResponse.json(recent)
}
