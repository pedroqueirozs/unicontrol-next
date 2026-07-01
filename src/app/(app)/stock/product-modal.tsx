"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Hash, ChevronDown, ChevronUp } from "lucide-react"
import { FormInput } from "@/components/form-input"
import type { StockProduct } from "./types"

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  sku: z.string().optional().nullable(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  minStock: z.number().int().min(0, "Mínimo 0"),
  description: z.string().optional().nullable(),
  ncm: z.string().optional().nullable(),
  price: z.number().positive("Deve ser maior que zero").optional().nullable(),
  costPrice: z.number().positive("Deve ser maior que zero").optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
  editItem: StockProduct | null
  loading: boolean
}

function formatCode(code: number | null) {
  if (code === null) return null
  return "#" + String(code).padStart(4, "0")
}

export function ProductModal({ open, onClose, onSave, editItem, loading }: Props) {
  const [showFiscal, setShowFiscal] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    if (editItem) {
      // Auto-expand fiscal section if any fiscal field is filled
      const hasFiscal = !!(editItem.description || editItem.ncm || editItem.price || editItem.costPrice)
      setShowFiscal(hasFiscal)
      reset({
        name: editItem.name,
        sku: editItem.sku ?? "",
        unit: editItem.unit,
        minStock: editItem.minStock,
        description: editItem.description ?? "",
        ncm: editItem.ncm ?? "",
        price: editItem.price ?? undefined,
        costPrice: editItem.costPrice ?? undefined,
      })
    } else {
      setShowFiscal(false)
      reset({ name: "", sku: "", unit: "un", minStock: 0, description: "", ncm: "", price: undefined, costPrice: undefined })
    }
  }, [open, editItem, reset])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {editItem ? "Editar Produto" : "Novo Produto"}
            </h2>
            {editItem?.code && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Hash size={11} /> Código {formatCode(editItem.code)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSave)} className="p-5 flex flex-col gap-5 overflow-y-auto">

          {/* Code info when creating */}
          {!editItem && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              <Hash size={14} className="shrink-0" />
              <span>O <strong className="text-foreground">código de identificação</strong> será gerado automaticamente.</span>
            </div>
          )}

          {/* ── Dados básicos ── */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold text-foreground/60 uppercase tracking-widest">Dados básicos</p>

            <FormInput
              label="Nome do produto"
              id="p-name"
              {...register("name")}
              error={errors.name?.message}
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <FormInput
                  label="SKU — código do sistema antigo (opcional)"
                  id="p-sku"
                  placeholder="Ex: 2580"
                  {...register("sku")}
                  error={errors.sku?.message}
                />
              </div>
              <div className="w-28">
                <FormInput
                  label="Unidade"
                  id="p-unit"
                  placeholder="un, kg, cx…"
                  {...register("unit")}
                  error={errors.unit?.message}
                />
              </div>
            </div>

            <FormInput
              label="Estoque mínimo"
              id="p-min"
              type="number"
              min={0}
              {...register("minStock", { valueAsNumber: true })}
              error={errors.minStock?.message}
            />
          </div>

          {/* ── Dados para pedidos / NF-e ── */}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setShowFiscal((v) => !v)}
              className="flex items-center justify-between w-full py-2 text-left group"
            >
              <p className="text-xs font-bold text-foreground/60 uppercase tracking-widest group-hover:text-foreground/80 transition-colors">
                Dados para pedidos e NF-e
              </p>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {showFiscal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            {showFiscal && (
              <div className="flex flex-col gap-4 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Todos os campos são opcionais. Preencha agora ou quando precisar emitir pedidos e notas fiscais.
                </p>

                <FormInput
                  label="Descrição comercial"
                  id="p-description"
                  placeholder="Descrição adicional do produto…"
                  {...register("description")}
                  error={errors.description?.message}
                />

                <FormInput
                  label="NCM"
                  id="p-ncm"
                  placeholder="00000000"
                  maxLength={8}
                  {...register("ncm")}
                  error={errors.ncm?.message}
                />

                <div className="flex gap-3">
                  <div className="flex-1">
                    <FormInput
                      label="Preço de venda (R$)"
                      id="p-price"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0,00"
                      {...register("price", { valueAsNumber: true })}
                      error={errors.price?.message}
                    />
                  </div>
                  <div className="flex-1">
                    <FormInput
                      label="Preço de custo (R$)"
                      id="p-cost"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0,00"
                      {...register("costPrice", { valueAsNumber: true })}
                      error={errors.costPrice?.message}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60 min-h-[44px]"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
