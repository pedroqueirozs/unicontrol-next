import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const supplierSchema = z.object({
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

  const suppliers = await prisma.supplier.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { code: "asc" },
  })

  return NextResponse.json(suppliers)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const body = await req.json()
  const parsed = supplierSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const companyId = session.user.companyId

  const supplier = await prisma.$transaction(async (tx) => {
    const last = await tx.supplier.findFirst({
      where: { companyId },
      orderBy: { code: "desc" },
      select: { code: true },
    })

    const lastNum = last ? parseInt(last.code.replace("F-", "")) : 0
    const code = `F-${String(lastNum + 1).padStart(3, "0")}`

    return tx.supplier.create({
      data: {
        ...parsed.data,
        email: parsed.data.email || null,
        code,
        companyId,
      },
    })
  })

  return NextResponse.json(supplier, { status: 201 })
}
