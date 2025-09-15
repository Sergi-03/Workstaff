"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  Users,
  BriefcaseBusiness,
  GraduationCap,
  ClipboardCheck,
  FileText,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import Image from "next/image";

const workerNavItems = [
  {
    title: "Dashboard",
    url: "/worker/dashboard",
    icon: Home,
  },
  {
    title: "Ofertas de Trabajo",
    url: "/worker/jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "Mis Aplicaciones",
    url: "/worker/applications",
    icon: FileText,
  },
  {
    title: "Formación",
    url: "/worker/training",
    icon: GraduationCap,
  },
  {
    title: "Control Horario",
    url: "/worker/attendance",
    icon: ClipboardCheck,
  },
];

const companyNavItems = [
  {
    title: "Dashboard",
    url: "/company/dashboard",
    icon: Home,
  },
  {
    title: "Mis Ofertas",
    url: "/company/jobs",
    icon: FileText,
  },
  {
    title: "Aplicaciones",
    url: "/company/applications",
    icon: Users,
  },
  {
    title: "Personal Activo",
    url: "/company/workers",
    icon: UserCheck,
  },
  {
    title: "Contratos",
    url: "/company/contracts",
    icon: ClipboardCheck,
  },
];

export function AppSidebar({ ...props }) {
  const router = useRouter();
  const [role, setRole] = React.useState(null);

  React.useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
  }, []);

  const getNavItems = () => {
    if (role === "WORKER") return workerNavItems;
    if (role === "COMPANY") return companyNavItems;
    return [];
  };

  const handleConfigurationClick = () => {
    if (role === "WORKER") {
      router.push("/worker/settings");
    } else if (role === "COMPANY") {
      router.push("/company/settings");
    }
  };

  const handleSupportClick = () => {
    if (role === "WORKER") {
      router.push("/worker/support");
    } else if (role === "COMPANY") {
      router.push("/company/support");
    }
  };

  const secondaryItems = [
    {
      title: "Soporte",
      url: "#",
      icon: Inbox,
      onClick: handleSupportClick,
    },
    {
      title: "Configuración",
      url: "#",
      icon: Settings,
      onClick: handleConfigurationClick,
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex items-center justify-center w-18 h-40 rounded-lg bg-transparent">
                <Image
                  src="/logo.png"
                  alt="logo workstaff"
                  width={100}
                  height={200}
                  draggable={false}
                  className="select-none object-contain w-32 h-32"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Workstaff</span>
                <span className="truncate text-xs">
                  {role === "WORKER"
                    ? "Trabajador"
                    : role === "COMPANY"
                    ? "Empresa"
                    : ""}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={getNavItems()} />
        <NavSecondary items={secondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}