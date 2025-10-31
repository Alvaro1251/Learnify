"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Copy,
  Crown,
  Download,
  FileText,
  LogOut,
  MessageSquare,
  Share2,
  Users,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import { GroupChatWithInput } from "@/components/group-chat-with-input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudyGroup, authApi, studyGroupsApi, UserProfile, Note, notesApi } from "@/lib/api"
import { CreateNoteDialog } from "@/components/create-note-dialog"

const getInitials = (value: string) => {
  if (!value) return "?"
  const normalized = value.replace(/[^A-Za-z0-9\s]/g, " ").trim()
  const parts = normalized.split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return value.slice(0, 2).toUpperCase()
  }

  return parts
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const formatDateTime = (value?: string | null, includeTime: boolean = false) => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const options: Intl.DateTimeFormatOptions = includeTime
    ? {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    : {
        year: "numeric",
        month: "long",
        day: "numeric",
      }

  return new Intl.DateTimeFormat("es-ES", options).format(date)
}

const extractNoteIdFromUrl = (value: string): string | null => {
  if (!value) return null

  const pathMatch = value.match(/\/app\/notes\/([^/?#]+)/)
  if (pathMatch?.[1]) {
    return pathMatch[1]
  }

  try {
    const url = new URL(
      value,
      typeof window !== "undefined" ? window.location.origin : "http://localhost"
    )
    const segments = url.pathname.split("/").filter(Boolean)
    const notesIndex = segments.indexOf("notes")
    if (notesIndex !== -1 && segments[notesIndex + 1]) {
      return segments[notesIndex + 1]
    }
  } catch {
    // ignore parsing errors for non-standard URLs
  }

  return null
}

export default function StudyGroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<StudyGroup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [noteMetadata, setNoteMetadata] = useState<Record<string, Note | null>>({})
  const fetchedNoteIdsRef = useRef(new Set<string>())

  const loadGroup = async () => {
    setIsLoading(true)
    try {
      const data = await studyGroupsApi.getStudyGroupDetails(groupId)
      setGroup(data)
    } catch (error) {
      console.error("Error loading study group:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        return
      }
      const user = await authApi.getCurrentUser(token)
      setCurrentUser(user)
    } catch (error) {
      console.error("Error loading current user:", error)
    }
  }

  useEffect(() => {
    loadGroup()
    loadCurrentUser()
  }, [groupId])

  useEffect(() => {
    setNoteMetadata({})
    fetchedNoteIdsRef.current = new Set<string>()
  }, [groupId])

  useEffect(() => {
    if (group && currentUser) {
      const userId = currentUser.id || (currentUser as any)?._id
      const isUserMember = Boolean(group.member_ids?.includes(userId))
      const isUserAdmin = group.owner === userId

      setIsMember(isUserMember || isUserAdmin)
      setIsAdmin(isUserAdmin)
    } else {
      setIsMember(false)
      setIsAdmin(false)
    }
  }, [group, currentUser])

  useEffect(() => {
    if (!group?.files || group.files.length === 0) {
      return
    }

    const noteIdsToFetch = group.files
      .map((file) => extractNoteIdFromUrl(file.file_url))
      .filter((noteId): noteId is string => Boolean(noteId) && !fetchedNoteIdsRef.current.has(noteId))

    if (noteIdsToFetch.length === 0) {
      return
    }

    let isCancelled = false

    const fetchMetadata = async () => {
      const results = await Promise.all(
        noteIdsToFetch.map(async (noteId) => {
          try {
            const note = await notesApi.getNoteDetails(noteId)
            return { noteId, note }
          } catch (error) {
            console.error(`Error fetching note ${noteId} details:`, error)
            return { noteId, note: null as Note | null }
          }
        })
      )

      if (isCancelled) {
        return
      }

      setNoteMetadata((prev) => {
        const next = { ...prev }
        for (const { noteId, note } of results) {
          next[noteId] = note
        }
        return next
      })

      results.forEach(({ noteId }) => {
        fetchedNoteIdsRef.current.add(noteId)
      })
    }

    fetchMetadata()

    return () => {
      isCancelled = true
    }
  }, [group?.files])

  const memberDisplayNames = useMemo(() => {
    if (!group) return []
    if (group.members && group.members.length > 0) {
      return group.members
    }
    if (group.member_ids && group.member_ids.length > 0) {
      return group.member_ids
    }
    return []
  }, [group])

  const handleJoinGroup = async () => {
    setIsJoining(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      await studyGroupsApi.joinStudyGroup(token, groupId)
      await loadGroup()
      await loadCurrentUser()
    } catch (error) {
      console.error("Error joining group:", error)
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!window.confirm("¿Estás seguro de que deseas abandonar este grupo?")) {
      return
    }

    setIsJoining(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      await studyGroupsApi.leaveStudyGroup(token, groupId)
      router.push("/app/study-groups")
    } catch (error) {
      console.error("Error leaving group:", error)
    } finally {
      setIsJoining(false)
    }
  }

  const handleShareNoteWithGroup = async (note: Note) => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const noteUrl = `${window.location.origin}/app/notes/${note.id || note._id}`
      const updatedGroup = await studyGroupsApi.shareFile(token, groupId, noteUrl)
      setGroup(updatedGroup)
      toast.success("Nota compartida con el grupo")
      setIsNoteDialogOpen(false)
    } catch (error) {
      console.error("Error sharing note with group:", error)
      toast.error("No se pudo compartir la nota con el grupo")
    }
  }

  if (isLoading) {
    return (
      <main className="container mx-auto py-12">
        <div className="mx-auto max-w-6xl space-y-8">
          <Skeleton className="h-9 w-40" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="lg:col-span-2">
              <CardHeader className="gap-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-36 w-full" />
              </CardContent>
            </Card>
            <Card className="hidden lg:flex lg:flex-col">
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="flex-1">
                <Skeleton className="h-full w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  if (!group) {
    return (
      <main className="container mx-auto py-12">
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <Card className="border border-destructive/30 bg-destructive/10">
            <CardHeader className="gap-3">
              <CardTitle className="text-2xl font-semibold text-destructive">
                Grupo de estudio no encontrado
              </CardTitle>
              <CardDescription className="text-sm">
                Puede que el enlace haya expirado o que el grupo haya sido eliminado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="default">
                <Link href="/app/study-groups">Volver a grupos de estudio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const createdAt = formatDateTime(group.created_at)
  const examDate = formatDateTime(group.exam_date, true)

  const membersCount = group.members_count ?? group.members?.length ?? 0
  const filesCount = group.files_count ?? group.files?.length ?? 0
  const messagesCount = group.messages_count ?? group.chat?.length ?? 0
  const pendingRequestsCount =
    group.pending_requests?.length ?? group.pending_request_ids?.length ?? 0

  const membershipLabel = isMember
    ? "Sos miembro de este grupo"
    : group.is_public
      ? "Grupo público disponible"
      : "Grupo privado"

  const stats = [
    {
      label: "Miembros",
      value: membersCount,
      hint:
        membersCount === 1
          ? "Estudiante participando"
          : "Estudiantes participando",
      icon: Users,
    },
    {
      label: "Archivos",
      value: filesCount,
      hint:
        filesCount === 1
          ? "Recurso compartido"
          : "Recursos compartidos",
      icon: FileText,
    },
    {
      label: "Mensajes",
      value: messagesCount,
      hint:
        messagesCount === 1
          ? "Conversación iniciada"
          : "Interacciones en el chat",
      icon: MessageSquare,
    },
  ]

  const currentUserId = currentUser?.id || (currentUser as any)?._id

  return (
    <>
      <main className="container mx-auto py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-1 w-max gap-2"
        >
          <Link href="/app/study-groups">
            <ArrowLeft className="h-4 w-4" />
            Volver a grupos de estudio
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <Card className="border border-border/70">
            <CardHeader className="gap-6 border-b pb-6 md:px-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isMember ? "default" : "secondary"} className="text-xs font-semibold">
                      {membershipLabel}
                    </Badge>
                    <Badge
                      variant={group.is_public ? "outline" : "secondary"}
                      className="text-xs"
                    >
                      {group.is_public ? "Pública" : "Privada"}
                    </Badge>
                    {pendingRequestsCount > 0 && (
                      <Badge variant="outline" className="border-dashed text-xs">
                        {pendingRequestsCount}{" "}
                        {pendingRequestsCount === 1
                          ? "solicitud pendiente"
                          : "solicitudes pendientes"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(group.owner)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-3xl font-bold leading-tight">
                        {group.name}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                        Administrado por
                        <Badge variant="secondary" className="text-xs font-medium">
                          {group.owner}
                        </Badge>
                        {isAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
                      </CardDescription>
                    </div>
                  </div>
                  <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                    {group.description}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                  {currentUser ? (
                    isMember ? (
                      <Button
                        variant="outline"
                        onClick={handleLeaveGroup}
                        disabled={isJoining}
                        className="gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        {isJoining ? "Saliendo..." : "Abandonar grupo"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleJoinGroup}
                        disabled={isJoining}
                        className="gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        {isJoining ? "Uniéndose..." : "Unirme al grupo"}
                      </Button>
                    )
                  ) : (
                    <Button
                      variant="secondary"
                      asChild
                      className="gap-2"
                    >
                      <Link href="/auth/login">
                        <UserPlus className="h-4 w-4" />
                        Iniciá sesión para participar
                      </Link>
                    </Button>
                  )}
                  {!isMember && (
                    <p className="text-xs text-muted-foreground">
                      Al unirte vas a poder chatear con el grupo y acceder a los materiales compartidos.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground sm:text-sm">
                {createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Creado {createdAt}</span>
                  </div>
                )}
                {examDate && (
                  <div className="flex items-center gap-2 text-primary">
                    <CalendarClock className="h-4 w-4" />
                    <span>Próximo examen: {examDate}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 md:px-8">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="flex w-full justify-start gap-2 rounded-lg bg-muted/60 p-1 sm:w-auto">
                  <TabsTrigger
                    value="overview"
                    className="rounded-md px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:shadow hover:bg-background/80 hover:text-foreground hover:shadow-sm"
                  >
                    Resumen
                  </TabsTrigger>
                  <TabsTrigger
                    value="members"
                    className="rounded-md px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:shadow hover:bg-background/80 hover:text-foreground hover:shadow-sm"
                  >
                    Miembros ({membersCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="resources"
                    className="rounded-md px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:shadow hover:bg-background/80 hover:text-foreground hover:shadow-sm"
                  >
                    Recursos ({filesCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-border/70 bg-muted/40 p-4"
                      >
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <stat.icon className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {stat.label}
                          </span>
                        </div>
                        <p className="mt-2 text-3xl font-semibold text-foreground">
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stat.hint}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Objetivo del grupo
                    </h2>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {group.description}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="members" className="mt-6 space-y-4">
                  {memberDisplayNames.length > 0 ? (
                    <div className="space-y-3">
                      {memberDisplayNames.map((member, index) => (
                        <div
                          key={`${member}-${index}`}
                          className="flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                {getInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {member}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member === group.owner
                                  ? "Administrador"
                                  : "Miembro"}
                              </p>
                            </div>
                          </div>
                          {currentUserId && member === currentUserId && (
                            <Badge variant="secondary" className="text-xs">
                              Vos
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                      Todavía no hay miembros registrados para mostrar.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="resources" className="mt-6 space-y-4">
                  {isMember && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsNoteDialogOpen(true)}
                      >
                        + Agregar nota
                      </Button>
                    </div>
                  )}

                  {group.files && group.files.length > 0 ? (
                    <div className="space-y-3">
                      {group.files.map((file) => {
                        const fileUrl = file.file_url
                        const isNoteLink = fileUrl.includes("/app/notes/")
                        const uploadedAt = formatDateTime(file.uploaded_at)
                        const noteId = isNoteLink ? extractNoteIdFromUrl(fileUrl) : null
                        const note = noteId ? noteMetadata[noteId] ?? null : null
                        const noteLocation = note
                          ? [note.university, note.subject]
                              .filter((segment) => segment && segment.trim().length > 0)
                              .join(" • ")
                          : null
                        const noteCreatedAt = note?.created_at
                          ? formatDateTime(note.created_at)
                          : null

                        const displayName = (() => {
                          if (note?.title) {
                            return note.title
                          }
                          if (isNoteLink) {
                            return "Nota en Learnify"
                          }
                          try {
                            const url = new URL(fileUrl)
                            const lastPath = url.pathname.split("/").pop()
                            return lastPath ? decodeURIComponent(lastPath) : url.href
                          } catch {
                            return fileUrl
                          }
                        })()

                        const description = (() => {
                          if (note) {
                            const segments = [
                              noteLocation,
                              noteCreatedAt ? `Publicada ${noteCreatedAt}` : null,
                            ].filter(Boolean)

                            if (segments.length > 0) {
                              return segments.join(" · ")
                            }
                            return "Nota compartida desde Learnify"
                          }

                          if (isNoteLink) {
                            return "Abrir detalles de la nota"
                          }

                          return uploadedAt
                            ? `Compartido el ${uploadedAt}`
                            : "Recurso compartido"
                        })()

                        const badgeLabel = note
                          ? "Nota compartida"
                          : isNoteLink
                            ? "Nota"
                            : "Archivo"

                        return (
                          <a
                            key={file.file_id}
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2 transition hover:border-primary/40 hover:bg-muted/40"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/40 text-muted-foreground">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-medium text-foreground line-clamp-1">
                                  {displayName}
                                </span>
                                <span className="text-xs text-muted-foreground line-clamp-2">
                                  {description}
                                </span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {badgeLabel}
                            </Badge>
                          </a>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                      No hay archivos compartidos todavía.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {isMember ? (
            <Card className="lg:sticky lg:top-24 flex max-h-[calc(100vh-8rem)] flex-col border border-border/70">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-semibold">
                  Chat del grupo
                </CardTitle>
                <CardDescription className="text-sm">
                  Coordiná encuentros y resolvé dudas en tiempo real.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex h-full flex-col overflow-hidden p-0">
                <GroupChatWithInput
                  messages={group.chat || []}
                  groupId={groupId}
                  currentUserId={currentUserId}
                  currentUserName={`${currentUser?.full_name || ""} ${currentUser?.last_name || ""}`.trim()}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-24 border border-dashed border-primary/40 bg-primary/5">
              <CardHeader className="gap-3">
                <CardTitle className="text-lg font-semibold">
                  Unite para acceder al chat
                </CardTitle>
                <CardDescription className="text-sm">
                  El chat del grupo está disponible sólo para miembros.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {group.is_public
                    ? "Este es un grupo público. Unite para empezar a chatear y compartir apuntes."
                    : "Este grupo es privado. Enviá la solicitud para que el administrador te apruebe y así habilitar el chat."}
                </p>
                {!currentUser && (
                  <p className="text-xs text-muted-foreground">
                    Necesitás iniciar sesión antes de poder unirte.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </main>

      {isMember && (
        <CreateNoteDialog
          open={isNoteDialogOpen}
          onOpenChange={setIsNoteDialogOpen}
          onNoteCreated={handleShareNoteWithGroup}
        />
      )}
    </>
  )
}
