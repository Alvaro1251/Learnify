"use client"

import { PostResponse } from "@/lib/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ResponseItemProps {
  response: PostResponse
}

export function ResponseItem({ response }: ResponseItemProps) {
  // Extract initials from the owner name
  const initials = response.owner
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const createdAt = new Date(response.creation_date).toLocaleDateString(
    "es-ES",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  )

  return (
    <div className="flex gap-4">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Name and Date */}
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm">{response.owner}</span>
          <span className="text-xs text-muted-foreground">{createdAt}</span>
        </div>

        {/* Reply Content */}
        <div className="mt-2 text-sm text-foreground whitespace-pre-wrap">
          {response.content}
        </div>
      </div>
    </div>
  )
}
