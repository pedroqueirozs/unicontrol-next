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

class InsufficientStockError extends Error {
  constructor(public productName: string, public unit: string) {
    super(`Insufficient stock for ${productName}`)
  }
}

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
  const productById = new Map(products.map((p) => [p.id, p]))

  // Early, friendly check against the stock we just read (covers the common case
  // with a precise "disponível: X" message). The real guarantee against negative
  // stock is the conditional decrement inside the transaction below, which re-checks
  // currentStock atomically at write time — this is what protects against two
  // concurrent saídas for the same product both passing this first check.
  for (const item of items) {
    const product = productById.get(item.productId)!
    if (product.currentStock < item.quantity) {
      return NextResponse.json(
        { error: `Estoque insuficiente para "${product.name}". Disponível: ${product.currentStock} ${product.unit}.` },
        { status: 422 }
      )
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = productById.get(item.productId)!

        // Conditional UPDATE: só decrementa se ainda houver estoque suficiente no
        // momento da escrita. Se uma saída concorrente já consumiu, count === 0
        // e abortamos o lote inteiro em vez de permitir estoque negativo.
        const result = await tx.stockProduct.updateMany({
          where: { id: item.productId, currentStock: { gte: item.quantity } },
          data: { currentStock: { decrement: item.quantity } },
        })
        if (result.count === 0) {
          throw new InsufficientStockError(product.name, product.unit)
        }

        // updateMany não retorna a linha atualizada — busca o saldo resultante
        // pra gravar previousStock/newStock no movimento (mesma transação).
        const updated = await tx.stockProduct.findUniqueOrThrow({ where: { id: item.productId } })

        await tx.stockMovement.create({
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
            previousStock: updated.currentStock + item.quantity,
            newStock: updated.currentStock,
            companyId,
          },
        })
      }
    })
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json(
        { error: `Estoque insuficiente para "${err.productName}" (alterado por outra operação simultânea). Recarregue e tente novamente.` },
        { status: 422 }
      )
    }
    throw err
  }

  return new NextResponse(null, { status: 204 })
}
