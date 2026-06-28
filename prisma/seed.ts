import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Verifica se já existe alguma empresa — evita duplicar ao rodar o seed de novo
  const existing = await prisma.company.findFirst()
  if (existing) {
    console.log("⚠️  Seed já foi executado. Banco não está vazio.")
    return
  }

  // Cria a empresa
  const company = await prisma.company.create({
    data: {
      name: process.env.SEED_COMPANY_NAME ?? "Minha Empresa",
      city: process.env.SEED_COMPANY_CITY ?? "Belo Horizonte",
      state: process.env.SEED_COMPANY_STATE ?? "MG",
    },
  })

  // Cria o usuário admin com senha hasheada
  const hashedPassword = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? "admin123",
    12
  )

  const admin = await prisma.user.create({
    data: {
      name: process.env.SEED_ADMIN_NAME ?? "Administrador",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@empresa.com",
      password: hashedPassword,
      role: "admin",
      companyId: company.id,
    },
  })

  console.log("✅ Empresa criada:", company.name, `(id: ${company.id})`)
  console.log("✅ Admin criado:", admin.email)
  console.log("")
  console.log("Acesse o sistema com:")
  console.log("  E-mail:  ", admin.email)
  console.log("  Senha:   ", process.env.SEED_ADMIN_PASSWORD ?? "admin123")
  console.log("")
  console.log("⚠️  Troque a senha após o primeiro login!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
