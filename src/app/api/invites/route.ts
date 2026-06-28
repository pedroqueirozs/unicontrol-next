import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma/enums"

const inviteSchema = z.object({
  role: z.enum(["expedicao", "vendas"]),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  if (session.user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const invites = await prisma.invite.findMany({
    where: { companyId: session.user.companyId, used: false },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(invites)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  if (session.user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const body = await req.json()
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Cargo inválido." }, { status: 400 })
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invite = await prisma.invite.create({
    data: {
      role: parsed.data.role as Role,
      expiresAt,
      companyId: session.user.companyId,
    },
  })

  return NextResponse.json(invite, { status: 201 })
}
