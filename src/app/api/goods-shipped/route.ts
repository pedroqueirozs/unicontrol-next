import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  name: z.string().min(1),
  documentNumber: z.string().min(1, "Nota fiscal é obrigatória"),
  city: z.string().min(1),
  uf: z.string().min(1),
  transporter: z.string().min(1, "Selecione uma transportadora"),
  shippingDate: z.string().min(1),
  deliveryForecast: z.string().nullable().optional(),
  deliveryDate: z.string().nullable().optional(),
  clientId: z.string().min(1),
  clientCode: z.string().min(1),
  trackingCodes: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const shipments = await prisma.goodsShipped.findMany({
    where: { companyId: session.user.companyId },
    orderBy: [{ shippingDate: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(shipments)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { notes, deliveryForecast, deliveryDate, ...rest } = parsed.data

  const initialNote = notes?.trim()
  const notesHistory = initialNote
    ? [{ id: crypto.randomUUID(), text: initialNote, createdAt: new Date().toISOString() }]
    : []

  const shipment = await prisma.goodsShipped.create({
    data: {
      ...rest,
      shippingDate: new Date(parsed.data.shippingDate),
      deliveryForecast: deliveryForecast ? new Date(deliveryForecast) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      notesHistory,
      companyId: session.user.companyId,
    },
  })

  return NextResponse.json(shipment, { status: 201 })
}
