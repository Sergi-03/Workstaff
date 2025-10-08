"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => router.push("/login"), 3000);
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

        <h1 className="text-[2.0rem] mt-[-40px] mb-6 text-center select-none outline-none font-bold text-muted-foreground">
          GENERA MÁS INGRESOS HACIENDO CLICK
        </h1>

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