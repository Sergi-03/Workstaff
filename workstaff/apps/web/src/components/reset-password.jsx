"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function ResetPasswordForm({ token }) {
  const router = useRouter();
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const res = await fetch(
        `https://ubiquitous-space-guide-q79wrjrgj4vvh4pq-3000.app.github.dev/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token, newPassword: password }),
        }
      );

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.error || "Error al cambiar la contraseña");

      toast.success(data.message || "Contraseña cambiada correctamente!");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      toast.error(err.message || "Error al cambiar la contraseña");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-center rounded-md">
        <Image
          width={150}
          height={200}
          src="/logo.png"
          alt="logo workstaff"
          draggable={false}
          className="select-none outline-none"
        ></Image>
      </div>
      <Input
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="border p-2 rounded w-full"
      />
      <Button
        type="submit"
        className="w-full bg-red-500 hover:bg-red-600 text-white"
      >
        Cambiar contraseña
      </Button>
    </form>
  );
}