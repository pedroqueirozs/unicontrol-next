"use client"

import { Minus, Plus } from "lucide-react"

interface Props {
  value: number
  onChange: (value: number) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  min?: number
}

// Campo de quantidade padrão usado em Entrada e Saída: digita direto ou ajusta de 1 em 1 com os botões.
export function QuantityStepper({ value, onChange, inputRef, onKeyDown, min = 1 }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-12 h-16 flex items-center justify-center rounded-xl border-2 border-border hover:bg-muted transition text-foreground shrink-0"
        aria-label="Diminuir quantidade"
      >
        <Minus size={20} />
      </button>
      <input
        ref={inputRef}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
        onKeyDown={onKeyDown}
        className="w-20 h-16 rounded-xl border-2 border-border bg-background px-2 text-2xl font-bold text-foreground text-center outline-none focus:border-ring"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-12 h-16 flex items-center justify-center rounded-xl border-2 border-border hover:bg-muted transition text-foreground shrink-0"
        aria-label="Aumentar quantidade"
      >
        <Plus size={20} />
      </button>
    </div>
  )
}
