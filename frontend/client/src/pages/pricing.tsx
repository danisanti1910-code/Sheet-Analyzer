import { useEffect, useState } from "react";
import { useSheet } from "@/lib/sheet-context";
import { apiUrl } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Briefcase, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface PlanInfo {
  id: "free" | "pro" | "business";
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  projectLimit: string;
  highlight?: boolean;
}

const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "gratis para siempre",
    description: "Perfecto para empezar a explorar tus datos.",
    features: [
      "Hasta 3 proyectos",
      "Gráficas básicas",
      "Exportar como imagen",
      "Dashboard global",
    ],
    projectLimit: "3",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$8",
    period: "/mes",
    description: "Para profesionales que necesitan más capacidad.",
    features: [
      "Hasta 25 proyectos",
      "Todas las gráficas avanzadas",
      "Exportar como imagen y PDF",
      "Dashboard global",
      "Soporte prioritario",
    ],
    projectLimit: "25",
    highlight: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$15",
    period: "/mes",
    description: "Para equipos y organizaciones sin límites.",
    features: [
      "Proyectos ilimitados",
      "Todas las gráficas avanzadas",
      "Exportar en todos los formatos",
      "Dashboard global",
      "Soporte prioritario 24/7",
      "Acceso API",
    ],
    projectLimit: "Ilimitados",
  },
];

export default function Pricing() {
  const { user } = useSheet();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("none");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Check URL for success/canceled query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({ title: "Suscripción exitosa", description: "Tu plan ha sido actualizado. Puede tomar unos segundos en reflejarse." });
      // Clean up URL
      window.history.replaceState({}, "", "/pricing");
    }
    if (params.get("canceled") === "true") {
      toast({ title: "Suscripción cancelada", description: "No se realizó ningún cambio.", variant: "destructive" });
      window.history.replaceState({}, "", "/pricing");
    }
  }, [toast]);

  // Fetch current subscription
  useEffect(() => {
    if (!user?.email) return;
    fetch(apiUrl(`/api/stripe/subscription?email=${encodeURIComponent(user.email)}`), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setCurrentPlan(data.plan || "free");
          setSubscriptionStatus(data.status || "none");
        }
      })
      .catch(() => {});
  }, [user?.email]);

  const handleUpgrade = async (planId: string) => {
    if (!user?.email) {
      toast({ title: "Inicia sesión", description: "Necesitas iniciar sesión para cambiar de plan.", variant: "destructive" });
      setLocation("/");
      return;
    }

    if (planId === "free") return;

    setLoadingPlan(planId);
    try {
      const res = await fetch(apiUrl("/api/stripe/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, plan: planId }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear sesión de checkout");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.email) return;
    setPortalLoading(true);
    try {
      const res = await fetch(apiUrl("/api/stripe/portal"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al abrir portal");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const isCurrentPlan = (planId: string) => currentPlan === planId;
  const canUpgrade = (planId: string) => {
    const order = { free: 0, pro: 1, enterprise: 2 };
    return (order[planId as keyof typeof order] ?? 0) > (order[currentPlan as keyof typeof order] ?? 0);
  };

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Planes y Precios</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tus necesidades. Empieza gratis y actualiza cuando lo necesites.
            </p>
            {subscriptionStatus === "past_due" && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                Tu pago tiene problemas. Por favor actualiza tu método de pago.
              </div>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.highlight
                    ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                    : ""
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-3 py-1 text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Más Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    {plan.id === "business" && <Briefcase className="w-5 h-5 text-muted-foreground" />}
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {isCurrentPlan(plan.id) && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Plan Actual
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                  </div>

                  <div className="mb-4 text-sm text-muted-foreground">
                    <strong>{plan.projectLimit}</strong> proyecto(s)
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4">
                  {isCurrentPlan(plan.id) ? (
                    currentPlan !== "free" ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={handleManageSubscription}
                        disabled={portalLoading}
                      >
                        {portalLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Gestionar Suscripción
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        Plan Actual
                      </Button>
                    )
                  ) : canUpgrade(plan.id) ? (
                    <Button
                      className="w-full"
                      variant={plan.highlight ? "default" : "outline"}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={loadingPlan !== null}
                    >
                      {loadingPlan === plan.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Actualizar a {plan.name}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      {plan.id === "free" ? "Plan Gratuito" : plan.name}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* FAQ / info */}
          <div className="mt-16 text-center text-sm text-muted-foreground">
            <p>Todos los pagos son procesados de forma segura por Stripe.</p>
            <p className="mt-1">Puedes cancelar tu suscripción en cualquier momento desde tu portal de cliente.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
