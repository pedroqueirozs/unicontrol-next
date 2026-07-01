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
  direction: number // 1 = entrada, -1 = saída
  type: "entrada" | "saida"
  reason: string | null
  operatorName: string
  createdAt: string
}
