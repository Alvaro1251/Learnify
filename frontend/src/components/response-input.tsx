"use client"

import { useState } from "react"
import { postsApi, AddResponseRequest, ApiError, UserProfile } from "@/lib/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Send } from "lucide-react"

interface ResponseInputProps {
  postId: string
  currentUser: UserProfile | null
  onResponseAdded: () => void
}

export function ResponseInput({
  postId,
  currentUser,
  onResponseAdded,
}: ResponseInputProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getInitials = (user: UserProfile | null) => {
    if (!user) return "?"
    const fullName = `${user.full_name || ""} ${user.last_name || ""}`.trim()
    return fullName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("La respuesta no puede estar vacía")
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      await postsApi.addResponse(token, postId, { content: content.trim() })
      setContent("")
      onResponseAdded()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Error adding response")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-2">
      <InputGroup className="items-start py-1.5">
        {/* Avatar on the left */}
        <InputGroupAddon align="inline-start" className="pt-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
              {getInitials(currentUser)}
            </AvatarFallback>
          </Avatar>
        </InputGroupAddon>

        {/* Textarea in the middle */}
        <InputGroupTextarea
          placeholder="Escribe tu respuesta aquí..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={3}
          className="max-h-32"
        />

        {/* Send button on the right */}
        <InputGroupAddon align="inline-end" className="pt-3">
          <InputGroupButton
            size="icon-sm"
            onClick={handleSubmit}
            disabled={isLoading || !content.trim()}
            aria-label="Enviar respuesta"
          >
            <Send className="h-4 w-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Presiona enter para enviar una respuesta
      </p>
    </div>
  )
}
