"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";
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
  MapPin,
  Trash2,
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
});

export default function EditJobForm() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [currentSkillName, setCurrentSkillName] = useState("");
  const [currentSkillLevel, setCurrentSkillLevel] = useState("BASICO");
  const [currentSkillWeight, setCurrentSkillWeight] = useState(3);
  const [currentSkillRequired, setCurrentSkillRequired] = useState(true);
  const [availableSkills, setAvailableSkills] = useState([]);

  const SKILL_LEVELS = [
    { value: "BASICO", label: "Básico" },
    { value: "INTERMEDIO", label: "Intermedio" },
    { value: "AVANZADO", label: "Avanzado" },
    { value: "EXPERTO", label: "Experto" },
  ];

  const form = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      duration: "",
    },
  });

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/skills`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAvailableSkills(data.skills);
        }
      } catch (err) {
        console.error("Error cargando skills:", err);
        toast.error("Error cargando habilidades disponibles");
      }
    };

    const loadJobData = async () => {
      if (!jobId) {
        router.replace("/company/jobs");
        return;
      }

      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs/${jobId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error("Error al cargar la oferta");
        }

        const data = await response.json();
        const job = data.job;

        form.reset({
          title: job.title,
          description: job.description,
          location: job.location,
          duration: job.duration || "",
        });

        if (job.imageUrl) {
          setImagePreview(job.imageUrl);
        }

        if (job.requiredSkills && job.requiredSkills.length > 0) {
          const formattedSkills = job.requiredSkills.map((skill) => ({
            name: skill.name,
            level: skill.level || "BASICO",
            weight: skill.weight || 3,
            isRequired: skill.isRequired !== false,
          }));
          setRequiredSkills(formattedSkills);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("Error al cargar la oferta");
        router.replace("/company/jobs");
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
    loadJobData();
  }, [jobId, router, form]);

  const addRequiredSkill = () => {
    if (!currentSkillName) {
      toast.error("Selecciona una habilidad");
      return;
    }

    const skillExists = requiredSkills.find((s) => s.name === currentSkillName);
    if (skillExists) {
      toast.error("Esta habilidad ya está añadida");
      return;
    }

    setRequiredSkills([
      ...requiredSkills,
      {
        name: currentSkillName,
        level: currentSkillLevel,
        weight: currentSkillWeight,
        isRequired: currentSkillRequired,
      },
    ]);

    setCurrentSkillName("");
    setCurrentSkillLevel("BASICO");
    setCurrentSkillWeight(3);
    setCurrentSkillRequired(true);
  };

  const removeRequiredSkill = (skillName) => {
    setRequiredSkills(requiredSkills.filter((s) => s.name !== skillName));
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

  const handleDeleteJob = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs/${jobId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar la oferta");
      }

      toast.success("Oferta eliminada correctamente");
      router.push("/company/dashboard");
    } catch (error) {
      console.error("Error eliminando:", error);
      toast.error(error.message || "Error al eliminar la oferta");
    } finally {
      setDeleting(false);
    }
  };

  const onSubmit = async (data) => {
    if (requiredSkills.length === 0) {
      toast.error("Debes añadir al menos una habilidad requerida");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("location", data.location);
      formData.append("requiredSkillsData", JSON.stringify(requiredSkills));

      if (data.duration) {
        formData.append("duration", data.duration);
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs/${jobId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar la oferta");
      }

      toast.success("Oferta actualizada correctamente");
      router.push(`/company/jobs/${jobId}`);
    } catch (error) {
      console.error("Error actualizando:", error);
      toast.error(error.message || "Error al actualizar la oferta");
    } finally {
      setSubmitting(false);
    }
  };

  const durationOptions = [
    { value: "4-8 horas", label: "4-8 horas (1 jornada)" },
    { value: "16-24 horas", label: "16-24 horas (2-3 días)" },
    { value: "40 horas", label: "40 horas (1 semana)" },
    { value: "80 horas", label: "80 horas (2 semanas)" },
    { value: "160 horas", label: "160 horas (1 mes)" },
    { value: "320 horas", label: "320 horas (2 meses)" },
    { value: "A convenir", label: "A convenir" },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in-up p-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up p-6 max-w-4xl mx-auto space-y-6 select-none">
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
            <h1 className="text-2xl font-bold">Editar Oferta</h1>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta oferta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La oferta se eliminará
                permanentemente y no podrás recuperarla.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteJob}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>
              Actualiza los detalles de tu oferta de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título del puesto *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Camarero/a"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  placeholder="Ej: Barcelona"
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
                placeholder="Describe las responsabilidades y requisitos..."
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
              Duración estimada del trabajo (Salario: 10€/hora)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Duración estimada
              </Label>
              <Select
                onValueChange={(value) => form.setValue("duration", value)}
                defaultValue={form.getValues("duration") || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
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

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Tarifa fija:</span>
                <span className="text-lg font-bold text-primary">10€/hora</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                El salario está establecido en 10€ por hora trabajada según el
                modelo de WorkStaff
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Habilidades Requeridas *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <Select
                value={currentSkillName}
                onValueChange={setCurrentSkillName}
              >
                <SelectTrigger className="md:col-span-2">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    availableSkills.reduce((acc, skill) => {
                      if (!acc[skill.category]) acc[skill.category] = [];
                      acc[skill.category].push(skill.name);
                      return acc;
                    }, {})
                  ).map(([category, skills]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {skills.map((skillName) => (
                        <SelectItem key={skillName} value={skillName}>
                          {skillName}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={currentSkillLevel}
                onValueChange={setCurrentSkillLevel}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={currentSkillWeight.toString()}
                onValueChange={(v) => setCurrentSkillWeight(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Baja</SelectItem>
                  <SelectItem value="2">Media-Baja</SelectItem>
                  <SelectItem value="3">Media</SelectItem>
                  <SelectItem value="4">Alta</SelectItem>
                  <SelectItem value="5">Crítica</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={currentSkillRequired.toString()}
                onValueChange={(v) => setCurrentSkillRequired(v === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Obligatoria</SelectItem>
                  <SelectItem value="false">Deseable</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addRequiredSkill}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </Button>
              </div>
            </div>

            {requiredSkills.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">
                  Habilidades actuales ({requiredSkills.length})
                </Label>
                <div className="space-y-2">
                  {requiredSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{skill.name}</span>
                          {skill.isRequired ? (
                            <Badge className="text-xs">Obligatoria</Badge>
                          ) : (
                            <Badge className="text-xs">Deseable</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>Nivel: {skill.level}</span>
                          <span>·</span>
                          <span>{"⭐".repeat(skill.weight)} Importancia</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRequiredSkill(skill.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {requiredSkills.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Añade al menos una habilidad requerida para esta oferta
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagen de la Oferta</CardTitle>
            <CardDescription>
              Actualiza la imagen representativa (opcional)
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
            disabled={submitting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            {submitting ? "Actualizando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}