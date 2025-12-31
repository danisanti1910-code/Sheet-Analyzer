import { Link, useLocation } from "wouter";
import { useSheet } from "@/lib/sheet-context";
import { 
  FileSpreadsheet, 
  BarChart3, 
  LayoutDashboard, 
  Home, 
  ChevronLeft,
  ChevronRight,
  FolderOpen,
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { projects, activeProjectId, setActiveProjectId, createProject, deleteProject, user, login, logout } = useSheet();
  const [collapsed, setCollapsed] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { toast } = useToast();

  const isActive = (path: string) => location === path;

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName);
      setNewProjectName("");
      setIsDialogOpen(false);
      setLocation("/analyze");
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      firstName: "Usuario",
      lastName: "Demo",
      email: "usuario@demo.com",
      useCase: "Personal"
    });
    toast({ title: "Bienvenido de nuevo" });
    setIsLoginOpen(false);
    setLocation("/projects");
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    login({
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      useCase: formData.get('useCase') as string
    });
    toast({ title: "Cuenta creada con éxito" });
    setIsLoginOpen(false);
    setLocation("/projects");
  };

  // If NO USER, show simpler layout without sidebar
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
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost">Iniciar Sesión</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Ingresa a tu cuenta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleLoginSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" defaultValue="usuario@demo.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" placeholder="••••••••" defaultValue="password" required />
                  </div>
                  <Button type="submit" className="w-full h-11">Ingresar</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-full px-6">Empezar gratis</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Crea tu cuenta gratis</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRegisterSubmit} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-firstName">Nombre</Label>
                      <Input id="reg-firstName" name="firstName" placeholder="Nombre" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-lastName">Apellido</Label>
                      <Input id="reg-lastName" name="lastName" placeholder="Apellido" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Correo electrónico</Label>
                    <Input id="reg-email" name="email" type="email" placeholder="tu@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-use-case">¿Para qué usarás el sistema?</Label>
                    <Select name="useCase" required>
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
                    <div className="space-y-2 relative">
                      <Label htmlFor="reg-password">Contraseña</Label>
                      <Input 
                        id="reg-password" 
                        name="password" 
                        type={showPassword ? "text" : "password"} 
                        required 
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-0 bottom-0 h-10 px-3" 
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "Ocultar" : "Ver"}
                      </Button>
                    </div>
                    <div className="space-y-2 relative">
                      <Label htmlFor="reg-confirmPassword">Confirmar</Label>
                      <Input 
                        id="reg-confirmPassword" 
                        name="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"} 
                        required 
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-0 bottom-0 h-10 px-3" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? "Ocultar" : "Ver"}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 mt-4">Comenzar ahora</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    );
  }

  // LOGGED IN LAYOUT with SIDEBAR
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
                <Button variant="outline" className={`w-full justify-start gap-2 ${collapsed ? 'px-2' : ''}`}>
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
                />
                <DialogFooter>
                  <Button onClick={handleCreateProject}>Crear</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="px-3 mb-2">
             <nav className="space-y-1">
                <Link href="/projects" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive('/projects') ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'}`}>
                  <LayoutGrid className="h-4 w-4" /> {!collapsed && <span>Mis Proyectos</span>}
                </Link>
             </nav>
          </div>

          {activeProjectId && (
            <div className="px-3 mt-4 pt-4 border-t">
              {!collapsed && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">Proyecto Activo</p>}
              <nav className="space-y-1">
                  <Link href="/analyze" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive('/analyze') ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'}`}>
                    <BarChart3 className="h-4 w-4" /> {!collapsed && <span>Análisis</span>}
                  </Link>
                  <Link href="/dashboards" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive('/dashboards') ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'}`}>
                    <LayoutDashboard className="h-4 w-4" /> {!collapsed && <span>Dashboards</span>}
                  </Link>
              </nav>
            </div>
          )}

          <div className="px-3 mt-4 pt-4 border-t">
            {!collapsed && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">Recientes</p>}
            <div className="space-y-1">
              {projects.slice(0, 5).map(project => (
                <div key={project.id} className="group flex items-center gap-1">
                  <Button 
                    variant={activeProjectId === project.id ? "secondary" : "ghost"}
                    className={`flex-1 justify-start gap-3 h-9 ${collapsed ? 'px-3' : 'px-3'}`}
                    onClick={() => {
                      setActiveProjectId(project.id);
                      setLocation('/analyze');
                    }}
                  >
                    <FolderOpen className={`h-4 w-4 shrink-0 ${activeProjectId === project.id ? 'text-primary' : ''}`} />
                    {!collapsed && <span className="truncate text-xs">{project.name}</span>}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t">
          <div className="flex items-center justify-between mb-4">
             {!collapsed && (
               <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold truncate max-w-[100px]">{user.firstName}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{user.email}</span>
                  </div>
               </div>
             )}
             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { logout(); setLocation('/'); }} title="Salir">
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
