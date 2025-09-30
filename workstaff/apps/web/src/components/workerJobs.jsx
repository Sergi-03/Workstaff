"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Search,
  MapPin,
  Euro,
  Calendar,
  Eye,
  Briefcase,
  Building,
  Clock,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function WorkerJobsView() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    if (!token || role !== "WORKER") {
      router.replace("/login");
      return;
    }

    loadJobs();
  }, [router]);

  const loadJobs = async (page = 1, search = "", location = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "9",
        ...(search && { search }),
        ...(location && { location }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/worker/jobs?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar las ofertas");
      }

      const data = await response.json();
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error cargando ofertas:", error);
      toast.error("Error al cargar las ofertas");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadJobs(1, searchTerm, locationFilter);
  };

  const handlePageChange = (newPage) => {
    loadJobs(newPage, searchTerm, locationFilter);
  };

  const formatSalary = (salary) => {
    if (!salary) return "Salario no especificado";
    return `${salary.toLocaleString()}€/mes`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && jobs.length === 0) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Ofertas de Trabajo</h1>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Puesto, palabra clave, empresa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative sm:w-64">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ubicación..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No hay ofertas disponibles</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || locationFilter
                  ? "No se encontraron ofertas con esos criterios. Intenta con otros filtros."
                  : "Aún no hay ofertas de trabajo publicadas."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1  sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const skills = job.requiredSkills || [];

            return (
              <Card
                key={job.id}
                className="group hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/worker/jobs/${job.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="line-clamp-2 group-hover:text-red-600 transition-colors">
                        {job.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-2">
                        <Building className="h-3 w-3 shrink-0" />
                        <span className="truncate">{job.company.name}</span>
                      </CardDescription>
                    </div>
                    {job.company.logoUrl ? (
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={job.company.logoUrl} />
                        <AvatarFallback>
                          {job.company.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Building className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {job.description}
                  </p>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 3).map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs max-w-[100px] truncate"
                          title={skill}
                        >
                          {skill}
                        </Badge>
                      ))}
                      {skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{skills.length - 3} más
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>

                    {job.salary && (
                      <div className="flex items-center gap-2">
                        <Euro className="h-3 w-3 shrink-0" />
                        <span>{formatSalary(job.salary)}</span>
                      </div>
                    )}

                    {job.duration && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span className="truncate">{job.duration}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>Publicado {formatDate(job.createdAt)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{job.applicationsCount} candidatos</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/company/jobs/${job.id}`)}
                      className=""
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagination.currentPage} de {pagination.totalPages} (
            {pagination.totalCount} ofertas total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage || loading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}