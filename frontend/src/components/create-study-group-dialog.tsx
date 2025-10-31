"use client"

import { useState } from "react"
import { studyGroupsApi, CreateStudyGroupRequest, ApiError } from "@/lib/api"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { Form as FormComponent } from "@/components/ui/form"

interface CreateStudyGroupDialogProps {
  onGroupCreated: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateStudyGroupDialog({
  onGroupCreated,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: CreateStudyGroupDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateStudyGroupRequest>({
    defaultValues: {
      name: "",
      description: "",
      is_public: true,
      exam_date: "",
    },
  })

  const onSubmit = async (data: CreateStudyGroupRequest) => {
    setError(null)
    setIsLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      await studyGroupsApi.createStudyGroup(token, data)
      form.reset()
      setOpen(false)
      onGroupCreated()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Error creating study group")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>+ Crear grupo</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear nuevo grupo de estudio</DialogTitle>
          <DialogDescription>
            Forma un grupo de estudio para colaborar con otros estudiantes
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
              name="name"
              rules={{
                required: "El nombre es requerido",
                minLength: { value: 5, message: "Mínimo 5 caracteres" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del grupo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ej. Advanced Python 2024"
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
                      placeholder="Describe el propósito del grupo y temas de estudio..."
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
              name="is_public"
              rules={{
                required: "Selecciona el tipo de grupo",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de grupo</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "true")}
                    defaultValue={field.value ? "true" : "false"}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de grupo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">
                        Público (Cualquiera puede unirse)
                      </SelectItem>
                      <SelectItem value="false">
                        Privado (Requiere aprobación)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exam_date"
              rules={{
                required: "La fecha de examen es requerida",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de examen</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
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
                {isLoading ? "Creando..." : "Crear grupo"}
              </Button>
            </div>
          </form>
        </FormComponent>
      </DialogContent>
    </Dialog>
  )
}
