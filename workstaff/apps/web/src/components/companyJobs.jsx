"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Search,
  Plus,
  MapPin,
  Euro,
  Calendar,
  Eye,
  Edit,
  Clock,
  Briefcase,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function CompanyJobsView() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

    if (!token || role !== "COMPANY") {
      router.replace("/login");
      return;
    }

    loadJobs();
  }, [router]);

  const loadJobs = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "6",
        ...(search && { search }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/company/jobs?${queryParams}`,
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
    loadJobs(1, searchTerm);
  };

  const handlePageChange = (newPage) => {
    loadJobs(newPage, searchTerm);
  };

  const formatSalary = (salary) => {
    if (!salary) return "No especificado";
    return `${salary.toLocaleString()}€/mes`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (count, type) => {
    if (type === "applications") {
      return count > 0 ? "default" : "secondary";
    }
    return count > 0 ? "default" : "outline";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Briefcase className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Mis Ofertas de Trabajo</h1>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ofertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              <h3 className="mt-2 text-sm font-semibold">No hay ofertas</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm
                  ? "No se encontraron ofertas con esos criterios."
                  : "Comienza creando tu primera oferta de trabajo."}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => router.push("/company/jobs/create")}
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Oferta
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const skills = job.requiredSkills || [];

            return (
              <Card
                key={job.id}
                className="group hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2 group-hover:text-red-600 transition-colors">
                        {job.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-2">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </CardDescription>
                    </div>
                    {job.imageUrl && (
                      <div className="ml-2">
                        <img
                          src={job.imageUrl}
                          alt={job.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground text-ellipsis line-clamp-3">
                    {job.description}
                  </p>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 3).map((skill, index) => (
                        <Badge
                          key={index}
                          className="text-xs px-2 py-1 max-w-full break-words whitespace-normal"
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
                    {job.salary && (
                      <div className="flex items-center gap-2">
                        <Euro className="h-3 w-3" />
                        {formatSalary(job.salary)}
                      </div>
                    )}
                    {job.duration && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {job.duration}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Publicado {formatDate(job.createdAt)}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={getStatusBadge(
                          job.applicationsCount,
                          "applications"
                        )}
                        className="text-xs"
                      >
                        {job.applicationsCount} aplicaciones
                      </Badge>
                      <Badge
                        variant={getStatusBadge(
                          job.contractsCount,
                          "contracts"
                        )}
                        className="text-xs"
                      >
                        {job.contractsCount} contratos
                      </Badge>
                    </div>
                  </div>

                  {job.applications.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Aplicaciones recientes:
                      </p>
                      <div className="flex -space-x-2">
                        {job.applications
                          .slice(0, 3)
                          .map((application, index) => (
                            <Avatar
                              key={application.id}
                              className="w-6 h-6 border-2 border-background"
                            >
                              <AvatarImage src={application.worker.photoUrl} />
                              <AvatarFallback className="text-xs">
                                {application.worker.fullname
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        {job.applications.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs font-medium">
                              +{job.applications.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/company/jobs/${job.id}`)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Detalles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/company/jobs/${job.id}/edit`)
                      }
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
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