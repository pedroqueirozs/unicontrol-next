"use client"

import { useState, useEffect } from "react"
import { X, Printer, Minus, Plus } from "lucide-react"
import JsBarcode from "jsbarcode"
import QRCode from "qrcode"
import type { StockProduct } from "./types"

// ── Tamanhos ──────────────────────────────────────────────────────────────────

type LabelSize = "small" | "medium" | "large"

const SIZE_CONFIG: Record<LabelSize, {
  label: string
  widthMm: number   // largura da etiqueta em mm
  namePt: number    // fonte do nome em pt
  detailPt: number  // fonte dos detalhes em pt
  barHMm: number    // altura do barcode/qr em mm
  previewH: number  // altura do barcode no preview do modal (px)
}> = {
  small: {
    label: "Pequena",
    widthMm: 88,   // 2 por linha em A4
    namePt: 7,
    detailPt: 5.5,
    barHMm: 11,
    previewH: 36,
  },
  medium: {
    label: "Média",
    widthMm: 130,
    namePt: 9,
    detailPt: 7,
    barHMm: 17,
    previewH: 52,
  },
  large: {
    label: "Grande",
    widthMm: 175,
    namePt: 12,
    detailPt: 9,
    barHMm: 24,
    previewH: 72,
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateBarcodeDataURL(value: string): string | null {
  try {
    const canvas = document.createElement("canvas")
    JsBarcode(canvas, value, {
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: true,
      fontSize: 14,
      margin: 10,
      background: "#ffffff",
      lineColor: "#000000",
    })
    return canvas.toDataURL("image/png")
  } catch {
    return null
  }
}

function openPrintWindow(
  product: StockProduct,
  quantity: number,
  size: LabelSize,
  barcodeDataURL: string,
  qrDataURL: string
) {
  const cfg = SIZE_CONFIG[size]
  const codePadded = product.code !== null ? String(product.code).padStart(4, "0") : "--"

  const labelHTML = `
    <div class="label">
      <p class="name">${product.name}</p>
      <p class="detail">Cód: <strong>${codePadded}</strong>${product.sku ? ` &middot; SKU: ${product.sku}` : ""} &middot; ${product.unit}</p>
      <div class="codes">
        <img src="${barcodeDataURL}" class="barcode" />
        <img src="${qrDataURL}" class="qr" />
      </div>
    </div>
  `

  const win = window.open("", "_blank", "width=900,height=700")
  if (!win) return

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Etiquetas — ${product.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: white; }
        .grid {
          display: flex;
          flex-wrap: wrap;
          gap: 3mm;
          padding: 8mm;
        }
        .label {
          width: max-content;
          border: 0.4mm dashed #999;
          padding: 2mm 2.5mm;
          page-break-inside: avoid;
        }
        .name {
          font-size: ${cfg.namePt}pt;
          font-weight: bold;
          line-height: 1.3;
          margin-bottom: 0.8mm;
        }
        .detail {
          font-size: ${cfg.detailPt}pt;
          color: #444;
          margin-bottom: 1.5mm;
        }
        .codes {
          display: flex;
          align-items: center;
          gap: 2mm;
        }
        .barcode { height: ${cfg.barHMm}mm; width: auto; }
        .qr { height: ${cfg.barHMm}mm; width: ${cfg.barHMm}mm; }
        @media print {
          .grid { padding: 5mm; }
        }
      </style>
    </head>
    <body>
      <div class="grid">
        ${Array.from({ length: quantity }).map(() => labelHTML).join("")}
      </div>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `)
  win.document.close()
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  product: StockProduct | null
  onClose: () => void
}

export function LabelPrintModal({ product, onClose }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [size, setSize] = useState<LabelSize>("small")
  const [barcodeDataURL, setBarcodeDataURL] = useState<string | null>(null)
  const [qrDataURL, setQrDataURL] = useState<string | null>(null)

  useEffect(() => {
    if (!product) return
    setQuantity(1)
    const barcodeValue = product.code !== null
      ? String(product.code).padStart(4, "0")
      : (product.sku ?? "")
    setBarcodeDataURL(barcodeValue ? generateBarcodeDataURL(barcodeValue) : null)
    if (barcodeValue) {
      QRCode.toDataURL(barcodeValue, { width: 120, margin: 1 })
        .then(setQrDataURL)
        .catch(() => setQrDataURL(null))
    }
  }, [product])

  if (!product) return null

  const cfg = SIZE_CONFIG[size]
  const imagesReady = !!barcodeDataURL && !!qrDataURL
  const codePadded = product.code !== null ? String(product.code).padStart(4, "0") : "--"

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Imprimir Etiqueta</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* Size selector */}
          <div>
            <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-2">
              Tamanho da Etiqueta
            </p>
            <div className="flex gap-2">
              {(["small", "medium", "large"] as LabelSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition
                    ${size === s
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  {SIZE_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Label preview */}
          <div className="border border-border rounded-xl p-4 bg-white overflow-hidden">
            <div className="inline-block">
              <p className="font-bold text-gray-900 leading-tight" style={{ fontSize: cfg.namePt * 1.6 }}>
                {product.name}
              </p>
              <p className="text-gray-500 mt-0.5" style={{ fontSize: cfg.detailPt * 1.6 }}>
                Cód: <strong className="text-gray-700">{codePadded}</strong>
                {product.sku ? ` · SKU: ${product.sku}` : ""}
                {" · "}{product.unit}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {barcodeDataURL ? (
                  <img src={barcodeDataURL} alt="barcode" style={{ height: cfg.previewH }} />
                ) : (
                  <div style={{ height: cfg.previewH }} className="w-32 bg-gray-100 rounded animate-pulse" />
                )}
                {qrDataURL ? (
                  <img src={qrDataURL} alt="qr code" style={{ height: cfg.previewH, width: cfg.previewH }} />
                ) : (
                  <div style={{ height: cfg.previewH, width: cfg.previewH }} className="bg-gray-100 rounded animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {/* Quantity selector */}
          <div>
            <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-2">
              Quantidade de Etiquetas
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border hover:bg-muted transition text-foreground"
              >
                <Minus size={16} />
              </button>
              <span className="text-xl font-semibold text-foreground w-10 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(200, q + 1))}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border hover:bg-muted transition text-foreground"
              >
                <Plus size={16} />
              </button>
              <span className="text-sm text-muted-foreground">
                {quantity} etiqueta{quantity > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1 border-t border-border justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition min-h-[44px]"
            >
              Fechar
            </button>
            <button
              onClick={() => openPrintWindow(product, quantity, size, barcodeDataURL!, qrDataURL!)}
              disabled={!imagesReady}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60 min-h-[44px]"
            >
              <Printer size={15} /> Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
