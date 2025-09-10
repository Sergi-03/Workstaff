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
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return <>{children}</>;
}