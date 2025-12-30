import { useSheet } from '@/lib/sheet-context';
import { Layout } from '@/components/layout';
import { ChartBuilder } from '@/components/chart-builder';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";

export default function Dashboards() {
  const { sheetData, savedViews, deleteView } = useSheet();

  if (!sheetData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold">Carga datos primero</h2>
          <Button asChild>
            <Link href="/">Ir al Inicio</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col p-6 md:p-8 space-y-6 overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Espacio de Trabajo</h1>
            <p className="text-muted-foreground text-sm">Organiza y redimensiona tus análisis.</p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/analyze">
              <Plus className="w-4 h-4" /> Nuevo Análisis
            </Link>
          </Button>
        </div>

        {savedViews.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground">
            <p className="mb-4">No tienes vistas guardadas todavía.</p>
            <Button asChild>
              <Link href="/analyze">Crear mi primer gráfico</Link>
            </Button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-950/20 rounded-xl p-4 overflow-hidden border">
            <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={100}>
                    <ResizablePanelGroup direction="horizontal">
                        {savedViews.map((view, index) => (
                            <React.Fragment key={view.id}>
                                <ResizablePanel defaultSize={100 / savedViews.length} minSize={20}>
                                    <Card className="h-full group overflow-hidden shadow-none border-none bg-background flex flex-col">
                                        <CardHeader className="flex flex-row items-center justify-between py-2 px-3 border-b bg-muted/10 shrink-0">
                                            <CardTitle className="text-[10px] font-bold truncate uppercase tracking-wider">{view.name}</CardTitle>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                onClick={() => deleteView(view.id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="p-0 flex-1 min-h-0">
                                            <ChartBuilder 
                                                data={sheetData} 
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
                                {index < savedViews.length - 1 && <ResizableHandle withHandle />}
                            </React.Fragment>
                        ))}
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}
      </div>
    </Layout>
  );
}

import React from 'react';
