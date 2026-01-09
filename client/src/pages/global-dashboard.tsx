import { useSheet } from '@/lib/sheet-context';
import { Layout } from '@/components/layout';
import { ChartPreview } from '@/components/chart-preview';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle, ExternalLink, PanelRight, PanelRightClose } from 'lucide-react';
import { Link } from 'wouter';
import { useMemo, useState, useCallback, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const GRID_COLS = 12;
const ROW_HEIGHT = 100;
const MARGIN: [number, number] = [16, 16];
const CONTAINER_PADDING: [number, number] = [24, 24];

export default function GlobalDashboard() {
  const { globalDashboardItems, projects, removeFromGlobalDashboard, updateGlobalDashboardLayout, updateChart } = useSheet();
  const [isDragging, setIsDragging] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const layout = useMemo(() => {
    return globalDashboardItems.map((item, index) => ({
      i: item.id,
      x: item.layout.x ?? 0,
      y: item.layout.y ?? index * 4,
      w: item.layout.w ?? 6,
      h: item.layout.h ?? 4,
      minW: 2,
      minH: 2,
      maxW: GRID_COLS
    }));
  }, [globalDashboardItems]);

  const handleLayoutChange = useCallback((currentLayout: readonly any[], layouts: any) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      const newItems = globalDashboardItems.map(item => {
          const l = (currentLayout as any[]).find(l => l.i === item.id);
          if (l) {
              return {
                  ...item,
                  layout: { x: l.x, y: l.y, w: l.w, h: l.h }
              };
          }
          return item;
      });
      updateGlobalDashboardLayout(newItems);
    }, 300);
  }, [globalDashboardItems, updateGlobalDashboardLayout]);

  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragStop = useCallback(() => setIsDragging(false), []);
  const handleResizeStart = useCallback(() => setIsDragging(true), []);
  const handleResizeStop = useCallback(() => setIsDragging(false), []);

  return (
    <Layout>
      <div className="min-h-screen flex flex-col p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Principal</h1>
            <p className="text-muted-foreground text-xs">Vista unificada de todos tus proyectos.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
                 Imprimir PDF
             </Button>
          </div>
        </div>

        {globalDashboardItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-12">
            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="mb-2">El dashboard principal está vacío.</p>
            <p className="text-sm">Ve a tus proyectos y selecciona "Añadir al Dashboard Principal" en tus gráficas.</p>
            <Button asChild className="mt-4" variant="outline">
                <Link href="/projects">Explorar Proyectos</Link>
            </Button>
          </div>
        ) : (
          <div className="pb-20 relative">
             {isDragging && (
               <div 
                 className="absolute inset-0 pointer-events-none z-0 rounded-lg"
                 style={{
                   backgroundImage: `
                     linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                     linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                   `,
                   backgroundSize: `calc((100% - ${CONTAINER_PADDING[0] * 2}px) / ${GRID_COLS}) ${ROW_HEIGHT + MARGIN[1]}px`,
                   backgroundPosition: `${CONTAINER_PADDING[0]}px ${CONTAINER_PADDING[1]}px`,
                   border: '2px dashed rgba(59, 130, 246, 0.3)',
                 }}
               />
             )}
             <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: layout }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: GRID_COLS, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={ROW_HEIGHT}
                margin={MARGIN}
                containerPadding={CONTAINER_PADDING}
                onLayoutChange={handleLayoutChange}
                onDragStart={handleDragStart}
                onDragStop={handleDragStop}
                onResizeStart={handleResizeStart}
                onResizeStop={handleResizeStop}
                draggableHandle=".drag-handle"
                resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
                preventCollision={false}
                compactType="vertical"
                isBounded={true}
             >
                {globalDashboardItems.map((item) => {
                  const project = projects.find(p => p.id === item.projectId);
                  const chart = project?.charts?.find(c => c.id === item.chartId);

                  if (!project || !chart) return null; // Should handle orphaned items cleaner
                  if (!project.sheetData) {
                    return (
                      <div key={item.id} className="bg-background shadow-md border rounded-lg overflow-hidden flex flex-col h-full">
                        <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b bg-muted/20 shrink-0 drag-handle cursor-move">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <CardTitle className="text-xs font-bold truncate uppercase tracking-tight select-none">
                              {chart.name} 
                            </CardTitle>
                            <span className="text-[10px] text-muted-foreground bg-white px-1.5 py-0.5 rounded border truncate max-w-[100px]">
                              {project.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1" onMouseDown={e => e.stopPropagation()}>
                            <Button 
                               variant="ghost" 
                               size="icon" 
                               className={`h-7 w-7 ${chart.includeInsights ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}
                               onClick={() => updateChart(chart.id, { includeInsights: !chart.includeInsights })}
                               title={chart.includeInsights ? "Ocultar Insights" : "Mostrar Insights"}
                            >
                              {chart.includeInsights ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                               <Link href={`/projects/${project.id}/charts/${chart.id}`}>
                                  <ExternalLink className="w-4 h-4" />
                               </Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeFromGlobalDashboard(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <div className="flex-1 min-h-0 bg-white dark:bg-black/20 p-4 text-xs text-muted-foreground">
                          Datos no disponibles
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="bg-background shadow-md border rounded-lg overflow-hidden flex flex-col h-full">
                      <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b bg-muted/20 shrink-0 drag-handle cursor-move">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CardTitle className="text-xs font-bold truncate uppercase tracking-tight select-none">
                            {chart.name} 
                          </CardTitle>
                          <span className="text-[10px] text-muted-foreground bg-white px-1.5 py-0.5 rounded border truncate max-w-[100px]">
                            {project.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1" onMouseDown={e => e.stopPropagation()}>
                          <Button 
                             variant="ghost" 
                             size="icon" 
                             className={`h-7 w-7 ${chart.includeInsights ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}
                             onClick={() => updateChart(chart.id, { includeInsights: !chart.includeInsights })}
                             title={chart.includeInsights ? "Ocultar Insights" : "Mostrar Insights"}
                          >
                            {chart.includeInsights ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                             <Link href={`/projects/${project.id}/charts/${chart.id}`}>
                                <ExternalLink className="w-4 h-4" />
                             </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeFromGlobalDashboard(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <div className="flex-1 min-h-0 bg-white dark:bg-black/20 p-2 overflow-hidden pointer-events-none select-none h-full">
                        <ChartPreview chart={chart} data={project.sheetData} />
                      </div>
                    </div>
                  );
                })}
             </ResponsiveGridLayout>
          </div>
        )}
      </div>
    </Layout>
  );
}
