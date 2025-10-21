"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function WorkerSkillManager() {
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState(null);
  const [currentLevel, setCurrentLevel] = useState("BASICO");
  const [currentYears, setCurrentYears] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const SKILL_LEVELS = [
    { value: "BASICO", label: "Básico (0-1 años)" },
    { value: "INTERMEDIO", label: "Intermedio (1-3 años)" },
    { value: "AVANZADO", label: "Avanzado (3-5 años)" },
    { value: "EXPERTO", label: "Experto (5+ años)" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadAvailableSkills(), loadWorkerSkills()]);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSkills = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/skills`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableSkills(data.skills);
      } else {
        console.error("Error al obtener skills del backend");
      }
    } catch (err) {
      console.error("Error cargando skills:", err);
      toast.error("Error cargando habilidades disponibles");
    }
  };

  const loadWorkerSkills = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/worker/skills`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const formattedSkills = data.skills.map((ws) => ({
          skillId: ws.skillId,
          name: ws.Skill.name,
          category: ws.Skill.category,
          level: ws.level,
          yearsExperience: ws.yearsExperience,
        }));
        setSelectedSkills(formattedSkills);

        if (formattedSkills.length > 0) {
          toast.success(`${formattedSkills.length} habilidades cargadas`);
        }
      }
    } catch (err) {
      console.error("Error cargando skills del trabajador:", err);
      toast.error("Error cargando tus habilidades");
    }
  };

  const addSkill = () => {
    if (!currentSkill) {
      toast.error("Selecciona una habilidad");
      return;
    }

    const skillExists = selectedSkills.find((s) => s.skillId === currentSkill);
    if (skillExists) {
      toast.error("Esta habilidad ya está añadida");
      return;
    }

    const skill = availableSkills.find((s) => s.id === currentSkill);
    if (!skill) return;

    setSelectedSkills([
      ...selectedSkills,
      {
        skillId: skill.id,
        name: skill.name,
        category: skill.category,
        level: currentLevel,
        yearsExperience: parseInt(currentYears) || 0,
      },
    ]);

    setCurrentSkill(null);
    setCurrentLevel("BASICO");
    setCurrentYears(0);

    toast.success(`${skill.name} añadida`);
  };

  const removeSkill = (skillId) => {
    const skill = selectedSkills.find((s) => s.skillId === skillId);
    setSelectedSkills(selectedSkills.filter((s) => s.skillId !== skillId));
    if (skill) {
      toast.info(`${skill.name} eliminada`);
    }
  };

  const saveSkills = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");

      const skillsToSave = selectedSkills.map((skill) => ({
        skillId: skill.skillId,
        level: skill.level,
        yearsExperience: skill.yearsExperience,
      }));

      if (skillsToSave.length === 0) {
        toast.error("No hay habilidades para guardar");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/worker/skills`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ skills: skillsToSave }),
        }
      );

      if (response.ok) {
        toast.success("Habilidades guardadas correctamente");
        await loadWorkerSkills();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Error guardando habilidades");
      }
    } catch (err) {
      toast.error(err.message || "Error guardando habilidades");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const skillsByCategory = availableSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Habilidades profesionales
        </Label>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Cargando habilidades...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">
            Habilidades profesionales
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Añade tus habilidades y tu nivel de experiencia en cada una
          </p>
        </div>
        {selectedSkills.length > 0 && (
          <Badge variant="secondary" className="ml-2">
            {selectedSkills.length} habilidades
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Select value={currentSkill || ""} onValueChange={setCurrentSkill}>
          <SelectTrigger className="md:col-span-2">
            <SelectValue placeholder="Selecciona una habilidad" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  {category}
                </div>
                {skills.map((skill) => {
                  const isSelected = selectedSkills.some(
                    (s) => s.skillId === skill.id
                  );
                  return (
                    <SelectItem
                      key={skill.id}
                      value={skill.id}
                      disabled={isSelected}
                    >
                      {skill.name} {isSelected && "✓"}
                    </SelectItem>
                  );
                })}
              </div>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentLevel} onValueChange={setCurrentLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Nivel" />
          </SelectTrigger>
          <SelectContent>
            {SKILL_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          onClick={addSkill}
          variant="secondary"
          className="w-full bg-none"
          disabled={!currentSkill}
        >
          <Plus className="h-4 w-4 mr-2" />
          Añadir
        </Button>
      </div>

      {selectedSkills.length > 0 ? (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Tus habilidades ({selectedSkills.length})
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedSkills.map((skill) => (
              <div
                key={skill.skillId}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {skill.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {skill.level}
                    {skill.yearsExperience > 0 &&
                      ` · ${skill.yearsExperience} años`}
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">
                    {skill.category}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSkill(skill.skillId)}
                  className="ml-2 shrink-0 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            onClick={saveSkills}
            disabled={saving}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar habilidades
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">
            No tienes habilidades añadidas todavía
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Selecciona una habilidad arriba para comenzar
          </p>
        </div>
      )}
    </div>
  );
}