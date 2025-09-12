"use client";

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