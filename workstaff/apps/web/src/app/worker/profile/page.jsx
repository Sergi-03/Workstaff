"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { apiFetch, getAuth } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function WorkerProfilePage() {
  const router = useRouter();
  const search = useSearchParams();
  const onboarding = search.get("onboarding") === "1";

  const [profile, setProfile] = useState(null);
  const [fullname, setFullname] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");
  const [certificates, setCertificates] = useState("");

  useEffect(() => {
    const { token, role } = getAuth();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (role !== "WORKER") {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        const data = await apiFetch("/api/auth/worker/profile", {
          method: "GET",
        });
        setProfile(data);
        setFullname(data.fullname || "");
        setExperience(data.experience || "");
        setSkills((data.skills || []).join(", "));
        setAvailability((data.availability || []).join(", "));
        setCertificates((data.certificates || []).join(", "));
      } catch (err) {
        toast.error(err.message || "Error cargando perfil");
      }
    })();
  }, [router]);

  const onSave = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/auth/worker/profile", {
        method: "PUT",
        body: {
          fullname,
          experience,
          skills,
          availability,
          certificates,
        },
      });
      toast.success("Perfil actualizado");
      if (onboarding) {
        router.push("/worker/dashboard");
      }
    } catch (err) {
      toast.error(err.message || "Error al actualizar");
    }
  };

  return (
    <div className={`animate-fade-in-up`}>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {onboarding ? (
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
            <h1 className="text-xl mb-10 select-none font-bold">
            Completa tu perfil para comenzar a postularte a trabajos
            </h1>
          </div>
        ) : null}

        <h1 className="text-2xl font-semibold">Tu perfil</h1>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nombre completo</label>
            <Input
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Experiencia</label>
            <Textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Habilidades (separadas por comas)
            </label>
            <Input
              placeholder="Ej: camarero, cocktail, TPV"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Disponibilidad (separada por comas)
            </label>
            <Input
              placeholder="Ej: lunes tarde, viernes noche"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Certificados (separados por comas)
            </label>
            <Input
              placeholder="Ej: manipulador alimentos, PRL"
              value={certificates}
              onChange={(e) => setCertificates(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
