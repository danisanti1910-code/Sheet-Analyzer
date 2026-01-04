import { useSheet, SavedChart } from '@/lib/sheet-context';
import { Layout } from '@/components/layout';
import { ChartBuilder } from '@/components/chart-builder';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle, Plus, Edit3, Settings2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import * as RGL from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Robust import handling for RGL which can be finicky with Vite/ESM
const Responsive = RGL.Responsive || (RGL as any).default?.Responsive || (RGL as any).default;
const WidthProvider = RGL.WidthProvider || (RGL as any).default?.WidthProvider;

// Fallback if WidthProvider is still not found (though it should be)
const ResponsiveGridLayout = WidthProvider ? WidthProvider(Responsive) : Responsive;

export default function Dashboards() {
  const { activeProject, deleteChart, updateChart, activeProjectId } = useSheet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [, setLocation] = useLocation();

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
    updateChart(id, { name: tempName });
    setEditingId(null);
  };

  const handleNavigateToEdit = (chartId: string) => {
    setLocation(`/projects/${activeProjectId}/charts/${chartId}`);
  };

  const layout = useMemo(() => {
    return activeProject.charts?.map((chart, index) => ({
      i: chart.id,
      x: chart.dashboardLayout?.x ?? (index % 2) * 6,
      y: chart.dashboardLayout?.y ?? Math.floor(index / 2) * 4,
      w: chart.dashboardLayout?.w ?? 6,
      h: chart.dashboardLayout?.h ?? 4,
      minW: 3,
      minH: 3
    })) || [];
  }, [activeProject.charts]);

  const handleLayoutChange = (currentLayout: any[]) => {
    // We only want to update if things actually changed to avoid loops, 
    // but react-grid-layout triggers this often.
    // We should iterate and update charts that have changed.
    
    currentLayout.forEach((l) => {
      const chart = activeProject.charts.find(c => c.id === l.i);
      if (chart) {
        const hasChanged = 
          chart.dashboardLayout?.x !== l.x ||
          chart.dashboardLayout?.y !== l.y ||
          chart.dashboardLayout?.w !== l.w ||
          chart.dashboardLayout?.h !== l.h;
        
        if (hasChanged) {
           updateChart(l.i, {
             dashboardLayout: { x: l.x, y: l.y, w: l.w, h: l.h }
           });
        }
      }
    });
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{activeProject.name} - Dashboard</h1>
            <p className="text-muted-foreground text-xs">Panel interactivo con tus gráficas guardadas.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
                 Imprimir PDF
             </Button>
             <Button asChild variant="default" size="sm" className="gap-2">
                <Link href={`/projects/${activeProjectId}/charts/new`}><Plus className="w-4 h-4" /> Nuevo Análisis</Link>
             </Button>
          </div>
        </div>

        {(!activeProject.charts || activeProject.charts.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-12">
            <p>No hay gráficas guardadas en este proyecto.</p>
          </div>
        ) : (
          <div className="pb-20">
             <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: layout }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={100}
                onLayoutChange={handleLayoutChange}
                draggableHandle=".drag-handle"
             >
                {activeProject.charts.map((chart) => (
                  <div key={chart.id} className="bg-background shadow-md border rounded-lg overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b bg-muted/20 shrink-0 drag-handle cursor-move">
                      {editingId === chart.id ? (
                        <div className="flex gap-1" onMouseDown={e => e.stopPropagation()}>
                          <Input value={tempName} onChange={e => setTempName(e.target.value)} className="h-7 text-xs w-32" />
                          <Button size="sm" className="h-7" onClick={() => handleUpdateName(chart.id)}>OK</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/title">
                          <CardTitle className="text-xs font-bold truncate uppercase tracking-tight select-none">{chart.name}</CardTitle>
                          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={(e) => { 
                              e.stopPropagation(); // prevent drag
                              setEditingId(chart.id); 
                              setTempName(chart.name); 
                          }} onMouseDown={e => e.stopPropagation()}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-1" onMouseDown={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleNavigateToEdit(chart.id)}>
                          <Settings2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteChart(chart.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <div className="flex-1 min-h-0 bg-white dark:bg-black/20 p-2 overflow-hidden pointer-events-none select-none">
                      {/* Pointer events none to prevent chart interaction interfering with drag/resize, or use a specific handle */}
                      {/* Actually, we want chart interaction usually, but draggableHandle on header solves it */}
                       <div className="w-full h-full pointer-events-auto">
                        <ChartBuilder 
                            data={activeProject.sheetData!} 
                            selectedColumns={chart.chartConfig.selectedColumns}
                            hideControls
                            initialConfig={chart.chartConfig}
                        />
                       </div>
                    </div>
                  </div>
                ))}
             </ResponsiveGridLayout>
          </div>
        )}
      </div>
    </Layout>
  );
}
