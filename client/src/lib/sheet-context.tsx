import { SheetData, parseSheet } from '@/lib/sheet-utils';

export interface SavedView {
  id: string;
  name: string;
  chartType: any;
  xAxis: string;
  yAxis: string[];
  selectedColumns: string[];
  colorScheme?: string[];
  timestamp: number;
}

export interface Project {
  id: string;
  name: string;
  sheetData: SheetData | null;
  savedViews: SavedView[];
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
  createProject: (name: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  refreshProjectData: (id: string) => Promise<void>;
  
  // Auth mock
  user: User | null;
  login: (user: User) => void;
  logout: () => void;

  // Computed for active project
  activeProject: Project | null;
  saveView: (view: Omit<SavedView, 'id' | 'timestamp'>) => void;
  deleteView: (id: string) => void;
  updateViewName: (viewId: string, name: string) => void;
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

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('sheet_analyzer_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sheet_analyzer_user');
  };

  useEffect(() => {
    const saved = localStorage.getItem('sheet_analyzer_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const createProject = (name: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substring(7),
      name,
      sheetData: null,
      savedViews: []
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const saveView = (view: Omit<SavedView, 'id' | 'timestamp'>) => {
    if (!activeProjectId) return;
    const newView: SavedView = {
      ...view,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId ? { ...p, savedViews: [newView, ...p.savedViews] } : p
    ));
  };

  const deleteView = (viewId: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId ? { ...p, savedViews: p.savedViews.filter(v => v.id !== viewId) } : p
    ));
  };

  const updateViewName = (viewId: string, name: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId ? { 
        ...p, 
        savedViews: p.savedViews.map(v => v.id === viewId ? { ...v, name } : v) 
      } : p
    ));
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
      saveView, 
      deleteView,
      updateViewName,
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
