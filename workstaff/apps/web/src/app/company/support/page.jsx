"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Users,
  Briefcase,
  CreditCard,
  Shield,
  FileText,
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
import { toast } from "sonner";

const companyFAQs = [
  {
    id: 1,
    category: "Registro Empresarial",
    icon: Briefcase,
    questions: [
      {
        question: "¿Qué información necesito para registrar mi empresa?",
        answer:
          "Necesitas: nombre de la empresa, CIF/NIF, email de contacto, tipo de negocio y opcionalmente el logo de tu empresa.",
        keywords: ["registro", "empresa", "CIF", "NIF", "logo", "contacto"],
      },
      {
        question: "¿Puedo registrar múltiples locales?",
        answer:
          "Sí, puedes gestionar múltiples ubicaciones desde una sola cuenta empresarial, especificando las necesidades de cada local.",
        keywords: ["locales", "sucursales", "múltiples", "gestión", "empresa"],
      },
    ],
  },
  {
    id: 2,
    category: "Creación de Ofertas",
    icon: FileText,
    questions: [
      {
        question: "¿Cómo creo una solicitud de empleo?",
        answer:
          "Desde tu dashboard, especifica: tipo de servicio, duración del trabajo, requisitos indispensables, horarios y ubicación. El sistema buscará candidatos automáticamente.",
        keywords: [
          "oferta",
          "solicitud",
          "empleo",
          "trabajo",
          "dashboard",
          "candidatos",
        ],
      },
      {
        question: "¿Puedo ver candidatos antes de publicar?",
        answer:
          "Sí, nuestro sistema te muestra candidatos potenciales basados en los criterios de tu oferta antes de publicarla.",
        keywords: [
          "candidatos",
          "previsualizar",
          "oferta",
          "publicar",
          "sistema",
        ],
      },
      {
        question: "¿Cómo funciona el matching de candidatos?",
        answer:
          "Nuestro algoritmo selecciona trabajadores basándose en habilidades, experiencia, disponibilidad y scoring. Los candidatos más compatibles aparecen primero.",
        keywords: [
          "matching",
          "algoritmo",
          "compatibilidad",
          "candidatos",
          "trabajadores",
        ],
      },
    ],
  },
  {
    id: 3,
    category: "Gestión de Personal",
    icon: Users,
    questions: [
      {
        question: "¿Cómo evalúo a los trabajadores?",
        answer:
          "Puedes dejar reseñas y puntuaciones que afectan el scoring interno del trabajador. Solo las estrellas son visibles públicamente.",
        keywords: [
          "evaluación",
          "trabajadores",
          "reseñas",
          "puntuación",
          "scoring",
        ],
      },
      {
        question: "¿Puedo supervisar el control horario?",
        answer:
          "Sí, tienes acceso completo al registro de asistencia con verificación GPS y puedes validar las horas trabajadas.",
        keywords: ["control", "horario", "fichaje", "GPS", "supervisión"],
      },
    ],
  },
  {
    id: 4,
    category: "Facturación y Pagos",
    icon: CreditCard,
    questions: [
      {
        question: "¿Cómo se procesan los pagos?",
        answer:
          "El cobro del servicio se realiza al comenzar el trabajo. Gestionamos automáticamente salarios, retenciones y contribuciones a la Seguridad Social.",
        keywords: ["pago", "salario", "cobro", "facturación", "retenciones"],
      },
      {
        question: "¿Qué métodos de pago aceptan?",
        answer:
          "Aceptamos tarjetas Visa, Mastercard, PayPal y sistemas de pago seguros. También trabajamos en integración con Apple Pay.",
        keywords: ["pago", "tarjeta", "PayPal", "Apple Pay", "método"],
      },
      {
        question: "¿Recibo facturas automáticas?",
        answer:
          "Sí, generamos facturas automáticamente con todos los detalles del servicio prestado y las gestiones administrativas realizadas.",
        keywords: ["factura", "automático", "servicio", "administración"],
      },
    ],
  },
  {
    id: 5,
    category: "Contratos y Legal",
    icon: Shield,
    questions: [
      {
        question: "¿Los contratos son legalmente válidos?",
        answer:
          "Sí, todos los contratos generados cumplen con la legislación laboral vigente e incluyen las cláusulas necesarias para el sector hostelería.",
        keywords: ["contrato", "legal", "válido", "legislación", "hostelería"],
      },
      {
        question: "¿Integran con la Seguridad Social?",
        answer:
          "Trabajamos en una integración API con la Seguridad Social para automatizar la gestión de altas y contratos.",
        keywords: [
          "seguridad social",
          "integración",
          "API",
          "altas",
          "contratos",
        ],
      },
    ],
  },
];

export default function CompanySupportPage() {
  const [openItems, setOpenItems] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return companyFAQs;

    const query = searchQuery.toLowerCase().trim();
    return companyFAQs
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
            <div className="p-3 rounded-full">
              <HelpCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Centro de Ayuda para Empresas
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encuentra respuestas a las preguntas más comunes sobre Workstaff
          </p>
          <Badge>Sección para Empresas</Badge>
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
                  <div className="p-2 rounded-lg">
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
                      <div className="flex items-center justify-between p-4  rounded-lg transition-colors">
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
              <Button
                onClick={() => toast.info("Función en desarrollo")}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 flex-1 flex items-center justify-center gap-2 rounded-lg font-medium transition-colors"
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Chat en Vivo
              </Button>
              <Button
                onClick={() => toast.info("Función en desarrollo")}
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