"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
import { FormInput } from "@/components/form-input"

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
})

type LoginData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginData) {
    setIsLoading(true)
    // TODO: implementar signIn com NextAuth após configurar as tabelas
    console.log("login:", data)
    setIsLoading(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Bem-vindo</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Digite suas credenciais para acessar o sistema
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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
          autoComplete="current-password"
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 mt-1 bg-accent text-accent-foreground font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-progress"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  )
}
