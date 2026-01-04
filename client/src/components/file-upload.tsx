import React, { useCallback, useState } from 'react';
import { useSheet } from '@/lib/sheet-context';
import { parseSheet } from '@/lib/sheet-utils';
import { useLocation } from 'wouter';
import { Upload, FileType, CheckCircle2, Loader2, Link as LinkIcon, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FileUpload() {
  const { activeProject, updateProject, activeProjectId, createProject, user, login } = useSheet();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [headerMode, setHeaderMode] = useState(true);
  const [importUrl, setImportUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'file' | 'url', data: any } | null>(null);

  const executeAction = async (action: { type: 'file' | 'url', data: any }) => {
    setIsProcessing(true);
    try {
      if (action.type === 'file') {
        const data = await parseSheet(action.data, headerMode);
        let targetId = activeProjectId;
        if (!targetId) {
          targetId = createProject(`Proyecto ${action.data.name}`);
        }
        updateProject(targetId || '', { sheetData: data });
        // Update targetId for navigation
        if (!activeProjectId) setActiveProjectId(targetId);
        
        toast({ title: "Procesado con éxito" });
        setLocation(`/projects/${targetId}/charts/new`);
      } else {
        let fetchUrl = action.data;
        if (fetchUrl.includes('docs.google.com/spreadsheets')) {
          const idMatch = fetchUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (idMatch && idMatch[1]) {
              fetchUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
          }
        }
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error('Fetch failed');
        const blob = await response.blob();
        const file = new File([blob], "imported.csv", { type: "text/csv" });
        const data = await parseSheet(file, headerMode);
        updateProject(activeProjectId || '', { sheetData: data, sourceUrl: action.data });
        
        toast({ title: "Procesado con éxito" });
        setLocation(`/projects/${activeProjectId}/charts/new`);
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  };

  const handleFile = async (file: File) => {
    if (!user) {
      setPendingAction({ type: 'file', data: file });
      setIsAuthDialogOpen(true);
      return;
    }
    executeAction({ type: 'file', data: file });
  };

  const handleUrlImport = async () => {
    if (!importUrl) return;
    if (!user) {
      setPendingAction({ type: 'url', data: importUrl });
      setIsAuthDialogOpen(true);
      return;
    }
    executeAction({ type: 'url', data: importUrl });
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    login({
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      useCase: formData.get('useCase') as string
    });
    setIsAuthDialogOpen(false);
    if (pendingAction) {
      executeAction(pendingAction);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <Card 
        className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            {isProcessing ? <Loader2 className="w-10 h-10 animate-spin" /> : <Upload className="w-10 h-10" />}
          </div>
          <h3 className="text-xl font-semibold">Sube tus datos</h3>
          <input type="file" id="file-upload" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
          <Button asChild><label htmlFor="file-upload" className="cursor-pointer">Seleccionar Archivo</label></Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <Label className="font-medium">Opciones</Label>
          <div className="flex items-center space-x-2">
            <Switch checked={headerMode} onCheckedChange={setHeaderMode} />
            <span className="text-sm">Encabezado en primera fila</span>
          </div>
        </Card>
        <Card className="p-6 space-y-4">
          <Label className="font-medium">Google Sheets</Label>
          <Input placeholder="URL pública..." value={importUrl} onChange={e => setImportUrl(e.target.value)} />
          <Button className="w-full" onClick={handleUrlImport} disabled={!importUrl || isProcessing}>Importar datos</Button>
        </Card>
      </div>

      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <UserPlus className="h-5 w-5 text-primary" />
               Crea una cuenta para continuar
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Para analizar y guardar tus proyectos, necesitas una cuenta gratuita.</p>
          <form onSubmit={handleAuthSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="auth-firstName">Nombre</Label>
                <Input id="auth-firstName" name="firstName" placeholder="Nombre" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-lastName">Apellido</Label>
                <Input id="auth-lastName" name="lastName" placeholder="Apellido" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-email">Correo electrónico</Label>
              <Input id="auth-email" name="email" type="email" placeholder="tu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-use-case">¿Para qué usarás el sistema?</Label>
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
            <Button type="submit" className="w-full h-11 mt-4">Registrarme y analizar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
