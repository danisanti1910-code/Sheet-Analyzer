import { FileUpload } from "@/components/file-upload";
import { Layout } from "@/components/layout";
import { useSheet } from "@/lib/sheet-context";
import { useLocation } from "wouter";
import { useEffect } from "react";
import generatedImage from '@assets/generated_images/abstract_data_visualization_waves_header_background.png';

export default function Home() {
  const { sheetData } = useSheet();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (sheetData) {
      // If we have data, we could redirect, but maybe user wants to upload another?
      // Let's stay on home but show a button to go back to analysis
    }
  }, [sheetData]);

  return (
    <Layout>
      <div className="relative isolate overflow-hidden">
        {/* Hero Background */}
        <div className="absolute inset-0 -z-10">
          <img
            src={generatedImage}
            alt="Background"
            className="h-full w-full object-cover opacity-20 dark:opacity-10 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/80 to-background" />
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
            <div className="mt-24 sm:mt-32 lg:mt-16">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold leading-6 text-primary ring-1 ring-inset ring-primary/10">
                MVP Alpha v1.0
              </span>
            </div>
            <h1 className="mt-10 text-4xl font-bold tracking-tight text-foreground sm:text-6xl font-sans">
              Analiza tus hojas de cálculo en segundos.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Sube archivos Excel o CSV y obtén visualizaciones automáticas, estadísticas e insights sin enviar tus datos a ningún servidor. 
              <br/>
              <span className="font-semibold text-primary">Privacidad total. Procesamiento local.</span>
            </p>
          </div>
          
          <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
            <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
              <FileUpload />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
