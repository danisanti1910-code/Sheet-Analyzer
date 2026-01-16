import { Link, useLocation } from "wouter";
import { useSheet } from "@/lib/sheet-context";
import { useAuth } from "@/hooks/use-auth";
import { 
  FileSpreadsheet, 
  BarChart3, 
  LayoutDashboard, 
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  LogOut,
  User as UserIcon,
  LayoutGrid
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { projects, activeProjectId, setActiveProjectId, createProject, deleteChart, activeProject } = useSheet();
  const { user, isLoading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isActive = (path: string) => location.startsWith(path);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName);
      setNewProjectName("");
      setIsDialogOpen(false);
      setLocation("/projects");
    }
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-background font-sans overflow-hidden">
        <header className="flex h-16 items-center justify-between px-8 border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <Link href="/" className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Sheet Analyzer</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.location.href = '/api/login'} data-testid="button-header-login">
              Iniciar Sesión
            </Button>
            <Button className="rounded-full px-6" onClick={() => window.location.href = '/api/login'} data-testid="button-header-signup">
              Empezar gratis
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    );
  }

  const userInitials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <aside className={`relative z-20 flex flex-col border-r bg-sidebar transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex h-14 items-center px-4 border-b shrink-0">
          <Link href="/projects" className="flex items-center space-x-3 overflow-hidden">
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && <span className="font-bold text-lg tracking-tight whitespace-nowrap">Sheet Analyzer</span>}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className={`w-full justify-start gap-2 ${collapsed ? 'px-2' : ''}`} data-testid="button-new-project">
                  <Plus className="h-4 w-4" />
                  {!collapsed && <span>Nuevo Proyecto</span>}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Crear nuevo proyecto</DialogTitle></DialogHeader>
                <Input 
                  placeholder="Nombre del proyecto" 
                  value={newProjectName} 
                  onChange={e => setNewProjectName(e.target.value)}
                  data-testid="input-project-name"
                />
                <DialogFooter>
                  <Button onClick={handleCreateProject} data-testid="button-create-project">Crear</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="px-3 mb-2">
             <nav className="space-y-1">
                <Link href="/projects" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive('/projects') && !isActive('/projects/') ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'}`}>
                  <LayoutGrid className="h-4 w-4" /> {!collapsed && <span>Mis Proyectos</span>}
                </Link>
                <Link href="/dashboard-global" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive('/dashboard-global') ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'}`}>
                  <LayoutDashboard className="h-4 w-4" /> {!collapsed && <span>Dashboard Principal</span>}
                </Link>
             </nav>
          </div>

          {activeProjectId && (
            <div className="px-3 mt-4 pt-4 border-t">
              {!collapsed && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">{activeProject?.name || "Proyecto Activo"}</p>}
              <nav className="space-y-1">
                  <Link href={`/projects/${activeProjectId}/charts/new`} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive(`/projects/${activeProjectId}/charts/new`) ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'}`}>
                    <BarChart3 className="h-4 w-4" /> {!collapsed && <span>Análisis / Nueva Gráfica</span>}
                  </Link>
                  <Link href={`/projects/${activeProjectId}/dashboards`} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive(`/projects/${activeProjectId}/dashboards`) ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'}`}>
                    <LayoutDashboard className="h-4 w-4" /> {!collapsed && <span>Dashboards</span>}
                  </Link>
              </nav>
            </div>
          )}

          <div className="px-3 mt-4 pt-4 border-t">
            {!collapsed && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">Gráficas del Proyecto</p>}
            <div className="space-y-1">
              {activeProject?.charts?.map(chart => (
                <div key={chart.id} className="group flex items-center gap-1">
                  <Link href={`/projects/${activeProjectId}/charts/${chart.id}`} className={`flex-1 flex items-center gap-3 h-9 px-3 rounded-lg text-xs hover:bg-muted ${isActive(`/projects/${activeProjectId}/charts/${chart.id}`) ? 'bg-muted font-medium' : ''}`}>
                    <BarChart3 className={`h-4 w-4 shrink-0 text-primary/70`} />
                    {!collapsed && <span className="truncate">{chart.name}</span>}
                  </Link>
                  {!collapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('¿Eliminar gráfica?')) {
                          deleteChart(chart.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {(!activeProject || !activeProject.charts || activeProject.charts.length === 0) && !collapsed && (
                <p className="px-3 text-[10px] text-muted-foreground italic">No hay gráficas guardadas</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t">
          <div className="flex items-center justify-between mb-4">
             {!collapsed && (
               <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {user.profileImageUrl ? (
                      <AvatarImage src={user.profileImageUrl} alt={user.firstName || 'User'} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold truncate max-w-[100px]">{user.firstName || 'Usuario'}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{user.email}</span>
                  </div>
               </div>
             )}
             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleLogout} title="Salir" data-testid="button-logout">
               <LogOut className="h-4 w-4" />
             </Button>
          </div>
          <Button variant="ghost" size="icon" className="w-full h-10" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
