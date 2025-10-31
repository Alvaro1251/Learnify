"use client"

import { ChatMessage } from "@/lib/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface GroupChatProps {
  messages: ChatMessage[]
  currentUserId?: string
}

export function GroupChat({ messages, currentUserId }: GroupChatProps) {
  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No hay mensajes aún. Sé el primero en empezar la conversación
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const displayName = (message.sender_name && message.sender_name.trim().length > 0)
          ? message.sender_name
          : message.sender

        const initials = displayName
          .split(" ")
          .filter(Boolean)
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

        const messageDate = new Date(message.timestamp).toLocaleDateString(
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
          <div key={index} className="flex gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm">{displayName}</span>
                <span className="text-xs text-muted-foreground">{messageDate}</span>
              </div>
              <div className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
