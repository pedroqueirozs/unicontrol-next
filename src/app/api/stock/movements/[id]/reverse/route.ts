import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdminLevel } from "@/lib/roles"

const REVERSAL_WINDOW_MS = 24 * 60 * 60 * 1000

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const companyId = session.user.companyId

  const original = await prisma.stockMovement.findFirst({ where: { id, companyId } })
  if (!original) return new NextResponse("Not Found", { status: 404 })

  if (original.type !== "entrada" && original.type !== "saida") {
    return NextResponse.json({ error: "Só é possível estornar lançamentos de entrada ou saída." }, { status: 422 })
  }
  if (original.reversedAt) {
    return NextResponse.json({ error: "Este lançamento já foi estornado." }, { status: 422 })
  }

  const ageMs = Date.now() - original.createdAt.getTime()
  if (ageMs > REVERSAL_WINDOW_MS && !isAdminLevel(session.user.role)) {
    return NextResponse.json(
      { error: "Lançamentos com mais de 24h só podem ser estornados por um administrador." },
      { status: 403 }
    )
  }

  const product = await prisma.stockProduct.findFirst({ where: { id: original.productId, companyId } })
  if (!product) {
    return NextResponse.json(
      { error: "O produto deste lançamento não existe mais no cadastro — não é possível estornar automaticamente." },
      { status: 422 }
    )
  }

  // Reverte a direção original: estornar uma entrada tira do estoque, estornar
  // uma saída devolve ao estoque.
  const reversalDirection = -original.direction

  try {
    const reversal = await prisma.$transaction(async (tx) => {
      // Reivindica o estorno de forma atômica: se duas requisições tentarem
      // estornar o mesmo lançamento ao mesmo tempo, só a primeira consegue
      // (count === 0 na segunda, que aborta em vez de duplicar o estorno).
      const claim = await tx.stockMovement.updateMany({
        where: { id: original.id, reversedAt: null },
        data: { reversedAt: new Date() },
      })
      if (claim.count === 0) {
        throw new Error("ALREADY_REVERSED")
      }

      let newStock: number
      if (reversalDirection < 0) {
        // Estornando uma entrada: mesmo guard condicional da saída normal —
        // evita ficar negativo se o produto já foi consumido depois da entrada errada.
        const result = await tx.stockProduct.updateMany({
          where: { id: product.id, currentStock: { gte: original.quantity } },
          data: { currentStock: { decrement: original.quantity } },
        })
        if (result.count === 0) {
          throw new Error("INSUFFICIENT_STOCK")
        }
        const updated = await tx.stockProduct.findUniqueOrThrow({ where: { id: product.id } })
        newStock = updated.currentStock
      } else {
        const updated = await tx.stockProduct.update({
          where: { id: product.id },
          data: { currentStock: { increment: original.quantity } },
        })
        newStock = updated.currentStock
      }

      return tx.stockMovement.create({
        data: {
          productId: original.productId,
          productName: original.productName,
          productCode: original.productCode,
          productSku: original.productSku,
          quantity: original.quantity,
          direction: reversalDirection,
          type: "estorno",
          reason: original.reason
            ? `Estorno de: ${original.reason}`
            : `Estorno do lançamento de ${original.createdAt.toLocaleDateString("pt-BR")}`,
          operatorName: session.user.name ?? "Desconhecido",
          reversalOfId: original.id,
          previousStock: newStock - reversalDirection * original.quantity,
          newStock,
          companyId,
        },
      })
    })

    return NextResponse.json(reversal, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_REVERSED") {
      return NextResponse.json({ error: "Este lançamento já foi estornado." }, { status: 422 })
    }
    if (err instanceof Error && err.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: `Não é possível estornar: o estoque atual de "${product.name}" é menor que a quantidade da entrada original (o produto já foi movimentado depois).` },
        { status: 422 }
      )
    }
    throw err
  }
}
