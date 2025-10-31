"use client"

import { Note } from "@/lib/api"

import { NoteCard } from "@/components/note-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface NotesListProps {
  notes: Note[]
  isLoading: boolean
  emptyState?: {
    title: string
    description: string
    helper?: string
  }
  onTagClick?: (tag: string) => void
}

export function NotesList({
  notes,
  isLoading,
  emptyState,
  onTagClick,
}: NotesListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={`note-skeleton-${index}`} className="h-full">
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
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <Card className="flex w-full flex-col items-center justify-center gap-4 border-2 border-dashed py-16 text-center">
        <CardHeader className="flex w-full flex-col items-center gap-2">
          <CardTitle className="text-xl font-semibold">
            {emptyState?.title ?? "Todavía no hay apuntes disponibles"}
          </CardTitle>
          <CardDescription className="w-full">
            {emptyState?.description ??
              "Cuando la comunidad suba nuevos materiales vas a encontrarlos acá."}
          </CardDescription>
        </CardHeader>
        {emptyState?.helper && (
          <CardContent className="w-full text-sm text-muted-foreground">
            {emptyState.helper}
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {notes.map((note) => (
        <NoteCard key={note.id || note._id} note={note} onTagClick={onTagClick} />
      ))}
    </div>
  )
}
