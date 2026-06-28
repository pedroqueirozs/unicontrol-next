import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const companySchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().optional(),
  stateRegistration: z.string().optional(),
  street: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: {
      name: true,
      cnpj: true,
      stateRegistration: true,
      street: true,
      district: true,
      city: true,
      state: true,
      zip: true,
      phone: true,
      whatsapp: true,
      logoUrl: true,
    },
  })

  if (!company) return new NextResponse("Not Found", { status: 404 })

  return NextResponse.json(company)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  if (session.user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const body = await req.json()
  const parsed = companySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const company = await prisma.company.update({
    where: { id: session.user.companyId },
    data: parsed.data,
  })

  return NextResponse.json(company)
}
