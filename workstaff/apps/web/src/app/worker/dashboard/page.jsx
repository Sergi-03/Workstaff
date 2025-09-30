import ProtectedRoute from "@/components/protectedRoute";
import { DashboardLayout } from "@/components/dashboard/dashboardLayout";

export default function WorkerDashboardPage() {
  return (
    <ProtectedRoute roles={["WORKER"]}>
      <DashboardLayout>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Dashboard Trabajador | WorkStaff",
  description: "Gestiona tus postulaciones, guarda ofertas y descubre nuevas oportunidades laborales en tu panel de trabajador.",
};