import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const registerSchema = z.object({
  token: z.string(),
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { token, name, email, password } = parsed.data

    // Busca o convite pelo token
    const invite = await prisma.invite.findUnique({ where: { token } })

    if (!invite) {
      return NextResponse.json({ error: "Convite inválido." }, { status: 404 })
    }

    if (invite.used) {
      return NextResponse.json({ error: "Este convite já foi utilizado." }, { status: 400 })
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Este convite expirou. Solicite um novo ao administrador." }, { status: 400 })
    }

    // Verifica se o e-mail já está cadastrado
    const emailExistente = await prisma.user.findUnique({ where: { email } })
    if (emailExistente) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Cria o usuário e marca o convite como usado em uma única transação
    await prisma.$transaction([
      prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: invite.role,
          companyId: invite.companyId,
        },
      }),
      prisma.invite.update({
        where: { token },
        data: { used: true },
      }),
    ])

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("[REGISTER]", error)
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 })
  }
}
