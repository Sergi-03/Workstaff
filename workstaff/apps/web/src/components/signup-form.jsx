"use client";

import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, BriefcaseBusiness } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const workerSchema = z.object({
  fullname: z
    .string()
    .min(5, "El nombre es obligatorio")
    .refine((val) => val.trim().split(" ").length >= 2, {
      message: "Debes ingresar al menos nombre y apellido",
    }),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener mínimo 6 caracteres"),
  profilePhoto: z.any().optional(),
  dniPhoto: z
    .any()
    .refine((file) => file?.length === 1, "Debes subir una imagen de DNI"),
});

const companySchema = z.object({
  companyName: z
    .string()
    .min(3, "El nombre de la empresa es obligatorio")
    .refine((val) => val.trim().split(" ").length >= 2, {
      message: "Incluye al menos dos palabras (ej: 'Panadería López')",
    }),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener mínimo 6 caracteres"),
  cif: z
    .string()
    .min(9, "El CIF/NIF debe tener al menos 9 caracteres")
    .max(9, "El CIF/NIF no puede tener más de 9 caracteres"),
});

export function RegisterForm({ className, ...props }) {
  const router = useRouter();
  const [role, setRole] = useState("trabajador");

  const form = useForm({
    resolver: zodResolver(role === "trabajador" ? workerSchema : companySchema),
  });

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      formData.append("role", role === "trabajador" ? "WORKER" : "COMPANY");
      formData.append("email", data.email);
      formData.append("password", data.password);

      if (role === "trabajador") {
        formData.append("fullname", data.fullname);

        if (data.profilePhoto?.[0]) {
          formData.append("profilePhoto", data.profilePhoto[0]);
        }

        if (data.dniPhoto?.[0]) {
          formData.append("dniPhoto", data.dniPhoto[0]);
        }
      } else {
        formData.append("companyName", data.companyName);
        formData.append("cif", data.cif);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await res.json();

      if (!res.ok)
        throw new Error(result.error || "Error al registrar usuario");

      toast.success(result.message || "¡Registro completado!");
      form.reset();
      localStorage.setItem("signup_email", data.email);
      setTimeout(() => router.push("/email-verification"), 2000);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error al registrar usuario", {
        description:
          "Por favor revisa los datos ingresados e inténtalo nuevamente",
      });
    }
  };

  return (
    <div
      className={cn("flex flex-col gap-6 px-8 sm:px-20", className)}
      {...props}
    >
      <div className="animate-fade-in-up flex flex-col gap-6">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/logo.png"
              width={150}
              height={200}
              alt="logo workstaff"
              draggable={false}
              className="select-none outline-none"
            />
            <h1 className="text-xl font-bold select-none">
              Registro en Workstaff
            </h1>

            <div className="flex gap-4 mt-2">
              <Button
                type="button"
                variant={role === "trabajador" ? "default" : "outline"}
                onClick={() => setRole("trabajador")}
                className="w-32"
              >
                Trabajador
                <User className="text-red-500" />
              </Button>
              <Button
                type="button"
                variant={role === "empresa" ? "default" : "outline"}
                onClick={() => setRole("empresa")}
                className="w-32"
              >
                Empresa
                <BriefcaseBusiness className="text-red-500" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6 mb-4">
            {role === "trabajador" && (
              <>
                <div className="grid gap-3">
                  <Label htmlFor="fullname">Nombre completo</Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="Juan Pérez García"
                    required
                    {...form.register("fullname")}
                  />
                  {form.formState.errors.fullname && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.fullname.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
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
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
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

                <div className="grid gap-3">
                  <Label htmlFor="profilePhoto">Foto de perfil</Label>
                  <Input
                    id="profilePhoto"
                    type="file"
                    accept="image/*"
                    {...form.register("profilePhoto")}
                  />
                  {form.formState.errors.profilePhoto && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.profilePhoto.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="dniPhoto">Foto DNI</Label>
                  <Input
                    id="dniPhoto"
                    type="file"
                    accept="image/*"
                    {...form.register("dniPhoto")}
                  />
                  {form.formState.errors.dniPhoto && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.dniPhoto.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {role === "empresa" && (
              <>
                <div className="grid gap-3">
                  <Label htmlFor="companyName">Nombre de la empresa</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Mi empresa S.L."
                    required
                    {...form.register("companyName")}
                  />
                  {form.formState.errors.companyName && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.companyName.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="cif">CIF / NIF</Label>
                  <Input
                    id="cif"
                    type="text"
                    placeholder="B12345678"
                    required
                    {...form.register("cif")}
                  />
                  {form.formState.errors.cif && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.cif.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="email">Correo de contacto</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@empresa.com"
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
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
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
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              Crear cuenta
            </Button>
            <div className="text-muted-foreground text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4 -mt-4">
              Al hacer click en Crear cuenta, aceptas nuestros{" "}
              <Link href="#" className="text-red-500 hover:text-red-400">
                Términos de servicio
              </Link>{" "}
              y nuestra{" "}
              <Link href="#" className="text-red-500 hover:text-red-400">
                Política de privacidad
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}