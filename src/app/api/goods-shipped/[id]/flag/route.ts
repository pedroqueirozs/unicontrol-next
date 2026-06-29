import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params

  const existing = await prisma.goodsShipped.findFirst({
    where: { id, companyId: session.user.companyId },
    select: { flagged: true },
  })
  if (!existing) return new NextResponse("Not Found", { status: 404 })

  const updated = await prisma.goodsShipped.update({
    where: { id },
    data: { flagged: !existing.flagged },
    select: { flagged: true },
  })

  return NextResponse.json(updated)
}
