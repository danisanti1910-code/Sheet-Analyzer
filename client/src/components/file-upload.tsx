import React, { useCallback, useState } from 'react';
import { useSheet } from '@/lib/sheet-context';
import { parseSheet } from '@/lib/sheet-utils';
import { useLocation } from 'wouter';
import { Upload, FileType, CheckCircle2, Loader2, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function FileUpload() {
  const { activeProject, updateProject, activeProjectId, createProject } = useSheet();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [headerMode, setHeaderMode] = useState(true);
  const [importUrl, setImportUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await parseSheet(file, headerMode);
      
      let targetId = activeProjectId;
      if (!targetId) {
        // Create a default project if none exists
        const newId = Math.random().toString(36).substring(7);
        createProject(`Proyecto ${file.name}`);
        targetId = newId; 
      }

      updateProject(activeProjectId!, { sheetData: data });
      toast({ title: "Archivo procesado" });
      setLocation('/analyze');
    } catch (error: any) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUrlImport = async () => {
    if (!importUrl) return;
    setIsProcessing(true);
    try {
      let fetchUrl = importUrl;
      if (importUrl.includes('docs.google.com/spreadsheets')) {
        const idMatch = importUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1]) {
            fetchUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
        }
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const file = new File([blob], "imported.csv", { type: "text/csv" });
      
      const data = await parseSheet(file, headerMode);
      updateProject(activeProjectId!, { sheetData: data, sourceUrl: importUrl });
      toast({ title: "Importación exitosa" });
      setLocation('/analyze');
    } catch (error: any) {
      toast({ title: "Error de URL", variant: "destructive" });
    } finally {
      setIsProcessing(false);
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
    </div>
  );
}
