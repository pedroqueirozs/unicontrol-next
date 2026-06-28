import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  if (session.user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Você não pode remover sua própria conta." },
      { status: 400 }
    )
  }

  const user = await prisma.user.findFirst({
    where: { id, companyId: session.user.companyId },
  })
  if (!user) return new NextResponse("Not Found", { status: 404 })

  await prisma.user.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
