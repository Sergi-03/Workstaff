"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Users,
  Briefcase,
  CreditCard,
  Clock,
  Star,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const workerFAQs = [
  {
    id: "registration",
    category: "Registro y Perfil",
    icon: Users,
    color: "bg-blue-500",
    questions: [
      {
        id: "docs-needed",
        question: "¿Qué documentos necesito para registrarme?",
        answer:
          "Para registrarte necesitas: foto de perfil, fotografía de tu DNI/NIE, certificados relevantes (manipulador de alimentos, PRL, etc.) y completar tu experiencia laboral en hostelería.",
        keywords: ["documentos", "registro", "dni", "nie", "certificados"],
      },
      {
        id: "modify-profile",
        question: "¿Puedo modificar mi perfil después del registro?",
        answer:
          "Sí, puedes actualizar tu perfil en cualquier momento desde la sección 'Mi Perfil'. Esto incluye experiencia, habilidades, disponibilidad y certificados.",
        keywords: ["modificar", "actualizar", "perfil", "experiencia"],
      },
      {
        id: "scoring",
        question: "¿Qué es el scoring de trabajadores?",
        answer:
          "Es un sistema de puntuación basado en tu rendimiento, comentarios de empresas y experiencia. Te ayuda a destacar y acceder a mejores oportunidades laborales.",
        keywords: ["scoring", "puntuación", "rendimiento", "valoración"],
      },
    ],
  },
  {
    id: "job-search",
    category: "Búsqueda de Empleo",
    icon: Briefcase,
    color: "bg-green-500",
    questions: [
      {
        id: "matching",
        question: "¿Cómo funciona el matching automático?",
        answer:
          "Nuestro algoritmo empareja automáticamente ofertas contigo basándose en tus habilidades, experiencia, disponibilidad y ubicación. Recibirás notificaciones de ofertas relevantes.",
        keywords: ["matching", "algoritmo", "ofertas", "notificaciones"],
      },
      {
        id: "apply-jobs",
        question: "¿Puedo postularme a cualquier trabajo?",
        answer:
          "Puedes ver todas las ofertas, pero te recomendamos postularte solo a aquellas que coincidan con tu perfil para aumentar tus posibilidades de ser seleccionado.",
        keywords: ["postular", "trabajo", "ofertas", "selección"],
      },
      {
        id: "response-time",
        question: "¿Cuánto tiempo tardan en responder las empresas?",
        answer:
          "Las empresas suelen responder en 24-48 horas. Recibirás una notificación cuando haya una actualización en tu postulación.",
        keywords: ["tiempo", "respuesta", "empresas", "notificación"],
      },
    ],
  },
  {
    id: "time-tracking",
    category: "Control Horario",
    icon: Clock,
    color: "bg-amber-500",
    questions: [
      {
        id: "clock-in-out",
        question: "¿Cómo registro mi entrada y salida?",
        answer:
          "Usa la app para fichar entrada/salida con verificación de ubicación GPS. También puede requerirse verificación con supervisor según el puesto.",
        keywords: ["fichar", "entrada", "salida", "gps", "ubicación"],
      },
      {
        id: "forgot-clock",
        question: "¿Qué pasa si olvido fichar?",
        answer:
          "Contacta inmediatamente con soporte o tu supervisor. Podemos ayudarte a corregir el registro con la documentación adecuada.",
        keywords: ["olvido", "fichar", "soporte", "corregir", "registro"],
      },
    ],
  },
  {
    id: "payments",
    category: "Pagos y Contratos",
    icon: CreditCard,
    color: "bg-purple-500",
    questions: [
      {
        id: "payment-schedule",
        question: "¿Cuándo recibo mi pago?",
        answer:
          "Los pagos se procesan automáticamente según lo acordado en tu contrato. Recibirás nóminas y podrás ver el detalle de pagos en tu dashboard.",
        keywords: ["pago", "nómina", "contrato", "dashboard", "salario"],
      },
      {
        id: "automatic-contracts",
        question: "¿Los contratos son automáticos?",
        answer:
          "Sí, generamos contratos automáticamente que cumplen con la legislación laboral. Incluyen todos los datos de la empresa y del trabajador registrados.",
        keywords: ["contratos", "automático", "legislación", "laboral"],
      },
    ],
  },
  {
    id: "training",
    category: "Formación",
    icon: Star,
    color: "bg-red-500",
    questions: [
      {
        id: "available-courses",
        question: "¿Qué cursos están disponibles?",
        answer:
          "Ofrecemos formación específica de hostelería: manipulador de alimentos, PRL, protocolo de servicio, coctelería y más. También tenemos contenido en nuestro canal de YouTube.",
        keywords: ["cursos", "formación", "hostelería", "manipulador", "prl"],
      },
      {
        id: "certificate-validity",
        question: "¿Los certificados tienen validez oficial?",
        answer:
          "Sí, nuestros certificados tienen validez oficial y son reconocidos en el sector de la hostelería.",
        keywords: ["certificados", "validez", "oficial", "reconocidos"],
      },
    ],
  },
];

export default function WorkerSupportPage() {
  const [openItems, setOpenItems] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return workerFAQs;

    const query = searchQuery.toLowerCase().trim();
    return workerFAQs
      .map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.question.toLowerCase().includes(query) ||
            q.answer.toLowerCase().includes(query) ||
            q.keywords.some((keyword) => keyword.includes(query))
        ),
      }))
      .filter((category) => category.questions.length > 0);
  }, [searchQuery]);

  const toggleItem = (categoryId, questionIndex) => {
    const key = `${categoryId}-${questionIndex}`;
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(key)) {
      newOpenItems.delete(key);
    } else {
      newOpenItems.add(key);
    }
    setOpenItems(newOpenItems);
  };

  const isOpen = (categoryId, questionIndex) => {
    return openItems.has(`${categoryId}-${questionIndex}`);
  };

  useEffect(() => {
    document.title = "Centro de soporte | Workstaff";
  }, []);

  return (
    <div className="min-h-screen select-none animate-fade-in-up">
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
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-none p-3 rounded-full">
              <HelpCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold ">
            Centro de Ayuda para Trabajadores
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encuentra respuestas a las preguntas más comunes sobre Workstaff
          </p>
          <Badge>Sección para Trabajadores</Badge>
        </div>

        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Buscar (ej: pago, contrato)`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="space-y-6">
          {filteredFAQs.map((category) => (
            <Card key={category.id} className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="bg-none p-2 rounded-lg">
                    <category.icon className="h-5 w-5 text-red-600" />
                  </div>
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.questions.map((faq, index) => (
                  <Collapsible key={index}>
                    <CollapsibleTrigger
                      className="w-full"
                      onClick={() => toggleItem(category.id, index)}
                    >
                      <div className="flex items-center justify-between p-4 rounded-lg transition-colors">
                        <span className="text-left font-medium text-muted-foreground">
                          {faq.question}
                        </span>
                        {isOpen(category.id, index) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 rounded-lg ml-4 mt-2">
                        <p className="text-white leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-xl shadow-lg border-0">
          <div className="p-6 text-center pb-4">
            <div className="flex items-center justify-center gap-3 text-2xl font-semibold text-white mb-8">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              ¿No encuentras tu respuesta?
            </div>
          </div>
          <div className="px-6 pb-6 text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 flex-1 flex items-center justify-center gap-2 rounded-lg font-medium transition-colors">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Chat en Vivo
              </Button>
              <Button
                className="px-6 py-3 flex-1 flex items-center justify-center gap-2 rounded-lg font-medium"
                variant="outline"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Enviar Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
