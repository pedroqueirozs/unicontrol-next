import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const patchSchema = z.union([
  z.object({ action: z.literal("status"), status: z.enum(["aberta", "em_andamento", "resolvida"]) }),
  z.object({ action: z.literal("update"), text: z.string().min(1) }),
])

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const existing = await prisma.pending.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) return new NextResponse("Not Found", { status: 404 })

  let updated
  if (parsed.data.action === "status") {
    updated = await prisma.pending.update({
      where: { id },
      data: { status: parsed.data.status },
    })
  } else {
    const newUpdate = {
      id: crypto.randomUUID(),
      text: parsed.data.text,
      createdAt: new Date().toISOString(),
    }
    const currentUpdates = Array.isArray(existing.updates) ? existing.updates : []
    updated = await prisma.pending.update({
      where: { id },
      data: { updates: [...currentUpdates, newUpdate] },
    })
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params

  const existing = await prisma.pending.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!existing) return new NextResponse("Not Found", { status: 404 })

  await prisma.pending.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
