import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdminLevel } from "@/lib/roles"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  if (!isAdminLevel(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { id } = await params

  const invite = await prisma.invite.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!invite) return new NextResponse("Not Found", { status: 404 })

  await prisma.invite.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
