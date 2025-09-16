"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
  IconSettings,
  IconBriefcase,
} from "@tabler/icons-react";

import { toast } from "sonner";
import { apiFetch, getAuth } from "@/lib/api";

export function NavUser() {
  const { isMobile } = useSidebar();
  const [user, setUser] = useState(() => {
  const savedUser = localStorage.getItem("user");
  return savedUser ? JSON.parse(savedUser) : null;
  });
  const router = useRouter();

  useEffect(() => {
    const { token, role } = getAuth();
    if (!token) {
      router.replace("/login");
      return;
    }

    const fetchProfile = async () => {
    try {
      let profileData = null;

      if (role === "WORKER") {
        profileData = await apiFetch("/api/auth/worker/profile", { method: "GET" });
        const updatedUser = {
          fullname: profileData?.fullname || "Trabajador",
          email: profileData?.user?.email || "usuario@workstaff.com",
          photoUrl: profileData?.photoUrl || "",
          role,
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else if (role === "COMPANY") {
        profileData = await apiFetch("/api/auth/company/profile", { method: "GET" });
        const updatedUser = {
          fullname: profileData?.name || "Empresa",
          email: profileData?.user?.email || "empresa@workstaff.com",
          photoUrl: profileData?.logoUrl || "",
          role,
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Error cargando perfil:", err);
      toast.error("Error cargando perfil");
    }
  };

  fetchProfile();
}, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
    toast.success("Sesión cerrada correctamente!");
  };

  const getRoleSpecificMenuItems = () => {
    if (!user) return [];
    if (user.role === "WORKER") {
      return [
        { icon: IconUserCircle, label: "Mi Perfil", href: "/worker/profile" },
        { icon: IconBriefcase, label: "Mis Trabajos", href: "/worker/jobs" },
      ];
    } else if (user.role === "COMPANY") {
      return [
        { icon: IconSettings, label: "Mi Empresa", href: "/company/profile" },
        { icon: IconBriefcase, label: "Mis Ofertas", href: "/company/jobs" },
      ];
    }
    return [];
  };

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback>...</AvatarFallback>
            </Avatar>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.photoUrl} alt={user.fullname} />
                <AvatarFallback>
                  {user.fullname ? user.fullname[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <span className="truncate font-medium">{user.fullname}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.photoUrl} alt={user.fullname} />
                  <AvatarFallback>
                    {user.fullname ? user.fullname[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.fullname}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {getRoleSpecificMenuItems().map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => router.push(item.href)}
                >
                  <item.icon className="mr-2" />
                  {item.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem>
                <IconNotification className="mr-2" />
                Notificaciones
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout className="mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}