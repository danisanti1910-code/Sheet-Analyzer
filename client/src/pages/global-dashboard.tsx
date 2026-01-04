import { useSheet, GlobalDashboardItem, SavedChart, Project } from '@/lib/sheet-context';
import { Layout } from '@/components/layout';
import { ChartBuilder } from '@/components/chart-builder';
import { InsightsPanel } from '@/components/insights-panel';
import { SheetData } from '@/lib/sheet-utils';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle, Settings2, ExternalLink, PanelRight, PanelRightClose } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import React, { useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

function GlobalDashboardChartWrapper({ item, project, chart }: { item: GlobalDashboardItem, project: Project, chart: SavedChart }) {
  const data = project.sheetData;
  if (!data) return <div className="p-4 text-xs text-muted-foreground">Datos no disponibles</div>;

  // Re-use logic for filtering
  const filteredData = useMemo(() => {
    if (!chart.chartConfig.filteredValues) return data;
    
    let rows = data.rows;
    Object.entries(chart.chartConfig.filteredValues).forEach(([col, values]) => {
      if (!values || values.length === 0) return;

      if (col.endsWith('_min')) {
        const actualCol = col.replace('_min', '');
        const type = data.columnProfiles[actualCol]?.type;
        if (type === 'numeric') {
          rows = rows.filter(r => Number(r[actualCol]) >= Number(values[0]));
        } else if (type === 'datetime') {
          rows = rows.filter(r => new Date(r[actualCol]) >= new Date(values[0]));
        }
      } else if (col.endsWith('_max')) {
        const actualCol = col.replace('_max', '');
        const type = data.columnProfiles[actualCol]?.type;
        if (type === 'numeric') {
          rows = rows.filter(r => Number(r[actualCol]) <= Number(values[0]));
        } else if (type === 'datetime') {
          rows = rows.filter(r => new Date(r[actualCol]) <= new Date(values[0]));
        }
      } else {
        rows = rows.filter(r => values.includes(String(r[col])));
      }
    });

    // Lightweight profile clone/update if needed
    // For now returning filtered rows is main priority
    return { ...data, rows, rowCount: rows.length };
  }, [data, chart.chartConfig.filteredValues]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 overflow-hidden pointer-events-auto">
      <div className={`flex-1 min-h-0 ${chart.includeInsights ? 'h-1/2 md:h-full md:w-2/3' : 'h-full'}`}>
         <ChartBuilder 
            data={filteredData} 
            selectedColumns={chart.chartConfig.selectedColumns}
            hideControls
            initialConfig={chart.chartConfig}
         />
      </div>
      {chart.includeInsights && (
        <div className="h-1/2 md:h-full md:w-1/3 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-2 rounded border">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Insights</h4>
            <div className="space-y-4 transform scale-90 origin-top-left w-[111%]"> 
               <InsightsPanel 
                  sheetData={filteredData} 
                  sourceData={data}
                  selectedColumns={chart.chartConfig.selectedColumns} 
                  filteredValues={chart.chartConfig.filteredValues || {}}
                  onFilterChange={() => {}} 
               />
            </div>
        </div>
      )}
    </div>
  );
}

export default function GlobalDashboard() {
  const { globalDashboardItems, projects, removeFromGlobalDashboard, updateGlobalDashboardLayout, updateChart } = useSheet();
  const [, setLocation] = useLocation();

  const layout = useMemo(() => {
    return globalDashboardItems.map((item, index) => ({
      i: item.id,
      x: item.layout.x,
      y: item.layout.y,
      w: item.layout.w,
      h: item.layout.h,
      minW: 3,
      minH: 2
    }));
  }, [globalDashboardItems]);

  const handleLayoutChange = (currentLayout: readonly any[], layouts: any) => {
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
  };

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
          <div className="pb-20">
             <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: layout }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={100}
                onLayoutChange={handleLayoutChange}
                draggableHandle=".drag-handle"
                resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
             >
                {globalDashboardItems.map((item) => {
                  const project = projects.find(p => p.id === item.projectId);
                  const chart = project?.charts?.find(c => c.id === item.chartId);

                  if (!project || !chart) return null; // Should handle orphaned items cleaner

                  return (
                    <div key={item.id} className="bg-background shadow-md border rounded-lg overflow-hidden flex flex-col">
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
                      <div className="flex-1 min-h-0 bg-white dark:bg-black/20 p-2 overflow-hidden pointer-events-none select-none">
                         <GlobalDashboardChartWrapper item={item} project={project} chart={chart} />
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
