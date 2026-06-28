"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { FormInput } from "@/components/form-input"

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
]

const contactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().min(1, "CNPJ/CPF é obrigatório"),
  stateRegistration: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
})

export type ContactFormData = z.infer<typeof contactSchema>

export interface ContactRecord extends ContactFormData {
  id: string
  code: string
  createdAt: string
  updatedAt: string
}

interface ContactModalProps {
  type: "client" | "supplier"
  record?: ContactRecord | null
  onClose: () => void
  onSave: (data: ContactFormData) => Promise<void>
  isLoading?: boolean
}

function maskCnpjCpf(value: string): string {
  const d = value.replace(/\D/g, "").substring(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

function maskZip(value: string): string {
  const d = value.replace(/\D/g, "").substring(0, 8)
  return d.replace(/(\d{5})(\d{1,3})$/, "$1-$2")
}

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").substring(0, 11)
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2")
  }
  return d
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
}

export function ContactModal({
  type,
  record,
  onClose,
  onSave,
  isLoading,
}: ContactModalProps) {
  const label = type === "client" ? "Cliente" : "Fornecedor"
  const title = record ? `Editar ${label}` : `Novo ${label}`

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: record ?? {},
  })

  useEffect(() => {
    reset(record ?? {
      name: "", cnpj: "", stateRegistration: "", street: "", number: "",
      complement: "", neighborhood: "", city: "", state: "", zipCode: "",
      phone: "", email: "",
    })
  }, [record, reset])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="
          fixed inset-x-0 bottom-0 z-50
          md:inset-0 md:flex md:items-center md:justify-center
        "
      >
        <div className="
          w-full md:max-w-2xl
          bg-card border border-border rounded-t-2xl md:rounded-2xl
          shadow-xl max-h-[90dvh] flex flex-col
        ">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form
            onSubmit={handleSubmit(onSave)}
            className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4"
          >
            {/* Identificação */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Identificação
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormInput
                  id="name"
                  label="Nome / Razão Social"
                  type="text"
                  placeholder="Nome do cliente"
                  error={errors.name?.message}
                  {...register("name")}
                />
              </div>
              <FormInput
                id="cnpj"
                label="CNPJ / CPF"
                type="text"
                placeholder="00.000.000/0000-00"
                error={errors.cnpj?.message}
                {...register("cnpj", {
                  onChange: (e) => {
                    const masked = maskCnpjCpf(e.target.value)
                    setValue("cnpj", masked, { shouldValidate: true })
                  },
                })}
              />
              <FormInput
                id="stateRegistration"
                label="Inscrição Estadual"
                type="text"
                placeholder="Isento"
                error={errors.stateRegistration?.message}
                {...register("stateRegistration")}
              />
            </div>

            {/* Endereço */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">
              Endereço
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormInput
                  id="street"
                  label="Logradouro"
                  type="text"
                  placeholder="Rua, Av., Praça..."
                  error={errors.street?.message}
                  {...register("street")}
                />
              </div>
              <FormInput
                id="number"
                label="Número"
                type="text"
                placeholder="123"
                error={errors.number?.message}
                {...register("number")}
              />
              <FormInput
                id="complement"
                label="Complemento"
                type="text"
                placeholder="Apto, Sala..."
                error={errors.complement?.message}
                {...register("complement")}
              />
              <FormInput
                id="neighborhood"
                label="Bairro"
                type="text"
                placeholder="Bairro"
                error={errors.neighborhood?.message}
                {...register("neighborhood")}
              />
              <FormInput
                id="zipCode"
                label="CEP"
                type="text"
                placeholder="00000-000"
                error={errors.zipCode?.message}
                {...register("zipCode", {
                  onChange: (e) => {
                    setValue("zipCode", maskZip(e.target.value), { shouldValidate: true })
                  },
                })}
              />
              <FormInput
                id="city"
                label="Cidade"
                type="text"
                placeholder="Cidade"
                error={errors.city?.message}
                {...register("city")}
              />
              <div className="flex flex-col gap-1">
                <label htmlFor="state" className="text-sm font-medium text-foreground">
                  Estado
                </label>
                <select
                  id="state"
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register("state")}
                >
                  <option value="">Selecione</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-xs text-destructive">{errors.state.message}</p>
                )}
              </div>
            </div>

            {/* Contato */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">
              Contato
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="phone"
                label="Telefone"
                type="text"
                placeholder="(00) 00000-0000"
                error={errors.phone?.message}
                {...register("phone", {
                  onChange: (e) => {
                    setValue("phone", maskPhone(e.target.value), { shouldValidate: true })
                  },
                })}
              />
              <FormInput
                id="email"
                label="E-mail"
                type="email"
                placeholder="email@exemplo.com"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end pt-2 pb-1">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-md text-sm text-foreground border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 rounded-md text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-progress"
              >
                {isLoading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
