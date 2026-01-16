import { useState, useMemo, useEffect } from 'react';
import { useSheet, SavedChart } from '@/lib/sheet-context';
import { useAuth } from '@/hooks/use-auth';
import { Layout } from '@/components/layout';
import { ColumnSidebar } from '@/components/column-sidebar';
import { ChartBuilder } from '@/components/chart-builder';
import { InsightsPanel } from '@/components/insights-panel';
import { DataTable } from '@/components/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { AlertCircle, RefreshCw, AlertTriangle, UserCheck, Trash2, Edit3 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Link, useLocation, useRoute } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/components/file-upload';
import { useToast } from '@/hooks/use-toast';

// Wrapper to handle chart logic based on props
export function ChartBuilderWrapper({ 
  data, 
  selectedColumns, 
  setSelectedColumns, 
  setFilteredValues,
  projectId,
  chartId
}: { 
  data: any, 
  selectedColumns: string[], 
  setSelectedColumns: (cols: string[]) => void, 
  setFilteredValues: (vals: any) => void,
  projectId: string,
  chartId?: string
}) {
  const { getChart, createChart, updateChart, activeProject, addToGlobalDashboard: addToGlobalDashboardProp } = useSheet();
  const [initialConfig, setInitialConfig] = useState<any>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (chartId && activeProject) {
      const chart = getChart(chartId);
      if (chart) {
        // Force state updates to sync with the view
        setSelectedColumns([...chart.chartConfig.selectedColumns]);
        if (chart.chartConfig.filteredValues) {
          setFilteredValues({ ...chart.chartConfig.filteredValues });
        }
        setInitialConfig({
          ...chart.chartConfig,
          title: chart.name
        });
      }
    } else {
      // New chart - reset if needed, but only on mount/id change
      // Don't reset if we are just typing in the builder
      if (!initialConfig) {
        setSelectedColumns([]);
        setFilteredValues({});
        setInitialConfig(null);
      }
    }
  }, [chartId, activeProject?.id]);

  const handleSave = async (config: SavedChart['chartConfig'] & { name: string }, options: { addToProjectDashboard: boolean, addToGlobalDashboard: boolean }) => {
    const { name, ...chartConfig } = config;
    const { addToProjectDashboard, addToGlobalDashboard } = options;
    
    let savedChartId = chartId;

    if (savedChartId) {
      // Update existing chart
      await updateChart(savedChartId, {
        name,
        includeInsights: addToProjectDashboard ? true : undefined,
        chartConfig: {
          ...chartConfig,
          selectedColumns, 
        }
      });
      toast({ title: "Gráfica actualizada", description: "Los cambios se han guardado correctamente." });
      
      // Handle Global Dashboard for existing charts
      if (addToGlobalDashboard) {
        addToGlobalDashboardProp(projectId, savedChartId);
      }
      
      // Navigate to dashboard if checkbox was checked, otherwise stay on current chart
      if (addToProjectDashboard) {
        setLocation(`/projects/${projectId}/dashboards`);
      }
      // No navigation needed when already viewing this chart
    } else {
      // Create new chart
      const newId = await createChart(projectId, {
        ...chartConfig,
        selectedColumns
      }, name, addToProjectDashboard);
      
      savedChartId = newId;
      toast({ title: "Gráfica guardada", description: "Se ha creado una nueva gráfica en el proyecto." });
      
      // Handle Global Dashboard
      if (addToGlobalDashboard && savedChartId) {
        addToGlobalDashboardProp(projectId, savedChartId);
      }
      
      // Navigate: to dashboard if checkbox checked, otherwise to the new chart view
      if (addToProjectDashboard) {
        setLocation(`/projects/${projectId}/dashboards`);
      } else {
        setLocation(`/projects/${projectId}/charts/${savedChartId}`);
      }
    }
  };

  return (
    <ChartBuilder 
      key={chartId || 'new'} 
      data={data} 
      selectedColumns={selectedColumns} 
      initialConfig={initialConfig} 
      onSave={handleSave}
      isEditing={!!chartId}
    />
  );
}

// Rename destructured prop to avoid conflict or just use it directly
// Wait, I messed up the destructuring above.
// Correct approach:
// const { getChart, createChart, updateChart, activeProject, addToGlobalDashboard } = useSheet();
// then use addToGlobalDashboard directly.


export default function Analyze({ params }: { params: { projectId: string, chartId?: string } }) {
  const { activeProject, setActiveProjectId, updateProject, refreshProjectData } = useSheet();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filteredValues, setFilteredValues] = useState<Record<string, string[]>>({});
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  // Handle URL params
  const projectId = params?.projectId;
  const chartId = params?.chartId;

  useEffect(() => {
    if (projectId && (!activeProject || activeProject.id !== projectId)) {
      setActiveProjectId(projectId);
    }
  }, [projectId, activeProject, setActiveProjectId]);

  useEffect(() => {
    if (activeProject) {
      setTempName(activeProject.name);
    }
  }, [activeProject]);

  const handleSelectView = (view: any) => {
    if (view.id) {
       setLocation(`/projects/${projectId}/charts/${view.id}`);
    }
  };

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
    
    // Applying filters to all related columns
    Object.entries(filteredValues).forEach(([col, values]) => {
      if (!values || values.length === 0) return;

      if (col.endsWith('_min')) {
        const actualCol = col.replace('_min', '');
        const type = sourceData.columnProfiles[actualCol]?.type;
        if (type === 'numeric') {
          rows = rows.filter(r => Number(r[actualCol]) >= Number(values[0]));
        } else if (type === 'datetime') {
          rows = rows.filter(r => new Date(r[actualCol]) >= new Date(values[0]));
        }
      } else if (col.endsWith('_max')) {
        const actualCol = col.replace('_max', '');
        const type = sourceData.columnProfiles[actualCol]?.type;
        if (type === 'numeric') {
          rows = rows.filter(r => Number(r[actualCol]) <= Number(values[0]));
        } else if (type === 'datetime') {
          rows = rows.filter(r => new Date(r[actualCol]) <= new Date(values[0]));
        }
      } else {
        rows = rows.filter(r => values.includes(String(r[col])));
      }
    });

    // Re-profiling columns based on filtered data for relational statistics
    const columns = sourceData.columns;
    const profiles: any = {};
    columns.forEach(col => {
      const values = rows.map(r => r[col]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const missingCount = values.length - nonNullValues.length;
      const type = sourceData.columnProfiles[col]?.type || 'unknown';
      const uniqueValues = new Set(nonNullValues);
      
      let stats: any = {};
      if (type === 'numeric' && nonNullValues.length > 0) {
        const nums = nonNullValues.map(v => Number(v)).sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        stats.min = nums[0];
        stats.max = nums[nums.length - 1];
        stats.mean = sum / nums.length;
        stats.median = nums[Math.floor(nums.length / 2)];
        const variance = nums.reduce((a, b) => a + Math.pow(b - stats.mean, 2), 0) / nums.length;
        stats.std = Math.sqrt(variance);
      } else if ((type === 'categorical' || type === 'boolean') && nonNullValues.length > 0) {
        const counts: Record<string, number> = {};
        nonNullValues.forEach(v => {
          const key = String(v);
          counts[key] = (counts[key] || 0) + 1;
        });
        stats.topCategories = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([value, count]) => ({ value, count }));
      }

      profiles[col] = {
        ...sourceData.columnProfiles[col],
        missingCount,
        missingPercentage: (missingCount / rows.length) * 100,
        uniqueCount: uniqueValues.size,
        ...stats
      };
    });

    return { ...sourceData, rows, rowCount: rows.length, columnProfiles: profiles };
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

  if (!projectId) {
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

  if (activeProject && !activeProject.sheetData) {
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

  if (!activeProject) return null; // Loading state ideally

  const handleUpdateName = () => {
    updateProject(projectId, { name: tempName });
    setIsEditingName(false);
  };

  const handleRemoveDuplicate = (index: number) => {
    const newRows = [...activeProject.sheetData!.rows];
    newRows.splice(index, 1);
    updateProject(projectId, { 
        sheetData: { ...activeProject.sheetData!, rows: newRows, rowCount: newRows.length } 
    });
  };

  const displayData = filteredData || activeProject.sheetData;

  if (!displayData) return null;

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
              <Button variant="outline" size="sm" className="gap-2" onClick={() => refreshProjectData(projectId)}>
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
              data={activeProject.sheetData!} 
              selectedColumns={selectedColumns} 
              onSelectionChange={setSelectedColumns}
              filteredValues={filteredValues}
              onFilterChange={handleFilterChange}
              onSelectView={handleSelectView}
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
                            <ChartBuilderWrapper 
                              data={displayData!} 
                              selectedColumns={selectedColumns} 
                              setSelectedColumns={setSelectedColumns}
                              setFilteredValues={setFilteredValues}
                              projectId={projectId}
                              chartId={chartId}
                            />
                        </div>
                        <div className="w-full xl:w-[400px] shrink-0">
                            <InsightsPanel 
                                sheetData={displayData!} 
                                sourceData={activeProject.sheetData!}
                                selectedColumns={selectedColumns} 
                                filteredValues={filteredValues}
                                onFilterChange={handleFilterChange}
                            />
                        </div>
                     </div>
                  </TabsContent>

                  <TabsContent value="data">
                    <DataTable data={displayData!} selectedColumns={selectedColumns} />
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
                                <Button size="sm" variant="outline" className="gap-1" onClick={() => setIgnoredDuplicates(prev => {
                                  const next = new Set(prev);
                                  next.add(idx);
                                  return next;
                                })}>
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
