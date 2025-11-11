"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { adminApi, UserProfile, ApiError, UsersPaginatedResponse } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, X, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

interface AdminPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FiltersState {
  search: string
  role: string
}

const DEFAULT_FILTERS: FiltersState = {
  search: "",
  role: "",
}

const USERS_PER_PAGE = 2

export function AdminPanel({ open, onOpenChange }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState("") // Input local para debounce
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    total_pages: 0,
  })
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search.trim().length > 0) count += 1
    if (filters.role.trim().length > 0) count += 1
    return count
  }, [filters])

  const loadUsers = useCallback(async (page: number = 1, search?: string, role?: string) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast.error("No estás autenticado")
        return
      }
      
      const response: UsersPaginatedResponse = await adminApi.getAllUsers(token, {
        page,
        limit: USERS_PER_PAGE,
        search: search?.trim() || undefined,
        role: role?.trim() || undefined,
      })
      
      setUsers(response.users)
      setPagination({
        page: response.page,
        total: response.total,
        total_pages: response.total_pages,
      })
    } catch (error) {
      console.error("Error loading users:", error)
      if (error instanceof ApiError) {
        toast.error(error.message || "Error al cargar usuarios")
      } else {
        toast.error("Error al cargar usuarios")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce para la búsqueda
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }))
    }, 500) // Espera 500ms después de que el usuario deje de escribir

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchInput])

  // Cargar usuarios cuando cambian los filtros o la página
  useEffect(() => {
    if (open) {
      loadUsers(1, filters.search, filters.role)
    }
  }, [open, filters.search, filters.role, loadUsers])

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    if (open && pagination.page !== 1) {
      loadUsers(1, filters.search, filters.role)
    }
  }, [filters.search, filters.role])

  const handleRoleChange = async (userId: string, newRole: "user" | "moderator" | "admin") => {
    setUpdatingUserId(userId)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        toast.error("No estás autenticado")
        return
      }
      await adminApi.updateUserRole(token, userId, newRole)
      toast.success("Rol actualizado correctamente")
      // Recargar la lista de usuarios en la página actual
      await loadUsers(pagination.page, filters.search, filters.role)
    } catch (error) {
      console.error("Error updating role:", error)
      if (error instanceof ApiError) {
        toast.error(error.message || "Error al actualizar el rol")
      } else {
        toast.error("Error al actualizar el rol")
      }
    } finally {
      setUpdatingUserId(null)
    }
  }

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "moderator":
        return "default"
      default:
        return "secondary"
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin":
        return "Admin"
      case "moderator":
        return "Moderador"
      default:
        return "Usuario"
    }
  }

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSearchInput("")
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      loadUsers(newPage, filters.search, filters.role)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestión de Usuarios</DialogTitle>
          <DialogDescription>
            Administra los roles de los usuarios del sistema
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="space-y-4 border-b pb-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Buscar por nombre o email
              </label>
              <Input
                placeholder="Nombre, apellido, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Filtrar por rol
              </label>
              <Select
                value={filters.role || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, role: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {activeFiltersCount > 0 ? (
                <span>
                  {activeFiltersCount} {activeFiltersCount === 1 ? "filtro" : "filtros"} aplicados
                </span>
              ) : (
                <span>Sin filtros aplicados</span>
              )}
              {filters.role && (
                <Badge variant="secondary">
                  {getRoleLabel(filters.role)}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              disabled={activeFiltersCount === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {activeFiltersCount > 0
                  ? "No se encontraron usuarios con los filtros aplicados"
                  : "No hay usuarios"}
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  Mostrando {users.length} de {pagination.total} usuarios
                  {pagination.total_pages > 1 && (
                    <span> (Página {pagination.page} de {pagination.total_pages})</span>
                  )}
                </div>
                {users.map((user) => (
                  <Card key={user.id || user._id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">
                            {user.full_name && user.last_name
                              ? `${user.full_name} ${user.last_name}`
                              : user.email}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Select
                            value={user.role || "user"}
                            onValueChange={(value) =>
                              handleRoleChange(user.id || user._id || "", value as "user" | "moderator" | "admin")
                            }
                            disabled={updatingUserId === (user.id || user._id)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuario</SelectItem>
                              <SelectItem value="moderator">Moderador</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          {updatingUserId === (user.id || user._id) && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Paginación */}
                {pagination.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Página {pagination.page} de {pagination.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.total_pages || isLoading}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
