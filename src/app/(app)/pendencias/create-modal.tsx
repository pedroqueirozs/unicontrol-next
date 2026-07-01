"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Search } from "lucide-react"
import { FormInput } from "@/components/form-input"

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  city: z.string().optional().nullable(),
  document: z.string().min(1, "Documento / NF é obrigatório"),
  openedAt: z.string().min(1, "Data de abertura é obrigatória"),
  initialDescription: z.string().min(1, "Descrição inicial é obrigatória"),
})

type FormData = z.infer<typeof schema>

type ContactResult = {
  id: string
  code: string
  name: string
  cnpj: string
  city: string | null
  state: string | null
}

interface Props {
  open: boolean
  type: "client" | "supplier"
  onClose: () => void
  onSave: (data: FormData & { contactId?: string }) => Promise<void>
  loading: boolean
}

const today = new Date().toISOString().split("T")[0]

export function CreatePendingModal({ open, type, onClose, onSave, loading }: Props) {
  const [contactSearch, setContactSearch] = useState("")
  const [contactResults, setContactResults] = useState<ContactResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactResult | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { openedAt: today },
  })

  useEffect(() => {
    if (!open) return
    reset({ name: "", city: "", document: "", openedAt: today, initialDescription: "" })
    setSelectedContact(null)
    setContactSearch("")
  }, [open, reset])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleContactSearch(value: string) {
    setContactSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setContactResults([]); setShowDropdown(false); return }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/address/search?q=${encodeURIComponent(value)}`)
      if (res.ok) {
        const data: (ContactResult & { type: string })[] = await res.json()
        setContactResults(data.filter((c) => c.type === type))
        setShowDropdown(true)
      }
    }, 300)
  }

  function handleSelectContact(contact: ContactResult) {
    setSelectedContact(contact)
    setValue("name", contact.name)
    setValue("city", contact.city ?? "")
    setContactSearch("")
    setShowDropdown(false)
  }

  async function onSubmit(data: FormData) {
    await onSave({ ...data, contactId: selectedContact?.id })
  }

  if (!open) return null

  const typeLabel = type === "client" ? "Cliente" : "Fornecedor"

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">Nova Pendência — {typeLabel}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4 overflow-y-auto">

          {/* Contact search */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-widest">
              Vincular ao cadastro <span className="font-normal normal-case text-muted-foreground">(opcional)</span>
            </p>

            {selectedContact ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedContact.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedContact.cnpj}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedContact(null); setValue("name", ""); setValue("city", "") }}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 min-h-[44px] px-2"
                >
                  <X size={14} /> limpar
                </button>
              </div>
            ) : (
              <div ref={searchContainerRef} className="relative">
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg border border-border bg-background focus-within:border-ring transition-colors">
                  <Search size={15} className="text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => handleContactSearch(e.target.value)}
                    onFocus={() => contactResults.length > 0 && setShowDropdown(true)}
                    placeholder={`Buscar ${typeLabel.toLowerCase()} pelo nome ou CNPJ…`}
                    className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                  />
                  {contactSearch && (
                    <button type="button" onClick={() => { setContactSearch(""); setContactResults([]); setShowDropdown(false) }} className="text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  )}
                </div>
                {showDropdown && contactResults.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                    {contactResults.map((c) => (
                      <li
                        key={c.id}
                        onMouseDown={() => handleSelectContact(c)}
                        className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                      >
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.cnpj}{c.city ? ` · ${c.city}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Fields */}
          <FormInput
            label={`Nome do ${typeLabel}`}
            id="pend-name"
            {...register("name")}
            error={errors.name?.message}
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <FormInput
                label="Cidade"
                id="pend-city"
                placeholder="Opcional"
                {...register("city")}
                error={errors.city?.message}
              />
            </div>
            <div className="flex-1">
              <FormInput
                label="Documento / NF"
                id="pend-doc"
                placeholder="Ex: NF 1234"
                {...register("document")}
                error={errors.document?.message}
              />
            </div>
          </div>

          <FormInput
            label="Data de abertura"
            id="pend-date"
            type="date"
            {...register("openedAt")}
            error={errors.openedAt?.message}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pend-desc" className="text-sm font-medium text-foreground">
              Descrição inicial <span className="text-destructive">*</span>
            </label>
            <textarea
              id="pend-desc"
              rows={4}
              placeholder="Descreva o problema ou a pendência…"
              className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none transition-colors focus:border-ring ${
                errors.initialDescription ? "border-destructive" : "border-border"
              }`}
              {...register("initialDescription")}
            />
            {errors.initialDescription && (
              <p className="text-xs text-destructive">{errors.initialDescription.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted transition min-h-[44px]">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-60 min-h-[44px]">
              {loading ? "Salvando..." : "Criar pendência"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
