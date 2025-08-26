"use client";

import Image from "next/image";
import { User, BriefcaseBusiness } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ className, ...props }) {
  const [role, setRole] = useState("trabajador");

  return (
    <div
      className={cn("flex flex-col gap-6 px-8 sm:px-20", className)}
      {...props}
    >
      <div className="animate-fade-in-up flex flex-col gap-6">
        <form className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/logo.png"
              width={150}
              height={200}
              alt="logo workstaff"
              draggable={false}
              className="select-none outline-none"
            />
            <h1 className="text-xl font-bold">Registro en Workstaff</h1>

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
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" required />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="photo">Foto / DNI</Label>
                  <Input id="photo" type="file" accept="image/*" />
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
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="cif">CIF / NIF</Label>
                  <Input
                    id="cif"
                    type="text"
                    placeholder="B12345678"
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="email">Correo de contacto</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@empresa.com"
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" required />
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
              <a href="#" className="text-red-500 hover:text-red-400">
                Términos de servicio
              </a>{" "}
              y nuestra{" "}
              <a href="#" className="text-red-500 hover:text-red-400">
                Política de privacidad
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}