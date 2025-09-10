"use client";

import ProtectedRoute from "@/components/protectedRoute";
import { DashboardLayout } from "@/components/dashboard/dashboardLayout";
import data from "@/components/dashboard/data.json";

export default function WorkerDashboardPage() {
  return (
    <ProtectedRoute roles={["WORKER"]}>
      <DashboardLayout data={data}>
      </DashboardLayout>
    </ProtectedRoute>
  );
}