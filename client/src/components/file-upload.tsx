import React, { useCallback, useState } from 'react';
import { useSheet } from '@/lib/sheet-context';
import { parseSheet } from '@/lib/sheet-utils';
import { useLocation } from 'wouter';
import { Upload, FileType, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function FileUpload() {
  const { setSheetData, setIsLoading } = useSheet();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [headerMode, setHeaderMode] = useState(true);
  const [importUrl, setImportUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setIsLoading(true);
    try {
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('El archivo excede el límite de 50MB');
      }
      const data = await parseSheet(file, headerMode);
      setSheetData(data);
      toast({
        title: "Archivo procesado con éxito",
        description: `Se cargaron ${data.rowCount} filas y ${data.columns.length} columnas.`,
        variant: "default",
      });
      setLocation('/analyze');
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error al procesar",
        description: error.message || "No se pudo leer el archivo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [headerMode]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleUrlImport = async () => {
    if (!importUrl) return;
    
    setIsProcessing(true);
    setIsLoading(true);

    try {
      // Basic heuristic for Google Sheets
      // https://docs.google.com/spreadsheets/d/ID/edit -> https://docs.google.com/spreadsheets/d/ID/export?format=csv
      let fetchUrl = importUrl;
      if (importUrl.includes('docs.google.com/spreadsheets')) {
        const idMatch = importUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1]) {
            fetchUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
        }
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('No se pudo descargar el archivo. Asegúrate de que sea público.');
      
      const blob = await response.blob();
      const file = new File([blob], "imported_sheet.csv", { type: "text/csv" });
      await handleFile(file);
      
    } catch (error: any) {
        toast({
            title: "Error de importación",
            description: "No se pudo importar desde la URL. Verifica que el enlace sea público (File -> Share -> Publish to web o Anyone with link).",
            variant: "destructive"
        });
        setIsProcessing(false);
        setIsLoading(false);
    }
  };

  const loadDemoData = async () => {
    setIsProcessing(true);
    setIsLoading(true);
    try {
        // Create a simple CSV string
        const csvContent = `Fecha,Producto,Categoría,Ventas,Cliente,Satisfacción
2023-01-01,Laptop Pro,Electrónica,1200,Empresa A,4.5
2023-01-02,Mouse Inalámbrico,Accesorios,25,Juan Perez,5.0
2023-01-03,Monitor 4K,Electrónica,450,Maria Garcia,4.0
2023-01-04,Teclado Mecánico,Accesorios,80,Pedro Lopez,3.5
2023-01-05,Laptop Air,Electrónica,900,Empresa B,4.8
2023-01-06,USB-C Hub,Accesorios,40,Ana Martinez,2.0
2023-01-07,Webcam HD,Accesorios,60,Carlos Ruiz,4.2
2023-01-08,Laptop Pro,Electrónica,1200,Empresa C,4.9
2023-01-09,Silla Ergonómica,Muebles,300,Laura Diaz,3.8
2023-01-10,Escritorio Elevable,Muebles,500,Empresa A,4.7`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const file = new File([blob], "demo_ventas.csv", { type: "text/csv" });
        await handleFile(file);

    } catch (e) {
        console.error(e);
        setIsProcessing(false);
        setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className={`
        relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 ease-in-out
        ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
        ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
      `}>
        <div 
            className="flex flex-col items-center justify-center text-center space-y-4"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
          <div className="p-4 rounded-full bg-primary/10 text-primary mb-2">
            {isProcessing ? <Loader2 className="w-10 h-10 animate-spin" /> : <Upload className="w-10 h-10" />}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight">
              {isProcessing ? 'Procesando archivo...' : 'Sube tu hoja de cálculo'}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Arrastra y suelta tu archivo Excel (.xlsx, .xls) o CSV aquí, o haz clic para explorar.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleInputChange}
            />
            <Button asChild size="lg" className="rounded-full px-8">
              <label htmlFor="file-upload" className="cursor-pointer">
                Seleccionar Archivo
              </label>
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
             <AlertCircle className="w-4 h-4" />
             <span>Máximo 50MB. Procesamiento local seguro.</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="header-mode" className="font-medium">Opciones de Lectura</Label>
                <FileType className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="header-mode" checked={headerMode} onCheckedChange={setHeaderMode} />
                <Label htmlFor="header-mode" className="text-sm text-muted-foreground">
                    Tratar primera fila como encabezado
                </Label>
            </div>
            <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full" onClick={loadDemoData}>
                    Probar con dataset demo
                </Button>
            </div>
        </Card>

        <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <Label className="font-medium">Importar URL</Label>
                <div className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Beta</div>
            </div>
            <div className="flex gap-2">
                <Input 
                    placeholder="Enlace público de Google Sheets..." 
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="flex-1"
                />
                <Button size="icon" variant="secondary" onClick={handleUrlImport} disabled={!importUrl || isProcessing}>
                    <CheckCircle2 className="w-4 h-4" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Soporta enlaces públicos de Google Sheets/Drive.
            </p>
        </Card>
      </div>
    </div>
  );
}
