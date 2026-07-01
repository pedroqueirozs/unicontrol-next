import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  type: z.enum(["client", "supplier"]),
  name: z.string().min(1, "Nome é obrigatório"),
  city: z.string().optional().nullable(),
  document: z.string().min(1, "Documento é obrigatório"),
  openedAt: z.string().min(1, "Data de abertura é obrigatória"),
  initialDescription: z.string().min(1, "Descrição inicial é obrigatória"),
  clientId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const url = new URL(req.url)
  const type = url.searchParams.get("type") // "client" | "supplier"

  const pendings = await prisma.pending.findMany({
    where: {
      companyId: session.user.companyId,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(pendings)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { type, name, city, document, openedAt, initialDescription, clientId, supplierId } = parsed.data

  const firstUpdate = {
    id: crypto.randomUUID(),
    text: initialDescription,
    createdAt: new Date().toISOString(),
  }

  const pending = await prisma.pending.create({
    data: {
      type,
      name,
      city: city || null,
      document,
      openedAt: new Date(openedAt),
      status: "aberta",
      updates: [firstUpdate],
      clientId: clientId || null,
      supplierId: supplierId || null,
      companyId: session.user.companyId,
    },
  })

  return NextResponse.json(pending, { status: 201 })
}
