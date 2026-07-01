export type StockProduct = {
  id: string
  code: number | null  // gerado automaticamente — identificador definitivo
  name: string
  sku: string | null   // legado do sistema antigo — opcional
  unit: string
  minStock: number
  currentStock: number
  createdAt: string
  updatedAt: string
}

export type StockMovement = {
  id: string
  productId: string
  productName: string
  productCode: number | null
  productSku: string | null
  quantity: number
  direction: number // 1 = entrada, -1 = saída
  type: "entrada" | "saida"
  reason: string | null
  operatorName: string
  createdAt: string
}
