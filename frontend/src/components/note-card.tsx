"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  School,
  Clock,
  Tags,
  Link as LinkIcon,
  Download,
  Share2,
  Heart,
} from "lucide-react"

import { Note } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface NoteCardProps {
  note: Note
  onTagClick?: (tag: string) => void
}

interface InfoRowProps {
  label: string
  icon: React.ReactNode
  value?: string | null
}

function InfoRow({ label, icon, value }: InfoRowProps) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-start gap-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center gap-2 text-sm text-foreground">
        {icon}
        {value && value.trim().length > 0 ? value : "-"}
      </span>
    </div>
  )
}

export function NoteCard({ note, onTagClick }: NoteCardProps) {
  const noteId = note.id || note._id
  const createdAt = new Date(note.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const safeTags = Array.isArray(note.tags) ? note.tags : []
  const [resolvedFileUrl, setResolvedFileUrl] = useState<string | null>(null)
  const [resolvedFileName, setResolvedFileName] = useState<string | undefined>(undefined)
  const [isCopying, setIsCopying] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!note.file_url) {
      setResolvedFileUrl(null)
      return
    }

    if (note.file_url.startsWith("local-note://")) {
      const storageKey = note.file_url.replace("local-note://", "")
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { dataUrl?: string; name?: string }
          setResolvedFileUrl(parsed.dataUrl ?? null)
          setResolvedFileName(parsed.name)
        } catch {
          setResolvedFileUrl(null)
        }
      } else {
        setResolvedFileUrl(null)
      }
    } else {
      setResolvedFileUrl(note.file_url)
    }
  }, [note.file_url])

  const handleOpenFile = () => {
    if (!resolvedFileUrl) return
    const newWindow = window.open(resolvedFileUrl, "_blank", "noopener,noreferrer")
    if (!newWindow) {
      window.location.href = resolvedFileUrl
    }
  }

  const handleCopyLink = async () => {
    try {
      setIsCopying(true)
      const shareUrl = `${window.location.origin}/app/notes/${noteId}`
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Enlace copiado al portapapeles")
    } catch (clipError) {
      toast.error("No se pudo copiar el enlace")
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <Card className="h-full border border-border/70 transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader className="gap-3 pb-0">
        <div className="flex flex-col gap-2">
          <CardTitle className="line-clamp-2 text-lg font-semibold text-foreground">
            {note.title}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{note.owner}</span>
            <span className="text-muted-foreground/70">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {createdAt}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <div className="grid gap-4 rounded-lg border border-muted/60 bg-muted/30 p-4 text-sm sm:grid-cols-2">
          <InfoRow
            label="Materia"
            icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
            value={note.subject}
          />
          <InfoRow
            label="Universidad"
            icon={<School className="h-4 w-4 text-muted-foreground" />}
            value={note.university}
          />
          <InfoRow
            label="Carrera"
            icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />}
            value={note.career}
          />
          <div className="grid grid-cols-[auto_1fr] gap-3 sm:col-span-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Tags
            </span>
            <div className="flex flex-wrap gap-2">
              {safeTags.length === 0 ? (
                <span className="text-xs text-muted-foreground/80">
                  Sin etiquetas
                </span>
              ) : (
                safeTags.slice(0, 6).map((tag) => (
                  <Badge
                    key={`${noteId}-${tag}`}
                    variant="secondary"
                    className="cursor-pointer text-xs"
                    onClick={() => onTagClick?.(tag)}
                  >
                    #{tag}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1.5 text-xs text-muted-foreground">
            <Heart className="h-3.5 w-3.5" />
            <span>{note.likes_count || 0}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenFile}
            disabled={!resolvedFileUrl}
            className="border border-border/60"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">
              {resolvedFileName ? `Descargar ${resolvedFileName}` : "Descargar archivo"}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyLink}
            disabled={isCopying}
            className="border border-border/60"
          >
            <LinkIcon className="h-4 w-4" />
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
        </div>

        <Button
          asChild
          variant="default"
          className="w-full justify-between sm:w-auto sm:justify-center"
        >
          <Link href={`/app/notes/${noteId}`} className="flex items-center gap-2">
            Ver detalles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
