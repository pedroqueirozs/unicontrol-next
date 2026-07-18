import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const VALID_TYPES = ["entrada", "saida", "estorno", "ajuste"]

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10) || 50))
  const typeParam = searchParams.get("type")
  const type = typeParam && VALID_TYPES.includes(typeParam) ? typeParam : undefined

  const where = {
    companyId: session.user.companyId,
    ...(type ? { type } : {}),
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stockMovement.count({ where }),
  ])

  return NextResponse.json({ movements, total, page, pageSize })
}
