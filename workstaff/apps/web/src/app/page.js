"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {

  const [animate, setAnimate] = useState(false);
  const router = useRouter()

  useEffect(() => {
  setAnimate(true)
  const timer = setTimeout(() => router.push("/login"), 2000);
  return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex flex-col items-center justify-start min-h-screen gap-16 px-8 sm:px-20">
      <div
        className={`transition-all duration-700 ease-out transform
          ${animate ? "opacity-100 scale-110 -translate-y-2" : "opacity-0 scale-75 translate-y-10"}
          animate-bounce-slow
        `}
      >
    <Image 
    src="/wstaff-logo.jpeg" 
    alt="logo workstaff" 
    width={500} 
    height={150} 
    ></Image>
    </div>
    </div>
  );
}