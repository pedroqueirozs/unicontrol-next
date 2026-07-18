/**
 * Preenche previousStock/newStock nas movimentações antigas (entrada/saída
 * registradas antes dessas colunas existirem — só "ajuste" já vinha com isso).
 *
 * Reconstrói o saldo replay-ando as movimentações de cada produto em ordem
 * cronológica a partir de 0 (todo produto nasce com currentStock: 0 — ver
 * scripts/import-products.ts e src/app/api/stock/products/route.ts). Antes de
 * escrever qualquer coisa, confere se o saldo final bate com o currentStock
 * atual do produto; se não bater, pula esse produto e avisa, em vez de gravar
 * um valor que pode estar errado.
 *
 * Como usar:
 *   Simulação (não grava nada, só mostra o que seria alterado):
 *     npx tsx scripts/backfill-movement-balances.ts
 *
 *   Aplicar de verdade:
 *     npx tsx scripts/backfill-movement-balances.ts --apply
 */

import "dotenv/config"
import { prisma } from "../src/lib/prisma"

const apply = process.argv.includes("--apply")

async function main() {
  const movements = await prisma.stockMovement.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  })

  const byProduct = new Map<string, typeof movements>()
  for (const m of movements) {
    const list = byProduct.get(m.productId) ?? []
    list.push(m)
    byProduct.set(m.productId, list)
  }

  const productIds = [...byProduct.keys()]
  const products = await prisma.stockProduct.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, currentStock: true },
  })
  const productById = new Map(products.map((p) => [p.id, p]))

  type Update = { id: string; previousStock: number; newStock: number }
  const updates: Update[] = []
  const skippedMismatch: string[] = []
  let unchanged = 0

  for (const [productId, list] of byProduct) {
    let running = 0
    const productUpdates: Update[] = []
    for (const m of list) {
      const previousStock = running
      running += m.direction * m.quantity
      const newStock = running
      if (m.previousStock === previousStock && m.newStock === newStock) {
        unchanged++
        continue
      }
      productUpdates.push({ id: m.id, previousStock, newStock })
    }

    const product = productById.get(productId)
    if (product && product.currentStock !== running) {
      skippedMismatch.push(
        `  - ${product.name} (${productId}): saldo reconstruído ${running}, mas currentStock atual é ${product.currentStock} — PULADO`
      )
      continue
    }
    updates.push(...productUpdates)
  }

  console.log(`Movimentações totais: ${movements.length}`)
  console.log(`Já corretas (sem mudança): ${unchanged}`)
  console.log(`Serão atualizadas: ${updates.length}`)
  if (skippedMismatch.length > 0) {
    console.log(`\nProdutos com divergência (pulados, nada será alterado neles):`)
    console.log(skippedMismatch.join("\n"))
  }

  if (!apply) {
    console.log("\nSimulação — nada foi gravado. Rode com --apply para aplicar de verdade.")
    return
  }

  if (updates.length === 0) {
    console.log("\nNada para aplicar.")
    return
  }

  // Updates sequenciais e independentes, sem transação: cada linha é recalculada
  // de forma determinística a partir do histórico, então o script é idempotente —
  // se cair no meio (ex: timeout de conexão), rodar de novo é seguro e só
  // termina o que faltou, sem risco de duplicar ou corromper nada.
  let done = 0
  for (const u of updates) {
    await prisma.stockMovement.update({
      where: { id: u.id },
      data: { previousStock: u.previousStock, newStock: u.newStock },
    })
    done++
  }
  console.log(`\n${done} movimentações atualizadas com sucesso.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
