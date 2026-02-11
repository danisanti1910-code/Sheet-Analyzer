import React, { useState } from "react";
import { useSheet } from "@/lib/sheet-context";
import { apiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, UserPlus, MailCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which tab to show first */
  defaultTab?: "login" | "register";
  /** Callback after successful auth */
  onSuccess?: () => void;
}

type DialogView = "auth" | "verify-sent" | "forgot-password" | "forgot-sent" | "resend-verify";

export function AuthDialog({
  open,
  onOpenChange,
  defaultTab = "login",
  onSuccess,
}: AuthDialogProps) {
  const { register, loginWithCredentials } = useSheet();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [view, setView] = useState<DialogView>("auth");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  // Reset state when dialog opens/closes
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShowPassword(false);
      setShowConfirmPassword(false);
      setIsLoading(false);
      setView("auth");
      setRegisteredEmail("");
      setForgotEmail("");
    } else {
      setActiveTab(defaultTab);
      setView("auth");
    }
    onOpenChange(nextOpen);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = (formData.get("loginEmail") as string)?.trim();
    const password = formData.get("loginPassword") as string;

    if (!email || !password) return;

    setIsLoading(true);
    try {
      await loginWithCredentials(email, password);
      toast({ title: "Bienvenido de nuevo" });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error al iniciar sesión";
      // Check if it's an email not verified error
      if (errorMsg.includes("no ha sido verificado")) {
        setRegisteredEmail(email);
        setView("resend-verify");
      } else {
        toast({ title: errorMsg, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get("regPassword") as string;
    const confirmPassword = formData.get("regConfirmPassword") as string;
    const email = (formData.get("regEmail") as string)?.trim();

    if (password !== confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await register({
        firstName: formData.get("regFirstName") as string,
        lastName: formData.get("regLastName") as string,
        email,
        useCase: formData.get("regUseCase") as string,
        password,
      });
      setRegisteredEmail(email);
      setView("verify-sent");
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Error al registrar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = (formData.get("forgotEmail") as string)?.trim();
    if (!email) return;

    setIsLoading(true);
    try {
      await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setForgotEmail(email);
      setView("forgot-sent");
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    setIsLoading(true);
    try {
      await fetch(apiUrl("/api/auth/resend-verification"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      toast({ title: "Correo de verificación reenviado" });
    } catch {
      toast({ title: "Error al reenviar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Verification sent view ──────────────────────────────────────

  if (view === "verify-sent") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[440px]">
          <div className="flex flex-col items-center text-center space-y-6 py-8">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
              <MailCheck className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Revisa tu correo</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                Hemos enviado un enlace de verificación a{" "}
                <strong className="text-foreground">{registeredEmail}</strong>.
                <br />
                Haz clic en el enlace para activar tu cuenta.
              </p>
            </div>
            <div className="space-y-3 w-full max-w-xs">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendVerification}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reenviar correo
              </Button>
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setView("auth");
                  setActiveTab("login");
                }}
              >
                Ya verifiqué, iniciar sesión
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Resend verification view (from login attempt) ───────────────

  if (view === "resend-verify") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[440px]">
          <div className="flex flex-col items-center text-center space-y-6 py-8">
            <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <MailCheck className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Verifica tu correo</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                Tu cuenta aún no ha sido verificada. Revisa la bandeja de entrada de{" "}
                <strong className="text-foreground">{registeredEmail}</strong>{" "}
                y haz clic en el enlace de verificación.
              </p>
            </div>
            <div className="space-y-3 w-full max-w-xs">
              <Button
                className="w-full"
                onClick={handleResendVerification}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reenviar correo de verificación
              </Button>
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setView("auth");
                  setActiveTab("login");
                }}
              >
                Volver al inicio de sesión
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Forgot password view ────────────────────────────────────────

  if (view === "forgot-password") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Recuperar contraseña
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>
          <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="forgotEmail">Correo electrónico</Label>
              <Input
                id="forgotEmail"
                name="forgotEmail"
                type="email"
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => {
                  setView("auth");
                  setActiveTab("login");
                }}
              >
                Volver al inicio de sesión
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Forgot password sent confirmation ───────────────────────────

  if (view === "forgot-sent") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[440px]">
          <div className="flex flex-col items-center text-center space-y-6 py-8">
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <MailCheck className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Revisa tu correo</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                Si existe una cuenta con{" "}
                <strong className="text-foreground">{forgotEmail}</strong>,
                recibirás un enlace para restablecer tu contraseña.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setView("auth");
                setActiveTab("login");
              }}
            >
              Volver al inicio de sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Main auth view (login / register tabs) ──────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {activeTab === "login" ? "Ingresa a tu cuenta" : "Crea tu cuenta gratis"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="gap-2">
              <LogIn className="h-4 w-4" />
              Iniciar Sesión
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Registrarse
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="loginEmail">Correo electrónico</Label>
                <Input
                  id="loginEmail"
                  name="loginEmail"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="loginPassword">Contraseña</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline font-medium"
                    onClick={() => setView("forgot-password")}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="loginPassword"
                    name="loginPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? "Ingresando..." : "Ingresar"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => setActiveTab("register")}
                >
                  Regístrate aquí
                </button>
              </p>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="regFirstName">Nombre</Label>
                  <Input
                    id="regFirstName"
                    name="regFirstName"
                    placeholder="Nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regLastName">Apellido</Label>
                  <Input
                    id="regLastName"
                    name="regLastName"
                    placeholder="Apellido"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="regEmail">Correo electrónico</Label>
                <Input
                  id="regEmail"
                  name="regEmail"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regUseCase">¿Para qué usarás el sistema?</Label>
                <Select name="regUseCase" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Análisis de Negocios</SelectItem>
                    <SelectItem value="education">Educación / Investigación</SelectItem>
                    <SelectItem value="personal">Uso Personal</SelectItem>
                    <SelectItem value="marketing">Marketing y Ventas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="regPassword">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="regPassword"
                      name="regPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mín. 6 caracteres"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regConfirmPassword">Confirmar</Label>
                  <div className="relative">
                    <Input
                      id="regConfirmPassword"
                      name="regConfirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repetir"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 mt-2" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => setActiveTab("login")}
                >
                  Inicia sesión
                </button>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
