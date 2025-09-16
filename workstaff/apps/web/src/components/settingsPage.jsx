"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Shield,
  Palette,
  Bell,
  Trash2,
  Key,
  Mail,
  Moon,
  Sun,
  ShieldCheck,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, getAuth } from "@/lib/api";

export function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { token, role: userRole } = getAuth();
    if (!token) {
      router.replace("/login");
      return;
    }

    setRole(userRole);
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [router]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/api/auth/change-password", {
        method: "PUT",
        body: {
          currentPassword,
          newPassword,
        },
      });

      toast.success("Contraseña actualizada correctamente");
      localStorage.clear();
      router.push("/login");
      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.message || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Email inválido");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/api/auth/change-email", {
        method: "PUT",
        body: { newEmail },
      });

      toast.success(
        "Email actualizado correctamente. Revisa tu nuevo correo para confirmar."
      );
      setChangeEmailOpen(false);
      setNewEmail("");

      const updatedUser = { ...user, email: newEmail };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      toast.error(error.message || "Error al cambiar el email");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") {
      toast.error('Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/delete-account", {
        method: "DELETE",
      });

      toast.success("Cuenta eliminada correctamente");
      localStorage.clear();
      router.push("/");
    } catch (error) {
      toast.error(error.message || "Error al eliminar la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const getPageTitle = () => {
    return role === "WORKER"
      ? "Configuración - Trabajador"
      : "Configuración - Empresa";
  };

  if (!user) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="animate-fade-in-up p-6 max-w-4xl mx-auto space-y-6 select-none">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguridad
          </CardTitle>
          <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Contraseña
              </div>
              <div className="text-sm text-muted-foreground">
                Cambia tu contraseña actual
              </div>
            </div>
            <Dialog
              open={changePasswordOpen}
              onOpenChange={setChangePasswordOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">Cambiar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cambiar Contraseña</DialogTitle>
                  <DialogDescription>
                    Ingresa tu contraseña actual y la nueva contraseña
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setChangePasswordOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleChangePassword} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo electrónico
              </div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <Dialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Cambiar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cambiar Correo Electrónico</DialogTitle>
                  <DialogDescription>
                    Ingresa tu nuevo correo electrónico
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newEmail">Nuevo correo</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={user.email}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setChangeEmailOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleChangeEmail} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Autenticación de dos factores
              </div>
              <div className="text-sm text-muted-foreground">
                Próximamente disponible
              </div>
            </div>
            <Button variant="outline" disabled>
              Configurar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Preferencias
          </CardTitle>
          <CardDescription>Personaliza tu experiencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                Tema
              </div>
              <div className="text-sm text-muted-foreground">
                {theme === "dark" ? "Modo oscuro" : "Modo claro"}
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg opacity-60">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificaciones
              </div>
              <div className="text-sm text-muted-foreground">
                Próximamente disponible
              </div>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <UserMinus className="h-5 w-5" />
            Zona de peligro
          </CardTitle>
          <CardDescription>Acciones irreversibles en tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg rounded-lg">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="h-4 w-4" />
                Eliminar cuenta
              </div>
              <div className="text-sm text-muted-foreground">
                Esta acción no se puede deshacer. Se eliminará toda tu
                información.
              </div>
            </div>
            <AlertDialog
              open={deleteAccountOpen}
              onOpenChange={setDeleteAccountOpen}
            >
              <AlertDialogTrigger asChild>
                <Button className="bg-red-500 hover:bg-red-600 text-white">
                  Eliminar cuenta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Estás absolutamente seguro?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará
                    permanentemente tu cuenta y todos los datos asociados de
                    nuestros servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deleteConfirm" className="mb-2 block">
                      Para confirmar, escribe <strong>ELIMINAR</strong> en el
                      campo de abajo:
                    </Label>
                    <Input
                      id="deleteConfirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="ELIMINAR"
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={loading || deleteConfirmText !== "ELIMINAR"}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {loading ? "Eliminando..." : "Eliminar cuenta"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}