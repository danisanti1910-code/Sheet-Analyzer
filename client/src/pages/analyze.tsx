import { useState, useMemo, useEffect } from 'react';
import { useSheet } from '@/lib/sheet-context';
import { Layout } from '@/components/layout';
import { ColumnSidebar } from '@/components/column-sidebar';
import { ChartBuilder } from '@/components/chart-builder';
import { InsightsPanel } from '@/components/insights-panel';
import { DataTable } from '@/components/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { AlertCircle, RefreshCw, AlertTriangle, UserCheck, Trash2, Edit3 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/components/file-upload';

export default function Analyze() {
  const { activeProject, updateProject, refreshProjectData, activeProjectId, user } = useSheet();
  const [, setLocation] = useLocation();
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filteredValues, setFilteredValues] = useState<Record<string, string[]>>({});
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(activeProject?.name || "");

  useEffect(() => {
    if (!user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const handleFilterChange = (col: string, values: string[]) => {
    setFilteredValues(prev => ({ ...prev, [col]: values }));
  };

  const filteredData = useMemo(() => {
    const sourceData = activeProject?.sheetData;
    if (!sourceData) return null;
    let rows = sourceData.rows;
    
    Object.entries(filteredValues).forEach(([col, values]) => {
      rows = rows.filter(r => values.includes(String(r[col])));
    });

    return { ...sourceData, rows, rowCount: rows.length };
  }, [activeProject?.sheetData, filteredValues]);

  const duplicates = useMemo(() => {
    const dataToUse = filteredData || activeProject?.sheetData;
    if (!dataToUse) return [];
    const rows = dataToUse.rows;
    const seen = new Set();
    const dups: number[] = [];
    rows.forEach((row, idx) => {
      const str = JSON.stringify(row);
      if (seen.has(str)) dups.push(idx);
      seen.add(str);
    });
    return dups;
  }, [filteredData, activeProject?.sheetData]);

  const [ignoredDuplicates, setIgnoredDuplicates] = useState<Set<number>>(new Set());

  if (!user) return null;

  if (!activeProject) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold">Selecciona un proyecto para comenzar</h2>
          <Button asChild><Link href="/projects">Ver mis proyectos</Link></Button>
        </div>
      </Layout>
    );
  }

  if (!activeProject.sheetData) {
    return (
      <Layout>
        <div className="p-8 max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{activeProject.name}</h1>
            <p className="text-muted-foreground">Este proyecto no tiene datos todavía. Sube un archivo o conecta Google Sheets.</p>
          </div>
          <FileUpload />
        </div>
      </Layout>
    );
  }

  const handleUpdateName = () => {
    updateProject(activeProjectId!, { name: tempName });
    setIsEditingName(false);
  };

  const handleRemoveDuplicate = (index: number) => {
    const newRows = [...activeProject.sheetData!.rows];
    newRows.splice(index, 1);
    updateProject(activeProjectId!, { 
        sheetData: { ...activeProject.sheetData!, rows: newRows, rowCount: newRows.length } 
    });
  };

  const displayData = filteredData || activeProject.sheetData;

  return (
    <Layout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        <div className="bg-card border-b px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input value={tempName} onChange={e => setTempName(e.target.value)} className="h-8 w-48" />
                <Button size="sm" onClick={handleUpdateName}>OK</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg">{activeProject.name}</h1>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setTempName(activeProject.name); setIsEditingName(true); }}>
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {activeProject.sourceUrl && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => refreshProjectData(activeProjectId!)}>
                <RefreshCw className="h-3 w-3" /> Actualizar desde fuente
              </Button>
            )}
          </div>
          
          {duplicates.length > ignoredDuplicates.size && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-full border border-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">{duplicates.length - ignoredDuplicates.size} duplicados</span>
            </div>
          )}
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={20} minSize={15} className="hidden md:block">
            <ColumnSidebar 
              data={activeProject.sheetData} 
              selectedColumns={selectedColumns} 
              onSelectionChange={setSelectedColumns}
              filteredValues={filteredValues}
              onFilterChange={handleFilterChange}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={80}>
            <div className="h-full flex flex-col p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950/30">
                <Tabs defaultValue="visualize" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="visualize">Análisis</TabsTrigger>
                    <TabsTrigger value="data">Vista Previa</TabsTrigger>
                    <TabsTrigger value="duplicates">Limpieza ({duplicates.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="visualize" className="space-y-4">
                     <div className="flex flex-col xl:flex-row gap-6">
                        <div className="flex-1 h-[600px]">
                            <ChartBuilder data={displayData} selectedColumns={selectedColumns} />
                        </div>
                        <div className="w-full xl:w-[400px] shrink-0">
                            <InsightsPanel 
                                sheetData={displayData} 
                                selectedColumns={selectedColumns} 
                                filteredValues={filteredValues}
                                onFilterChange={handleFilterChange}
                            />
                        </div>
                     </div>
                  </TabsContent>

                  <TabsContent value="data">
                    <DataTable data={displayData} selectedColumns={selectedColumns} />
                  </TabsContent>

                  <TabsContent value="duplicates">
                    <Card>
                      <CardHeader><CardTitle>Gestión de Duplicados</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {duplicates.map((idx) => (
                            <div key={idx} className={`p-4 border rounded-lg flex items-center justify-between ${ignoredDuplicates.has(idx) ? 'opacity-50' : ''}`}>
                              <div className="text-sm truncate max-w-md">
                                <span className="font-mono text-xs mr-2 text-muted-foreground">Fila {idx + 1}</span>
                                {JSON.stringify(displayData.rows[idx]).substring(0, 100)}...
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="gap-1" onClick={() => setIgnoredDuplicates(prev => new Set([...prev, idx]))}>
                                  <UserCheck className="h-3 w-3" /> Ignorar
                                </Button>
                                <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleRemoveDuplicate(idx)}>
                                  <Trash2 className="h-3 w-3" /> Eliminar
                                </Button>
                              </div>
                            </div>
                          ))}
                          {duplicates.length === 0 && <p className="text-center py-10 text-muted-foreground">No se detectaron duplicados.</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
}
