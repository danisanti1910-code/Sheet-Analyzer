import { useState } from "react";
import { useSheet } from "@/lib/sheet-context";
import { apiUrl } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, BarChart3, Upload, Link2, Loader2, RefreshCw, KeyRound } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AdminUserStats {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lastActiveAt: string;
  projectCount: number;
  chartCount: number;
  chartTypes: string[];
  projectsWithUrl: number;
  projectsWithUpload: number;
}

const CHART_TYPE_LABELS: Record<string, string> = {
  bar: "Barras",
  line: "Líneas",
  area: "Área",
  pie: "Circular",
  scatter: "Dispersión",
  table: "Tabla",
};

export default function Admin() {
  const { user } = useSheet();
  const [adminPassword, setAdminPassword] = useState("");
  const [setPasswordValue, setSetPasswordValue] = useState({ password: "", confirm: "" });
  const [setPasswordStatus, setSetPasswordStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [setPasswordMessage, setSetPasswordMessage] = useState("");
  const [showSetPasswordForm, setShowSetPasswordForm] = useState(false);

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users", user?.email, adminPassword],
    queryFn: async (): Promise<AdminUserStats[]> => {
      if (!user?.email) throw new Error("No user");
      const headers: Record<string, string> = { "X-User-Email": user.email };
      if (adminPassword) headers["X-Admin-Password"] = adminPassword;
      const res = await fetch(apiUrl("/api/admin/users"), {
        headers,
        credentials: "include",
      });
      if (res.status === 403) throw new Error("FORBIDDEN");
      if (res.status === 401) {
        const err = await res.json().catch(() => ({}));
        const e = new Error(err?.error ?? "No autorizado") as Error & { code?: string };
        e.code = err?.code;
        throw e;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Error al cargar usuarios");
      }
      const body = await res.json();
      return body.map((u: AdminUserStats) => ({
        ...u,
        lastActiveAt: typeof u.lastActiveAt === "string" ? u.lastActiveAt : new Date(u.lastActiveAt).toISOString(),
      }));
    },
    enabled: !!user?.email,
  });

  const isForbidden = error?.message === "FORBIDDEN";
  const needsAdminPassword = (error as Error & { code?: string })?.code === "ADMIN_PASSWORD_REQUIRED";

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setPasswordValue.password.length < 8) {
      setSetPasswordMessage("Mínimo 8 caracteres");
      setSetPasswordStatus("error");
      return;
    }
    if (setPasswordValue.password !== setPasswordValue.confirm) {
      setSetPasswordMessage("Las contraseñas no coinciden");
      setSetPasswordStatus("error");
      return;
    }
    setSetPasswordStatus("loading");
    setSetPasswordMessage("");
    try {
      const res = await fetch(apiUrl("/api/auth/set-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: user?.email,
          password: setPasswordValue.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSetPasswordMessage(data?.error ?? "Error al guardar");
        setSetPasswordStatus("error");
        return;
      }
      setSetPasswordStatus("success");
      setSetPasswordMessage(data?.message ?? "Contraseña guardada.");
      setSetPasswordValue({ password: "", confirm: "" });
      setAdminPassword(setPasswordValue.password);
      setShowSetPasswordForm(false);
      refetch();
    } catch {
      setSetPasswordMessage("Error de conexión");
      setSetPasswordStatus("error");
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Inicia sesión para acceder.</p>
        </div>
      </Layout>
    );
  }

  if (!isLoading && isForbidden) {
    return (
      <Layout>
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Acceso restringido</h2>
          <p className="text-muted-foreground mt-2 text-center max-w-md">
            Solo super administradores pueden ver esta página. Configura <code className="text-xs bg-muted px-1 rounded">SUPER_ADMIN_EMAIL</code> en el archivo .env del servidor con tu correo ({user?.email}) y reinicia el servidor.
          </p>
        </div>
      </Layout>
    );
  }

  if (!isLoading && error && !isForbidden && !needsAdminPassword) {
    return (
      <Layout>
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
          <p className="text-destructive font-medium">Error al cargar usuarios</p>
          <p className="text-muted-foreground mt-2 text-sm">{error.message}</p>
          <button onClick={() => refetch()} className="mt-4 text-sm text-primary hover:underline">Reintentar</button>
        </div>
      </Layout>
    );
  }

  if (!isLoading && needsAdminPassword) {
    return (
      <Layout>
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] max-w-sm mx-auto">
          <KeyRound className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Contraseña de administrador</h2>

          {showSetPasswordForm ? (
            <>
              <p className="text-muted-foreground text-sm text-center mt-2 mb-4">
                Establece una contraseña para acceder al panel de administración. Mínimo 8 caracteres.
              </p>
              <form onSubmit={handleSetPassword} className="w-full space-y-3">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={setPasswordValue.password}
                  onChange={(e) => setSetPasswordValue((p) => ({ ...p, password: e.target.value }))}
                  minLength={8}
                  className="w-full"
                />
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={setPasswordValue.confirm}
                  onChange={(e) => setSetPasswordValue((p) => ({ ...p, confirm: e.target.value }))}
                  className="w-full"
                />
                {setPasswordMessage && (
                  <p className={setPasswordStatus === "error" ? "text-destructive text-sm" : "text-muted-foreground text-sm"}>
                    {setPasswordMessage}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowSetPasswordForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={setPasswordStatus === "loading"}>
                    {setPasswordStatus === "loading" ? "Guardando…" : "Guardar contraseña"}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm text-center mt-2 mb-4">
                Tu cuenta es super administrador. Introduce la contraseña que configuraste para acceder al panel.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.querySelector<HTMLInputElement>('input[name="adminPassword"]');
                  if (input?.value) {
                    setAdminPassword(input.value);
                    refetch();
                  }
                }}
                className="w-full space-y-3"
              >
                <Label htmlFor="adminPassword">Contraseña</Label>
                <Input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  placeholder="Contraseña de administrador"
                  autoFocus
                  className="w-full"
                />
                <Button type="submit" className="w-full">Entrar</Button>
              </form>
              <button
                type="button"
                onClick={() => setShowSetPasswordForm(true)}
                className="mt-4 text-sm text-primary hover:underline"
              >
                ¿Primera vez? Establecer contraseña
              </button>
            </>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Administración de usuarios</h1>
              <p className="text-sm text-muted-foreground">Usuarios activos, proyectos y gráficas por tipo</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Super admin
          </Badge>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Usuarios del sistema</CardTitle>
            <button
              onClick={() => refetch()}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" /> Actualizar
            </button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Última actividad</TableHead>
                      <TableHead className="text-center">Proyectos</TableHead>
                      <TableHead className="text-center">Nº gráficas</TableHead>
                      <TableHead>Tipos de gráfica</TableHead>
                      <TableHead className="text-center">Con URL</TableHead>
                      <TableHead className="text-center">Con Excel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                          No hay usuarios registrados aún. Los usuarios aparecen aquí cuando inician sesión en el sistema.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            {u.firstName} {u.lastName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {format(new Date(u.lastActiveAt), "d MMM y, HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell className="text-center">{u.projectCount}</TableCell>
                          <TableCell className="text-center">{u.chartCount}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {u.chartTypes.length === 0 ? (
                                <span className="text-muted-foreground text-sm">—</span>
                              ) : (
                                u.chartTypes.map((t) => (
                                  <Badge key={t} variant="outline" className="text-xs">
                                    {CHART_TYPE_LABELS[t] ?? t}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {u.projectsWithUrl > 0 ? (
                              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400" title="Proyectos con datos desde URL">
                                <Link2 className="h-4 w-4" /> {u.projectsWithUrl}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {u.projectsWithUpload > 0 ? (
                              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400" title="Proyectos con Excel/archivo subido">
                                <Upload className="h-4 w-4" /> {u.projectsWithUpload}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Contraseña de administrador
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Puedes cambiar la contraseña que usas para acceder a esta página.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="max-w-sm space-y-3">
              <Label htmlFor="changePassword">Nueva contraseña</Label>
              <Input
                id="changePassword"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={setPasswordValue.password}
                onChange={(e) => setSetPasswordValue((p) => ({ ...p, password: e.target.value }))}
                minLength={8}
              />
              <Label htmlFor="changeConfirm">Confirmar</Label>
              <Input
                id="changeConfirm"
                type="password"
                placeholder="Repite la contraseña"
                value={setPasswordValue.confirm}
                onChange={(e) => setSetPasswordValue((p) => ({ ...p, confirm: e.target.value }))}
              />
              {setPasswordMessage && (
                <p className={setPasswordStatus === "error" ? "text-destructive text-sm" : "text-muted-foreground text-sm"}>
                  {setPasswordMessage}
                </p>
              )}
              <Button type="submit" size="sm" disabled={setPasswordStatus === "loading"}>
                {setPasswordStatus === "loading" ? "Guardando…" : "Cambiar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          <strong>Con URL:</strong> proyectos que conectaron datos desde una URL (ej. Google Sheets).
          <strong className="ml-2">Con Excel:</strong> proyectos que subieron un archivo (Excel/CSV).
        </p>
      </div>
    </Layout>
  );
}
