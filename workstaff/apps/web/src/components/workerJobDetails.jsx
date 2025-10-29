"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Euro,
  Calendar,
  Clock,
  Briefcase,
  Building,
  Users,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

export default function WorkerJobDetailView() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (!token || role !== "WORKER") {
      router.replace("/login");
      return;
    }

    if (!jobId) {
      router.replace("/worker/jobs");
      return;
    }

    loadJobDetails();
  }, [router, jobId]);

  const loadJobDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/worker/jobs/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Oferta no encontrada");
          router.replace("/worker/jobs");
          return;
        }
        throw new Error("Error al cargar los detalles de la oferta");
      }

      const data = await response.json();
      setJob(data.job);
    } catch (error) {
      console.error("Error cargando detalles:", error);
      toast.error("Error al cargar los detalles de la oferta");
      router.replace("/worker/jobs");
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (salary) => {
    if (!salary) return "No especificado";
    return `${salary.toLocaleString()}€/mes`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="animate-fade-in-up p-6 max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="animate-fade-in-up p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-semibold">Oferta no encontrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            La oferta que buscas no existe o ya no está disponible.
          </p>
          <Button onClick={() => router.push("/worker/jobs")} className="mt-4">
            Volver a Ofertas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up p-6 max-w-6xl mx-auto space-y-6 select-none">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-start sm:items-center gap-3 flex-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold line-clamp-2">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                <span className="truncate">{job.company.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{job.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Publicado {formatDate(job.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2  lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descripción del Puesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.imageUrl && (
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
                  <img
                    src={job.imageUrl}
                    alt={job.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap break-words">
                  {job.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Habilidades Requeridas ({job.requiredSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {job.requiredSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <div>
                        <div className="font-medium text-sm">{skill.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Nivel: {skill.level}
                          {skill.isRequired ? " • Obligatoria" : " • Deseable"}
                        </div>
                      </div>
                      <Badge variant={skill.isRequired ? "default" : "default"}>
                        {skill.isRequired ? "Requerida" : "Opcional"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {job.company.logoUrl ? (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={job.company.logoUrl} />
                    <AvatarFallback>
                      {job.company.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Building className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {job.company.name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Oferta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.salary && (
                <div className="flex items-center gap-3">
                  <Euro className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {formatSalary(job.salary)}
                    </div>
                    <div className="text-sm text-muted-foreground">Salario</div>
                  </div>
                </div>
              )}

              {job.duration && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{job.duration}</div>
                    <div className="text-sm text-muted-foreground">
                      Duración
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{job.location}</div>
                  <div className="text-sm text-muted-foreground">Ubicación</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{formatDate(job.createdAt)}</div>
                  <div className="text-sm text-muted-foreground">
                    Fecha de publicación
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Candidatos</span>
                </div>
                <Badge variant="secondary">{job.applicationsCount}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-muted">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Las aplicaciones se gestionarán próximamente mediante un
                  sistema externo
                </p>
                <Button disabled className="w-full" variant="outline">
                  Aplicar (Próximamente)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}