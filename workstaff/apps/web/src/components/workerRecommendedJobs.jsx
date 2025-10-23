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
  Sparkles,
  MapPin,
  Euro,
  Calendar,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Building2,
  Star,
} from "lucide-react";
import { toast } from "sonner";

export default function WorkerRecommendedJobs() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(50);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (!token || role !== "WORKER") {
      router.replace("/login");
      return;
    }

    loadRecommendedJobs();
  }, [router]);

  const loadRecommendedJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/worker/recommended-jobs?limit=20&minScore=${minScore}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar trabajos recomendados");
      }

      const data = await response.json();
      setMatches(data.matches);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar trabajos recomendados");
    } finally {
      setLoading(false);
    }
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

  const formatSalary = (min, max) => {
    if (!min || !max) return "No especificado";
    return `${min.toLocaleString()}€ - ${max.toLocaleString()}€`;
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

  return (
    <div className="animate-fade-in-up py-4 sm:py-6 px-3 sm:px-6 w-full mx-auto space-y-4 sm:space-y-6 select-none">
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

      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">
              Trabajos Recomendados
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Ofertas perfectas para tu perfil
            </p>
          </div>
        </div>

        {matches.length > 0 && (
          <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                <span className="font-medium">
                  Hemos encontrado {matches.length} ofertas que encajan contigo
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 sm:py-12">
              <Sparkles className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">
                No hay recomendaciones
              </h3>
              <p className="mt-1 text-sm text-muted-foreground px-4">
                Completa tu perfil y añade tus habilidades para recibir mejores
                recomendaciones.
              </p>
              <Button
                onClick={() => router.push("/worker/profile")}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white"
              >
                Completar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {matches.map((match) => {
            const job = match.Job;
            const score = match.overallScore;

            return (
              <Card
                key={match.id}
                className="group hover:shadow-xl transition-all duration-300 hover:border-red-500/50"
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-start gap-2 sm:gap-3">
                        {job.company.logoUrl && (
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarImage src={job.company.logoUrl} />
                            <AvatarFallback>
                              {job.company.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-xl group-hover:text-red-500 transition-colors">
                            {job.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1 text-xs sm:text-sm">
                            <Building2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{job.company.name}</span>
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </span>
                        {job.duration && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            {job.duration}
                          </span>
                        )}
                        {job.salaryMin && job.salaryMax && (
                          <span className="flex items-center gap-1">
                            <Euro className="h-3 w-3 flex-shrink-0" />
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-2 sm:text-right">
                      <div
                        className={`text-3xl sm:text-4xl font-bold ${getScoreColor(
                          score
                        )}`}
                      >
                        {score}%
                      </div>
                      <Badge
                        variant={getScoreBadgeVariant(score)}
                        className="justify-center whitespace-nowrap"
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

                <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium">Habilidades</span>
                        <span className={getScoreColor(match.skillsScore)}>
                          {match.skillsScore.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={match.skillsScore} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium">Ubicación</span>
                        <span className={getScoreColor(match.locationScore)}>
                          {match.locationScore.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={match.locationScore} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium">Experiencia</span>
                        <span className={getScoreColor(match.experienceScore)}>
                          {match.experienceScore.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={match.experienceScore} className="h-2" />
                    </div>
                  </div>

                  {match.matchedSkills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                        Habilidades que cumples ({match.matchedSkills.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {match.matchedSkills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-green-500/50 text-green-700 dark:text-green-400"
                          >
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.missingSkills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                        Habilidades por mejorar ({match.missingSkills.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {match.missingSkills.slice(0, 5).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-yellow-500/50 text-yellow-700 dark:text-yellow-400"
                          >
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.strengths.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                        ✓ Tus fortalezas
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
                      <p className="text-xs sm:text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        ⚠ Áreas de mejora
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

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => router.push(`/worker/jobs/${job.id}`)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/worker/jobs/${job.id}`)}
                      className="flex-1"
                    >
                      Aplicar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}