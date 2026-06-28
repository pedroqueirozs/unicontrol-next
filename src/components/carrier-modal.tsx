"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Building2, Truck } from "lucide-react"
import { FormInput } from "@/components/form-input"

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
]

const carrierSchema = z.object({
  type: z.enum(["empresa", "simples"]),
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
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
  trackingUrl: z.string().url("URL inválida").optional().or(z.literal("")),
})

export type CarrierFormData = z.infer<typeof carrierSchema>

export interface CarrierRecord extends CarrierFormData {
  id: string
  createdAt: string
  updatedAt: string
}

interface CarrierModalProps {
  record?: CarrierRecord | null
  onClose: () => void
  onSave: (data: CarrierFormData) => Promise<void>
  isLoading?: boolean
}

function maskCnpj(value: string): string {
  const d = value.replace(/\D/g, "").substring(0, 14)
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
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2")
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2")
}

const EMPTY: CarrierFormData = {
  type: "simples",
  name: "",
  cnpj: "",
  stateRegistration: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  phone: "",
  email: "",
  trackingUrl: "",
}

export function CarrierModal({ record, onClose, onSave, isLoading }: CarrierModalProps) {
  const title = record ? "Editar Transportadora" : "Nova Transportadora"

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CarrierFormData>({
    resolver: zodResolver(carrierSchema),
    defaultValues: record ?? EMPTY,
  })

  const type = watch("type")
  const isEmpresa = type === "empresa"

  useEffect(() => {
    reset(record ?? EMPTY)
  }, [record, reset])

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center"
      >
        <div className="w-full md:max-w-2xl bg-card border border-border rounded-t-2xl md:rounded-2xl shadow-xl max-h-[90dvh] flex flex-col">

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

          <form
            onSubmit={handleSubmit(onSave)}
            className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4"
          >
            {/* Seletor de tipo — segmented control */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Tipo
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["simples", "empresa"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue("type", t, { shouldValidate: true })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      type === t
                        ? "border-sidebar-accent bg-sidebar-accent/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {t === "simples" ? <Truck size={16} /> : <Building2 size={16} />}
                    {t === "simples" ? "Simples" : "Empresa"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {isEmpresa
                  ? "Transportadora com dados completos — Braspress, Correios, empresa de ônibus etc."
                  : "Só o nome — Retirada na empresa, Táxi, Entrega própria etc."}
              </p>
            </div>

            {/* Nome — sempre visível */}
            <FormInput
              id="name"
              label="Nome"
              type="text"
              placeholder={isEmpresa ? "Braspress Transportes" : "Retirada na empresa"}
              error={errors.name?.message}
              {...register("name")}
            />

            {/* Campos exclusivos do tipo "empresa" */}
            {isEmpresa && (
              <>
                {/* Identificação */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Identificação
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    id="cnpj"
                    label="CNPJ"
                    type="text"
                    placeholder="00.000.000/0000-00"
                    error={errors.cnpj?.message}
                    {...register("cnpj", {
                      onChange: (e) => setValue("cnpj", maskCnpj(e.target.value)),
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Endereço
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormInput
                      id="street"
                      label="Logradouro"
                      type="text"
                      placeholder="Rua, Av., Rodovia..."
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
                    placeholder="Galpão, Setor..."
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
                      onChange: (e) => setValue("zipCode", maskZip(e.target.value)),
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
                  </div>
                </div>

                {/* Contato */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
                      onChange: (e) => setValue("phone", maskPhone(e.target.value)),
                    })}
                  />
                  <FormInput
                    id="email"
                    label="E-mail"
                    type="email"
                    placeholder="contato@transportadora.com"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <div className="md:col-span-2">
                    <FormInput
                      id="trackingUrl"
                      label="URL de rastreio"
                      type="url"
                      placeholder="https://www.transportadora.com.br/rastreio"
                      error={errors.trackingUrl?.message}
                      {...register("trackingUrl")}
                    />
                  </div>
                </div>
              </>
            )}

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
