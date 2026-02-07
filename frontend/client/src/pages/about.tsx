import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Zap, Database } from "lucide-react";

export default function About() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-12 px-4 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Acerca de Sheet Analyzer</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Una herramienta moderna para el análisis rápido de datos, diseñada con privacidad y velocidad en mente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">Privacidad Primero</h3>
              <p className="text-sm text-muted-foreground">
                Tus datos nunca salen de tu dispositivo. Todo el procesamiento ocurre localmente en tu navegador usando WebAssembly y JavaScript moderno.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">Análisis Instantáneo</h3>
              <p className="text-sm text-muted-foreground">
                Obtén visualizaciones y estadísticas al instante. Sin colas de espera, sin configuraciones complejas de servidor.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">Formatos Universales</h3>
              <p className="text-sm text-muted-foreground">
                Compatible con Excel (.xlsx, .xls) y CSV. Soporte experimental para importación directa desde Google Sheets.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
