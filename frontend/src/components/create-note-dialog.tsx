"use client"

import { ChangeEvent, useMemo, useRef, useState } from "react"
import { notesApi, CreateNoteRequest, ApiError, Note } from "@/lib/api"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form as FormComponent } from "@/components/ui/form"
import { useForm } from "react-hook-form"

type CreateNoteFormValues = Omit<CreateNoteRequest, "tags" | "file_url"> & {
  tags: string
  file: File | null
}

interface CreateNoteDialogProps {
  onNoteCreated?: (note: Note) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateNoteDialog({
  onNoteCreated,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: CreateNoteDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<CreateNoteFormValues>({
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      university: "",
      career: "",
      tags: "",
      file: null,
    },
  })

  const tagsHelper = useMemo(
    () =>
      "Separá con comas: parciales, ejercicios, teoria",
    []
  )

  const onSubmit = async (data: CreateNoteFormValues) => {
    setError(null)
    setIsLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const file = data.file
      if (!file) {
        form.setError("file", { message: "Debes adjuntar un archivo" })
        throw new Error("Debes adjuntar un archivo")
      }

      const fileUrl = await storeFileInLocalStorage(file)

      const payload: CreateNoteRequest = {
        title: data.title,
        description: data.description,
        subject: data.subject,
        university: data.university,
        career: data.career,
        tags: data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        file_url: fileUrl,
      }

      const createdNote = await notesApi.createNote(token, payload)
      form.reset({
        title: "",
        description: "",
        subject: "",
        university: "",
        career: "",
        tags: "",
        file: null,
      })
      setSelectedFileName("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setOpen(false)
      onNoteCreated?.(createdNote)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Error al crear la nota")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const storeFileInLocalStorage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const storageKey = `note-files/${Date.now()}-${file.name}`
          const payload = {
            name: file.name,
            type: file.type,
            size: file.size,
            createdAt: new Date().toISOString(),
            dataUrl: reader.result as string,
          }
          localStorage.setItem(storageKey, JSON.stringify(payload))
          resolve(`local-note://${storageKey}`)
        } catch (storageError) {
          reject(storageError)
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    onChange: (value: File | null) => void
  ) => {
    const file = event.target.files?.[0] ?? null

    if (!file) {
      setSelectedFileName("")
      onChange(null)
      return
    }

    const allowedExtensions = [
      "pdf",
      "doc",
      "docx",
      "jpg",
      "jpeg",
      "png",
      "xlsx",
      "xls",
      "csv",
    ]

    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!extension || !allowedExtensions.includes(extension)) {
      setError("Formato de archivo no soportado.")
      form.setError("file", { message: "Formato de archivo no soportado" })
      onChange(null)
      event.target.value = ""
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError("El archivo supera el límite de 10MB.")
      form.setError("file", { message: "El archivo supera el límite de 10MB" })
      onChange(null)
      event.target.value = ""
      return
    }

    setError(null)
    setSelectedFileName(file.name)
    form.clearErrors("file")
    onChange(file)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>+ Subir nota</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Compartir nuevo apunte</DialogTitle>
          <DialogDescription>
            Publicá tus apuntes para que otros estudiantes puedan aprovecharlos.
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
                minLength: { value: 4, message: "Mínimo 4 caracteres" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Resumen Unidad 2 - Álgebra"
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
                      placeholder="Contanos qué cubre esta nota, consejos de uso o contenidos específicos..."
                      rows={4}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="subject"
                rules={{
                  required: "La materia es requerida",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materia</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Programación, Álgebra, Estadística..."
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
                name="university"
                rules={{
                  required: "La universidad es requerida",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Universidad</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="UBA, UNLP, ITBA..."
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="career"
              rules={{
                required: "La carrera es requerida",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrera</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingeniería Informática, Medicina..."
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
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tagsHelper}
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
              name="file"
              rules={{
                required: "Debes adjuntar un archivo",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Archivo</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                          ref={(node) => {
                            fileInputRef.current = node
                            field.ref(node)
                          }}
                          onChange={(event) => handleFileChange(event, field.onChange)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading}
                        >
                          Seleccionar archivo
                        </Button>
                        {selectedFileName && (
                          <span className="max-w-[220px] truncate text-sm text-muted-foreground">
                            {selectedFileName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Formatos permitidos: PDF, DOC, DOCX, JPG, JPEG, PNG, XLSX, XLS, CSV (máx. 10MB)
                      </p>
                    </div>
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
                {isLoading ? "Publicando..." : "Publicar nota"}
              </Button>
            </div>
          </form>
        </FormComponent>
      </DialogContent>
    </Dialog>
  )
}
