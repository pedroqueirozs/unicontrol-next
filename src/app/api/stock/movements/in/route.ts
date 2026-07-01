import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1, "Quantidade deve ser ao menos 1"),
  reason: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { productId, quantity, reason } = parsed.data

  const product = await prisma.stockProduct.findFirst({
    where: { id: productId, companyId: session.user.companyId },
  })
  if (!product) return new NextResponse("Product not found", { status: 404 })

  await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        productId,
        productName: product.name,
        productCode: product.code ?? null,
        productSku: product.sku ?? null,
        quantity,
        direction: 1,
        type: "entrada",
        reason: reason || null,
        operatorName: session.user.name ?? "Desconhecido",
        companyId: session.user.companyId,
      },
    }),
    prisma.stockProduct.update({
      where: { id: productId },
      data: { currentStock: { increment: quantity } },
    }),
  ])

  return new NextResponse(null, { status: 204 })
}
