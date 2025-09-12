"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect } from "react";

export function SectionCards() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
  }, []);

  const workerCards = [
    {
      title: "Aplicaciones Enviadas",
      value: "0",
      description: "Este mes",
      trend: "+0",
      footer: "Postulaciones activas",
      subtext: "Mantén tu perfil actualizado",
    },
    {
      title: "Trabajos Completados",
      value: "0",
      description: "Total histórico",
      trend: "0%",
      footer: "Experiencia acumulada",
      subtext: "Construye tu reputación",
    },
    {
      title: "Valoración Promedio",
      value: "0.0",
      description: "De 5 estrellas",
      trend: "N/A",
      footer: "Basada en 0 reseñas",
      subtext: "Las buenas valoraciones traen más trabajo",
    },
    {
      title: "Ingresos del Mes",
      value: "€0",
      description: "Ganancias actuales",
      trend: "+€0",
      footer: "Crecimiento mensual",
      subtext: "Aumenta con más trabajos completados",
    },
  ];

  const companyCards = [
    {
      title: "Ofertas Publicadas",
      value: "0",
      description: "Activas este mes",
      trend: "+0",
      footer: "Posiciones abiertas",
      subtext: "Publica ofertas para atraer talento",
    },
    {
      title: "Candidatos Recibidos",
      value: "0",
      description: "Aplicaciones totales",
      trend: "0%",
      footer: "Interés en tus ofertas",
      subtext: "Mejora las descripciones para más candidatos",
    },
    {
      title: "Personal Contratado",
      value: "0",
      description: "Trabajadores activos",
      trend: "0",
      footer: "Equipo actual",
      subtext: "Gestiona tu fuerza laboral",
    },
    {
      title: "Gasto Mensual",
      value: "€0",
      description: "Costes de personal",
      trend: "+€0",
      footer: "Inversión en recursos humanos",
      subtext: "Controla tus gastos operativos",
    },
  ];

  const cards =
    role === "WORKER" ? workerCards : role === "COMPANY" ? companyCards : [];

  if (cards.length === 0) return null;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="@container/card">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                {card.trend}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.footer} <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">{card.subtext}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}