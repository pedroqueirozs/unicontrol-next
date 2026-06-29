import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  name: z.string().min(1),
  documentNumber: z.string().min(1),
  city: z.string().min(1),
  uf: z.string().min(1),
  transporter: z.string().min(1),
  shippingDate: z.string().min(1),
  deliveryForecast: z.string().nullable().optional(),
  deliveryDate: z.string().nullable().optional(),
  clientId: z.string().min(1),
  clientCode: z.string().min(1),
  trackingCodes: z.array(z.string()).optional().default([]),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const existing = await prisma.goodsShipped.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) return new NextResponse("Not Found", { status: 404 })

  const { deliveryForecast, deliveryDate, ...rest } = parsed.data

  const updated = await prisma.goodsShipped.update({
    where: { id },
    data: {
      ...rest,
      shippingDate: new Date(parsed.data.shippingDate),
      deliveryForecast: deliveryForecast ? new Date(deliveryForecast) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params

  const existing = await prisma.goodsShipped.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) return new NextResponse("Not Found", { status: 404 })

  await prisma.goodsShipped.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
