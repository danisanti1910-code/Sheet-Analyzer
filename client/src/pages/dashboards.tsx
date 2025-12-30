import { useSheet } from '@/lib/sheet-context';
import { Layout } from '@/components/layout';
import { ChartBuilder } from '@/components/chart-builder';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle, Plus, Edit3 } from 'lucide-react';
import { Link } from 'wouter';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function Dashboards() {
  const { activeProject, activeProjectId, deleteView, updateViewName } = useSheet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  if (!activeProject || !activeProject.sheetData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold">Selecciona un proyecto con datos</h2>
          <Button asChild><Link href="/">Ir al Inicio</Link></Button>
        </div>
      </Layout>
    );
  }

  const handleUpdateName = (id: string) => {
    updateViewName(id, tempName);
    setEditingId(null);
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col p-6 space-y-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{activeProject.name} - Dashboard</h1>
            <p className="text-muted-foreground text-xs">Vistas guardadas en este proyecto.</p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/analyze"><Plus className="w-4 h-4" /> Nuevo Análisis</Link>
          </Button>
        </div>

        <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950/20 rounded-xl p-4 overflow-hidden border">
          {activeProject.savedViews.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p>No hay gráficas guardadas en este proyecto.</p>
            </div>
          ) : (
            <ResizablePanelGroup direction="horizontal">
                {activeProject.savedViews.map((view, index) => (
                    <React.Fragment key={view.id}>
                        <ResizablePanel defaultSize={100 / activeProject.savedViews.length} minSize={20}>
                            <Card className="h-full group overflow-hidden border-none bg-background flex flex-col shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between py-2 px-3 border-b bg-muted/10 shrink-0">
                                    {editingId === view.id ? (
                                      <div className="flex gap-1">
                                        <Input value={tempName} onChange={e => setTempName(e.target.value)} className="h-6 text-[10px] w-24" />
                                        <Button size="icon" className="h-6 w-6" onClick={() => handleUpdateName(view.id)}>OK</Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 group/title">
                                        <CardTitle className="text-[10px] font-bold truncate uppercase">{view.name}</CardTitle>
                                        <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover/title:opacity-100" onClick={() => { setEditingId(view.id); setTempName(view.name); }}>
                                          <Edit3 className="h-2 w-2" />
                                        </Button>
                                      </div>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteView(view.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 min-h-0">
                                    <ChartBuilder 
                                        data={activeProject.sheetData!} 
                                        selectedColumns={view.selectedColumns}
                                        hideControls
                                        initialConfig={{
                                            chartType: view.chartType,
                                            xAxis: view.xAxis,
                                            yAxis: view.yAxis,
                                            colorScheme: view.colorScheme
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </ResizablePanel>
                        {index < activeProject.savedViews.length - 1 && <ResizableHandle withHandle />}
                    </React.Fragment>
                ))}
            </ResizablePanelGroup>
          )}
        </div>
      </div>
    </Layout>
  );
}
