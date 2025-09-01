"use client";

import { ResetPasswordForm } from "@/components/reset-password";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Suspense, useState, useEffect } from "react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [hasToken, setHasToken] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let token = searchParams.get("access_token");

    if (!token && typeof window !== "undefined") {
      const hash = new URLSearchParams(window.location.hash.substring(1));
      token = hash.get("access_token");
    }

    setHasToken(!!token);
  }, [searchParams]);

  if (!hasToken) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center p-6">
        <Image
          width={150}
          height={200}
          src="/logo.png"
          alt="logo workstaff"
          draggable={false}
          className="select-none outline-none"
        />
        <p className="text-red-500 text-center select-none">
          Token inválido o expirado
        </p>
        <p className="text-center text-sm text-gray-300 select-none mt-4">
          ¿El enlace caducó? Vuelve a solicitar la recuperación de contraseña
        </p>
        <Button
          onClick={() => router.push("/forgot-password")}
          className="bg-red-500 select-none hover:bg-red-600 text-white mt-6"
        >
          Solicitar enlace de recuperación
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ResetPasswordForm />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}