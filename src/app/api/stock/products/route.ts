import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

// Nome, SKU, unidade e descrição são normalizados em caixa alta pra manter o
// padrão do módulo de Estoque — vale só pra cadastros novos/editados a partir
// daqui, dados já existentes não são alterados retroativamente.
const upper = (v: string) => v.trim().toUpperCase()
const upperNullable = (v: string | null | undefined) => (v ? upper(v) : v ?? null)

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório").transform(upper),
  sku: z.string().optional().nullable().transform(upperNullable),
  unit: z.string().min(1, "Unidade é obrigatória").transform(upper),
  minStock: z.number().int().min(0, "Estoque mínimo não pode ser negativo"),
  description: z.string().optional().nullable().transform(upperNullable),
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

  // Produtos com estoque aparecem primeiro; zerados ficam no final (ambos em ordem alfabética)
  products.sort((a, b) => {
    const aHasStock = a.currentStock > 0
    const bHasStock = b.currentStock > 0
    if (aHasStock !== bHasStock) return aHasStock ? -1 : 1
    return 0
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

  // Gera o próximo código sequencial e cria o produto. Dois cadastros feitos ao
  // mesmo tempo podem calcular o mesmo "próximo código" — a constraint única
  // (companyId, code) no banco rejeita a segunda tentativa, e aqui recalculamos
  // e tentamos de novo em vez de devolver um erro ao usuário.
  let product = null
  for (let attempt = 0; attempt < 5 && !product; attempt++) {
    const lastProduct = await prisma.stockProduct.findFirst({
      where: { companyId: session.user.companyId, code: { not: null } },
      orderBy: { code: "desc" },
      select: { code: true },
    })
    const nextCode = (lastProduct?.code ?? 0) + 1

    try {
      product = await prisma.stockProduct.create({
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
    } catch (err) {
      const isCodeCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        (err.meta?.target as string[] | undefined)?.includes("code")
      if (!isCodeCollision) throw err
      // Colisão: outro cadastro simultâneo pegou o mesmo código — tenta de novo.
    }
  }

  if (!product) {
    return NextResponse.json(
      { error: "Não foi possível gerar um código para o produto. Tente novamente." },
      { status: 409 }
    )
  }

  return NextResponse.json(product, { status: 201 })
}
