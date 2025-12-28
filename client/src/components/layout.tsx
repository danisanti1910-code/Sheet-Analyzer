import { Link, useLocation } from "wouter";
import { useSheet } from "@/lib/sheet-context";
import { FileSpreadsheet, BarChart3, Info } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { sheetData } = useSheet();

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-bold sm:inline-block text-lg tracking-tight">
              Sheet Analyzer
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link 
              href="/"
              className={`transition-colors hover:text-foreground/80 ${isActive('/') ? 'text-foreground' : 'text-foreground/60'}`}
            >
              Cargar
            </Link>
            <Link 
              href="/analyze"
              className={`transition-colors hover:text-foreground/80 ${isActive('/analyze') ? 'text-foreground' : 'text-foreground/60'} ${!sheetData ? 'opacity-50 pointer-events-none' : ''}`}
            >
              Analizar
            </Link>
            <Link 
              href="/about"
              className={`transition-colors hover:text-foreground/80 ${isActive('/about') ? 'text-foreground' : 'text-foreground/60'}`}
            >
              Acerca de
            </Link>
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            {sheetData && (
              <span className="text-xs text-muted-foreground hidden md:inline-block border px-2 py-1 rounded-full">
                {sheetData.fileName} • {sheetData.rowCount.toLocaleString()} filas
              </span>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-8">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with ❤️ using Replit. Privacidad garantizada: los archivos se procesan en tu navegador.
          </p>
        </div>
      </footer>
    </div>
  );
}
