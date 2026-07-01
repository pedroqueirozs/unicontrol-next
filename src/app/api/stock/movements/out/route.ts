import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1),
    })
  ).min(1, "Adicione ao menos um produto"),
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

  const { items, reason } = parsed.data
  const companyId = session.user.companyId
  const operatorName = session.user.name ?? "Desconhecido"

  // Verify all products belong to this company
  const productIds = items.map((i) => i.productId)
  const products = await prisma.stockProduct.findMany({
    where: { id: { in: productIds }, companyId },
  })

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 })
  }

  // Validate sufficient stock
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)!
    if (product.currentStock < item.quantity) {
      return NextResponse.json(
        { error: `Estoque insuficiente para "${product.name}". Disponível: ${product.currentStock} ${product.unit}.` },
        { status: 422 }
      )
    }
  }

  await prisma.$transaction(
    items.flatMap((item) => {
      const product = products.find((p) => p.id === item.productId)!
      return [
        prisma.stockMovement.create({
          data: {
            productId: item.productId,
            productName: product.name,
            productCode: product.code ?? null,
            productSku: product.sku ?? null,
            quantity: item.quantity,
            direction: -1,
            type: "saida",
            reason: reason || null,
            operatorName,
            companyId,
          },
        }),
        prisma.stockProduct.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        }),
      ]
    })
  )

  return new NextResponse(null, { status: 204 })
}
