"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, MessageCircle, Clock } from "lucide-react"

import { Post } from "@/lib/api"
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

interface PostCardProps {
  post: Post
  onSubjectClick?: (subject: string) => void
}

export function PostCard({ post, onSubjectClick }: PostCardProps) {
  const createdAt = new Date(post.creation_date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const postId = post.id || post._id

  return (
    <Card className="h-full border border-border/70 transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="line-clamp-2 text-lg font-semibold">
            {post.title}
          </CardTitle>
          <Badge
            variant="secondary"
            className="whitespace-nowrap cursor-pointer"
            onClick={() => onSubjectClick?.(post.subject)}
          >
            {post.subject}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2 text-xs">
          <Clock className="h-3.5 w-3.5" />
          {createdAt}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-4">
          {post.description}
        </p>

        <div className="rounded-md border border-muted/60 bg-muted/30 p-3 text-xs text-muted-foreground">
          Recordá que las respuestas ayudan a la comunidad a comprender y resolver dudas rápidamente.
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>
            {post.responses_count || 0} respuesta
            {(post.responses_count || 0) !== 1 ? "s" : ""}
          </span>
        </div>
        <Button asChild className="w-full justify-between sm:w-auto sm:justify-center">
          <Link href={`/app/posts/${postId}`} className="flex items-center gap-2">
            Ver detalles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
