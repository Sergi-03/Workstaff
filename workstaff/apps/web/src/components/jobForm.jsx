"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  X,
  Upload,
  MapPin,
  Euro,
  Calendar,
  Briefcase,
  Image as ImageIcon,
  Plus,
  ArrowLeft,
} from "lucide-react";

const jobSchema = z.object({
  title: z
    .string()
    .min(1, "El título es obligatorio")
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título no puede exceder 100 caracteres"),
  description: z
    .string()
    .min(1, "La descripción es obligatoria")
    .min(20, "La descripción debe tener al menos 20 caracteres")
    .max(2000, "La descripción no puede exceder 2000 caracteres"),
  location: z
    .string()
    .min(1, "La ubicación es obligatoria")
    .min(3, "La ubicación debe tener al menos 3 caracteres")
    .max(100, "La ubicación no puede exceder 100 caracteres"),
  duration: z.string().optional(),
  salary: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 1000000;
    }, "El salario debe ser un número válido entre 0 y 1,000,000"),
});

export default function CreateJobForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const form = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      duration: "",
      salary: "",
    },
  });

  const durationOptions = [
    { value: "1-3 meses", label: "1-3 meses" },
    { value: "3-6 meses", label: "3-6 meses" },
    { value: "6-12 meses", label: "6-12 meses" },
    { value: "Más de 1 año", label: "Más de 1 año" },
    { value: "Indefinido", label: "Indefinido" },
    { value: "Por proyecto", label: "Por proyecto" },
  ];

  const addSkill = () => {
    const trimmedSkill = currentSkill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill) && skills.length < 10) {
      setSkills([...skills, trimmedSkill]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no puede superar los 5MB");
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Solo se permiten imágenes JPG, PNG o WebP");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("location", data.location);
      formData.append("requiredSkills", JSON.stringify(skills));

      if (data.duration) {
        formData.append("duration", data.duration);
      }

      if (data.salary) {
        formData.append("salary", data.salary);
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al crear la oferta");
      }

      toast.success("Oferta creada correctamente");
      router.push("/company/dashboard");
    } catch (error) {
      console.error("Error creando oferta:", error);
      toast.error(error.message || "Error al crear la oferta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up p-6 max-w-4xl mx-auto space-y-6 select-none">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Crear Nueva Oferta</h1>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>
              Completa los detalles principales de tu oferta de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Título del puesto *
                </Label>
                <Input
                  id="title"
                  placeholder="Ej: Camarero/a, Cocinero/a, Recepcionista de Hotel"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ubicación *
                </Label>
                <Input
                  id="location"
                  placeholder="Ej: Barcelona, Madrid, Sevilla"
                  {...form.register("location")}
                />
                {form.formState.errors.location && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción del puesto *</Label>
              <Textarea
                id="description"
                placeholder="Ej: Atender clientes en restaurante, preparar platos según carta, gestionar reservas, mantener limpieza del área, trabajo en equipo..."
                rows={6}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Contrato</CardTitle>
            <CardDescription>
              Información sobre duración y compensación (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Duración
                </Label>
                <Select
                  onValueChange={(value) => form.setValue("duration", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la duración" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary" className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Salario (€/mes)
                </Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  max="1000000"
                  step="100"
                  placeholder="2500"
                  {...form.register("salary")}
                />
                {form.formState.errors.salary && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.salary.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Habilidades Requeridas</CardTitle>
            <CardDescription>
              Añade las habilidades y competencias necesarias para el puesto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ej:  Atención al cliente, Cocina mediterránea, Gestión de reservas, Limpieza, Trabajo en equipo..."
                className="flex-1"
                maxLength={30}
              />
              <Button
                type="button"
                onClick={addSkill}
                disabled={!currentSkill.trim() || skills.length >= 10}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 py-1 px-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {skills.length}/10 habilidades añadidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagen de la Oferta</CardTitle>
            <CardDescription>
              Añade una imagen representativa (opcional, máx. 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                        Selecciona una imagen
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        PNG, JPG, WebP hasta 5MB
                      </span>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? "Creando oferta..." : "Crear oferta"}
          </Button>
        </div>
      </form>
    </div>
  );
}