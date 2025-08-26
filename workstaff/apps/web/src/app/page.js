"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
  setTimeout(() => router.push("/login"), 4000);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-16 px-8 sm:px-20">
      <div className={`animate-fade-in-up -mt-30`}>
        <Image
          src="/logo.png"
          alt="logo workstaff"
          width={500}
          height={150}
          draggable={false}
          className="select-none outline-none mx-auto"
        />

        <h1 className="text-[1.5rem] mt-[-40px] mb-6 text-center select-none outline-none font-bold text-gray-300">
          GENERA MÁS INGRESOS HACIENDO CLICK
        </h1>

        <p className="text-gray-300 text-lg mb-8 select-none">
          Conectamos trabajadores de hostelería con empresas al instante
        </p>

        <div className="flex items-center justify-center gap-4 text-gray-300 text-base mb-8 select-none">
          <span>Contratos automáticos</span>
          <span className="text-red-500">•</span>
          <span>Pagos seguros</span>
          <span className="text-red-500">•</span>
          <span>Disponibilidad 24/7</span>
        </div>

        <div className="text-sm italic select-none flex items-center justify-center gap-1">
          <span>Accediendo</span>
          <span className="text-red-500 animate-bounce">.</span>
          <span
            className="text-red-500 animate-bounce"
            style={{ animationDelay: "0.1s" }}
          >
            .
          </span>
          <span
            className="text-red-500 animate-bounce"
            style={{ animationDelay: "0.2s" }}
          >
            .
          </span>
        </div>
      </div>
    </div>
  );
}
