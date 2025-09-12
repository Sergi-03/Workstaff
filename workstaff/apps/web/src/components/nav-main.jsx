"use client";

import {
  IconCirclePlusFilled,
  IconMail,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function NavMain({ items }) {
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
  }, []);

  const getQuickCreateText = () => {
    switch (role) {
      case "WORKER":
        return "Buscar Trabajos";
      case "COMPANY":
        return "Crear Oferta";
      default:
        return "Quick Create";
    }
  };

  const getQuickCreateIcon = () => {
    switch (role) {
      case "WORKER":
        return IconSearch;
      case "COMPANY":
        return IconPlus;
      default:
        return IconCirclePlusFilled;
    }
  };

  const QuickIcon = getQuickCreateIcon();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip={getQuickCreateText()}
              className="bg-red-500 text-white hover:bg-red-600 hover:text-white active:bg-red-600 active:text-white min-w-8 duration-200 ease-linear"
              onClick={() => {
                if (role === "WORKER") router.push("/worker/jobs");
                else if (role === "COMPANY")
                  router.push("/company/jobs/create");
              }}
            >
              <QuickIcon />
              <span>{getQuickCreateText()}</span>
            </SidebarMenuButton>

            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Mensajes</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => router.push(item.url)}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}