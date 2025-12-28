import { useState } from 'react';
import { useSheet } from '@/lib/sheet-context';
import { Layout } from '@/components/layout';
import { ColumnSidebar } from '@/components/column-sidebar';
import { ChartBuilder } from '@/components/chart-builder';
import { InsightsPanel } from '@/components/insights-panel';
import { DataTable } from '@/components/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { AlertCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function Analyze() {
  const { sheetData } = useSheet();
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  if (!sheetData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold">No hay datos cargados</h2>
          <p className="text-muted-foreground">Sube un archivo para comenzar el análisis.</p>
          <Button asChild>
            <Link href="/">Ir al Inicio</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Mobile View Warning/Optimization could go here, for now relying on responsive flex */}
        
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden md:block bg-background">
            <ColumnSidebar 
              data={sheetData} 
              selectedColumns={selectedColumns} 
              onSelectionChange={setSelectedColumns} 
            />
          </ResizablePanel>
          
          <ResizableHandle className="hidden md:flex" />
          
          <ResizablePanel defaultSize={80}>
            <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950/50">
                <Tabs defaultValue="visualize" className="flex-1 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="visualize">Tablero</TabsTrigger>
                      <TabsTrigger value="data">Datos</TabsTrigger>
                    </TabsList>
                    
                    <div className="text-xs text-muted-foreground hidden lg:block">
                        {selectedColumns.length === 0 
                            ? "Selecciona columnas de la barra lateral" 
                            : `${selectedColumns.length} columnas seleccionadas`}
                    </div>
                  </div>

                  <TabsContent value="visualize" className="flex-1 space-y-4 animate-in fade-in-50">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                        <div className="lg:col-span-2 min-h-[400px]">
                            <ChartBuilder data={sheetData} selectedColumns={selectedColumns} />
                        </div>
                        <div className="lg:col-span-1 space-y-4">
                             <h3 className="text-lg font-medium">Insights</h3>
                             <InsightsPanel sheetData={sheetData} selectedColumns={selectedColumns} />
                        </div>
                     </div>
                  </TabsContent>

                  <TabsContent value="data" className="flex-1 border rounded-lg bg-background p-2 shadow-sm animate-in fade-in-50">
                    <DataTable data={sheetData} selectedColumns={selectedColumns} />
                  </TabsContent>
                </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
}
