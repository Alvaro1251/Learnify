import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  ChevronsUpDown,
  Home,
  LogOut,
  Settings,
  Calendar,
  Search,
  Users,
  Book,
  Group,
  Pencil,
  CreditCard,
  DollarSign,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function AppSidebar() {
  return (
    <Sidebar variant="floating">
      <SidebarHeader>
        <h1 className="text-2xl font-bold p-2">Learnify</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/home">
                <SidebarMenuButton className="cursor-pointer">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/study-sessions">
                <SidebarMenuButton className="cursor-pointer">
                  <Calendar className="w-4 h-4 mr-2" />
                  Study Sessions
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/search-notes">
                <SidebarMenuButton className="cursor-pointer">
                  <Search className="w-4 h-4 mr-2" />
                  Search Notes
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {/* <SidebarGroup>
          <SidebarGroupLabel>Personal</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/friends">
                <SidebarMenuButton className="cursor-pointer">
                  <Users className="w-4 h-4 mr-2" />
                  Friends
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/my-notes">
                <SidebarMenuButton className="cursor-pointer">
                  <Book className="w-4 h-4 mr-2" />
                  My Notes
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/my-study-groups">
                <SidebarMenuButton className="cursor-pointer">
                  <Pencil className="w-4 h-4 mr-2" />
                  My Study Groups
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup> */}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarGroupLabel>Credits</SidebarGroupLabel>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <p className="text-sm ">
                You have <b>100</b> credits
              </p>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center justify-between w-full h-full p-2 cursor-pointer"
                asChild
              >
                <SidebarMenuButton>
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>NN</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Gabriel Viera</span>
                    <p className="text-sm text-muted-foreground">
                      sgviera@frd.utn.edu.ar
                    </p>
                  </div>

                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" className="w-48">
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
