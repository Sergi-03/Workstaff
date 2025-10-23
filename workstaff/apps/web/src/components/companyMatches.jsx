"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Star,
  Users,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

export default function CompanyMatches() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (!token || role !== "COMPANY") {
      router.replace("/login");
      return;
    }

    loadJobs();
  }, [router]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar ofertas");
      }

      const data = await response.json();
      setJobs(data.jobs);

      if (data.jobs.length > 0) {
        setSelectedJobId(data.jobs[0].id);
        loadMatches(data.jobs[0].id);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar ofertas");
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async (jobId) => {
    setLoadingMatches(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs/${jobId}/matches?limit=20&minScore=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar candidatos");
      }

      const data = await response.json();
      setMatches(data.matches);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar candidatos");
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleJobChange = (jobId) => {
    setSelectedJobId(jobId);
    loadMatches(jobId);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadgeVariant = (score) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  const selectedJob = jobs.find((job) => job.id === selectedJobId);

  if (loading) {
    return (
      <div className="animate-fade-in-up p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up p-6 max-w-7xl mx-auto space-y-6 select-none">
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

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold">Candidatos Ideales</h1>
            <p className="text-muted-foreground">
              Los mejores perfiles para tus ofertas
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">
                  No hay ofertas activas
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crea tu primera oferta para ver candidatos recomendados.
                </p>
                <Button
                  onClick={() => router.push("/company/jobs/create")}
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white"
                >
                  Crear Oferta
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">
                    Selecciona una oferta para ver candidatos
                  </span>
                </div>
                <Select value={selectedJobId} onValueChange={handleJobChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una oferta" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{job.title}</span>
                          <span className="text-xs text-muted-foreground">
                            • {job.location}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedJob && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {selectedJob.applicationsCount} aplicaciones
                      </span>
                      <Separator
                        orientation="vertical"
                        className="h-4 hidden sm:block"
                      />
                      <span className="text-muted-foreground">
                        {matches.length} candidatos compatibles
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() =>
                        router.push(`/company/jobs/${selectedJobId}`)
                      }
                    >
                      Ver Oferta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {loadingMatches ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : matches.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">
                      No hay candidatos compatibles
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Aún no hay trabajadores que coincidan con esta oferta.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {matches.map((match) => {
                  const worker = match.WorkerProfile;
                  const score = match.overallScore;

                  return (
                    <Card
                      key={match.id}
                      className="group hover:shadow-xl transition-all duration-300 hover:border-red-500/50"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={worker.photoUrl} />
                              <AvatarFallback className="text-lg">
                                {worker.fullname.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div>
                                <CardTitle className="text-xl group-hover:text-red-500 transition-colors">
                                  {worker.fullname}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {worker.location ||
                                    "Ubicación no especificada"}
                                </CardDescription>
                              </div>

                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                {worker.totalYearsExperience > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    {worker.totalYearsExperience} años de
                                    experiencia
                                  </span>
                                )}
                                {worker.user?.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    Contacto disponible
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right space-y-2">
                            <div
                              className={`text-4xl font-bold ${getScoreColor(
                                score
                              )}`}
                            >
                              {score}%
                            </div>
                            <Badge
                              variant={getScoreBadgeVariant(score)}
                              className="w-full justify-center"
                            >
                              <Star className="h-3 w-3 mr-1" />
                              {score >= 80
                                ? "Excelente"
                                : score >= 60
                                ? "Bueno"
                                : "Aceptable"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {worker.experienceDescription && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {worker.experienceDescription}
                          </p>
                        )}

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Habilidades</span>
                              <span
                                className={getScoreColor(match.skillsScore)}
                              >
                                {match.skillsScore.toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={match.skillsScore}
                              className="h-2"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Ubicación</span>
                              <span
                                className={getScoreColor(match.locationScore)}
                              >
                                {match.locationScore.toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={match.locationScore}
                              className="h-2"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Experiencia</span>
                              <span
                                className={getScoreColor(match.experienceScore)}
                              >
                                {match.experienceScore.toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={match.experienceScore}
                              className="h-2"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Requisitos
                            </p>
                            <p
                              className={`text-sm font-medium ${
                                match.meetsMinimumRequirements
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {match.meetsMinimumRequirements ? "✓" : "✗"}{" "}
                              Cumple requisitos
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Ubicación
                            </p>
                            <p
                              className={`text-sm font-medium ${
                                match.locationCompatible
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {match.locationCompatible ? "✓" : "⚠"}{" "}
                              {match.locationCompatible
                                ? "Compatible"
                                : "Diferente"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Disponibilidad
                            </p>
                            <p
                              className={`text-sm font-medium ${
                                match.availabilityCompatible
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {match.availabilityCompatible ? "✓" : "⚠"}{" "}
                              {match.availabilityCompatible
                                ? "Inmediata"
                                : "Limitada"}
                            </p>
                          </div>
                        </div>

                        {match.matchedSkills.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Habilidades que cumple (
                              {match.matchedSkills.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {match.matchedSkills.map((skill, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs border-green-500/50 text-green-700 dark:text-green-400"
                                >
                                  {skill.name}
                                  {skill.has && (
                                    <span className="ml-1 text-xs">
                                      • {skill.has}
                                    </span>
                                  )}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {match.missingSkills.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-1">
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                              Habilidades pendientes (
                              {match.missingSkills.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {match.missingSkills
                                .slice(0, 5)
                                .map((skill, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs border-yellow-500/50 text-yellow-700 dark:text-yellow-400"
                                  >
                                    {skill.name}
                                    {skill.has && (
                                      <span className="ml-1 text-xs">
                                        • tiene {skill.has}
                                      </span>
                                    )}
                                  </Badge>
                                ))}
                              {match.missingSkills.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{match.missingSkills.length - 5} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {match.strengths.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">
                              ✓ Fortalezas del candidato
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {match.strengths.map((strength, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-1 rounded"
                                >
                                  {strength}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {match.weaknesses.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                              ⚠ Consideraciones
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {match.weaknesses.map((weakness, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded"
                                >
                                  {weakness}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator />

                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => {
                              if (worker.user?.email) {
                                window.location.href = `mailto:${worker.user.email}`;
                              } else {
                                toast.info("Email no disponible");
                              }
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Contactar
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              const jobId = selectedJobId;
                              router.push(`/company/workers/${worker.id}?jobId=${jobId}`);
                            }}
                          >
                            Ver Perfil Completo
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}