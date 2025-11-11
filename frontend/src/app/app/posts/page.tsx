"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, NotebookPen, RefreshCw, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"

import { postsApi, Post, PostsPaginatedResponse } from "@/lib/api"
import { CreatePostDialog } from "@/components/create-post-dialog"
import { PostsList } from "@/components/posts-list"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface FiltersState {
  search: string
  subject: string
}

const DEFAULT_FILTERS: FiltersState = {
  search: "",
  subject: "",
}

const POSTS_PER_PAGE = 2

export default function PostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState("") // Input local para debounce
  const [subjectInput, setSubjectInput] = useState("") // Input local para debounce
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    total_pages: 0,
  })
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search.trim().length > 0) count += 1
    if (filters.subject.trim().length > 0) count += 1
    return count
  }, [filters])

  const loadPosts = useCallback(async (page: number = 1, search?: string, subject?: string) => {
    setIsLoading(true)
    try {
      const response: PostsPaginatedResponse = await postsApi.getLatestPosts({
        page,
        limit: POSTS_PER_PAGE,
        search: search?.trim() || undefined,
        subject: subject?.trim() || undefined,
      })
      
      setPosts(response.posts)
      setPagination({
        page: response.page,
        total: response.total,
        total_pages: response.total_pages,
      })
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce para la búsqueda
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }))
    }, 500) // Espera 500ms después de que el usuario deje de escribir

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchInput])

  // Debounce para el filtro de materia
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, subject: subjectInput }))
    }, 500)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [subjectInput])

  // Cargar posts cuando cambian los filtros o la página
  useEffect(() => {
    loadPosts(1, filters.search, filters.subject)
  }, [filters.search, filters.subject, loadPosts])

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    if (pagination.page !== 1) {
      loadPosts(1, filters.search, filters.subject)
    }
  }, [filters.search, filters.subject])

  const loadMyPosts = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setMyPosts([])
        return
      }
      const data = await postsApi.getMyPosts(token)
      setMyPosts(data)
    } catch (error) {
      console.error("Error loading my posts:", error)
    }
  }

  const refreshAll = async () => {
    await Promise.all([loadPosts(pagination.page, filters.search, filters.subject), loadMyPosts()])
  }

  useEffect(() => {
    loadPosts()
    loadMyPosts()
  }, [])

  const handlePostCreated = () => {
    refreshAll()
    router.push("/app/posts")
  }

  const handleSubjectClick = (subject: string) => {
    setSubjectInput(subject)
    setFilters((prev) => ({
      ...prev,
      subject,
    }))
  }

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSearchInput("")
    setSubjectInput("")
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      loadPosts(newPage, filters.search, filters.subject)
    }
  }

  // Calcular estadísticas basadas en todos los posts (necesitaríamos cargar todos para esto, pero por ahora usamos los cargados)
  const highlightPost = useMemo(() => {
    if (posts.length === 0) return null
    const [first] = posts
    const createdAt = new Date(first.creation_date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    return `${first.title} · ${createdAt}`
  }, [posts])

  const topSubject = useMemo(() => {
    if (posts.length === 0) return null
    const subjectCount = posts.reduce<Record<string, number>>((acc, post) => {
      const key = post.subject.toLowerCase()
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    const [topEntry] = Object.entries(subjectCount).sort((a, b) => b[1] - a[1])
    if (!topEntry) return null
    const [subjectKey, count] = topEntry
    const subjectLabel =
      posts.find((post) => post.subject.toLowerCase() === subjectKey)?.subject ??
      subjectKey
    return { subject: subjectLabel, count }
  }, [posts])

  return (
    <main className="container mx-auto space-y-10 py-12">
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Comunidad Learnify
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              Publicaciones y respuestas
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Compartí tus dudas, descubrí soluciones de otros estudiantes y mantené conversaciones enfocadas en tus materias.
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
            <CreatePostDialog onPostCreated={handlePostCreated} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-primary/20 bg-primary/5">
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <NotebookPen className="h-4 w-4 text-primary" />
                Conversaciones activas
              </CardTitle>
              <CardDescription>
                Cantidad de publicaciones disponibles actualmente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold text-primary">
                {pagination.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeFiltersCount > 0
                  ? `Filtrando entre ${pagination.total} publicaciones`
                  : "Total de publicaciones disponibles"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Tus aportes
              </CardTitle>
              <CardDescription>
                Resumen de las publicaciones que compartiste.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold">
                {myPosts.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Volvé seguido para responder nuevas consultas y seguir la conversación.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Tendencias
              </CardTitle>
              <CardDescription>
                Tema más recurrente en las últimas publicaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-foreground">
                {topSubject
                  ? `${topSubject.subject} · ${topSubject.count} debate${topSubject.count === 1 ? "" : "s"}`
                  : "Sin tendencias por el momento"}
              </div>
              <p className="text-xs text-muted-foreground">
                {highlightPost ?? "Compartí tu duda para iniciar una nueva conversación."}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border border-border/70">
        <CardHeader className="gap-4 border-b pb-6">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">
              Encontrá el hilo correcto para participar
            </CardTitle>
            <CardDescription>
              Buscá por materia o palabras clave para sumarte a la conversación que necesitás.
            </CardDescription>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Buscar palabras clave
              </label>
              <Input
                placeholder="conceptos, dudas, títulos..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Filtrar por materia
              </label>
              <Input
                placeholder="Programación, Álgebra, Física..."
                value={subjectInput}
                onChange={(event) => setSubjectInput(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {activeFiltersCount > 0 ? (
                <span>
                  {activeFiltersCount} {activeFiltersCount === 1 ? "filtro" : "filtros"} aplicados
                </span>
              ) : (
                <span>Sin filtros aplicados</span>
              )}
              {filters.subject.trim().length > 0 && (
                <Badge variant="secondary">#{filters.subject.trim()}</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                disabled={
                  filters.search === "" &&
                  filters.subject === ""
                }
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Mostrando {posts.length} de {pagination.total} publicaciones
                {pagination.total_pages > 1 && (
                  <span> (Página {pagination.page} de {pagination.total_pages})</span>
                )}
              </div>
              <PostsList
                posts={posts}
                isLoading={isLoading}
                onSubjectClick={handleSubjectClick}
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
        </CardContent>
      </Card>
    </main>
  )
}
