"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Building2, Cog, Bell, ImageIcon, Trash2 } from "lucide-react"
import { FormInput } from "@/components/form-input"

type Tab = "empresa" | "operacional" | "notificacoes"

const companySchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().optional(),
  stateRegistration: z.string().optional(),
  street: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, "Use a sigla do estado (ex: MG)").optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
})

type CompanyData = z.infer<typeof companySchema>

function maskCnpj(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18)
}

function maskZip(value: string) {
  return value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9)
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim()
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim()
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("empresa")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [removingLogo, setRemovingLogo] = useState(false)
  const [savingData, setSavingData] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CompanyData>({ resolver: zodResolver(companySchema) })

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then((data) => {
        reset({
          name: data.name ?? "",
          cnpj: data.cnpj ?? "",
          stateRegistration: data.stateRegistration ?? "",
          street: data.street ?? "",
          district: data.district ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          zip: data.zip ?? "",
          phone: data.phone ?? "",
          whatsapp: data.whatsapp ?? "",
        })
        setLogoUrl(data.logoUrl ?? null)
      })
  }, [reset])

  async function onSaveCompany(data: CompanyData) {
    setSavingData(true)
    const res = await fetch("/api/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success("Dados da empresa atualizados.")
    } else {
      const json = await res.json().catch(() => null)
      toast.error(json?.error ?? "Erro ao salvar dados.")
    }
    setSavingData(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const form = new FormData()
    form.append("logo", file)

    const res = await fetch("/api/company/logo", { method: "POST", body: form })

    if (res.ok) {
      const { logoUrl: newUrl } = await res.json()
      setLogoUrl(newUrl)
      toast.success("Logo atualizado.")
    } else {
      const json = await res.json().catch(() => null)
      toast.error(json?.error ?? "Erro ao enviar logo.")
    }

    setUploadingLogo(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleLogoRemove() {
    setRemovingLogo(true)
    const res = await fetch("/api/company/logo", { method: "DELETE" })

    if (res.ok) {
      setLogoUrl(null)
      toast.success("Logo removido.")
    } else {
      toast.error("Erro ao remover logo.")
    }
    setRemovingLogo(false)
  }

  const TABS = [
    { key: "empresa" as Tab, label: "Empresa", icon: Building2, active: true },
    { key: "operacional" as Tab, label: "Operacional", icon: Cog, active: false },
    { key: "notificacoes" as Tab, label: "Notificações", icon: Bell, active: false },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* Tab bar */}
      <div className="flex border-b border-border gap-1">
        {TABS.map(({ key, label, icon: Icon, active }) => (
          <button
            key={key}
            onClick={() => active && setActiveTab(key)}
            disabled={!active}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
              ${activeTab === key
                ? "border-accent text-accent"
                : active
                  ? "border-transparent text-muted-foreground hover:text-foreground"
                  : "border-transparent text-muted-foreground/40 cursor-not-allowed"
              }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Aba Empresa */}
      {activeTab === "empresa" && (
        <div className="flex flex-col gap-5 max-w-2xl mx-auto w-full">

          {/* Logo */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Logo da empresa</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aparece no documento de endereços gerado. Formatos aceitos: PNG, JPG.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo da empresa"
                    className="object-contain w-full h-full p-1"
                  />
                ) : (
                  <ImageIcon size={28} className="text-muted-foreground/40" />
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="h-10 px-4 bg-accent text-accent-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-progress"
                >
                  {uploadingLogo ? "Enviando..." : logoUrl ? "Alterar" : "Enviar logo"}
                </button>

                {logoUrl && (
                  <button
                    onClick={handleLogoRemove}
                    disabled={removingLogo}
                    className="flex items-center gap-1.5 h-10 px-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-70"
                  >
                    <Trash2 size={14} />
                    {removingLogo ? "Removendo..." : "Remover"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dados da empresa */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Dados da empresa</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Usados como remetente no documento de endereços gerado.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSaveCompany)} className="flex flex-col gap-4">
              <FormInput
                id="name"
                label="Nome da empresa"
                placeholder="Razão social"
                error={errors.name?.message}
                {...register("name")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  id="cnpj"
                  label="CNPJ"
                  placeholder="00.000.000/0001-00"
                  {...register("cnpj", {
                    onChange: (e) => setValue("cnpj", maskCnpj(e.target.value)),
                  })}
                />
                <FormInput
                  id="stateRegistration"
                  label="Inscrição Estadual"
                  placeholder="Ex: 062.052.884/0069"
                  {...register("stateRegistration")}
                />
              </div>

              <FormInput
                id="street"
                label="Endereço (rua e número)"
                placeholder="Rua Exemplo, 123"
                {...register("street")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput
                  id="district"
                  label="Bairro"
                  placeholder="Centro"
                  {...register("district")}
                />
                <FormInput
                  id="city"
                  label="Cidade"
                  placeholder="Montes Claros"
                  {...register("city")}
                />
                <FormInput
                  id="state"
                  label="Estado (UF)"
                  placeholder="MG"
                  maxLength={2}
                  className="uppercase"
                  {...register("state", {
                    onChange: (e) =>
                      setValue("state", e.target.value.toUpperCase()),
                  })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput
                  id="zip"
                  label="CEP"
                  placeholder="39401-036"
                  {...register("zip", {
                    onChange: (e) => setValue("zip", maskZip(e.target.value)),
                  })}
                />
                <FormInput
                  id="phone"
                  label="Telefone"
                  placeholder="(38) 3321-4705"
                  {...register("phone", {
                    onChange: (e) => setValue("phone", maskPhone(e.target.value)),
                  })}
                />
                <FormInput
                  id="whatsapp"
                  label="WhatsApp"
                  placeholder="(38) 9 9895-3646"
                  {...register("whatsapp", {
                    onChange: (e) => setValue("whatsapp", maskPhone(e.target.value)),
                  })}
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingData}
                  className="h-11 px-6 bg-accent text-accent-foreground font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-progress"
                >
                  {savingData ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* Abas sem conteúdo */}
      {(activeTab === "operacional" || activeTab === "notificacoes") && (
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
          Em breve
        </div>
      )}

    </div>
  )
}
