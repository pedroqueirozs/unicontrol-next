import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  sku: z.string().optional().nullable(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  minStock: z.number().int().min(0, "Estoque mínimo não pode ser negativo"),
  description: z.string().optional().nullable(),
  ncm: z.string().optional().nullable(),
  price: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const products = await prisma.stockProduct.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  // Generate next sequential code for this company
  const lastProduct = await prisma.stockProduct.findFirst({
    where: { companyId: session.user.companyId, code: { not: null } },
    orderBy: { code: "desc" },
    select: { code: true },
  })
  const nextCode = (lastProduct?.code ?? 0) + 1

  const product = await prisma.stockProduct.create({
    data: {
      name: parsed.data.name,
      code: nextCode,
      sku: parsed.data.sku ?? null,
      unit: parsed.data.unit,
      minStock: parsed.data.minStock,
      description: parsed.data.description ?? null,
      ncm: parsed.data.ncm ?? null,
      price: parsed.data.price ?? null,
      costPrice: parsed.data.costPrice ?? null,
      currentStock: 0,
      companyId: session.user.companyId,
    },
  })

  return NextResponse.json(product, { status: 201 })
}
