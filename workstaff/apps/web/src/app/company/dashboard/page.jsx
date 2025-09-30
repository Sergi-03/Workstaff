import ProtectedRoute from "@/components/protectedRoute";
import { DashboardLayout } from "@/components/dashboard/dashboardLayout";

export default function CompanyDashboardPage() {
  return (
    <ProtectedRoute roles={["COMPANY"]}>
      <DashboardLayout>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Dashboard Empresa | WorkStaff",
  description: "Publica vacantes, revisa candidatos y gestiona fácilmente los procesos de selección en tu panel de empresa.",
};