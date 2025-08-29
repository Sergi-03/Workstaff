"use client";
import { useState } from "react";
import Image from "next/image";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `https://ubiquitous-space-guide-q79wrjrgj4vvh4pq-1234.app.github.dev/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "¡Revisa tu correo! Te enviamos un enlace para restablecer tu contraseña");
      } else {
        toast.error(data.error || "Error al enviar el enlace", {
            description: "Verifica que hayas ingresado tu correo correctamente e intenta de nuevo"
        });
      }
    } catch (err) {
      toast.error(err.message || "Error en el servidor, inténtalo de nuevo");
    }
  };

  return (
    <div className={`animate-fade-in-up`}>
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
        type="email"
        placeholder="Introduce tu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border p-2 rounded w-full"
      />
      <Button
        type="submit"
        className="w-full bg-red-500 hover:bg-red-600 text-white"
      >
        Enviar enlace de recuperación
      </Button>
    </form>
    </div>
  );
}