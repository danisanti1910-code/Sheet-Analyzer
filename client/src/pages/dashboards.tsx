import { useSheet, SavedView } from '@/lib/sheet-context';
import { Layout } from '@/components/layout';
import { ChartBuilder } from '@/components/chart-builder';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle, Plus, Edit3, Settings2 } from 'lucide-react';
import { Link } from 'wouter';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function Dashboards() {
  const { activeProject, deleteView, updateViewName, updateProject } = useSheet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [editingView, setEditingView] = useState<SavedView | null>(null);

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
      <div className="min-h-screen flex flex-col p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{activeProject.name} - Dashboard</h1>
            <p className="text-muted-foreground text-xs">Panel interactivo con tus gráficas guardadas.</p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/analyze"><Plus className="w-4 h-4" /> Nuevo Análisis</Link>
          </Button>
        </div>

        {activeProject.savedViews.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-12">
            <p>No hay gráficas guardadas en este proyecto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            {activeProject.savedViews.map((view) => (
              <Card key={view.id} className="group overflow-hidden bg-background flex flex-col shadow-md border hover:border-primary/50 transition-all duration-300 resize overflow-auto min-h-[450px]">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b bg-muted/20 shrink-0">
                  {editingId === view.id ? (
                    <div className="flex gap-1">
                      <Input value={tempName} onChange={e => setTempName(e.target.value)} className="h-7 text-xs w-32" />
                      <Button size="sm" className="h-7" onClick={() => handleUpdateName(view.id)}>OK</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/title">
                      <CardTitle className="text-xs font-bold truncate uppercase tracking-tight">{view.name}</CardTitle>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => { setEditingId(view.id); setTempName(view.name); }}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditingView(view)}>
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteView(view.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-0 bg-white dark:bg-black/20">
                  <ChartBuilder 
                    data={activeProject.sheetData!} 
                    selectedColumns={view.selectedColumns}
                    hideControls
                    initialConfig={{
                      chartType: view.chartType,
                      xAxis: view.xAxis,
                      yAxis: view.yAxis,
                      colorScheme: view.colorScheme,
                      aggregation: view.aggregation as any,
                      showLabels: view.showLabels,
                      activeColorScheme: view.activeColorScheme as any
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editingView} onOpenChange={(open) => !open && setEditingView(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Configuración de Gráfica</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {editingView && (
                <ChartBuilder 
                  data={activeProject.sheetData!} 
                  selectedColumns={editingView.selectedColumns}
                  initialConfig={{
                    chartType: editingView.chartType,
                    xAxis: editingView.xAxis,
                    yAxis: editingView.yAxis,
                    colorScheme: editingView.colorScheme,
                    aggregation: editingView.aggregation as any,
                    showLabels: editingView.showLabels,
                    activeColorScheme: editingView.activeColorScheme as any
                  }}
                />
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setEditingView(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
