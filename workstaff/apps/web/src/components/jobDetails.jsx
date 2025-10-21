"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Euro,
  Calendar,
  Users,
  FileText,
  Edit,
  Clock,
  Briefcase,
  Building,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function JobDetailsView() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (!token || role !== "COMPANY") {
      router.replace("/login");
      return;
    }

    if (!jobId) {
      router.replace("/company/jobs");
      return;
    }

    loadJobDetails();
  }, [router, jobId]);

  const loadJobDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Oferta no encontrada");
          router.replace("/company/jobs");
          return;
        }
        throw new Error("Error al cargar los detalles de la oferta");
      }

      const data = await response.json();
      setJob(data.job);
    } catch (error) {
      console.error("Error cargando detalles:", error);
      toast.error("Error al cargar los detalles de la oferta");
      router.replace("/company/jobs");
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

  const getApplicationStatusIcon = (status) => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getApplicationStatusText = (status) => {
    switch (status) {
      case "ACCEPTED":
        return "Aceptada";
      case "REJECTED":
        return "Rechazada";
      default:
        return "Pendiente";
    }
  };

  const getApplicationStatusVariant = (status) => {
    switch (status) {
      case "ACCEPTED":
        return "default";
      case "REJECTED":
        return "destructive";
      default:
        return "secondary";
    }
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
            La oferta que buscas no existe o no tienes permisos para verla.
          </p>
          <Button onClick={() => router.push("/company/jobs")} className="mt-4">
            Volver a Mis Ofertas
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
          <div>
            <h1 className="text-xl sm:text-2xl font-bold line-clamp-2">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {job.company.name}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Publicado {formatDate(job.createdAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/company/jobs/${job.id}/edit`)}
            className="flex-1 sm:flex-none"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                <CardTitle>Habilidades Requeridas</CardTitle>
                <CardDescription>
                  Total de {job.requiredSkills.length} habilidades requeridas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(job.requiredSkills || []).map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {skill.name}
                          </span>
                          {skill.isRequired ? (
                            <Badge className="text-xs">
                              Obligatoria
                            </Badge>
                          ) : (
                            <Badge className="text-xs">
                              Deseable
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>
                            Nivel mínimo: <strong>{skill.level}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Importancia:{" "}
                            <strong>{"⭐".repeat(skill.weight)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Aplicaciones ({job.applicationsCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.applications.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">
                    Sin aplicaciones
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aún no hay candidatos para esta oferta.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {job.applications.map((application) => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={application.worker.photoUrl} />
                          <AvatarFallback>
                            {application.worker.fullname
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {application.worker.fullname}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            {application.worker.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {application.worker.location}
                              </span>
                            )}
                            {application.worker.experience && (
                              <span>{application.worker.experience}</span>
                            )}
                          </div>
                          {application.worker.skills &&
                            application.worker.skills.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {application.worker.skills
                                  .slice(0, 3)
                                  .map((skill, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                {application.worker.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{application.worker.skills.length - 3} más
                                  </Badge>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getApplicationStatusVariant(
                            application.status
                          )}
                        >
                          {getApplicationStatusIcon(application.status)}
                          <span className="ml-1">
                            {getApplicationStatusText(application.status)}
                          </span>
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/company/applications/${application.id}`
                            )
                          }
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Puesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.salary && (
                <div className="flex items-center gap-3">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {formatSalary(job.salary)}
                    </div>
                    <div className="text-sm text-muted-foreground">Salario</div>
                  </div>
                </div>
              )}

              {job.duration && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{job.duration}</div>
                    <div className="text-sm text-muted-foreground">
                      Duración
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{job.location}</div>
                  <div className="text-sm text-muted-foreground">Ubicación</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{formatDate(job.createdAt)}</div>
                  <div className="text-sm text-muted-foreground">
                    Fecha de publicación
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Aplicaciones</span>
                </div>
                <Badge variant="secondary">{job.applicationsCount}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Contratos</span>
                </div>
                <Badge variant="secondary">{job.contractsCount}</Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pendientes</span>
                  <span>
                    {
                      job.applications.filter((app) => app.status === "PENDING")
                        .length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Aceptadas</span>
                  <span className="text-green-600">
                    {
                      job.applications.filter(
                        (app) => app.status === "ACCEPTED"
                      ).length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rechazadas</span>
                  <span className="text-red-600">
                    {
                      job.applications.filter(
                        (app) => app.status === "REJECTED"
                      ).length
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}