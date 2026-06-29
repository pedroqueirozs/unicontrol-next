import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  text: z.string().min(1, "Observação não pode estar vazia"),
})

type NoteEntry = { id: string; text: string; createdAt: string }

export async function POST(
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
    select: { notesHistory: true },
  })
  if (!existing) return new NextResponse("Not Found", { status: 404 })

  const history = existing.notesHistory as NoteEntry[]
  const newNote: NoteEntry = {
    id: crypto.randomUUID(),
    text: parsed.data.text,
    createdAt: new Date().toISOString(),
  }

  const updated = await prisma.goodsShipped.update({
    where: { id },
    data: { notesHistory: [...history, newNote] },
    select: { notesHistory: true },
  })

  return NextResponse.json(updated)
}
