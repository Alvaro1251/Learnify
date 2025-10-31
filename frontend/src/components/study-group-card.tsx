"use client"

import Link from "next/link"
import { ArrowRight, Calendar, FileText, MessageSquare, Users } from "lucide-react"

import { StudyGroup } from "@/lib/api"
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
import { Separator } from "@/components/ui/separator"

interface StudyGroupCardProps {
  group: StudyGroup
  isMember?: boolean
}

export function StudyGroupCard({ group, isMember = false }: StudyGroupCardProps) {
  const groupId = group.id || group._id

  const createdAt = new Date(group.created_at).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const examDate = group.exam_date
    ? new Date(group.exam_date).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  const membersCount = group.members_count ?? group.members?.length ?? 0
  const filesCount = group.files_count ?? group.files?.length ?? 0
  const messagesCount = group.messages_count ?? group.chat?.length ?? 0

  const membershipLabel = isMember ? "Miembro activo" : group.is_public ? "Disponible" : "Solicitar acceso"
  const membershipVariant = isMember ? "default" : "secondary"

  return (
    <Card className="h-full border border-border/70 transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={membershipVariant} className="text-xs font-semibold">
            {membershipLabel}
          </Badge>
          <Badge
            variant={group.is_public ? "outline" : "secondary"}
            className="text-xs"
          >
            {group.is_public ? "Pública" : "Privada"}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 text-lg font-semibold">
          {group.name}
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs">
          Creado {createdAt}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {group.description}
        </p>

        {examDate && (
          <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="text-xs uppercase text-muted-foreground">
                Próximo examen
              </p>
              <p className="font-medium text-primary">{examDate}</p>
            </div>
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold">{membersCount}</p>
              <p className="text-xs text-muted-foreground">
                {membersCount === 1 ? "Miembro" : "Miembros"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold">{filesCount}</p>
              <p className="text-xs text-muted-foreground">
                {filesCount === 1 ? "Archivo" : "Archivos"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-semibold">{messagesCount}</p>
              <p className="text-xs text-muted-foreground">
                {messagesCount === 1 ? "Mensaje" : "Mensajes"}
              </p>
            </div>
          </div>
          {!examDate && (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-muted px-3 py-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <div>
                <p className="font-semibold">Sin fecha</p>
                <p className="text-xs">Aún no se fijó examen</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button
          asChild
          variant={isMember ? "default" : "secondary"}
          className="w-full justify-between"
        >
          <Link href={`/app/study-groups/${groupId}`} className="flex w-full items-center justify-between gap-2">
            <span>{isMember ? "Entrar al grupo" : "Ver detalles"}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
