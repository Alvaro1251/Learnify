"use client"

import { useEffect, useRef, useState } from "react"

import { ChatMessage } from "@/lib/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface GroupChatWithInputProps {
  messages: ChatMessage[]
  groupId: string
  currentUserId?: string
  currentUserName?: string
}

type ConnectionStatus = "connecting" | "connected" | "disconnected"

function messageAlreadyExists(collection: ChatMessage[], incoming: ChatMessage) {
  const incomingTime = new Date(incoming.timestamp).getTime()

  return collection.some((item) => {
    if (item.content !== incoming.content) return false
    if (item.sender !== incoming.sender) return false

    const itemTime = new Date(item.timestamp).getTime()
    if (Number.isNaN(incomingTime) || Number.isNaN(itemTime)) {
      return true
    }

    return Math.abs(incomingTime - itemTime) < 1500
  })
}

export function GroupChatWithInput({
  messages: initialMessages,
  groupId,
  currentUserId,
  currentUserName,
}: GroupChatWithInputProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((msg) => ({ ...msg }))
  )
  const [messageInput, setMessageInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const optimisticMessagesRef = useRef<
    {
      senderId: string
      content: string
      optimisticSenderId: string
      optimisticSenderName: string
      localTimestamp: string
    }[]
  >([])

  useEffect(() => {
    setMessages(initialMessages.map((msg) => ({ ...msg })))
    optimisticMessagesRef.current = []
  }, [initialMessages, groupId])

  // Connect to WebSocket
  useEffect(() => {
    if (!currentUserId || typeof window === "undefined") return

    setConnectionStatus("connecting")
    const wsUrl = `ws://localhost:8000/study-groups/ws/${groupId}`

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log("WebSocket connected")
        setConnectionStatus("connected")
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log("Received message:", message)

          // Ensure we have valid values for sender and sender_name
          const senderId = message.sender_id || message.sender || "unknown"
          const senderName =
            message.sender_name ||
            message.sender_full_name ||
            message.sender ||
            "Usuario desconocido"
          const newMessage: ChatMessage = {
            sender: senderId,
            sender_name: senderName,
            content: message.content || "",
            timestamp: message.timestamp || new Date().toISOString(),
          }

          const pendingIndex = optimisticMessagesRef.current.findIndex(
            (entry) =>
              entry.senderId === senderId && entry.content === newMessage.content
          )

          if (pendingIndex !== -1) {
            const [pending] = optimisticMessagesRef.current.splice(pendingIndex, 1)
            setMessages((prev) => {
              const updated = [...prev]
              const replaceIndex = updated.findIndex(
                (candidate) =>
                  candidate.content === pending.content &&
                  candidate.sender === pending.optimisticSenderId &&
                  candidate.timestamp === pending.localTimestamp
              )

              if (replaceIndex !== -1) {
                updated[replaceIndex] = {
                  ...newMessage,
                  sender_name:
                    newMessage.sender_name || pending.optimisticSenderName,
                }
                return updated
              }

              if (!messageAlreadyExists(updated, newMessage)) {
                return [...updated, newMessage]
              }
              return updated
            })
          } else {
            setMessages((prev) => {
              if (messageAlreadyExists(prev, newMessage)) {
                return prev
              }
              return [...prev, newMessage]
            })
          }
        } catch (error) {
          console.error("Error parsing message:", error)
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setConnectionStatus("disconnected")
      }

      ws.onclose = () => {
        console.log("WebSocket disconnected")
        setConnectionStatus("disconnected")
      }

      wsRef.current = ws
    } catch (error) {
      console.error("Error connecting to WebSocket:", error)
      setConnectionStatus("disconnected")
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [groupId, currentUserId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageInput.trim() || !currentUserId || !wsRef.current) return

    setIsSending(true)

    try {
      const trimmedContent = messageInput.trim()
      const optimisticSenderName =
        (currentUserName && currentUserName.trim()) ||
        currentUserId ||
        "Vos"

      const localTimestamp = new Date().toISOString()
      const optimisticSenderId = currentUserId || "me"
      const optimisticMessage: ChatMessage = {
        sender: optimisticSenderId,
        sender_name: optimisticSenderName,
        content: trimmedContent,
        timestamp: localTimestamp,
      }

      setMessages((prev) => [...prev, optimisticMessage])
      optimisticMessagesRef.current.push({
        senderId: currentUserId,
        content: trimmedContent,
        optimisticSenderId,
        optimisticSenderName,
        localTimestamp,
      })

      wsRef.current.send(
        JSON.stringify({
          sender_id: currentUserId,
          content: trimmedContent,
        })
      )
      setMessageInput("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const getInitials = (name: string | undefined, fallbackId: string | undefined) => {
    if (name && name.trim().length > 0) {
      return name
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }

    // Ensure fallbackId is a valid string
    const safeFallback = fallbackId && typeof fallbackId === "string" ? fallbackId : "??"
    return safeFallback.slice(0, 2).toUpperCase()
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-5">
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 min-h-0">
        {messages.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <p>No hay mensajes aún.</p>
            <p>Sé el primero en empezar</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="flex gap-3 px-2">
              {/* Avatar */}
              <div className="flex-shrink-0 pt-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                    {getInitials(message.sender_name, message.sender)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">
                    {message.sender_name || message.sender}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap mt-1 break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="mt-4 flex shrink-0 gap-2 border-t pt-4">
        <Input
          placeholder="Escribe un mensaje..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          disabled={isSending || connectionStatus !== "connected"}
          className="h-10 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={
            !messageInput.trim() || isSending || connectionStatus !== "connected"
          }
          className="h-10 px-3"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
