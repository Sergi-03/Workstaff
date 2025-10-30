"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, getAuth } from "@/lib/api";
import Image from "next/image";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

function CompanyProfileContent() {
  const router = useRouter();
  const search = useSearchParams();
  const onboarding = search.get("onboarding") === "1";

  const savedUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const initialUser = savedUser ? JSON.parse(savedUser) : {};

  const [profile, setProfile] = useState(null);
  const [name, setName] = useState(initialUser.name || "");
  const [cif, setCif] = useState(initialUser.cif || "");
  const [contactInfo, setContactInfo] = useState(initialUser.email || "");
  const [phone, setPhone] = useState(initialUser.phone || "");
  const [logoUrl, setLogoUrl] = useState(initialUser.logoUrl);
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonRole, setContactPersonRole] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const logoInputRef = useRef(null);

  const validateCIF = (cif) => {
    const cifRegex = /^[A-Z]\d{8}$/i;
    return cifRegex.test(cif.trim());
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/[^\d+]/g, "");
    const digitCount = cleaned.replace(/\+/g, "").length;

    if (digitCount < 9 || digitCount > 15) {
      return false;
    }
    return /^\+?\d{9,15}$/.test(cleaned);
  };

  useEffect(() => {
    const { token, role } = getAuth();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (role !== "COMPANY") {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        const data = await apiFetch("/api/auth/company/profile", {
          method: "GET",
        });
        setProfile(data);
        setName(data.name || "");
        setCif(data.cif || "");
        setContactInfo(data.contactInfo || "");
        setPhone(data.phone || data.user?.phone || "");
        setLogoUrl(data.logoUrl || "");
        setDescription(data.description || "");
        setWebsite(data.website || "");
        setContactPersonName(
          data.contactPersonName === "N/A" ? "" : data.contactPersonName || ""
        );
        setContactPersonRole(
          data.contactPersonRole === "N/A" ? "" : data.contactPersonRole || ""
        );
        setFullAddress(
          data.fullAddress === "N/A" ? "" : data.fullAddress || ""
        );
      } catch (err) {
        toast.error(err.message || "Error cargando perfil");
      }
    })();
  }, [router]);

  const handleLogoChange = (event) => {
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

      setLogoFile(file);

      const reader = new FileReader();
      reader.onload = (e) => setLogoUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (logoFile) {
      const formData = new FormData();
      formData.append("file", logoFile);

      try {
        const res = await apiFetch("/api/auth/company/profile/logo", {
          method: "PUT",
          body: formData,
        });

        if (!res.logoUrl) {
          throw new Error("No se pudo subir el logo");
        }

        setLogoUrl(res.logoUrl);
        setLogoFile(null);
        toast.success("Logo subido correctamente");
      } catch (error) {
        throw new Error("Error al subir el logo");
      }
    }
  };

  const onSave = async (e) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !cif.trim() ||
      !contactInfo.trim() ||
      !phone.trim() ||
      !contactPersonName.trim() ||
      !contactPersonRole.trim() ||
      !fullAddress.trim()
    ) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    if (!validateCIF(cif)) {
      toast.error(
        "Formato de CIF inválido. Debe ser una letra seguida de 8 números (ej: B12345678)"
      );
      return;
    }

    if (!validateEmail(contactInfo)) {
      toast.error("Formato de email inválido");
      return;
    }

    if (!validatePhone(phone)) {
      toast.error("Formato de teléfono inválido");
      return;
    }

    setUploading(true);

    try {
      if (logoFile) {
        await uploadLogo();
      }

      await apiFetch("/api/auth/company/profile", {
        method: "PUT",
        body: {
          name: name.trim(),
          cif: cif.trim().toUpperCase(),
          contactInfo: contactInfo.trim().toLowerCase(),
          phone: phone.trim(),
          description: description.trim(),
          website: website.trim(),
          contactPersonName: contactPersonName.trim(),
          contactPersonRole: contactPersonRole.trim(),
          fullAddress: fullAddress.trim(),
        },
      });

      toast.success("Perfil actualizado");
      if (onboarding) {
        router.push("/company/dashboard");
      }
    } catch (err) {
      toast.error(err.message || "Error al actualizar el perfil");
    } finally {
      setUploading(false);
    }
  };

  const completed = [
    name,
    cif,
    contactInfo,
    phone,
    description,
    website,
    contactPersonName,
    contactPersonRole,
    fullAddress,
    logoUrl,
  ].filter(Boolean).length;
  const progress = Math.min((completed / 10) * 100, 100);

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
            Completa tu perfil de empresa para comenzar a publicar trabajos
          </h1>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <label className="block text-sm mb-1">Progreso del perfil</label>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(progress)}% completo
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={logoUrl} />
            <AvatarFallback>{name ? name[0] : "?"}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploading}
            >
              {logoFile
                ? "Cambiar logo"
                : logoUrl
                ? "Actualizar logo"
                : "Subir logo"}
            </Button>
            {logoFile && (
              <p className="text-xs text-green-600">
                Archivo seleccionado: {logoFile.name}
              </p>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />
        </div>

        <h1 className="text-2xl font-semibold">Perfil de tu empresa</h1>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">
              Nombre de la empresa <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Restaurante La Tasca S.L."
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              CIF/NIF <span className="text-red-500">*</span>
            </label>
            <Input
              value={cif}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                if (/^[A-Z]?\d{0,8}$/.test(value)) {
                  setCif(value);
                }
              }}
              placeholder="Ej: B12345678"
              maxLength={9}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Introduce el CIF o NIF de tu empresa (9 caracteres)
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Descripción de la empresa
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu empresa, sector, valores..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ayuda a los candidatos a conocer mejor tu empresa
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">Sitio web</label>
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.tuempresa.com"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL de tu página web corporativa (opcional)
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Dirección completa de la empresa{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="Calle, número, código postal, ciudad"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Dirección fiscal o principal de la empresa
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Nombre de la persona de contacto{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
              placeholder="Ej: María García"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Persona responsable de RRHH o contratación
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Rol de la persona de contacto{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={contactPersonRole}
              onChange={(e) => setContactPersonRole(e.target.value)}
              placeholder="Ej: Responsable de RRHH, Gerente"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cargo de la persona de contacto
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Email de contacto <span className="text-red-500">*</span>
            </label>
            <Input
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              type="email"
              placeholder="contacto@empresa.com"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tu email oficial de contacto
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Teléfono de contacto <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 900 123 456"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tu número de teléfono para contacto rápido
            </p>
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

export default function CompanyProfilePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CompanyProfileContent />
    </Suspense>
  );
}