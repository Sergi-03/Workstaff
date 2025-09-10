"use client";

import ProtectedRoute from "@/components/protectedRoute";
import { DashboardLayout } from "@/components/dashboard/dashboardLayout";
import data from "@/components/dashboard/data.json";

export default function CompanyDashboardPage() {
  return (
    <ProtectedRoute roles={["COMPANY"]}>
      <DashboardLayout data={data}>
      </DashboardLayout>
    </ProtectedRoute>
  );
}