import { Link, useLocation } from "wouter";
import { useSheet } from "@/lib/sheet-context";
import { 
  FileSpreadsheet, 
  BarChart3, 
  Info, 
  LayoutDashboard, 
  Home, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { sheetData } = useSheet();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => location === path;

  const navItems = [
    { label: "Inicio", href: "/", icon: Home },
    { label: "Analizar", href: "/analyze", icon: BarChart3, disabled: !sheetData },
    { label: "Dashboards", href: "/dashboards", icon: LayoutDashboard, disabled: !sheetData },
    { label: "Acerca de", href: "/about", icon: Info },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside 
        className={`relative z-20 flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <div className="flex h-14 items-center px-4 border-b">
          <Link href="/" className="flex items-center space-x-3 overflow-hidden">
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2">
                Sheet Analyzer
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              const content = (
                <Link
                  href={item.disabled ? "#" : item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200
                    ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-sidebar-foreground hover:bg-sidebar-accent'}
                    ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? '' : 'text-sidebar-foreground/70'}`} />
                  {!collapsed && (
                    <span className="font-medium animate-in fade-in slide-in-from-left-1">{item.label}</span>
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {content}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <React.Fragment key={item.href}>{content}</React.Fragment>;
            })}
          </TooltipProvider>
        </nav>

        <div className="p-2 border-t">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden flex h-14 items-center justify-between px-4 border-b bg-background/95 backdrop-blur">
          <Link href="/" className="flex items-center space-x-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <span className="font-bold">Sheet Analyzer</span>
          </Link>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {children}
        </main>

        <footer className="border-t py-4 bg-muted/30 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Sheet Analyzer MVP • Privacidad local garantizada.
            </p>
            {sheetData && (
              <div className="flex items-center space-x-3">
                <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-muted border">
                  {sheetData.fileName}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-muted border">
                  {sheetData.rowCount.toLocaleString()} filas
                </span>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
