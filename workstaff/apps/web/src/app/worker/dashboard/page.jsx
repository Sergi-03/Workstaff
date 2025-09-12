"use client";

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