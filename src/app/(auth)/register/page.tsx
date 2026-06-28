"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { FormInput } from "@/components/form-input"

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Mínimo de 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type RegisterData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterData) {
    setIsLoading(true)
    // TODO: validar token e criar conta via API após configurar as tabelas
    console.log("register:", { ...data, token })
    setIsLoading(false)
  }

  // Convite inválido — sem token na URL
  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">
          Convite inválido
        </h1>
        <p className="text-muted-foreground text-sm">
          Este link de cadastro é inválido ou expirou. Solicite um novo convite
          ao administrador da sua empresa.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Criar conta</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Preencha os dados para acessar o sistema
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormInput
          id="name"
          label="Nome completo"
          type="text"
          placeholder="Seu nome"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />

        <FormInput
          id="email"
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <FormInput
          id="password"
          label="Senha"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register("password")}
        />

        <FormInput
          id="confirmPassword"
          label="Confirmar senha"
          type={showConfirm ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register("confirmPassword")}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 mt-1 bg-accent text-accent-foreground font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-progress"
        >
          {isLoading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
    </div>
  )
}
