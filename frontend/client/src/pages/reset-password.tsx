import { useState } from "react";
import { useLocation } from "wouter";
import { apiUrl } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Eye, EyeOff, KeyRound } from "lucide-react";

type ResetState = "form" | "loading" | "success" | "error";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [state, setState] = useState<ResetState>("form");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center text-center space-y-6 pt-10 pb-8">
              <XCircle className="h-16 w-16 text-red-500" />
              <h1 className="text-2xl font-bold">Enlace inválido</h1>
              <p className="text-muted-foreground">
                No se encontró un token de restablecimiento. Solicita un nuevo enlace.
              </p>
              <Button variant="outline" onClick={() => setLocation("/")}>
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }

    setState("loading");
    try {
      const res = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("success");
        setMessage(data.message || "Contraseña restablecida correctamente.");
      } else {
        setState("error");
        setMessage(data.error || "Error al restablecer la contraseña.");
      }
    } catch {
      setState("error");
      setMessage("Error de conexión. Intenta de nuevo más tarde.");
    }
  };

  if (state === "success") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center text-center space-y-6 pt-10 pb-8">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h1 className="text-2xl font-bold">Contraseña restablecida</h1>
              <p className="text-muted-foreground">{message}</p>
              <Button onClick={() => setLocation("/")}>
                Ir a iniciar sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (state === "error") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center text-center space-y-6 pt-10 pb-8">
              <XCircle className="h-16 w-16 text-red-500" />
              <h1 className="text-2xl font-bold">Error</h1>
              <p className="text-muted-foreground">{message}</p>
              <Button variant="outline" onClick={() => setLocation("/")}>
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-10 pb-8">
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="p-4 rounded-full bg-primary/10">
                <KeyRound className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Nueva contraseña</h1>
              <p className="text-muted-foreground text-sm">
                Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
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
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repetir contraseña"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={state === "loading"}
              >
                {state === "loading" ? "Restableciendo..." : "Restablecer contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
