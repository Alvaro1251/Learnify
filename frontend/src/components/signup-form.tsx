"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import { authApi, profileApi, ApiError } from "@/lib/api"
import { useRouter } from "next/navigation"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "",
    career: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setCurrentStep(null)
    setIsLoading(true)

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Las contraseñas no coinciden")
      }

      // Step 1: Register user with email and password
      setCurrentStep("Creando cuenta...")
      await authApi.register({
        email: formData.email,
        password: formData.password,
      })

      // Step 2: Login to get a valid token (ensures user is fully created)
      setCurrentStep("Iniciando sesión...")
      const loginResponse = await authApi.login({
        email: formData.email,
        password: formData.password,
      })

      const token = loginResponse.access_token

      // Step 3: Update profile with additional information
      setCurrentStep("Completando perfil...")
      await profileApi.updateProfile(token, {
        full_name: formData.firstName,
        last_name: formData.lastName,
        university: formData.university,
        career: formData.career,
      })

      // Store token
      localStorage.setItem("auth_token", token)
      setCurrentStep(null)

      // Redirect to app
      router.push("/app")
    } catch (err) {
      setCurrentStep(null)
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ha ocurrido un error al crear la cuenta")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Completa el formulario a continuación para crear tu cuenta
          </p>
        </div>
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="firstName">Nombre</FieldLabel>
            <Input
              id="firstName"
              type="text"
              placeholder="Juan"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName">Apellido</FieldLabel>
            <Input
              id="lastName"
              type="text"
              placeholder="Pérez"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="usuario@ejemplo.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          <FieldDescription>
            Lo usaremos para contactarte. No compartiremos tu correo electrónico con nadie más.
          </FieldDescription>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <FieldDescription>
              Debe tener al menos 8 caracteres.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirmar contraseña</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <FieldDescription>Por favor, confirma tu contraseña.</FieldDescription>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="university">Universidad</FieldLabel>
            <Input
              id="university"
              type="text"
              placeholder="Tu universidad"
              value={formData.university}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="career">Carrera</FieldLabel>
            <Input
              id="career"
              type="text"
              placeholder="Tu carrera"
              value={formData.career}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </Field>
        </div>
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (currentStep || "Creando cuenta...") : "Crear cuenta"}
          </Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="underline hover:no-underline">
              Inicia sesión
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
