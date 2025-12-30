import { useSheet } from '@/lib/sheet-context';
import { Layout } from '@/components/layout';
import { ChartBuilder } from '@/components/chart-builder';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle, Plus } from 'lucide-react';
import { Link } from 'wouter';

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
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis Dashboards</h1>
            <p className="text-muted-foreground">Vistas guardadas de tus análisis.</p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/analyze">
              <Plus className="w-4 h-4" /> Nuevo Análisis
            </Link>
          </Button>
        </div>

        {savedViews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
            <p className="mb-4">No tienes vistas guardadas todavía.</p>
            <Button asChild>
              <Link href="/analyze">Crear mi primer gráfico</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {savedViews.map((view) => (
              <Card key={view.id} className="group overflow-hidden shadow-sm hover:shadow-md transition-all border-none bg-card">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b bg-muted/20">
                  <div>
                    <CardTitle className="text-sm font-semibold truncate">{view.name}</CardTitle>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(view.timestamp).toLocaleDateString()} {new Date(view.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteView(view.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 h-[350px]">
                  <ChartBuilder 
                    data={sheetData} 
                    selectedColumns={view.selectedColumns}
                    hideControls
                    initialConfig={{
                      chartType: view.chartType,
                      xAxis: view.xAxis,
                      yAxis: view.yAxis
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
