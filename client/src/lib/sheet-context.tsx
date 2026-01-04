import { SheetData, parseSheet } from '@/lib/sheet-utils';
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    [key: string]: any;
  };
  dashboardLayout?: { x: number; y: number; w: number; h: number };
  createdAt: string | number;
  updatedAt: string | number;
}

export interface GlobalDashboardItem {
  id: string;
  projectId: string;
  chartId: string;
  layout: { x: number; y: number; w: number; h: number };
}

export interface Project {
  id: string;
  name: string;
  sheetData: SheetData | null;
  charts: SavedChart[];
  sourceUrl?: string;
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
  createProject: (name: string) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjectData: (id: string) => Promise<void>;
  
  createChart: (projectId: string, chartConfig: SavedChart['chartConfig'], name?: string, includeInsights?: boolean) => Promise<string>;
  updateChart: (chartId: string, updates: Partial<SavedChart>) => Promise<void>;
  deleteChart: (chartId: string) => Promise<void>;
  getChart: (chartId: string) => SavedChart | undefined;
  
  globalDashboardItems: GlobalDashboardItem[];
  addToGlobalDashboard: (projectId: string, chartId: string) => Promise<void>;
  removeFromGlobalDashboard: (itemId: string) => Promise<void>;
  updateGlobalDashboardLayout: (items: GlobalDashboardItem[]) => Promise<void>;
  
  user: User | null;
  login: (user: User) => void;
  logout: () => void;

  activeProject: Project | null;
  isLoading: boolean;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

export const SheetProvider = ({ children }: { children: ReactNode }) => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projectsData = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  const { data: chartsData = [] } = useQuery({
    queryKey: ['charts'],
    queryFn: async () => {
      const chartsByProject: Record<string, SavedChart[]> = {};
      for (const project of projectsData) {
        const response = await fetch(`/api/projects/${project.id}/charts`);
        if (response.ok) {
          chartsByProject[project.id] = await response.json();
        }
      }
      return chartsByProject;
    },
    enabled: projectsData.length > 0
  });

  const { data: globalDashboardItems = [] } = useQuery({
    queryKey: ['globalDashboard'],
    queryFn: async () => {
      const response = await fetch('/api/global-dashboard');
      if (!response.ok) throw new Error('Failed to fetch global dashboard');
      return response.json();
    }
  });

  const projects: Project[] = useMemo(() => {
    if (!Array.isArray(projectsData)) return [];
    return projectsData.map((p: any) => ({
      ...p,
      charts: (chartsData as Record<string, SavedChart[]>)[p.id] || []
    }));
  }, [projectsData, chartsData]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || null
  , [projects, activeProjectId]);

  useEffect(() => {
    const savedUser = localStorage.getItem('sheet_analyzer_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('sheet_analyzer_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sheet_analyzer_user');
  };

  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, sheetData: null })
      });
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const createProject = async (name: string): Promise<string> => {
    const project = await createProjectMutation.mutateAsync(name);
    setActiveProjectId(project.id);
    return project.id;
  };

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    await updateProjectMutation.mutateAsync({ id, updates });
  };

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete project');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const deleteProject = async (id: string): Promise<void> => {
    await deleteProjectMutation.mutateAsync(id);
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const createChartMutation = useMutation({
    mutationFn: async (chart: any) => {
      const response = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chart)
      });
      if (!response.ok) throw new Error('Failed to create chart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
    }
  });

  const createChart = async (projectId: string, chartConfig: SavedChart['chartConfig'], name?: string, includeInsights?: boolean): Promise<string> => {
    const existingCharts = projects.find(p => p.id === projectId)?.charts || [];
    let maxY = 0;
    existingCharts.forEach(c => {
      if (c.dashboardLayout) {
        maxY = Math.max(maxY, c.dashboardLayout.y + c.dashboardLayout.h);
      }
    });

    const chart = await createChartMutation.mutateAsync({
      projectId,
      name: name || `Gráfica ${Date.now()}`,
      includeInsights: includeInsights || false,
      chartConfig,
      dashboardLayout: { x: 0, y: maxY, w: 6, h: 4 }
    });
    
    return chart.id;
  };

  const updateChartMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SavedChart> }) => {
      const response = await fetch(`/api/charts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update chart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
    }
  });

  const updateChart = async (chartId: string, updates: Partial<SavedChart>): Promise<void> => {
    await updateChartMutation.mutateAsync({ id: chartId, updates });
  };

  const deleteChartMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/charts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete chart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
    }
  });

  const deleteChart = async (chartId: string): Promise<void> => {
    await deleteChartMutation.mutateAsync(chartId);
  };

  const getChart = (chartId: string): SavedChart | undefined => {
    for (const p of projects) {
      const chart = p.charts?.find(c => c.id === chartId);
      if (chart) return chart;
    }
    return undefined;
  };

  const addToGlobalDashboardMutation = useMutation({
    mutationFn: async ({ projectId, chartId }: { projectId: string; chartId: string }) => {
      let maxY = 0;
      globalDashboardItems.forEach((item: GlobalDashboardItem) => {
        maxY = Math.max(maxY, item.layout.y + item.layout.h);
      });

      const response = await fetch('/api/global-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          chartId,
          layout: { x: 0, y: maxY, w: 6, h: 4 }
        })
      });
      if (!response.ok) throw new Error('Failed to add to global dashboard');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalDashboard'] });
      toast({ title: "Añadido al Dashboard Principal", description: "La gráfica ahora es visible en el panel global." });
    }
  });

  const addToGlobalDashboard = async (projectId: string, chartId: string): Promise<void> => {
    if (globalDashboardItems.some(item => item.projectId === projectId && item.chartId === chartId)) {
      return;
    }
    await addToGlobalDashboardMutation.mutateAsync({ projectId, chartId });
  };

  const removeFromGlobalDashboardMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/global-dashboard/${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to remove from global dashboard');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalDashboard'] });
    }
  });

  const removeFromGlobalDashboard = async (itemId: string): Promise<void> => {
    await removeFromGlobalDashboardMutation.mutateAsync(itemId);
  };

  const updateGlobalDashboardLayoutMutation = useMutation({
    mutationFn: async (items: GlobalDashboardItem[]) => {
      await Promise.all(items.map((item: GlobalDashboardItem) => 
        fetch(`/api/global-dashboard/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout: item.layout })
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalDashboard'] });
    }
  });

  const updateGlobalDashboardLayout = async (items: GlobalDashboardItem[]): Promise<void> => {
    await updateGlobalDashboardLayoutMutation.mutateAsync(items);
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
      
      await updateProject(projectId, { sheetData: newData });
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
      globalDashboardItems,
      addToGlobalDashboard,
      removeFromGlobalDashboard,
      updateGlobalDashboardLayout,
      user,
      login,
      logout,
      isLoading
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
