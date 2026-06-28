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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = carrierSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const existing = await prisma.carrier.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) return new NextResponse("Not Found", { status: 404 })

  const updated = await prisma.carrier.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      trackingUrl: parsed.data.trackingUrl || null,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.carrier.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) return new NextResponse("Not Found", { status: 404 })

  await prisma.carrier.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
