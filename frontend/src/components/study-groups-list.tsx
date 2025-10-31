"use client"

import { StudyGroup } from "@/lib/api"

import { StudyGroupCard } from "@/components/study-group-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StudyGroupsListProps {
  groups: StudyGroup[]
  isLoading: boolean
  isMember?: boolean
}

export function StudyGroupsList({
  groups,
  isLoading,
  isMember = false,
}: StudyGroupsListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={`sg-skeleton-${index}`} className="h-full">
            <CardHeader className="gap-3">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <Card className="flex w-full flex-col items-center justify-center gap-4 border-2 border-dashed py-16 text-center">
        <CardHeader className="flex w-full flex-col items-center gap-2">
          <CardTitle className="text-xl font-semibold">
            {isMember ? "Todavía no te sumaste a ningún grupo" : "Aún no hay grupos disponibles"}
          </CardTitle>
          <CardDescription className="w-full">
            {isMember
              ? "Buscá grupos abiertos en la pestaña descubrir o creá uno nuevo para tu materia."
              : "Cuando alguien cree un grupo público lo vas a ver acá. También podés ser la primera persona en abrir la conversación."}
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full text-sm text-muted-foreground">
          {isMember
            ? "Consejo: elegí si querés que tu grupo sea público o privado cuando lo crees."
            : "Necesitás inspiración? Pensá en una materia o parcial próximo y sumá a tus compañeros."}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <StudyGroupCard
          key={group.id || group._id}
          group={group}
          isMember={isMember}
        />
      ))}
    </div>
  )
}
