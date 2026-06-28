import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim() ?? ""

  if (q.length < 2) return NextResponse.json([])

  const companyId = session.user.companyId
  const where = {
    companyId,
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { code: { contains: q, mode: "insensitive" as const } },
      { cnpj: { contains: q } },
    ],
  }

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
  }

  const [clients, suppliers] = await Promise.all([
    prisma.client.findMany({ where, take: 6, select }),
    prisma.supplier.findMany({ where, take: 6, select }),
  ])

  const results = [
    ...clients.map((c) => ({ ...c, type: "client" as const })),
    ...suppliers.map((s) => ({ ...s, type: "supplier" as const })),
  ]

  return NextResponse.json(results)
}
