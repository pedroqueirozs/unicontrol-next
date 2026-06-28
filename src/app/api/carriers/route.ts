import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const carrierSchema = z.object({
  type: z.enum(["empresa", "simples"]),
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
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
  trackingUrl: z.string().url("URL inválida").optional().or(z.literal("")),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const carriers = await prisma.carrier.findMany({
    where: { companyId: session.user.companyId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  })

  return NextResponse.json(carriers)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const body = await req.json()
  const parsed = carrierSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const carrier = await prisma.carrier.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      trackingUrl: parsed.data.trackingUrl || null,
      companyId: session.user.companyId,
    },
  })

  return NextResponse.json(carrier, { status: 201 })
}
