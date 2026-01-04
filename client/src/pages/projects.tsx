import { useSheet } from '@/lib/sheet-context';
import { Layout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Calendar, ArrowRight, Trash2, LayoutGrid } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Projects() {
  const { projects, createProject, setActiveProjectId, deleteProject, user } = useSheet();
  const [, setLocation] = useLocation();
  const [newProjectName, setNewProjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!user) return null;

  const handleCreate = () => {
    if (newProjectName.trim()) {
      const newId = createProject(newProjectName);
      setNewProjectName("");
      setIsDialogOpen(false);
      // Navigate to analysis/new chart immediately
      setLocation(`/projects/${newId}/charts/new`);
    }
  };

  const openProject = (project: any) => {
    setActiveProjectId(project.id);
    
    // Si tiene datos, vamos directo al dashboard (o detalles)
    if (project.sheetData) {
        setLocation(`/projects/${project.id}/dashboards`);
    } else {
        // Si no tiene datos, vamos a la pantalla de análisis para cargar/configurar
        setLocation(`/projects/${project.id}/charts/new`);
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis Proyectos</h1>
            <p className="text-muted-foreground">Gestiona tus análisis y dashboards de forma independiente.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear un nuevo espacio de trabajo</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-muted-foreground">Cada proyecto mantiene sus propios datos, gráficas y configuraciones de forma aislada.</p>
                <Input 
                  placeholder="Ej: Análisis de Ventas Q4" 
                  value={newProjectName} 
                  onChange={e => setNewProjectName(e.target.value)} 
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate}>Crear Proyecto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed py-16">
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-primary/5">
                <LayoutGrid className="h-12 w-12 text-primary/30" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">No tienes proyectos todavía</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Crea tu primer proyecto para empezar a analizar tus hojas de cálculo de forma profesional.</p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Crear mi primer proyecto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <Card key={project.id} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive h-8 w-8" onClick={() => deleteProject(project.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="mt-4">{project.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Creado recientemente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {project.sheetData ? (
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {project.sheetData.rowCount} filas cargadas
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        Sin datos cargados
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="secondary" className="w-full gap-2" onClick={() => openProject(project)}>
                    Abrir Proyecto <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
