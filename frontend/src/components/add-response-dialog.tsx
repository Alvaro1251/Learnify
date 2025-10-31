"use client"

import { useState } from "react"
import { postsApi, AddResponseRequest, ApiError } from "@/lib/api"
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
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { Form as FormComponent } from "@/components/ui/form"

interface AddResponseDialogProps {
  postId: string
  onResponseAdded: () => void
}

export function AddResponseDialog({
  postId,
  onResponseAdded,
}: AddResponseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AddResponseRequest>({
    defaultValues: {
      content: "",
    },
  })

  const onSubmit = async (data: AddResponseRequest) => {
    setError(null)
    setIsLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      await postsApi.addResponse(token, postId, data)
      form.reset()
      setOpen(false)
      onResponseAdded()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Error adding response")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Agregar respuesta</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar respuesta</DialogTitle>
          <DialogDescription>
            Comparte tu respuesta o experiencia con la comunidad
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
              name="content"
              rules={{
                required: "La respuesta es requerida",
                minLength: { value: 5, message: "Mínimo 5 caracteres" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tu respuesta</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escribe tu respuesta aquí..."
                      {...field}
                      disabled={isLoading}
                      rows={5}
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
                {isLoading ? "Enviando..." : "Enviar respuesta"}
              </Button>
            </div>
          </form>
        </FormComponent>
      </DialogContent>
    </Dialog>
  )
}
