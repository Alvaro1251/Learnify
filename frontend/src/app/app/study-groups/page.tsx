"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw, Users, CalendarClock, Globe } from "lucide-react"

import { studyGroupsApi, StudyGroup } from "@/lib/api"
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

export default function StudyGroupsPage() {
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([])
  const [publicGroups, setPublicGroups] = useState<StudyGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadGroups = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("auth_token")

      const publicData = await studyGroupsApi.getPublicStudyGroups()
      let myGroupsData: StudyGroup[] = []

      if (token) {
        myGroupsData = await studyGroupsApi.getMyStudyGroups(token)
      }

      setPublicGroups(publicData)
      setMyGroups(myGroupsData)
    } catch (error) {
      console.error("Error loading study groups:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const { discoverGroups, privateGroupCount, upcomingExamCount, nextExamLabel } = useMemo(() => {
    const discover = publicGroups.filter(
      (publicGroup) =>
        !myGroups.some(
          (myGroup) =>
            (myGroup.id || myGroup._id) === (publicGroup.id || publicGroup._id)
        )
    )

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
      discoverGroups: discover,
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
  }, [myGroups, publicGroups])

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
                {discoverGroups.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {discoverGroups.length === 0
                  ? "Ningún grupo por ahora"
                  : "Explorá la pestaña descubrir para sumarte"}
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

      <Tabs defaultValue="my-groups" className="w-full">
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
                    {myGroups.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="discover"
                  className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:shadow hover:bg-background/80 hover:text-foreground hover:shadow-sm"
                >
                  Descubrir
                  <span className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                    {discoverGroups.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="my-groups" className="mt-0">
              <StudyGroupsList
                groups={myGroups}
                isLoading={isLoading}
                isMember={true}
              />
            </TabsContent>
            <TabsContent value="discover" className="mt-0">
              <StudyGroupsList
                groups={discoverGroups}
                isLoading={isLoading}
                isMember={false}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </main>
  )
}
