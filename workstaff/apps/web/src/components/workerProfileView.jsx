"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Calendar,
  Award,
  GraduationCap,
  CheckCircle2,
  Star,
  TrendingUp,
  Phone,
  FileText,
  History,
} from "lucide-react";
import { toast } from "sonner";

export default function WorkerProfileView() {
  const router = useRouter();
  const params = useParams();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (!token || role !== "COMPANY") {
      router.replace("/login");
      return;
    }

    loadWorkerProfile();
  }, [router, params.workerId]);

  const loadWorkerProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/workers/${params.workerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar perfil");
      }

      const data = await response.json();
      setWorker(data.worker);

      const jobId = new URLSearchParams(window.location.search).get("jobId");
      if (jobId) {
        loadMatchData(jobId);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar el perfil del trabajador");
    } finally {
      setLoading(false);
    }
  };

  const loadMatchData = async (jobId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs/${jobId}/matches?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const match = data.matches.find(
          (m) => m.WorkerProfile.id === params.workerId
        );
        if (match) {
          setMatchData(match);
        }
      }
    } catch (error) {
      console.error("Error cargando match data:", error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No especificado";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  if (!worker) {
    return (
      <div className="animate-fade-in-up p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Trabajador no encontrado</p>
              <Button
                onClick={() => router.back()}
                className="mt-4 bg-red-500 hover:bg-red-600"
              >
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 select-none">
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

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Perfil del Candidato
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Información detallada del trabajador
          </p>
        </div>
      </div>

      <Card className="border-red-500/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              <AvatarImage src={worker.photoUrl} />
              <AvatarFallback className="text-xl sm:text-2xl">
                {worker.fullname.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2 sm:space-y-3 w-full">
              <div>
                <CardTitle className="text-2xl sm:text-3xl">
                  {worker.fullname}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base mt-2">
                  {worker.experienceDescription || "Sin descripción disponible"}
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  {worker.location || "Ubicación no especificada"}
                </span>

                {worker.availableFromDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    Disponible desde {formatDate(worker.availableFromDate)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {worker.verified && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
                {worker.certificate?.length > 0 && (
                  <Badge variant="secondary">
                    <Award className="h-3 w-3 mr-1" />
                    {worker.certificate.length} Certificados
                  </Badge>
                )}
                {worker.WorkerSkill?.length > 0 && (
                  <Badge variant="outline">
                    <Star className="h-3 w-3 mr-1" />
                    {worker.WorkerSkill.length} Habilidades
                  </Badge>
                )}
              </div>
            </div>

            {matchData && (
              <div className="text-center space-y-2 w-full md:w-auto md:min-w-[120px]">
                <div
                  className={`text-4xl sm:text-5xl font-bold ${getScoreColor(
                    matchData.overallScore
                  )}`}
                >
                  {matchData.overallScore}%
                </div>
                <Badge
                  variant={
                    matchData.overallScore >= 80 ? "default" : "secondary"
                  }
                  className="w-full justify-center"
                >
                  <Star className="h-3 w-3 mr-1" />
                  {matchData.overallScore >= 80
                    ? "Excelente"
                    : matchData.overallScore >= 60
                    ? "Bueno"
                    : "Aceptable"}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 sm:flex-initial"
              onClick={() => {
                toast.info("Función en desarrollo");
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generar Informe
            </Button>
          </div>
        </CardContent>
      </Card>

      {worker.stats && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mx-auto" />
                <div className="text-2xl sm:text-3xl font-bold">
                  {worker.stats.totalSkills}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Habilidades
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mx-auto" />
                <div className="text-2xl sm:text-3xl font-bold">
                  {worker.stats.totalCertificates}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Certificados
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mx-auto" />
                <div className="text-2xl sm:text-3xl font-bold">
                  {worker.stats.averageRating > 0
                    ? worker.stats.averageRating.toFixed(1)
                    : "N/A"}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {worker.stats.totalReviews} Valoraciones
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto gap-1">
          <TabsTrigger value="skills" className="text-xs sm:text-sm py-2">
            Habilidades
          </TabsTrigger>
          <TabsTrigger value="experience" className="text-xs sm:text-sm py-2">
            Experiencia
          </TabsTrigger>
          <TabsTrigger value="certificates" className="text-xs sm:text-sm py-2">
            Certificados
          </TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs sm:text-sm py-2">
            Valoraciones
          </TabsTrigger>
          <TabsTrigger
            value="match"
            className="text-xs sm:text-sm py-2 col-span-2 sm:col-span-1"
          >
            Match
          </TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                Habilidades y Competencias
              </CardTitle>
              <CardDescription className="text-sm">
                Nivel de dominio en diferentes áreas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {worker.WorkerSkill && worker.WorkerSkill.length > 0 ? (
                <div className="grid gap-4">
                  {worker.WorkerSkill.map((skill) => (
                    <div key={skill.id} className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm sm:text-base">
                            {skill.Skill.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {skill.level}
                          </Badge>
                          {skill.verified && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      <Progress
                        value={
                          skill.level === "EXPERTO"
                            ? 100
                            : skill.level === "AVANZADO"
                            ? 75
                            : skill.level === "INTERMEDIO"
                            ? 50
                            : 25
                        }
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No hay habilidades registradas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          {worker.experienceDescription && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <History className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  Resumen de Experiencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {worker.experienceDescription}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                Historial Laboral Detallado
              </CardTitle>
              <CardDescription className="text-sm">
                Experiencia profesional del candidato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {worker.WorkHistory && worker.WorkHistory.length > 0 ? (
                worker.WorkHistory.map((work) => (
                  <div
                    key={work.id}
                    className="relative pl-6 border-l-2 border-red-500/20"
                  >
                    <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-red-500" />
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <h4 className="font-semibold text-base sm:text-lg">
                            {work.position}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {work.companyName}
                          </p>
                        </div>
                        {work.isCurrent && (
                          <Badge variant="default" className="bg-green-500">
                            Actual
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(work.startDate)} -{" "}
                        {work.endDate ? formatDate(work.endDate) : "Presente"}
                      </div>
                      {work.description && (
                        <p className="text-xs sm:text-sm">{work.description}</p>
                      )}
                      {work.skillsUsed?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {work.skillsUsed.map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No hay historial laboral registrado
                </p>
              )}

              {worker.totalYearsExperience > 0 && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Experiencia Total
                    </span>
                    <span className="text-lg font-bold text-red-500">
                      {worker.totalYearsExperience} años
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                Certificados y Formación
              </CardTitle>
              <CardDescription className="text-sm">
                Certificaciones y títulos obtenidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {worker.certificate && worker.certificate.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {worker.certificate.map((cert, index) => (
                    <Card key={index} className="border-2">
                      <CardHeader>
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-red-500" />
                          {cert}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No hay certificados registrados
                </p>
              )}

              {worker.Certificate && worker.Certificate.length > 0 && (
                <div className="mt-6 space-y-4">
                  <Separator />
                  <h4 className="font-semibold text-sm sm:text-base">
                    Certificados Detallados
                  </h4>
                  {worker.Certificate.map((cert) => (
                    <Card key={cert.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="space-y-1">
                            <CardTitle className="text-sm sm:text-base">
                              {cert.name}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                              {cert.type}
                            </CardDescription>
                          </div>
                          {cert.verified && (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs sm:text-sm">
                        {cert.issuedBy && (
                          <p className="text-muted-foreground">
                            Emitido por: {cert.issuedBy}
                          </p>
                        )}
                        {cert.issuedDate && (
                          <p className="text-muted-foreground">
                            Fecha de emisión: {formatDate(cert.issuedDate)}
                          </p>
                        )}
                        {cert.expiryDate && (
                          <p className="text-muted-foreground">
                            Válido hasta: {formatDate(cert.expiryDate)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="match" className="space-y-4">
          {matchData ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                    Análisis de Compatibilidad
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Evaluación detallada del ajuste con la oferta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium">Habilidades</span>
                        <span className={getScoreColor(matchData.skillsScore)}>
                          {matchData.skillsScore.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={matchData.skillsScore} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium">Ubicación</span>
                        <span
                          className={getScoreColor(matchData.locationScore)}
                        >
                          {matchData.locationScore.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={matchData.locationScore}
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium">Experiencia</span>
                        <span
                          className={getScoreColor(matchData.experienceScore)}
                        >
                          {matchData.experienceScore.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={matchData.experienceScore}
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium">Disponibilidad</span>
                        <span
                          className={getScoreColor(matchData.availabilityScore)}
                        >
                          {matchData.availabilityScore.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={matchData.availabilityScore}
                        className="h-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Requisitos Mínimos
                      </p>
                      <p
                        className={`text-xs sm:text-sm font-medium ${
                          matchData.meetsMinimumRequirements
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {matchData.meetsMinimumRequirements ? "✓" : "✗"} Cumple
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Ubicación</p>
                      <p
                        className={`text-xs sm:text-sm font-medium ${
                          matchData.locationCompatible
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {matchData.locationCompatible ? "✓" : "⚠"} Compatible
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Disponibilidad
                      </p>
                      <p
                        className={`text-xs sm:text-sm font-medium ${
                          matchData.availabilityCompatible
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {matchData.availabilityCompatible ? "✓" : "⚠"}{" "}
                        Compatible
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {matchData.matchedSkills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600 text-base sm:text-lg">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      Habilidades que Cumple
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {matchData.matchedSkills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-green-500/50 text-green-700 dark:text-green-400 text-xs"
                        >
                          {skill.name}
                          {skill.has && (
                            <span className="ml-1">• {skill.has}</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {matchData.missingSkills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600 text-base sm:text-lg">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                      Áreas de Mejora
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {matchData.missingSkills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 text-xs"
                        >
                          {skill.name}
                          {skill.has && (
                            <span className="ml-1">• tiene {skill.has}</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {matchData.strengths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600 text-base sm:text-lg">
                      Fortalezas Destacadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {matchData.strengths.map((strength, index) => (
                        <span
                          key={index}
                          className="text-xs sm:text-sm bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1 rounded-full"
                        >
                          ✓ {strength}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {matchData.weaknesses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600 text-base sm:text-lg">
                      Consideraciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {matchData.weaknesses.map((weakness, index) => (
                        <span
                          key={index}
                          className="text-xs sm:text-sm bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full"
                        >
                          ⚠ {weakness}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No hay datos de compatibilidad disponibles.
                  <br />
                  Para ver el análisis de compatibilidad, accede desde una
                  oferta específica.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}