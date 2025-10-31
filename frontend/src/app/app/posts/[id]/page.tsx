"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { postsApi, Post, authApi, UserProfile } from "@/lib/api"
import { ResponseInput } from "@/components/response-input"
import { ResponseItem } from "@/components/response-item"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trash2 } from "lucide-react"
import Link from "next/link"

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPost = async () => {
    setIsLoading(true)
    try {
      const data = await postsApi.getPostDetails(postId)
      console.log("Post details:", data)
      setPost(data)
    } catch (error) {
      console.error("Error loading post:", error)
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

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta publicación?")) {
      return
    }

    setIsDeleting(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      await postsApi.deletePost(token, postId)
      router.push("/app/posts")
    } catch (error) {
      console.error("Error deleting post:", error)
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    loadPost()
    loadCurrentUser()
  }, [postId])

  if (isLoading) {
    return (
      <main className="container mx-auto py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    )
  }

  if (!post) {
    return (
      <main className="container mx-auto py-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Publicación no encontrada</h1>
          <Link href="/app/posts">
            <Button>Volver a publicaciones</Button>
          </Link>
        </div>
      </main>
    )
  }

  const createdAt = new Date(post.creation_date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Check if current user is the owner by comparing full names
  const currentUserFullName = currentUser
    ? `${currentUser.full_name} ${currentUser.last_name}`.trim()
    : null
  const isOwner = currentUserFullName && post.owner === currentUserFullName

  return (
    <main className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/app/posts" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
          ← Volver a publicaciones
        </Link>

        {/* Post Details */}
        <Card className="mb-8">
          <CardHeader>
            {/* Owner Info - Avatar and Name */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex gap-3 flex-1">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {post.owner
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {/* Name and Date */}
                <div>
                  <p className="font-semibold text-sm">{post.owner}</p>
                  <p className="text-xs text-muted-foreground">{createdAt}</p>
                </div>
              </div>
              {/* Delete Icon Button */}
              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-shrink-0 p-1 hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Eliminar publicación"
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </button>
              )}
            </div>

            {/* Title */}
            <CardTitle className="text-3xl mb-4">{post.title}</CardTitle>

            {/* Subject Badge */}
            <div className="flex gap-2">
              <Badge variant="secondary">{post.subject}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{post.description}</p>
          </CardContent>
        </Card>

        {/* Responses Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">
            Respuestas ({post.responses?.length || 0})
          </h2>

          {/* Response Input */}
          <ResponseInput
            postId={postId}
            currentUser={currentUser}
            onResponseAdded={loadPost}
          />

          {/* Existing Responses */}
          {post.responses && post.responses.length > 0 ? (
            <div className="space-y-6 mt-8">
              {post.responses.map((response, index) => (
                <div key={index}>
                  <ResponseItem response={response} />
                  {index < post.responses!.length - 1 && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay respuestas aún. Sé el primero en responder
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
