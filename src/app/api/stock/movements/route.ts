import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const movements = await prisma.stockMovement.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return NextResponse.json(movements)
}
