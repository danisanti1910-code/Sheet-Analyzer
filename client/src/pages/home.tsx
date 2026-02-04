import { FileUpload } from "@/components/file-upload";
import { Layout } from "@/components/layout";
import { useSheet } from "@/lib/sheet-context";
import generatedImage from '@assets/generated_images/abstract_data_visualization_waves_header_background.png';
import { Shield, Zap, Database, ArrowRight, Upload, BarChart3, LayoutDashboard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, login } = useSheet();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await login({
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        useCase: formData.get('useCase') as string
      });
      toast({
        title: "Cuenta creada",
        description: "¡Bienvenido a Sheet Analyzer! Ahora puedes empezar.",
      });
    } catch (err) {
      toast({
        title: "Error al registrar",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const steps = [
    {
      title: "1. Sube tu archivo",
      description: "Arrastra tu Excel o CSV. También puedes conectar directamente desde Google Sheets.",
      icon: Upload,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "2. Selecciona Variables",
      description: "Identificamos tus columnas automáticamente. Elige qué quieres comparar con un clic.",
      icon: BarChart3,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "3. Genera el Dashboard",
      description: "Crea visualizaciones profesionales y guarda tus vistas favoritas en un tablero dinámico.",
      icon: LayoutDashboard,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20"
    }
  ];

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
            <div className="mx-auto max-w-3xl lg:mx-0">
              <div className="mt-10">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold leading-6 text-primary ring-1 ring-inset ring-primary/10">
                  MVP Alpha v1.2
                </span>
              </div>
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-foreground sm:text-7xl font-sans leading-[1.1]">
                Tus datos de Excel, <br/>
                <span className="text-primary">convertidos en claridad.</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl">
                La herramienta más sencilla para analizar hojas de cálculo. Visualizaciones automáticas y limpieza de datos en segundos, sin complicaciones.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                {!user ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" className="rounded-full h-12 px-8 text-base shadow-xl shadow-primary/20">
                        Empezar gratis <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Crea tu cuenta gratis</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRegister} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">Nombre</Label>
                            <Input id="firstName" name="firstName" placeholder="Nombre" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input id="lastName" name="lastName" placeholder="Apellido" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Correo electrónico</Label>
                          <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="use-case">¿Para qué usarás el sistema?</Label>
                          <Select name="useCase" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una opción" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="business">Análisis de Negocios</SelectItem>
                              <SelectItem value="education">Educación / Investigación</SelectItem>
                              <SelectItem value="personal">Uso Personal</SelectItem>
                              <SelectItem value="marketing">Marketing y Ventas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full h-11 mt-4">Comenzar ahora</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button size="lg" className="rounded-full h-12 px-8 text-base shadow-xl shadow-primary/20" onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}>
                    Empezar a analizar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="lg" className="rounded-full h-12" onClick={() => document.getElementById('steps-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  Ver cómo funciona
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section id="steps-section" className="py-24 bg-muted/20">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Análisis profesional en 3 pasos</h2>
              <p className="text-muted-foreground text-lg">Diseñado para ser intuitivo, potente y privado.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {steps.map((step, idx) => (
                <div key={idx} className="relative space-y-6 group">
                  <div className={`w-16 h-16 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-8 -right-6 text-muted-foreground/30">
                      <ArrowRight className="w-8 h-8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-24 border-y bg-background">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-8">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Potencia tus decisiones con datos</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="mt-1 bg-primary/10 p-1 rounded-full"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h4 className="font-semibold">Detección de tipos inteligente</h4>
                      <p className="text-sm text-muted-foreground">Clasificamos automáticamente números, fechas y categorías.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 bg-primary/10 p-1 rounded-full"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h4 className="font-semibold">Limpieza de duplicados</h4>
                      <p className="text-sm text-muted-foreground">Identifica y resuelve entradas duplicadas con un solo clic.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full max-w-xl">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border shadow-2xl overflow-hidden relative group">
                   <div className="absolute inset-4 bg-background rounded-lg shadow-sm border p-4 flex flex-col gap-4 overflow-hidden">
                      <div className="h-4 w-32 bg-muted rounded shrink-0" />
                      <div className="flex-1 flex gap-4">
                        <div className="w-24 bg-muted/30 rounded flex flex-col gap-2 p-2">
                           <div className="h-2 w-full bg-muted rounded" />
                           <div className="h-2 w-full bg-muted rounded" />
                        </div>
                        <div className="flex-1 bg-primary/5 rounded border-2 border-dashed border-primary/20 flex items-center justify-center">
                           <BarChart3 className="w-12 h-12 text-primary/40 animate-pulse" />
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section id="upload-section" className="py-24 bg-muted/10">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Carga tus datos</h2>
              <p className="text-muted-foreground">Sube tu archivo para comenzar el análisis visual ahora mismo.</p>
            </div>
            <FileUpload />
          </div>
        </section>
      </div>
    </Layout>
  );
}
