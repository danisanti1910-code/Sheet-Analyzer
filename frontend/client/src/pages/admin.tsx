import { useSheet } from "@/lib/sheet-context";
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
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, BarChart3, Upload, Link2, Loader2, RefreshCw } from "lucide-react";
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

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users", user?.email],
    queryFn: async (): Promise<AdminUserStats[]> => {
      if (!user?.email) throw new Error("No user");
      const res = await fetch("/api/admin/users", {
        headers: { "X-User-Email": user.email },
        credentials: "include",
      });
      if (res.status === 403) throw new Error("FORBIDDEN");
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

  if (!isLoading && error && !isForbidden) {
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

        <p className="text-xs text-muted-foreground">
          <strong>Con URL:</strong> proyectos que conectaron datos desde una URL (ej. Google Sheets).
          <strong className="ml-2">Con Excel:</strong> proyectos que subieron un archivo (Excel/CSV).
        </p>
      </div>
    </Layout>
  );
}
