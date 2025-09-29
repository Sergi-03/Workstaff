"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  Edit,
  Eye,
  MapPin,
  Clock,
  Euro,
  Upload,
  X,
  Briefcase,
  FileText,
  Tag,
  Image as ImageIcon,
  Save,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

export default function EditJobView() {
  const router = useRouter();
  const params = useParams();
  const { jobId } = params;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    requiredSkills: [],
    duration: "",
    salary: "",
    image: null,
    removeImage: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return router.replace("/login");

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setJob(data.job);
        setFormData({
          title: data.job.title || "",
          description: data.job.description || "",
          location: data.job.location || "",
          requiredSkills: data.job.requiredSkills || [],
          duration: data.job.duration || "",
          salary: data.job.salary || "",
          image: null,
          removeImage: false,
        });
      })
      .catch(() => toast.error("Error cargando la oferta"))
      .finally(() => setLoading(false));
  }, [jobId, router]);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (type === "file") setFormData({ ...formData, image: files[0] });
    else if (type === "checkbox") setFormData({ ...formData, [name]: checked });
    else setFormData({ ...formData, [name]: value });
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    setFormData({ ...formData, requiredSkills: skills });
  };

  const removeSkill = (skillIndex) => {
    const updatedSkills = formData.requiredSkills.filter(
      (_, index) => index !== skillIndex
    );
    setFormData({ ...formData, requiredSkills: updatedSkills });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title?.trim() || formData.title.length < 3) {
      toast.error("El título debe tener al menos 3 caracteres");
      return;
    }

    if (!formData.description?.trim() || formData.description.length < 20) {
      toast.error("La descripción debe tener al menos 20 caracteres");
      return;
    }

    if (!formData.location?.trim() || formData.location.length < 3) {
      toast.error("La ubicación debe tener al menos 3 caracteres");
      return;
    }

    if (formData.requiredSkills.length === 0) {
      toast.error("Debes añadir al menos una habilidad");
      return;
    }

    if (
      formData.salary &&
      (isNaN(parseFloat(formData.salary)) || parseFloat(formData.salary) < 0)
    ) {
      toast.error("El salario debe ser un número válido mayor o igual a 0");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("access_token");
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "requiredSkills") {
        data.append(key, value.join(","));
      } else if (key === "image" && value) {
        data.append(key, value);
      } else if (key !== "image") {
        data.append(key, value);
      }
    });

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs/${jobId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al actualizar");
      toast.success("Oferta actualizada correctamente");
      router.push(`/company/jobs/${jobId}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs/${jobId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Error eliminando la oferta");
      toast.success("Oferta eliminada");
      router.push("/company/dashboard");
    } catch (err) {
      toast.error(err.message);
      setIsDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in-up p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                Oferta no encontrada
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                La oferta que buscas no existe o ha sido eliminada.
              </p>
              <Button
                onClick={() => router.push("/company/jobs")}
                className="mt-4"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a ofertas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background select-none">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/company/jobs/${jobId}`)}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold">Editar Oferta</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Información de la oferta
                </CardTitle>
                <CardDescription>
                  Completa todos los campos para actualizar la oferta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Título
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Desarrollador Frontend React"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe las responsabilidades y requisitos del puesto..."
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={8}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="location"
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        Ubicación
                      </Label>
                      <Input
                        id="location"
                        name="location"
                        placeholder="Madrid, España"
                        value={formData.location}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="duration"
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Duración
                      </Label>
                      <Input
                        id="duration"
                        name="duration"
                        placeholder="Tiempo completo"
                        value={formData.duration}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary" className="flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Salario (€/mes)
                    </Label>
                    <Input
                      id="salary"
                      name="salary"
                      type="number"
                      placeholder="2500"
                      value={formData.salary || ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="skills" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Habilidades requeridas
                    </Label>
                    <Input
                      id="skills"
                      name="requiredSkills"
                      placeholder="Ej: Atención al cliente, Cocina, Limpieza..."
                      value={formData.requiredSkills.join(", ")}
                      onChange={handleSkillsChange}
                    />
                    {formData.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.requiredSkills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="gap-1">
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(i)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Imagen
                    </Label>

                    {(formData.image ||
                      (job.imageUrl && !formData.removeImage)) && (
                      <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={
                              formData.image
                                ? URL.createObjectURL(formData.image)
                                : job.imageUrl
                            }
                            className="object-cover"
                          />
                          <AvatarFallback>IMG</AvatarFallback>
                        </Avatar>
                        {job.imageUrl && !formData.image && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="removeImage"
                              checked={formData.removeImage}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  removeImage: checked,
                                })
                              }
                            />
                            <Label
                              htmlFor="removeImage"
                              className="text-sm cursor-pointer"
                            >
                              Eliminar imagen actual
                            </Label>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-2 border-dashed rounded-lg p-8">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                          <Label htmlFor="image" className="cursor-pointer">
                            <span className="font-semibold">
                              Haz clic para subir
                            </span>{" "}
                            o arrastra una imagen
                          </Label>
                          <Input
                            id="image"
                            type="file"
                            name="image"
                            onChange={handleChange}
                            className="hidden"
                            accept="image/*"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          PNG, JPG hasta 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/company/jobs/${jobId}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver detalles
                  </Button>

                  <Separator />

                  <AlertDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. La oferta "
                          {job.title}" será eliminada permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white"
                          disabled={deleting}
                        >
                          {deleting ? "Eliminando" : "Eliminar"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant="outline">Activa</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creada:</span>
                    <span>
                      {job.createdAt
                        ? new Date(job.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{jobId}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
