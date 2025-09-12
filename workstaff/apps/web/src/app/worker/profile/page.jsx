"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, getAuth } from "@/lib/api";
import Image from "next/image";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

function WorkerProfileContent() {
  const router = useRouter();
  const search = useSearchParams();
  const onboarding = search.get("onboarding") === "1";

  const savedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const initialUser = savedUser ? JSON.parse(savedUser) : {};

  const [profile, setProfile] = useState(null);
  const [fullname, setFullname] = useState(initialUser.fullname);
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");
  const [certificates, setCertificates] = useState("");
  const [photoUrl, setPhotoUrl] = useState(initialUser.photoUrl);
  const [idPhotoUrl, setIdPhotoUrl] = useState("");

  const [rolesExperience, setRolesExperience] = useState([]);
  const [location, setLocation] = useState("");
  const [serviceTypes, setServiceTypes] = useState("");

  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [idPhotoFile, setIdPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const profilePhotoInputRef = useRef(null);
  const idPhotoInputRef = useRef(null);

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
        const data = await apiFetch("/api/auth/worker/profile", { method: "GET" });

        setProfile(data);
        setFullname(data.fullname || fullname);
        setExperience(data.experience || "");
        setSkills((data.skills || []).join(", "));
        setAvailability((data.availability || []).join(", "));
        setCertificates((data.certificates || []).join(", "));
        setPhotoUrl(data.photoUrl || photoUrl);
        setIdPhotoUrl(data.idPhotoUrl || "");
        setRolesExperience(
          Object.entries(data.rolesExperience || {}).map(([role, years]) => ({
            role,
            years,
          }))
        );
        setLocation(data.location || "");
        setServiceTypes((data.serviceTypes || []).join(", "));
      } catch (err) {
        toast.error(err.message || "Error cargando perfil");
      }
    })();
  }, [router]);


  const handleProfilePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten archivos de imagen");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 5MB");
        return;
      }
      setProfilePhotoFile(file);

      const reader = new FileReader();
      reader.onload = (e) => setPhotoUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleIdPhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten archivos de imagen");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 5MB");
        return;
      }
      setIdPhotoFile(file);

      const reader = new FileReader();
      reader.onload = (e) => setIdPhotoUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhotos = async () => {
    const uploadPromises = [];

    if (profilePhotoFile) {
      const formData = new FormData();
      formData.append("photo", profilePhotoFile);

      uploadPromises.push(
        apiFetch("/api/auth/worker/profile/photo", {
          method: "PUT",
          body: formData,
        }).then((res) => {
          if (!res.profile?.photoUrl) {
            throw new Error("No se pudo subir la foto de perfil");
          }
          setPhotoUrl(res.profile.photoUrl);
          setProfilePhotoFile(null);
        })
      );
    }

    if (idPhotoFile) {
      const formData = new FormData();
      formData.append("idPhoto", idPhotoFile);

      uploadPromises.push(
        apiFetch("/api/auth/worker/profile/id-photo", {
          method: "PUT",
          body: formData,
        }).then((res) => {
          if (!res.profile?.idPhotoUrl) {
            throw new Error("No se pudo subir la foto de DNI");
          }
          setIdPhotoUrl(res.profile.idPhotoUrl);
          setIdPhotoFile(null);
        })
      );
    }

    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
      toast.success("Fotos subidas correctamente");
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      await uploadPhotos();

      await apiFetch("/api/auth/worker/profile", {
        method: "PUT",
        body: {
          fullname,
          experience,
          skills,
          availability,
          certificates,
          rolesExperience: Object.fromEntries(
            rolesExperience.map((r) => [r.role, r.years])
          ),
          location,
          serviceTypes,
        },
      });

      toast.success("Perfil actualizado");
      if (onboarding) router.push("/worker/dashboard");
    } catch (err) {
      toast.error(err.message || "Error al actualizar el perfil");
    } finally {
      setUploading(false);
    }
  };

  const addRole = () =>
    setRolesExperience([...rolesExperience, { role: "", years: "" }]);

  const completed = [
    fullname,
    experience,
    skills,
    availability,
    certificates,
    photoUrl,
    idPhotoUrl,
    location,
    serviceTypes,
  ].filter(Boolean).length;
  const progress = Math.min((completed / 9) * 100, 100);

  return (
    <div className="animate-fade-in-up min-h-screen pt-0">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
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

        {onboarding && (
          <h1 className="text-xl mb-6 font-bold text-center select-none">
            Completa tu perfil para comenzar a postularte a trabajos
          </h1>
        )}

        <div>
          <label className="block text-sm mb-1">Progreso del perfil</label>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(progress)}% completo
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={photoUrl} />
            <AvatarFallback>{fullname ? fullname[0] : "?"}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => profilePhotoInputRef.current?.click()}
              disabled={uploading}
            >
              {profilePhotoFile ? "Cambiar foto" : "Subir foto de perfil"}
            </Button>
            {profilePhotoFile && (
              <p className="text-xs text-green-600">
                Archivo seleccionado: {profilePhotoFile.name}
              </p>
            )}
          </div>
          <input
            ref={profilePhotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePhotoChange}
            className="hidden"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">
            Foto de DNI <span className="text-red-500">*</span>{" "}
          </label>
          {idPhotoUrl ? (
            <img
              src={idPhotoUrl}
              alt="DNI"
              className="w-40 h-24 object-cover border rounded mb-2"
            />
          ) : (
            <p className="text-xs text-gray-500 mb-2">
              No has subido tu DNI todavía
            </p>
          )}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => idPhotoInputRef.current?.click()}
              disabled={uploading}
            >
              {idPhotoFile ? "Cambiar foto de DNI" : "Subir foto de DNI"}
            </Button>
            {idPhotoFile && (
              <p className="text-xs text-green-600">
                Archivo seleccionado: {idPhotoFile.name}
              </p>
            )}
          </div>
          <input
            ref={idPhotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleIdPhotoChange}
            className="hidden"
          />
        </div>

        <h1 className="text-2xl font-semibold">Tu perfil</h1>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">
              Nombre completo <span className="text-red-500">*</span>{" "}
            </label>
            <Input
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Experiencia general</label>
            <Textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Experiencia por rol</label>
            {rolesExperience.map((r, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <Input
                  placeholder="Rol (ej: camarero)"
                  value={r.role}
                  onChange={(e) => {
                    const newRoles = [...rolesExperience];
                    newRoles[idx].role = e.target.value;
                    setRolesExperience(newRoles);
                  }}
                />
                <Input
                  placeholder="Tiempo (ej: 2 años)"
                  value={r.years}
                  onChange={(e) => {
                    const newRoles = [...rolesExperience];
                    newRoles[idx].years = e.target.value;
                    setRolesExperience(newRoles);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addRole}
            >
              + Añadir rol
            </Button>
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

          <div>
            <label className="block text-sm mb-1">
              Ubicación / zonas de trabajo
            </label>
            <Input
              placeholder="Ej: Madrid centro, Getafe"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Tipos de servicio</label>
            <Input
              placeholder="Ej: camarero, barra, eventos"
              value={serviceTypes}
              onChange={(e) => setServiceTypes(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              disabled={uploading}
            >
              {uploading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WorkerProfilePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <WorkerProfileContent />
    </Suspense>
  );
}