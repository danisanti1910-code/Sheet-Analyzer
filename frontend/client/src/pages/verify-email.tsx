import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiUrl } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, MailOpen } from "lucide-react";

type VerifyState = "loading" | "success" | "error" | "expired";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setState("error");
      setMessage("No se proporcionó un token de verificación.");
      return;
    }

    fetch(apiUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`))
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setState("success");
          setMessage(data.message || "Correo verificado correctamente.");
        } else {
          if (data.error?.includes("expirado")) {
            setState("expired");
          } else {
            setState("error");
          }
          setMessage(data.error || "Error al verificar.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("Error de conexión. Intenta de nuevo más tarde.");
      });
  }, []);

  const icons = {
    loading: <Loader2 className="h-16 w-16 text-primary animate-spin" />,
    success: <CheckCircle2 className="h-16 w-16 text-green-500" />,
    error: <XCircle className="h-16 w-16 text-red-500" />,
    expired: <MailOpen className="h-16 w-16 text-amber-500" />,
  };

  const titles = {
    loading: "Verificando tu correo...",
    success: "Correo verificado",
    error: "Error de verificación",
    expired: "Enlace expirado",
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center text-center space-y-6 pt-10 pb-8">
            {icons[state]}

            <h1 className="text-2xl font-bold">{titles[state]}</h1>

            <p className="text-muted-foreground leading-relaxed max-w-sm">
              {message}
            </p>

            {state === "success" && (
              <Button
                className="mt-4"
                onClick={() => setLocation("/")}
              >
                Ir a iniciar sesión
              </Button>
            )}

            {state === "expired" && (
              <div className="space-y-3 w-full max-w-xs">
                <p className="text-sm text-muted-foreground">
                  Puedes solicitar un nuevo correo de verificación desde la pantalla de inicio de sesión.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/")}
                >
                  Volver al inicio
                </Button>
              </div>
            )}

            {state === "error" && (
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
              >
                Volver al inicio
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
