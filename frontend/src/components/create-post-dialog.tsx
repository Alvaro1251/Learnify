"use client"

import { useState } from "react"
import { postsApi, CreatePostRequest, ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { Form as FormComponent } from "@/components/ui/form"

interface CreatePostDialogProps {
  onPostCreated: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreatePostDialog({
  onPostCreated,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: CreatePostDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreatePostRequest>({
    defaultValues: {
      title: "",
      description: "",
      subject: "",
    },
  })

  const onSubmit = async (data: CreatePostRequest) => {
    setError(null)
    setIsLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      await postsApi.createPost(token, data)
      form.reset()
      setOpen(false)
      onPostCreated()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Error creating post")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>+ Crear publicación</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear nueva publicación</DialogTitle>
          <DialogDescription>
            Comparte tu pregunta o conocimiento con la comunidad
          </DialogDescription>
        </DialogHeader>

        <FormComponent {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              rules={{
                required: "El título es requerido",
                minLength: { value: 5, message: "Mínimo 5 caracteres" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="¿Cuál es tu pregunta o idea?"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              rules={{
                required: "La descripción es requerida",
                minLength: { value: 10, message: "Mínimo 10 caracteres" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Proporciona más detalles sobre tu pregunta o idea..."
                      {...field}
                      disabled={isLoading}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              rules={{
                required: "La materia es requerida",
                minLength: { value: 2, message: "Mínimo 2 caracteres" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materia</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ej. Matemáticas, Programación, Física..."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear publicación"}
              </Button>
            </div>
          </form>
        </FormComponent>
      </DialogContent>
    </Dialog>
  )
}
