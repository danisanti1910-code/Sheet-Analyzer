import { FileUpload } from "@/components/file-upload";
import { Layout } from "@/components/layout";
import { useSheet } from "@/lib/sheet-context";
import { useLocation } from "wouter";
import { useEffect } from "react";
import generatedImage from '@assets/generated_images/abstract_data_visualization_waves_header_background.png';
import { Shield, Zap, Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { sheetData } = useSheet();
  const [, setLocation] = useLocation();

  return (
    <Layout>
      <div className="flex flex-col w-full">
        {/* Hero Section */}
        <section className="relative isolate overflow-hidden min-h-[90vh] flex items-center">
          <div className="absolute inset-0 -z-10">
            <img
              src={generatedImage}
              alt="Background"
              className="h-full w-full object-cover opacity-20 dark:opacity-10 blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/80 to-background" />
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0">
              <div className="mt-10">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold leading-6 text-primary ring-1 ring-inset ring-primary/10">
                  MVP Alpha v1.1
                </span>
              </div>
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-foreground sm:text-6xl font-sans leading-tight">
                Analiza tus hojas de cálculo en segundos.
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Sube archivos Excel o CSV y obtén visualizaciones automáticas, estadísticas e insights sin enviar tus datos a ningún servidor. 
                <span className="block mt-2 font-semibold text-primary">Privacidad total. Procesamiento local.</span>
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Button size="lg" onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  Empezar ahora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-background border-none shadow-sm">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg">Privacidad Primero</h3>
                  <p className="text-sm text-muted-foreground">
                    Tus datos nunca salen de tu dispositivo. Todo ocurre localmente en tu navegador.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-background border-none shadow-sm">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg">Análisis Instantáneo</h3>
                  <p className="text-sm text-muted-foreground">
                    Obtén visualizaciones y estadísticas al instante. Sin colas de espera.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-background border-none shadow-sm">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg">Formatos Universales</h3>
                  <p className="text-sm text-muted-foreground">
                    Compatible con Excel (.xlsx, .xls) y CSV. Soporte para Google Sheets.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section id="upload-section" className="py-24">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Carga tus datos</h2>
              <p className="text-muted-foreground">Sube tu archivo para comenzar el análisis visual.</p>
            </div>
            <FileUpload />
          </div>
        </section>
      </div>
    </Layout>
  );
}
