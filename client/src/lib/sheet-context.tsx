import { SheetData, parseSheet } from '@/lib/sheet-utils';

export interface SavedChart {
  id: string;
  projectId: string;
  name: string;
  includeInsights?: boolean;
  chartConfig: {
    chartType: any;
    xAxis: string;
    yAxis: string[];
    selectedColumns: string[];
    filteredValues?: Record<string, string[]>;
    colorScheme?: string[];
    aggregation?: string;
    showLabels?: boolean;
    activeColorScheme?: string;
    [key: string]: any; // Allow future extensibility
  };
  dashboardLayout?: { x: number; y: number; w: number; h: number };
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  sheetData: SheetData | null;
  charts: SavedChart[];
  sourceUrl?: string;
  collaborators?: { email: string; role: 'viewer' | 'commenter' | 'editor' }[];
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  useCase: string;
}

interface SheetContextType {
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  createProject: (name: string) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  refreshProjectData: (id: string) => Promise<void>;
  
  // Charts
  createChart: (projectId: string, chartConfig: SavedChart['chartConfig'], name?: string, includeInsights?: boolean) => string;
  updateChart: (chartId: string, updates: Partial<SavedChart>) => void;
  deleteChart: (chartId: string) => void;
  getChart: (chartId: string) => SavedChart | undefined;
  
  // Auth mock
  user: User | null;
  login: (user: User) => void;
  logout: () => void;

  // Computed for active project
  activeProject: Project | null;
}

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const SheetContext = createContext<SheetContextType | undefined>(undefined);

export const SheetProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || null
  , [projects, activeProjectId]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('sheet_analyzer_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const savedProjects = localStorage.getItem('sheet_analyzer_projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Persist projects whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('sheet_analyzer_projects', JSON.stringify(projects));
    }
  }, [projects]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('sheet_analyzer_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sheet_analyzer_user');
  };

  const createProject = (name: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substring(7),
      name,
      sheetData: null,
      charts: []
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    return newProject.id;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const createChart = (projectId: string, chartConfig: SavedChart['chartConfig'], name?: string, includeInsights?: boolean) => {
    const newChart: SavedChart = {
      id: Math.random().toString(36).substring(7),
      projectId,
      name: name || `Gráfica ${Date.now()}`,
      includeInsights: includeInsights || false,
      chartConfig,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // Default layout position - find next available slot roughly
      dashboardLayout: { x: 0, y: Infinity, w: 6, h: 4 } 
    };

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        // Simple layout collision avoidance strategy: put it at the bottom
        // RGL usually handles this if y is Infinity, but let's be safe
        const existingCharts = p.charts || [];
        let maxY = 0;
        existingCharts.forEach(c => {
            if (c.dashboardLayout) {
                maxY = Math.max(maxY, c.dashboardLayout.y + c.dashboardLayout.h);
            }
        });
        
        newChart.dashboardLayout = { x: 0, y: maxY, w: 6, h: 4 };

        return { ...p, charts: [...existingCharts, newChart] };
      }
      return p;
    }));

    return newChart.id;
  };

  const updateChart = (chartId: string, updates: Partial<SavedChart>) => {
    setProjects(prev => prev.map(p => {
      // Find project containing the chart
      if (p.charts?.some(c => c.id === chartId)) {
        return {
          ...p,
          charts: p.charts.map(c => c.id === chartId ? { ...c, ...updates, updatedAt: Date.now() } : c)
        };
      }
      return p;
    }));
  };

  const deleteChart = (chartId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.charts?.some(c => c.id === chartId)) {
        return {
          ...p,
          charts: p.charts.filter(c => c.id !== chartId)
        };
      }
      return p;
    }));
  };

  const getChart = (chartId: string) => {
    for (const p of projects) {
      const chart = p.charts?.find(c => c.id === chartId);
      if (chart) return chart;
    }
    return undefined;
  };

  const refreshProjectData = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.sourceUrl) return;

    try {
      let fetchUrl = project.sourceUrl;
      if (fetchUrl.includes('docs.google.com/spreadsheets')) {
        const idMatch = fetchUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1]) {
            fetchUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
        }
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Refresh failed');
      const blob = await response.blob();
      const file = new File([blob], "refreshed.csv", { type: "text/csv" });
      const newData = await parseSheet(file, true);
      
      updateProject(projectId, { sheetData: newData });
      toast({ title: "Datos actualizados", description: "Las gráficas se han ajustado a los nuevos valores." });
    } catch (e) {
      toast({ title: "Error al actualizar", variant: "destructive" });
    }
  };

  return (
    <SheetContext.Provider value={{ 
      projects,
      activeProjectId,
      setActiveProjectId,
      createProject,
      updateProject,
      deleteProject,
      refreshProjectData,
      activeProject,
      createChart,
      updateChart,
      deleteChart,
      getChart,
      user,
      login,
      logout
    }}>
      {children}
    </SheetContext.Provider>
  );
};

export const useSheet = () => {
  const context = useContext(SheetContext);
  if (context === undefined) {
    throw new Error('useSheet must be used within a SheetProvider');
  }
  return context;
};
