"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Hash } from "lucide-react"
import { FormInput } from "@/components/form-input"
import type { StockProduct } from "./types"

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  sku: z.string().optional().nullable(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  minStock: z.number().int().min(0, "Mínimo 0"),
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    if (editItem) {
      reset({ name: editItem.name, sku: editItem.sku ?? "", unit: editItem.unit, minStock: editItem.minStock })
    } else {
      reset({ name: "", sku: "", unit: "un", minStock: 0 })
    }
  }, [open, editItem, reset])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
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

        <form onSubmit={handleSubmit(onSave)} className="p-5 flex flex-col gap-4">

          {!editItem && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              <Hash size={14} className="shrink-0" />
              <span>O <strong className="text-foreground">código de identificação</strong> será gerado automaticamente.</span>
            </div>
          )}

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

          <div className="flex justify-end gap-3 pt-1">
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
