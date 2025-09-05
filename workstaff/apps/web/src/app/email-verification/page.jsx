"use client";
import { useEffect, useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmailVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("signup_email");
    if (storedEmail) {
      setEmail(storedEmail);
      localStorage.removeItem("signup_email");
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden">
      <div className="animate-fade-in-up">
        <Card className="w-full max-w-md bg-zinc-900 border-none">
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-red-500" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              ¡Correo enviado!
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Hemos enviado un enlace de verificación
              {email && (
                <>
                  {" "}
                  a <span className="font-medium text-white">{email}</span>
                </>
              )}
            </p>

            <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Si has creado una cuenta recientemente, revisa tu correo
                electrónico y sigue el enlace de verificación. Si aún no lo has
                hecho, puedes{" "}
                <Link
                  href="/signup"
                  className="text-red-500 hover:text-red-400 underline underline-offset-2"
                >
                  registrarte aquí
                </Link>
              </p>
            </div>

            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio de sesión
            </Button>

            <div className="mt-6 text-center text-xs text-muted-foreground *:[a]:underline *:[a]:underline-offset-4">
              <span>¿Necesitas ayuda?</span>
              <Link href="#" className="ml-1 text-red-500 hover:text-red-400">
                Contacta con nuestro soporte
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}