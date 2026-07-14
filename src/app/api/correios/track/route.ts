import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { trackCorreiosObject } from "@/lib/correios"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.companyId) return new NextResponse("Unauthorized", { status: 401 })

  const codigo = new URL(req.url).searchParams.get("codigo")
  if (!codigo) {
    return NextResponse.json({ error: "Parâmetro 'codigo' é obrigatório." }, { status: 400 })
  }

  try {
    const result = await trackCorreiosObject(codigo)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao consultar rastreio."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
