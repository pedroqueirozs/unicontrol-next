import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().min(1, "CNPJ/CPF é obrigatório"),
  stateRegistration: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const clients = await prisma.client.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { code: "asc" },
  })

  return NextResponse.json(clients)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const body = await req.json()
  const parsed = clientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const companyId = session.user.companyId

  // Gera o próximo código sequencial dentro de uma transaction para evitar race conditions
  const client = await prisma.$transaction(async (tx) => {
    const last = await tx.client.findFirst({
      where: { companyId },
      orderBy: { code: "desc" },
      select: { code: true },
    })

    const lastNum = last ? parseInt(last.code.replace("C-", "")) : 0
    const code = `C-${String(lastNum + 1).padStart(3, "0")}`

    return tx.client.create({
      data: {
        ...parsed.data,
        email: parsed.data.email || null,
        code,
        companyId,
      },
    })
  })

  return NextResponse.json(client, { status: 201 })
}
