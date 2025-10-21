"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";
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
  Smartphone,
  Copy,
  Download,
  AlertTriangle,
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
  const [setup2FAOpen, setSetup2FAOpen] = useState(false);
  const [disable2FAOpen, setDisable2FAOpen] = useState(false);
  const [backupCodesOpen, setBackupCodesOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [twoFactorStatus, setTwoFactorStatus] = useState({
    enabled: false,
    backupCodesCount: 0,
  });
  const [qrCode, setQrCode] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [passwordFor2FA, setPasswordFor2FA] = useState("");
  const [codeForDisable, setCodeForDisable] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { token, role: userRole } = getAuth();
      if (!token) {
        router.replace("/login");
        return;
      }

      setRole(userRole);

      const [profile] = await Promise.all([
        fetchUserProfile(token, userRole),
        loadTwoFactorStatus(),
      ]);
      setUser(profile);
      setLoadingProfile(false);
    };

    init();
  }, [router]);

  const fetchUserProfile = async (token, role) => {
    try {
      let profileData = null;

      if (role === "WORKER") {
        profileData = await apiFetch("/api/auth/worker/profile");
        return {
          fullname: profileData?.fullname || "Trabajador",
          email: profileData?.user?.email || "usuario@workstaff.com",
          photoUrl: profileData?.photoUrl || "",
          role,
        };
      } else if (role === "COMPANY") {
        profileData = await apiFetch("/api/auth/company/profile");
        return {
          fullname: profileData?.name || "Empresa",
          email: profileData?.user?.email || "empresa@workstaff.com",
          photoUrl: profileData?.logoUrl || "",
          role,
        };
      }
      return null;
    } catch (err) {
      console.error("Error cargando perfil:", err);
      toast.error("Error cargando perfil");
      return null;
    }
  };

  const loadTwoFactorStatus = async () => {
    try {
      const response = await apiFetch("/api/auth/2fa/status");
      setTwoFactorStatus({
        enabled: response.enabled,
        backupCodesCount: response.backupCodesCount,
      });
    } catch (error) {
      console.error("Error cargando estado 2FA:", error);
    }
  };

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
      await apiFetch("/api/auth/change-password", {
        method: "PUT",
        body: { currentPassword, newPassword },
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
      await apiFetch("/api/auth/change-email", {
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

  const handleSetup2FA = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/auth/2fa/setup", {
        method: "POST",
      });

      setQrCode(response.qrCode);
      setManualKey(response.manualEntryKey);
      setSetup2FAOpen(true);
    } catch (error) {
      toast.error(error.message || "Error configurando 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode) {
      toast.error("Ingresa el código de verificación");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/api/auth/2fa/verify", {
        method: "POST",
        body: { token: verificationCode },
      });

      setBackupCodes(response.backupCodes);
      setTwoFactorStatus({
        enabled: true,
        backupCodesCount: response.backupCodes.length,
      });
      toast.success("2FA habilitado correctamente");
      setSetup2FAOpen(false);
      setVerificationCode("");
      setBackupCodesOpen(true);
    } catch (error) {
      toast.error(error.message || "Código incorrecto");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!passwordFor2FA) {
      toast.error("Ingresa tu contraseña");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/2fa/disable", {
        method: "DELETE",
        body: {
          password: passwordFor2FA,
          token: codeForDisable || undefined,
        },
      });

      setTwoFactorStatus({ enabled: false, backupCodesCount: 0 });
      toast.success("2FA deshabilitado correctamente");
      setDisable2FAOpen(false);
      setPasswordFor2FA("");
      setCodeForDisable("");
    } catch (error) {
      toast.error(error.message || "Error deshabilitando 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    if (!passwordFor2FA) {
      toast.error("Ingresa tu contraseña");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/api/auth/2fa/backup-codes", {
        method: "POST",
        body: { password: passwordFor2FA },
      });

      setBackupCodes(response.backupCodes);
      setTwoFactorStatus((prev) => ({
        ...prev,
        backupCodesCount: response.backupCodes.length,
      }));
      toast.success("Códigos de respaldo generados");
      setPasswordFor2FA("");
    } catch (error) {
      toast.error(error.message || "Error generando códigos");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado al portapapeles");
    } catch (error) {
      toast.error("Error al copiar");
    }
  };

  const downloadBackupCodes = () => {
    const content = `Códigos de respaldo WorkStaff - ${
      user?.email
    }\nFecha: ${new Date().toLocaleDateString()}\n\n${backupCodes.join(
      "\n"
    )}\n\nGuarda estos códigos en un lugar seguro.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workstaff-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Códigos descargados");
  };

  const getPageTitle = () => {
    return role === "WORKER"
      ? "Configuración - Trabajador"
      : "Configuración - Empresa";
  };

  if (loadingProfile) {
    return (
      <div className="animate-fade-in-up p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up p-6 max-w-4xl mx-auto space-y-6 select-none">
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
                {twoFactorStatus.enabled
                  ? `Habilitada - ${twoFactorStatus.backupCodesCount} códigos de respaldo disponibles`
                  : "Agrega una capa extra de seguridad a tu cuenta"}
              </div>
            </div>
            <div className="flex w-full gap-3 justify-center sm:w-auto sm:justify-end">
              {!twoFactorStatus.enabled ? (
                <Button onClick={handleSetup2FA} disabled={loading}>
                  {loading ? "Configurando..." : "Configurar"}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setBackupCodesOpen(true)}
                  >
                    Códigos de respaldo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDisable2FAOpen(true)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Deshabilitar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={setup2FAOpen} onOpenChange={setSetup2FAOpen}>
        <DialogContent
          className="w-[95%] max-w-md sm:rounded-lg p-4 sm:p-6 
             max-h-[90vh] overflow-y-auto select-none"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Configurar 2FA
            </DialogTitle>
            <DialogDescription>
              Configura la autenticación de dos factores para mayor seguridad
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="border rounded" />
                </div>
                <div className="text-center space-y-3 w-full">
                  <p className="text-sm text-muted-foreground">
                    <strong>Paso 1:</strong> Escanea el código QR con tu app de
                    autenticación
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Aplicaciones recomendadas:</p>
                    <p>
                      • Google Authenticator • Microsoft Authenticator • Authy
                    </p>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>¿No puedes escanear?</strong> Configura
                      manualmente:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                        <span className="font-semibold">Cuenta:</span>
                        <span className="break-all">
                          WorkStaff ({user?.email})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="font-semibold text-xs">Clave:</span>
                        <code className="text-xs flex-1 break-all">
                          {manualKey}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(manualKey)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label
                  htmlFor="verificationCode"
                  className="text-sm font-semibold"
                >
                  <strong>Paso 2:</strong> Ingresa el código de 6 dígitos
                </Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  maxLength={6}
                  className="text-center text-lg tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el código de 6 dígitos que aparece en tu aplicación de
                  autenticación
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSetup2FAOpen(false);
                setVerificationCode("");
                setQrCode("");
                setManualKey("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleVerify2FA}
              disabled={
                loading || !verificationCode || verificationCode.length !== 6
              }
            >
              {loading ? "Verificando..." : "Verificar y Activar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disable2FAOpen} onOpenChange={setDisable2FAOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Deshabilitar 2FA
            </DialogTitle>
            <DialogDescription>
              Esto reducirá la seguridad de tu cuenta. Confirma con tu
              contraseña y un código 2FA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="passwordFor2FA">Contraseña actual</Label>
              <Input
                id="passwordFor2FA"
                type="password"
                value={passwordFor2FA}
                onChange={(e) => setPasswordFor2FA(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="codeForDisable">Código 2FA (opcional)</Label>
              <Input
                id="codeForDisable"
                type="text"
                placeholder="000000 o código de respaldo"
                value={codeForDisable}
                onChange={(e) => setCodeForDisable(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDisable2FAOpen(false);
                setPasswordFor2FA("");
                setCodeForDisable("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDisable2FA}
              disabled={loading || !passwordFor2FA}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {loading ? "Deshabilitando..." : "Deshabilitar 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={backupCodesOpen} onOpenChange={setBackupCodesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Códigos de respaldo
            </DialogTitle>
            <DialogDescription>
              Guarda estos códigos en un lugar seguro. Puedes usar cada uno solo
              una vez.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {backupCodes.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded max-h-40 overflow-y-auto">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="font-mono text-sm p-2 bg-white dark:bg-gray-800 rounded"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(backupCodes.join("\n"))}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadBackupCodes}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ingresa tu contraseña para generar nuevos códigos de respaldo:
                </p>
                <div>
                  <Label htmlFor="passwordForBackup">Contraseña</Label>
                  <Input
                    id="passwordForBackup"
                    type="password"
                    value={passwordFor2FA}
                    onChange={(e) => setPasswordFor2FA(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleGenerateBackupCodes}
                  disabled={loading || !passwordFor2FA}
                  className="w-full"
                >
                  {loading ? "Generando..." : "Generar códigos"}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setBackupCodesOpen(false);
                setBackupCodes([]);
                setPasswordFor2FA("");
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg">
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