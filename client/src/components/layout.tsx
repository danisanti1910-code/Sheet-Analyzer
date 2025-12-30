import { Link, useLocation } from "wouter";
import { useSheet } from "@/lib/sheet-context";
import { 
  FileSpreadsheet, 
  BarChart3, 
  Info, 
  LayoutDashboard, 
  Home, 
  ChevronLeft,
  ChevronRight,
  Menu,
  FolderOpen,
  Plus,
  Trash2
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { projects, activeProjectId, setActiveProjectId, createProject, deleteProject } = useSheet();
  const [collapsed, setCollapsed] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName);
      setNewProjectName("");
      setIsDialogOpen(false);
      setLocation("/analyze");
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <aside className={`relative z-20 flex flex-col border-r bg-sidebar transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex h-14 items-center px-4 border-b shrink-0">
          <Link href="/" className="flex items-center space-x-3 overflow-hidden">
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
            {!collapsed && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">Proyectos</p>}
            <div className="space-y-1">
              {projects.map(project => (
                <div key={project.id} className="group flex items-center gap-1">
                  <Button 
                    variant={activeProjectId === project.id ? "secondary" : "ghost"}
                    className={`flex-1 justify-start gap-3 h-9 ${collapsed ? 'px-3' : 'px-3'}`}
                    onClick={() => {
                      setActiveProjectId(project.id);
                      if (location === '/') setLocation('/analyze');
                    }}
                  >
                    <FolderOpen className={`h-4 w-4 shrink-0 ${activeProjectId === project.id ? 'text-primary' : ''}`} />
                    {!collapsed && <span className="truncate">{project.name}</span>}
                  </Button>
                  {!collapsed && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t mt-4 pt-4 px-3">
             <nav className="space-y-1">
                <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive('/') ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'}`}>
                  <Home className="h-4 w-4" /> {!collapsed && <span>Inicio</span>}
                </Link>
                <Link href="/analyze" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${!activeProjectId ? 'opacity-50 pointer-events-none' : ''} ${isActive('/analyze') ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'}`}>
                  <BarChart3 className="h-4 w-4" /> {!collapsed && <span>Análisis</span>}
                </Link>
                <Link href="/dashboards" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${!activeProjectId ? 'opacity-50 pointer-events-none' : ''} ${isActive('/dashboards') ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'}`}>
                  <LayoutDashboard className="h-4 w-4" /> {!collapsed && <span>Dashboards</span>}
                </Link>
             </nav>
          </div>
        </div>

        <div className="p-2 border-t">
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
