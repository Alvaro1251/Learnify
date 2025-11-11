"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { Filter, Layers3, NotebookPen, RefreshCw, Tag, ChevronLeft, ChevronRight } from "lucide-react"

import {
  Note,
  notesApi,
  NotesFilters,
  NotesPaginatedResponse,
} from "@/lib/api"
import { CreateNoteDialog } from "@/components/create-note-dialog"
import { NotesList } from "@/components/notes-list"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FiltersState {
  university: string
  career: string
  subject: string
  tags: string
}

const DEFAULT_FILTERS: FiltersState = {
  university: "",
  career: "",
  subject: "",
  tags: "",
}

const NOTES_PER_PAGE = 2

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [myNotes, setMyNotes] = useState<Note[]>([])
  const [latestNotes, setLatestNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMyNotesLoading, setIsMyNotesLoading] = useState(true)
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState<"recent" | "liked" | "oldest">("recent")
  const [activeTab, setActiveTab] = useState<"explore" | "mine">("explore")
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    total_pages: 0,
  })
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const parsedFilters = useMemo<NotesFilters>(() => {
    const result: NotesFilters = {}
    if (filters.university.trim().length > 0) {
      result.university = filters.university.trim()
    }
    if (filters.career.trim().length > 0) {
      result.career = filters.career.trim()
    }
    if (filters.subject.trim().length > 0) {
      result.subject = filters.subject.trim()
    }
    const tags = filters.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
    if (tags.length > 0) {
      result.tags = tags
    }
    result.sort_by = sortBy
    return result
  }, [filters, sortBy])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.university.trim().length > 0) count += 1
    if (filters.career.trim().length > 0) count += 1
    if (filters.subject.trim().length > 0) count += 1
    if (filters.tags.trim().length > 0) count += 1
    return count
  }, [filters])

  const loadNotes = useCallback(async (page: number = 1) => {
    setIsLoading(true)
    try {
      const response: NotesPaginatedResponse = await notesApi.searchNotes({
        ...parsedFilters,
        page,
        limit: NOTES_PER_PAGE,
      })
      setNotes(response.notes)
      setPagination({
        page: response.page,
        total: response.total,
        total_pages: response.total_pages,
      })
    } catch (error) {
      console.error("Error loading notes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [parsedFilters])

  // Debounce para los filtros
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      loadNotes(1)
    }, 500) // Espera 500ms después de que el usuario deje de cambiar filtros

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [parsedFilters, loadNotes])

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    if (pagination.page !== 1) {
      loadNotes(1)
    }
  }, [parsedFilters])

  const loadMyNotes = async () => {
    setIsMyNotesLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setMyNotes([])
        return
      }
      const data = await notesApi.getMyNotes(token)
      setMyNotes(data)
    } catch (error: any) {
      console.error("Error loading my notes:", error)
      // Si es 401, el token es inválido - limpiar y mostrar lista vacía
      if (error?.status === 401) {
        localStorage.removeItem("auth_token")
        setMyNotes([])
      }
    } finally {
      setIsMyNotesLoading(false)
    }
  }

  const loadLatestNotes = async () => {
    try {
      const data = await notesApi.getLatestNotes()
      setLatestNotes(data)
    } catch (error) {
      console.error("Error loading latest notes:", error)
    }
  }

  const refreshAll = async () => {
    await Promise.all([loadNotes(pagination.page), loadMyNotes(), loadLatestNotes()])
  }

  useEffect(() => {
    loadNotes(1)
    loadMyNotes()
    loadLatestNotes()
  }, [])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      loadNotes(newPage)
    }
  }

  const handleTagClick = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: tag,
    }))
    setActiveTab("explore")
  }

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const latestHighlight = useMemo(() => {
    const latest = latestNotes[0]
    if (!latest) return null
    const createdAt = new Date(latest.created_at).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    return `${latest.title} · ${createdAt}`
  }, [latestNotes])

  return (
    <main className="container mx-auto space-y-10 py-12">
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Biblioteca colaborativa
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              Apuntes compartidos
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Descubrí apuntes organizados por materia, universidad y carrera. Filtrá lo que necesitás y compartí tus propios materiales.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              className="gap-2"
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <CreateNoteDialog onNoteCreated={() => refreshAll()} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-primary/20 bg-primary/5">
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <NotebookPen className="h-4 w-4 text-primary" />
                Apuntes disponibles
              </CardTitle>
              <CardDescription>
                Resultados según los filtros aplicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold text-primary">
                {pagination.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeFiltersCount > 0
                  ? `${activeFiltersCount} ${activeFiltersCount === 1 ? "filtro" : "filtros"} activos`
                  : "Total de notas disponibles"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Layers3 className="h-4 w-4 text-muted-foreground" />
                Tus aportes
              </CardTitle>
              <CardDescription>
                Cantidad de apuntes que subiste a Learnify
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold">
                {myNotes.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Comparte más materiales para ayudar a la comunidad.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Últimos agregados
              </CardTitle>
              <CardDescription>
                Lo más nuevo que se sumó a la biblioteca colaborativa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-foreground">
                {latestHighlight ?? "Sin novedades recientes"}
              </div>
              <p className="text-xs text-muted-foreground">
                {latestNotes.length > 1
                  ? `+${latestNotes.length - 1} notas nuevas la última semana`
                  : "Mantenete atento a los nuevos aportes"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border border-border/70">
        <CardHeader className="gap-4 border-b pb-6">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">
              Filtrá y encontrá apuntes relevantes
            </CardTitle>
            <CardDescription>
              Combiná universidad, materia, carrera y etiquetas para encontrar el material que estás buscando.
            </CardDescription>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Universidad
              </label>
              <Input
                placeholder="ej. UBA, UTN, UNLP..."
                value={filters.university}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, university: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Carrera
              </label>
              <Input
                placeholder="Ingeniería, Medicina..."
                value={filters.career}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, career: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Materia
              </label>
              <Input
                placeholder="Programación, Álgebra..."
                value={filters.subject}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, subject: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tags
              </label>
              <Input
                placeholder="Separá con comas · ej. parciales, teorico, 2024"
                value={filters.tags}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, tags: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              {activeFiltersCount > 0 ? (
                <span>
                  {activeFiltersCount} {activeFiltersCount === 1 ? "filtro" : "filtros"} aplicados
                </span>
              ) : (
                <span>Sin filtros aplicados</span>
              )}
              {parsedFilters.tags && parsedFilters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {parsedFilters.tags.map((tag) => (
                    <Badge key={`active-tag-${tag}`} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Ordenar por:
                </label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as "recent" | "liked" | "oldest")}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Más recientes</SelectItem>
                    <SelectItem value="liked">Más valoradas</SelectItem>
                    <SelectItem value="oldest">Más antiguas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  disabled={
                    filters.university === "" &&
                    filters.career === "" &&
                    filters.subject === "" &&
                    filters.tags === ""
                  }
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "explore" | "mine")
            }
            className="w-full"
          >
            <CardAction className="mb-6 justify-self-start">
              <TabsList className="grid w-full grid-cols-2 gap-2 rounded-lg bg-muted/50 p-1 sm:w-auto sm:grid-cols-2">
                <TabsTrigger
                  value="explore"
                  className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:shadow hover:bg-background/80 hover:text-foreground hover:shadow-sm"
                >
                  Explorar
                  <span className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                    {notes.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="mine"
                  className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:shadow hover:bg-background/80 hover:text-foreground hover:shadow-sm"
                >
                  Mis notas
                  <span className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                    {myNotes.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </CardAction>

            <TabsContent value="explore" className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Mostrando {notes.length} de {pagination.total} notas
                    {pagination.total_pages > 1 && (
                      <span> (Página {pagination.page} de {pagination.total_pages})</span>
                    )}
                  </div>
                  <NotesList
                    notes={notes}
                    isLoading={isLoading}
                    emptyState={{
                      title: "No encontramos apuntes con esos filtros",
                      description:
                        "Probá ajustando los términos o combinando otras etiquetas.",
                      helper:
                        "Tip: cuanto más específicos sean los filtros, menos resultados vas a ver.",
                    }}
                    onTagClick={handleTagClick}
                  />
                  
                  {/* Paginación */}
                  {pagination.total_pages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-6 mt-6 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground px-4">
                        Página {pagination.page} de {pagination.total_pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.total_pages || isLoading}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            <TabsContent value="mine" className="mt-0">
              <NotesList
                notes={myNotes}
                isLoading={isMyNotesLoading}
                emptyState={{
                  title: "Todavía no subiste ningún apunte",
                  description:
                    "Compartí tus materiales para ayudar a tus compañeros y tenerlos respaldados.",
                  helper:
                    'Hacé clic en "Subir nota" para agregar tu primer material.',
                }}
                onTagClick={handleTagClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}
