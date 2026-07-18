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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const existing = await prisma.stockProduct.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) return new NextResponse("Not Found", { status: 404 })

  const updated = await prisma.stockProduct.update({
    where: { id },
    data: {
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      unit: parsed.data.unit,
      minStock: parsed.data.minStock,
      description: parsed.data.description ?? null,
      ncm: parsed.data.ncm ?? null,
      price: parsed.data.price ?? null,
      costPrice: parsed.data.costPrice ?? null,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params

  const existing = await prisma.stockProduct.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) return new NextResponse("Not Found", { status: 404 })

  if (existing.currentStock > 0) {
    return NextResponse.json(
      { error: `Não é possível excluir: há ${existing.currentStock} ${existing.unit} em estoque. Zere o estoque (saída ou ajuste) antes de excluir.` },
      { status: 422 }
    )
  }

  await prisma.stockProduct.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
