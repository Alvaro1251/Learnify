"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Copy,
  Download,
  GraduationCap,
  Heart,
  Loader2,
  School,
  Share2,
  Tag,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { notesApi, Note, authApi, UserProfile } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

const formatDate = (value?: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string

  const [note, setNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [resolvedFileUrl, setResolvedFileUrl] = useState<string | null>(null)
  const [resolvedFileName, setResolvedFileName] = useState<string | undefined>(undefined)

  const loadNote = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      const data = await notesApi.getNoteDetails(noteId, token || undefined)
      setNote(data)
    } catch (error) {
      console.error("Error loading note:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return
      const user = await authApi.getCurrentUser(token)
      setCurrentUser(user)
    } catch (error) {
      console.error("Error loading current user:", error)
    }
  }

  useEffect(() => {
    loadNote()
    loadCurrentUser()
  }, [noteId])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!note?.file_url) {
      setResolvedFileUrl(null)
      setResolvedFileName(undefined)
      return
    }

    // Use file_name from note if available, otherwise try to extract from localStorage
    if (note.file_name) {
      setResolvedFileName(note.file_name)
    }

    if (note.file_url.startsWith("local-note://")) {
      const storageKey = note.file_url.replace("local-note://", "")
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { dataUrl?: string; name?: string }
          setResolvedFileUrl(parsed.dataUrl ?? null)
          // Only set from localStorage if file_name wasn't already set
          if (!note.file_name && parsed.name) {
            setResolvedFileName(parsed.name)
          }
        } catch {
          setResolvedFileUrl(null)
          if (!note.file_name) {
            setResolvedFileName(undefined)
          }
        }
      } else {
        setResolvedFileUrl(null)
        if (!note.file_name) {
          setResolvedFileName(undefined)
        }
      }
    } else {
      setResolvedFileUrl(note.file_url)
      // Try to extract filename from URL if file_name not set
      if (!note.file_name) {
        try {
          const url = new URL(note.file_url)
          const pathParts = url.pathname.split("/")
          const filename = pathParts[pathParts.length - 1]
          setResolvedFileName(filename || undefined)
        } catch {
          setResolvedFileName(undefined)
        }
      }
    }
  }, [note])

  const currentUserDisplayName = useMemo(() => {
    if (!currentUser) return ""
    const composed = `${currentUser.full_name ?? ""} ${currentUser.last_name ?? ""}`.trim()
    return composed.length > 0 ? composed : currentUser.email
  }, [currentUser])

  const isOwner = useMemo(() => {
    if (!note || !currentUserDisplayName) return false
    return note.owner.trim().toLowerCase() === currentUserDisplayName.trim().toLowerCase()
  }, [note, currentUserDisplayName])

  const handleDelete = async () => {
    if (!note) return
    if (!window.confirm("¿Seguro que querés eliminar este apunte? Esta acción no se puede deshacer.")) {
      return
    }

    setIsDeleting(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }
      await notesApi.deleteNote(token, note.id || note._id || noteId)
      router.push("/app/notes")
    } catch (error) {
      console.error("Error deleting note:", error)
      setIsDeleting(false)
    }
  }

  const handleOpenFile = () => {
    if (!resolvedFileUrl) return
    const newWindow = window.open(resolvedFileUrl, "_blank", "noopener,noreferrer")
    if (!newWindow) {
      window.location.href = resolvedFileUrl
    }
  }

  const handleShareLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/app/notes/${noteId}`
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Enlace copiado al portapapeles")
    } catch (clipError) {
      toast.error("No se pudo copiar el enlace")
    }
  }

  const handleToggleLike = async () => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión para dar like")
      return
    }

    setIsLiking(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }
      const updatedNote = await notesApi.toggleLike(token, noteId)
      console.log("Updated note after like:", updatedNote)
      if (updatedNote) {
        setNote(updatedNote)
        toast.success("Like actualizado")
      } else {
        // Si no hay respuesta, recargar la nota
        await loadNote()
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      toast.error("No se pudo actualizar el like")
      // Recargar la nota en caso de error
      await loadNote()
    } finally {
      setIsLiking(false)
    }
  }

  if (isLoading) {
    return (
      <main className="container mx-auto py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-9 w-32" />
          <Card>
            <CardHeader className="space-y-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (!note) {
    return (
      <main className="container mx-auto py-12">
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <Card className="border border-destructive/30 bg-destructive/10">
            <CardHeader className="gap-3">
              <CardTitle className="text-2xl font-semibold text-destructive">
                Nota no encontrada
              </CardTitle>
              <CardDescription>
                Es posible que el enlace haya expirado o que la nota haya sido eliminada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/app/notes">Volver a notas</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const createdAt = formatDate(note.created_at)
  const updatedAt = formatDate(note.updated_at)
  const safeTags = Array.isArray(note.tags) ? note.tags : []
  const infoRows = [
    {
      label: "Materia",
      icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
      value: note.subject,
    },
    {
      label: "Universidad",
      icon: <School className="h-4 w-4 text-muted-foreground" />,
      value: note.university,
    },
    {
      label: "Carrera",
      icon: <GraduationCap className="h-4 w-4 text-muted-foreground" />,
      value: note.career,
    },
  ]

  return (
    <main className="container mx-auto py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-1 w-max gap-2"
        >
          <Link href="/app/notes">
            <ArrowLeft className="h-4 w-4" />
            Volver a notas
          </Link>
        </Button>

        <Card className="border border-border/70">
          <CardHeader className="border-b pb-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <Badge variant="secondary" className="w-max uppercase tracking-wide">
                  Apunte compartido
                </Badge>
                <CardTitle className="text-3xl font-bold leading-tight">
                  {note.title}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Subido por <span className="font-medium text-foreground">{note.owner}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground sm:text-sm">
                  {createdAt && (
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      <span>Publicado: {createdAt}</span>
                    </div>
                  )}
                  {updatedAt && (
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      <span>Actualizado: {updatedAt}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentUser && (
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={handleToggleLike}
                    disabled={isLiking}
                    className={`border border-border/60 gap-2 ${note?.user_liked ? "text-red-500" : ""}`}
                  >
                    <Heart className={`h-4 w-4 ${note?.user_liked ? "fill-current" : ""}`} />
                    <span>{note?.likes_count || 0}</span>
                    <span className="sr-only">Dar like</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="default"
                  onClick={handleOpenFile}
                  disabled={!resolvedFileUrl}
                  className="border border-border/60 gap-2"
                >
                  <Download className="h-4 w-4" />
                  {resolvedFileName && (
                    <span className="text-sm max-w-[150px] truncate" title={resolvedFileName}>
                      {resolvedFileName}
                    </span>
                  )}
                  <span className="sr-only">Descargar archivo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShareLink}
                  className="border border-border/60"
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copiar enlace</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/app/notes/${noteId}`
                    if (navigator.share && typeof navigator.share === "function") {
                      navigator
                        .share({ title: note.title, url: shareUrl })
                        .catch(() => {
                          toast.error("No se pudo compartir el enlace")
                        })
                    } else {
                      toast.info("Tu navegador no soporta la función compartir.")
                    }
                  }}
                  className="border border-border/60"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Compartir</span>
                </Button>
                {isOwner && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">Eliminar nota</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            <div className="grid gap-4 rounded-lg border border-muted/60 bg-muted/30 p-4 text-sm sm:grid-cols-2">
              {infoRows.map((row) => (
                <div key={row.label} className="grid grid-cols-[auto_1fr] items-start gap-3">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="flex items-center gap-2 text-foreground">
                    {row.icon}
                    {row.value && row.value.trim().length > 0 ? row.value : "-"}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-[auto_1fr] gap-3 sm:col-span-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Tags
                </span>
                <div className="flex flex-wrap gap-2">
                  {safeTags.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Sin etiquetas
                    </span>
                  ) : (
                    safeTags.map((tag) => (
                      <Badge key={`tag-${tag}`} variant="secondary">
                        #{tag}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground leading-relaxed">
              Recordá que los enlaces externos se abren en una pestaña nueva. Si el archivo sufre cambios, actualizá la nota subiendo una versión actualizada.
              {!resolvedFileUrl && (
                <span className="mt-2 block text-destructive">
                  No pudimos acceder al archivo almacenado de forma local.
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
