import { NextResponse } from "next/server"
import { writeFile, unlink, mkdir } from "fs/promises"
import path from "path"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_TYPES = ["image/png", "image/jpeg"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  if (session.user.role !== "admin") {
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

  const ext = file.type === "image/png" ? "png" : "jpg"
  const filename = `logo-${session.user.companyId}.${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads")

  await mkdir(uploadDir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes))

  const logoUrl = `/uploads/${filename}`

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
  if (session.user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { logoUrl: true },
  })

  if (company?.logoUrl) {
    const filePath = path.join(process.cwd(), "public", company.logoUrl)
    await unlink(filePath).catch(() => {})
  }

  await prisma.company.update({
    where: { id: session.user.companyId },
    data: { logoUrl: null },
  })

  return new NextResponse(null, { status: 204 })
}
