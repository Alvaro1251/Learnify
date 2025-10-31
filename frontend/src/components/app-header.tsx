"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BookOpenText, LogOut, MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { CreatePostDialog } from "@/components/create-post-dialog"
import { CreateStudyGroupDialog } from "@/components/create-study-group-dialog"
import { CreateNoteDialog } from "@/components/create-note-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { authApi, UserProfile, Note } from "@/lib/api"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

interface NavItem {
  id: string
  title: string
  href: string
  description: string
  icon?: string
}

interface NavSection {
  label: string
  description: string
  icon?: string
  image: string
  items: NavItem[]
}

const navigationSections: NavSection[] = [
  {
    label: "Grupos de Estudio",
    description: "Colabora y aprende con otros estudiantes",
    image: "/study-groups.png",
    items: [
      {
        id: "study-groups-all",
        title: "Ver todos",
        href: "/app/study-groups",
        description: "Explora todos los grupos de estudio disponibles",
      },
      {
        id: "study-groups-create",
        title: "+ Crear grupo",
        href: "/app/study-groups",
        description: "Crea un nuevo grupo de estudio",
      },
    ],
  },
  {
    label: "Publicaciones",
    description: "Comparte tus ideas y conocimientos",
    image: "/posts.jpg",
    items: [
      {
        id: "posts-all",
        title: "Ver todas",
        href: "/app/posts",
        description: "Explora todas las publicaciones disponibles",
      },
      {
        id: "posts-create",
        title: "+ Crear publicación",
        href: "/app/posts",
        description: "Crea una nueva publicación",
      },
    ],
  },
  {
    label: "Notas",
    description: "Organiza y comparte tus apuntes",
    image: "/notes.jpg",
    items: [
      {
        id: "notes-all",
        title: "Ver todas",
        href: "/app/notes",
        description: "Explora todas las notas disponibles",
      },
      {
        id: "notes-create",
        title: "+ Subir nota",
        href: "/app/notes",
        description: "Compartí apuntes con la comunidad",
      },
    ],
  },
]

function ListItem({
  title,
  href,
  description,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  title: string
  href?: string
  description?: string
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="text-sm leading-none font-medium">{title}</div>
      {description && (
        <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
          {description}
        </p>
      )}
    </>
  )

  if (onClick) {
    return (
      <li {...props}>
        <button
          onClick={onClick}
          className="block w-full text-left px-3 py-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
        >
          {content}
        </button>
      </li>
    )
  }

  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href || "#"} className="block px-3 py-2 hover:bg-accent rounded-md transition-colors">
          {content}
        </Link>
      </NavigationMenuLink>
    </li>
  )
}

export function AppHeader() {
  const router = useRouter()
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) return
        const user = await authApi.getCurrentUser(token)
        setCurrentUser(user)
      } catch (error) {
        console.error("Error loading current user:", error)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    router.push("/login")
  }

  const handlePostCreated = () => {
    setIsCreatePostOpen(false)
    router.push("/app/posts")
  }

  const handleGroupCreated = () => {
    setIsCreateGroupOpen(false)
    router.push("/app/study-groups")
  }

  const handleNoteCreated = (_note: Note) => {
    setIsCreateNoteOpen(false)
    router.push("/app/notes")
  }

  const displayName = useMemo(() => {
    if (!currentUser) return "Usuario"
    const full =
      `${currentUser.full_name ?? ""} ${currentUser.last_name ?? ""}`.trim()
    if (full.length > 0) return full
    return currentUser.email ?? "Usuario"
  }, [currentUser])

  const userInitials = useMemo(() => {
    const source = displayName || currentUser?.email || "U"
    const parts = source.trim().split(/\s+/)
    if (parts.length >= 2) {
      const first = parts[0]?.[0]?.toUpperCase() ?? ""
      const second = parts[1]?.[0]?.toUpperCase() ?? ""
      const combined = `${first}${second}`
      return combined.length > 0 ? combined : "U"
    }
    return source.slice(0, 2).toUpperCase() || "U"
  }, [displayName, currentUser])

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/app"
            className="flex items-center gap-2 font-medium hover:opacity-80 transition-opacity"
          >
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <BookOpenText className="size-4" />
            </div>
            <span className="text-lg font-bold">Learnify</span>
          </Link>

          {/* Navigation Menu */}
          <NavigationMenu>
            <NavigationMenuList>
              {navigationSections.map((section) => (
                <NavigationMenuItem key={section.label}>
                  <NavigationMenuTrigger>{section.label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 md:w-[500px] lg:w-[600px] lg:grid-cols-[220px_1fr] p-4">
                      {/* Left column - Image */}
                      <div className="row-span-4 hidden lg:flex items-center justify-center">
                        <div className="relative w-[200px] h-[200px] overflow-hidden rounded-md flex-shrink-0">
                          <img
                            src={section.image}
                            alt={section.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Right column - Header and items */}
                      <div className="space-y-2">
                        {/* Header with title and description */}
                        <div>
                          <div className="font-semibold text-sm">{section.label}</div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {section.description}
                          </p>
                        </div>

                        {/* Menu items */}
                        <ul className="space-y-0.5">
                          {section.items.map((item) => (
                            <ListItem
                              key={item.id}
                              title={item.title}
                              href={
                                item.id === "posts-create" ||
                                item.id === "study-groups-create" ||
                                item.id === "notes-create"
                                  ? undefined
                                  : item.href
                              }
                              description={item.description}
                              onClick={
                                item.id === "posts-create"
                                  ? () => setIsCreatePostOpen(true)
                                  : item.id === "study-groups-create"
                                    ? () => setIsCreateGroupOpen(true)
                                    : item.id === "notes-create"
                                      ? () => setIsCreateNoteOpen(true)
                                      : undefined
                              }
                            />
                          ))}
                        </ul>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src=""
                    alt={displayName}
                    className="rounded-lg object-cover"
                  />
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 flex-1 sm:block">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  {currentUser?.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {currentUser.email}
                    </p>
                  )}
                </div>
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={displayName} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="grid text-left text-sm leading-tight">
                    <span className="font-semibold text-foreground">
                      {displayName}
                    </span>
                    {currentUser?.email && (
                      <span className="truncate text-xs text-muted-foreground">
                        {currentUser.email}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer gap-2"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Create Post Dialog */}
      <CreatePostDialog
        open={isCreatePostOpen}
        onOpenChange={setIsCreatePostOpen}
        onPostCreated={handlePostCreated}
      />
      {/* Create Study Group Dialog */}
      <CreateStudyGroupDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        onGroupCreated={handleGroupCreated}
      />
      <CreateNoteDialog
        open={isCreateNoteOpen}
        onOpenChange={setIsCreateNoteOpen}
        onNoteCreated={handleNoteCreated}
      />
    </header>
  )
}
