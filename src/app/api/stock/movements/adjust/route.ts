import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  productId: z.string().min(1),
  countedStock: z.number().int().min(0, "Quantidade contada não pode ser negativa"),
  // Motivo em caixa alta pra manter o padrão do módulo de Estoque.
  reason: z.string().min(1, "Informe o motivo do ajuste").transform((v) => v.trim().toUpperCase()),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { productId, countedStock, reason } = parsed.data
  const companyId = session.user.companyId

  const product = await prisma.stockProduct.findFirst({ where: { id: productId, companyId } })
  if (!product) return new NextResponse("Product not found", { status: 404 })

  const delta = countedStock - product.currentStock
  if (delta === 0) {
    return NextResponse.json({ error: "A quantidade informada já é igual ao estoque atual." }, { status: 422 })
  }

  try {
    const movement = await prisma.$transaction(async (tx) => {
      // Update condicional: garante que o estoque não mudou entre a leitura
      // acima e esta escrita (ex: uma saída foi lançada nesse meio-tempo).
      const result = await tx.stockProduct.updateMany({
        where: { id: productId, currentStock: product.currentStock },
        data: { currentStock: countedStock },
      })
      if (result.count === 0) {
        throw new Error("STALE_STOCK")
      }

      return tx.stockMovement.create({
        data: {
          productId,
          productName: product.name,
          productCode: product.code ?? null,
          productSku: product.sku ?? null,
          quantity: Math.abs(delta),
          direction: delta > 0 ? 1 : -1,
          type: "ajuste",
          reason,
          operatorName: session.user.name ?? "Desconhecido",
          previousStock: product.currentStock,
          newStock: countedStock,
          companyId,
        },
      })
    })

    return NextResponse.json(movement, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === "STALE_STOCK") {
      return NextResponse.json(
        { error: "O estoque foi alterado por outra operação enquanto você ajustava. Recarregue e tente novamente." },
        { status: 409 }
      )
    }
    throw err
  }
}
