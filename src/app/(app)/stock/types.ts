export type StockProduct = {
  id: string
  code: number | null
  name: string
  sku: string | null
  unit: string
  minStock: number
  currentStock: number
  description: string | null
  ncm: string | null
  price: number | null
  costPrice: number | null
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
  direction: number // 1 = entrada/estorno de saída/ajuste positivo, -1 = saída/estorno de entrada/ajuste negativo
  type: "entrada" | "saida" | "estorno" | "ajuste"
  reason: string | null
  operatorName: string
  reversalOfId: string | null // presente em movimentos "estorno": aponta pro lançamento original
  reversedAt: string | null // presente no lançamento original quando ele já foi estornado
  previousStock: number | null // presente em movimentos "ajuste"
  newStock: number | null // presente em movimentos "ajuste"
  createdAt: string
}
