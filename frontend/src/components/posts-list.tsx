"use client"

import { Post } from "@/lib/api"

import { PostCard } from "@/components/post-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface PostsListProps {
  posts: Post[]
  isLoading: boolean
  onSubjectClick?: (subject: string) => void
}

export function PostsList({ posts, isLoading, onSubjectClick }: PostsListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={`post-skeleton-${index}`} className="h-full">
            <CardHeader className="gap-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card className="flex w-full flex-col items-center justify-center gap-4 border-2 border-dashed py-16 text-center">
        <CardHeader className="flex w-full flex-col items-center gap-2">
          <CardTitle className="text-xl font-semibold">
            Todavía no hay publicaciones
          </CardTitle>
          <CardDescription className="w-full">
            Cuando se publiquen nuevas preguntas o ideas las vas a ver acá.
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full text-sm text-muted-foreground">
          Animate a crear la primera publicación y ayudá a otros estudiantes.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <PostCard
          key={post.id || post._id}
          post={post}
          onSubjectClick={onSubjectClick}
        />
      ))}
    </div>
  )
}
