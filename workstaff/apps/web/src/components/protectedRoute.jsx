"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "@/lib/api";

export default function ProtectedRoute({ children, roles = [] }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { token, role } = getAuth();
    if (!token) {
      router.replace("/login");
      return;
    }

    if (roles.length > 0 && !roles.includes(role)) {
      router.replace("/login");
      return;
    }
    setChecking(false);
  }, [router, roles]);

  if (checking) {
    return (
      <div className="animate-fade-in-up p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}