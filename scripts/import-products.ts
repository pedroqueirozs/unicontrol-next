/**
 * Script de importação de produtos em massa via CSV.
 *
 * Como usar:
 *   1. Salve sua planilha como CSV (separador ; ou ,) na raiz do projeto com o nome:
 *      products-import.csv
 *
 *   2. O arquivo deve ter cabeçalho na primeira linha. Colunas aceitas:
 *      nome  →  Nome do produto         (obrigatório)
 *      sku   →  Código SKU              (opcional)
 *      unidade → UN, CX, KG etc.        (obrigatório)
 *
 *      Exemplo:
 *        nome;sku;unidade
 *        VELA VOTIVA 7 DIAS;2580;UN
 *        TERÇO ROSA;2581;CX
 *        INCENSO INDIANO;;UN
 *
 *   3. Rode:
 *      npx tsx scripts/import-products.ts
 */

import fs from "fs"
import path from "path"
import { prisma } from "../src/lib/prisma"

const CSV_FILE = path.resolve(process.cwd(), "products-import.csv")

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/)
  if (lines.length < 2) throw new Error("CSV vazio ou sem dados além do cabeçalho.")

  // Detecta separador: ponto-e-vírgula ou vírgula
  const sep = lines[0].includes(";") ? ";" : ","

  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(sep).map((v) => v.trim())
    if (values.every((v) => v === "")) continue // pula linhas vazias
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] ?? "" })
    rows.push(row)
  }

  return rows
}

// Tenta encontrar o valor da coluna com diferentes grafias
function col(row: Record<string, string>, ...candidates: string[]): string {
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c].trim()
  }
  return ""
}

async function main() {
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`\n❌  Arquivo não encontrado: ${CSV_FILE}`)
    console.error("    Salve sua planilha como products-import.csv na raiz do projeto.\n")
    process.exit(1)
  }

  const company = await prisma.company.findFirst()
  if (!company) {
    console.error("\n❌  Nenhuma empresa encontrada no banco. Rode o seed primeiro.\n")
    process.exit(1)
  }

  const companyId = company.id
  const content = fs.readFileSync(CSV_FILE, "utf-8")
  const rows = parseCsv(content)

  console.log(`\n📄  Empresa: ${company.name}`)
  console.log(`📦  ${rows.length} produto(s) encontrado(s) no CSV\n`)

  // Pega o maior código atual para continuar a sequência
  const last = await prisma.stockProduct.findFirst({
    where: { companyId, code: { not: null } },
    orderBy: { code: "desc" },
    select: { code: true },
  })
  let nextCode = (last?.code ?? 0) + 1

  let created = 0
  let skipped = 0

  for (const row of rows) {
    const name = col(row, "nome", "name", "produto", "nome do produto").toUpperCase()
    const sku = col(row, "sku", "código sku", "codigo sku", "cod sku") || null
    const unit = col(row, "unidade", "unit", "un").toUpperCase() || "UN"

    if (!name) {
      console.warn(`  ⚠️  Linha ignorada (sem nome): ${JSON.stringify(row)}`)
      skipped++
      continue
    }

    await prisma.stockProduct.create({
      data: {
        code: nextCode++,
        name,
        sku: sku || null,
        unit,
        minStock: 0,
        currentStock: 0,
        companyId,
      },
    })

    console.log(`  ✅  #${String(nextCode - 1).padStart(4, "0")}  ${name}  (${unit})${sku ? `  SKU: ${sku}` : ""}`)
    created++
  }

  console.log(`\n✔   Importação concluída: ${created} criado(s), ${skipped} ignorado(s).\n`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error("\n❌  Erro durante a importação:", e.message)
  prisma.$disconnect()
  process.exit(1)
})
