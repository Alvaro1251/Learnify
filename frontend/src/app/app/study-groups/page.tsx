"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { RefreshCw, Users, CalendarClock, Globe, ChevronLeft, ChevronRight } from "lucide-react"

import { studyGroupsApi, StudyGroup, StudyGroupsPaginatedResponse } from "@/lib/api"
import { CreateStudyGroupDialog } from "@/components/create-study-group-dialog"
import { StudyGroupsList } from "@/components/study-groups-list"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const GROUPS_PER_PAGE = 2

export default function StudyGroupsPage() {
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([])
  const [publicGroups, setPublicGroups] = useState<StudyGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [publicPagination, setPublicPagination] = useState({
    page: 1,
    total: 0,
    total_pages: 0,
  })
  const [myGroupsPagination, setMyGroupsPagination] = useState({
    page: 1,
    total: 0,
    total_pages: 0,
  })
  const [activeTab, setActiveTab] = useState<"my-groups" | "discover">("my-groups")

  const loadPublicGroups = useCallback(async (page: number = 1) => {
    try {
      const token = localStorage.getItem("auth_token")

      const publicResponse: StudyGroupsPaginatedResponse = await studyGroupsApi.getPublicStudyGroups({
        page,
        limit: GROUPS_PER_PAGE,
      }, token || undefined)

      setPublicGroups(publicResponse.groups)
      setPublicPagination({
        page: publicResponse.page,
        total: publicResponse.total,
        total_pages: publicResponse.total_pages,
      })
    } catch (error) {
      console.error("Error loading public groups:", error)
    }
  }, [])

  const loadMyGroups = useCallback(async (page: number = 1) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setMyGroups([])
        setMyGroupsPagination({ page: 1, total: 0, total_pages: 0 })
        return
      }

      const myGroupsResponse: StudyGroupsPaginatedResponse = await studyGroupsApi.getMyStudyGroups(token, {
        page,
        limit: GROUPS_PER_PAGE,
      })

      setMyGroups(myGroupsResponse.groups)
      setMyGroupsPagination({
        page: myGroupsResponse.page,
        total: myGroupsResponse.total,
        total_pages: myGroupsResponse.total_pages,
      })
    } catch (error) {
      console.error("Error loading my groups:", error)
    }
  }, [])

  const loadGroups = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([loadPublicGroups(1), loadMyGroups(1)])
    } catch (error) {
      console.error("Error loading groups:", error)
    } finally {
      setIsLoading(false)
    }
  }, [loadPublicGroups, loadMyGroups])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const handlePublicPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= publicPagination.total_pages) {
      loadPublicGroups(newPage)
    }
  }

  const handleMyGroupsPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= myGroupsPagination.total_pages) {
      loadMyGroups(newPage)
    }
  }

  const { privateGroupCount, upcomingExamCount, nextExamLabel } = useMemo(() => {
    const privateCount = myGroups.filter((group) => !group.is_public).length

    const now = new Date().getTime()
    const upcomingExamEntries = myGroups
      .map((group) => {
        if (!group.exam_date) return null
        const date = new Date(group.exam_date)
        if (Number.isNaN(date.getTime()) || date.getTime() < now) return null
        return { group, date }
      })
      .filter((entry): entry is { group: StudyGroup; date: Date } => Boolean(entry))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    const nextExam = upcomingExamEntries[0]

    return {
      privateGroupCount: privateCount,
      upcomingExamCount: upcomingExamEntries.length,
      nextExamLabel: nextExam
        ? new Intl.DateTimeFormat("es-ES", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(nextExam.date)
        : null,
    }
  }, [myGroups])

  return (
    <main className="container mx-auto space-y-10 py-12">
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Comunidad Learnify
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              Grupos de estudio
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Conecta con estudiantes que comparten tu objetivo, prepara exámenes juntos
              y mantente al día con los materiales que necesita tu cursada.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadGroups}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <CreateStudyGroupDialog onGroupCreated={loadGroups} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-primary/20 bg-primary/5">
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Users className="h-4 w-4 text-primary" />
                Mis grupos activos
              </CardTitle>
              <CardDescription>
                Grupos donde ya estás colaborando con otros estudiantes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold text-primary">
                {myGroups.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {privateGroupCount} {privateGroupCount === 1 ? "grupo privado" : "grupos privados"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Nuevos espacios por descubrir
              </CardTitle>
              <CardDescription>
                Grupos abiertos a los que podés unirte en segundos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold">
                {publicPagination.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {publicPagination.total === 0
                  ? "Ningún grupo por ahora"
                  : "Grupos públicos disponibles para descubrir"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Preparación para exámenes
              </CardTitle>
              <CardDescription>
                Mantené a tu equipo alineado con las próximas evaluaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold">
                {upcomingExamCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {nextExamLabel ? `Próximo examen: ${nextExamLabel}` : "Sin exámenes agendados"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "my-groups" | "discover")} className="w-full">
        <Card className="border border-border/70">
          <CardHeader className="gap-4 border-b pb-6">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold">
                Organizá tus espacios de estudio
              </CardTitle>
              <CardDescription>
                Alterná entre tus grupos y los públicos disponibles en la comunidad.
              </CardDescription>
            </div>
            <CardAction className="justify-self-start">
              <TabsList className="grid w-full grid-cols-2 gap-2 rounded-lg bg-muted/50 p-1 sm:w-auto sm:grid-cols-2">
                <TabsTrigger
                  value="my-groups"
                  className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:shadow hover:bg-background/80 hover:text-foreground hover:shadow-sm"
                >
                  Mis grupos
                  <span className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                    {myGroupsPagination.total}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="discover"
                  className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:shadow hover:bg-background/80 hover:text-foreground hover:shadow-sm"
                >
                  Descubrir
                  <span className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                    {publicPagination.total}
                  </span>
                </TabsTrigger>
              </TabsList>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="my-groups" className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      Mostrando {myGroups.length} de {myGroupsPagination.total} grupos
                      {myGroupsPagination.total_pages > 1 && (
                        <span> (Página {myGroupsPagination.page} de {myGroupsPagination.total_pages})</span>
                      )}
                    </div>
                    <StudyGroupsList
                      groups={myGroups}
                      isLoading={isLoading}
                      isMember={true}
                    />
                    
                    {/* Paginación Mis grupos */}
                    {myGroupsPagination.total_pages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-6 mt-6 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMyGroupsPageChange(myGroupsPagination.page - 1)}
                          disabled={myGroupsPagination.page === 1 || isLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground px-4">
                          Página {myGroupsPagination.page} de {myGroupsPagination.total_pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMyGroupsPageChange(myGroupsPagination.page + 1)}
                          disabled={myGroupsPagination.page === myGroupsPagination.total_pages || isLoading}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              <TabsContent value="discover" className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      Mostrando {publicGroups.length} de {publicPagination.total} grupos públicos
                      {publicPagination.total_pages > 1 && (
                        <span> (Página {publicPagination.page} de {publicPagination.total_pages})</span>
                      )}
                    </div>
                    <StudyGroupsList
                      groups={publicGroups}
                      isLoading={isLoading}
                      isMember={false}
                    />
                    
                    {/* Paginación Descubrir */}
                    {publicPagination.total_pages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-6 mt-6 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublicPageChange(publicPagination.page - 1)}
                          disabled={publicPagination.page === 1 || isLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground px-4">
                          Página {publicPagination.page} de {publicPagination.total_pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublicPageChange(publicPagination.page + 1)}
                          disabled={publicPagination.page === publicPagination.total_pages || isLoading}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </main>
  )
}
