"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import Image from "next/image";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw new Error(error.message);

      toast.success("Contraseña cambiada correctamente!");
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
        />
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