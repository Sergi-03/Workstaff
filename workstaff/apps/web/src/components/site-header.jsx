"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";

export function SiteHeader() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
  }, []);

  const getHeaderTitle = () => {
    switch (role) {
      case "WORKER":
        return "Panel de Trabajador";
      case "COMPANY":
        return "Panel de Empresa";
      default:
        return "Workstaff";
    }
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 text-red-500 hover:text-red-400" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{getHeaderTitle()}</h1>
        <div className="ml-auto flex items-center gap-2">
          {/* notificaciones, perfil, etc. específicos por rol */}
        </div>
      </div>
    </header>
  );
}