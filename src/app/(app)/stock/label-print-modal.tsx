"use client"

import { useState, useEffect } from "react"
import { X, Printer, Download, Minus, Plus } from "lucide-react"
import JsBarcode from "jsbarcode"
import QRCode from "qrcode"
import {
  Document,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  BorderStyle,
  AlignmentType,
} from "docx"
import type { StockProduct } from "./types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function dataURLToBuffer(dataURL: string): ArrayBuffer {
  const base64 = dataURL.split(",")[1]
  const binary = atob(base64)
  const buf = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i)
  return buf
}

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

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideH: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideV: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
}

const outerBorder = {
  top: { style: BorderStyle.DASHED, size: 4, color: "AAAAAA" },
  bottom: { style: BorderStyle.DASHED, size: 4, color: "AAAAAA" },
  left: { style: BorderStyle.DASHED, size: 4, color: "AAAAAA" },
  right: { style: BorderStyle.DASHED, size: 4, color: "AAAAAA" },
}

async function generateLabelDocx(
  product: StockProduct,
  quantity: number,
  barcodeBuffer: ArrayBuffer,
  qrBuffer: ArrayBuffer
): Promise<Blob> {
  const makeLabel = (): TableRow =>
    new TableRow({
      children: [
        new TableCell({
          borders: outerBorder,
          margins: { top: 120, bottom: 120, left: 150, right: 150 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: product.name, bold: true, size: 28 })],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Cód: ${product.code !== null ? String(product.code).padStart(4, "0") : "--"}`,
                  size: 18,
                  bold: true,
                }),
                ...(product.sku ? [new TextRun({ text: `   SKU: ${product.sku}`, size: 18 })] : []),
                new TextRun({ text: "   ·   Unidade: ", size: 18 }),
                new TextRun({ text: product.unit, size: 18, underline: {} }),
              ],
              spacing: { after: 100 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: noBorder,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: noBorder,
                      width: { size: 80, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [
                            new ImageRun({
                              data: barcodeBuffer,
                              transformation: { width: 260, height: 78 },
                              type: "png",
                            }),
                          ],
                          alignment: AlignmentType.LEFT,
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: noBorder,
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [
                            new ImageRun({
                              data: qrBuffer,
                              transformation: { width: 78, height: 78 },
                              type: "png",
                            }),
                          ],
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })

  const doc = new Document({
    sections: [
      {
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorder,
            rows: Array.from({ length: quantity }, makeLabel),
          }),
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  product: StockProduct | null
  onClose: () => void
}

export function LabelPrintModal({ product, onClose }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [barcodeDataURL, setBarcodeDataURL] = useState<string | null>(null)
  const [qrDataURL, setQrDataURL] = useState<string | null>(null)
  const [generatingDocx, setGeneratingDocx] = useState(false)

  useEffect(() => {
    if (!product) return
    setQuantity(1)
    // Código automático (padded) é o valor do barcode; fallback para SKU em produtos legados
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

  async function handleDownloadDocx() {
    if (!product || !barcodeDataURL || !qrDataURL) return
    setGeneratingDocx(true)
    try {
      const blob = await generateLabelDocx(
        product,
        quantity,
        dataURLToBuffer(barcodeDataURL),
        dataURLToBuffer(qrDataURL)
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `etiqueta-${product.sku}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail — user can retry
    } finally {
      setGeneratingDocx(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  if (!product) return null

  const imagesReady = !!barcodeDataURL && !!qrDataURL

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#label-print-area) { display: none !important; }
          #label-print-area {
            display: block !important;
            position: fixed;
            inset: 0;
            padding: 16px;
            background: white;
          }
          .label-item {
            border: 1px dashed #aaa;
            padding: 12px;
            margin-bottom: 10px;
            page-break-inside: avoid;
          }
          .label-codes {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            margin-top: 8px;
          }
        }
        #label-print-area { display: none; }
      `}</style>

      {/* Hidden print area */}
      <div id="label-print-area">
        {Array.from({ length: quantity }).map((_, i) => (
          <div key={i} className="label-item">
            <p style={{ fontWeight: "bold", fontSize: 18, margin: 0 }}>{product.name}</p>
            <p style={{ fontSize: 13, margin: "2px 0 0" }}>
              SKU: {product.sku} · Unidade: {product.unit}
            </p>
            <div className="label-codes">
              {barcodeDataURL && <img src={barcodeDataURL} alt="barcode" style={{ height: 70 }} />}
              {qrDataURL && <img src={qrDataURL} alt="qr" style={{ height: 70, width: 70 }} />}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
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
            {/* Label preview */}
            <div className="border border-border rounded-xl p-4 bg-white">
              <p className="font-bold text-gray-900 text-lg leading-tight">{product.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Cód: <strong className="text-gray-700">
                  {product.code !== null ? String(product.code).padStart(4, "0") : "--"}
                </strong>
                {product.sku ? ` · SKU: ${product.sku}` : ""}
                {" · "}{product.unit}
              </p>
              <div className="flex items-end justify-between mt-3">
                {barcodeDataURL ? (
                  <img src={barcodeDataURL} alt="barcode" className="h-16" />
                ) : (
                  <div className="h-16 w-44 bg-gray-100 rounded animate-pulse" />
                )}
                {qrDataURL ? (
                  <img src={qrDataURL} alt="qr code" className="h-16 w-16" />
                ) : (
                  <div className="h-16 w-16 bg-gray-100 rounded animate-pulse" />
                )}
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
                  onClick={() => setQuantity((q) => Math.min(50, q + 1))}
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
            <div className="flex gap-2 pt-1 border-t border-border justify-end flex-wrap">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition min-h-[44px]"
              >
                Fechar
              </button>
              <button
                onClick={handleDownloadDocx}
                disabled={generatingDocx || !imagesReady}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition disabled:opacity-60 min-h-[44px]"
              >
                <Download size={15} />
                {generatingDocx ? "Gerando..." : "Baixar .docx"}
              </button>
              <button
                onClick={handlePrint}
                disabled={!imagesReady}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60 min-h-[44px]"
              >
                <Printer size={15} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
