import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isAdminLevel } from "@/lib/roles"

const ALLOWED_TYPES = ["image/png", "image/jpeg"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  if (!isAdminLevel(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("logo") as File | null

  if (!file) {
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use PNG ou JPG." }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 5 MB." }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")
  const logoUrl = `data:${file.type};base64,${base64}`

  await prisma.company.update({
    where: { id: session.user.companyId },
    data: { logoUrl },
  })

  return NextResponse.json({ logoUrl })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  if (!isAdminLevel(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  await prisma.company.update({
    where: { id: session.user.companyId },
    data: { logoUrl: null },
  })

  return new NextResponse(null, { status: 204 })
}
