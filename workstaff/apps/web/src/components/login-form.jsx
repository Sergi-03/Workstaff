"use client";

import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener mínimo 6 caracteres"),
});

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setUploading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Error al iniciar sesión");
        return;
      }

      localStorage.setItem("access_token", result.token);
      localStorage.setItem("role", result.role);
      localStorage.setItem("userId", result.user?.id);
      localStorage.setItem(
        "user",
        JSON.stringify({
          fullname: result.user?.fullname || "Usuario",
          name: result.user?.name || "Usuario",
          cif: result.user?.cif || "Cif",
          email: result.user?.contactInfo || "Email",
          photoUrl: result.user?.photoUrl || "",
          idPhotoUrl: result.user?.idPhotoUrl || "Id",
          logoUrl: result.user?.logoUrl || "",
          role: result.role || "",
        })
      );

      toast.success("Sesión iniciada correctamente!");

      if (result.role === "WORKER") {
        setTimeout(() => router.push("/worker/profile?onboarding=1"), 1000);
      } else if (result.role === "COMPANY") {
        setTimeout(() => router.push("/company/profile?onboarding=1"), 1000);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error en login:", error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className={`animate-fade-in-up`}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
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
              <h1 className="text-xl select-none font-bold">
                Bienvenido a Workstaff
              </h1>
              <div className="text-center text-sm">
                No tienes una cuenta?{" "}
                <Link
                  href="/signup"
                  className="text-red-500 hover:text-red-400 underline"
                >
                  Regístrate
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm text-red-500 hover:text-red-400 underline-offset-2 hover:underline"
                  >
                    Has olvidado tu contraseña?
                  </Link>
                </div>
                <Input
                  className="focus:border-red-600"
                  id="password"
                  type="password"
                  required
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                disabled={uploading}
              >
                {uploading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-background text-muted-foreground relative z-10 px-2">
                O
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Button
                variant="outline"
                type="button"
                className="w-full hover:border-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
                Continuar con Apple
              </Button>
              <Button
                variant="outline"
                type="button"
                className="w-full hover:border-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Continuar con Google
              </Button>
            </div>
          </div>
        </form>
        <div className="text-muted-foreground text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4 mt-7">
          Al hacer click en Continuar, aceptas nuestros{" "}
          <Link href="#" className="text-red-500 hover:text-red-400">
            Términos de servicio
          </Link>{" "}
          y nuestra{" "}
          <Link href="#" className="text-red-500 hover:text-red-400">
            Política de privacidad
          </Link>
        </div>
      </div>
    </div>
  );
}