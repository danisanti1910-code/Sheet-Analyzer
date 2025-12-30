import { SheetData } from '@/lib/sheet-utils';

export interface SavedView {
  id: string;
  name: string;
  chartType: any;
  xAxis: string;
  yAxis: string[];
  selectedColumns: string[];
  timestamp: number;
}

interface SheetContextType {
  sheetData: SheetData | null;
  setSheetData: (data: SheetData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  savedViews: SavedView[];
  saveView: (view: Omit<SavedView, 'id' | 'timestamp'>) => void;
  deleteView: (id: string) => void;
}

import React, { createContext, useContext, useState, ReactNode } from 'react';

const SheetContext = createContext<SheetContextType | undefined>(undefined);

export const SheetProvider = ({ children }: { children: ReactNode }) => {
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  const saveView = (view: Omit<SavedView, 'id' | 'timestamp'>) => {
    const newView: SavedView = {
      ...view,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    setSavedViews(prev => [newView, ...prev]);
  };

  const deleteView = (id: string) => {
    setSavedViews(prev => prev.filter(v => v.id !== id));
  };

  return (
    <SheetContext.Provider value={{ 
      sheetData, 
      setSheetData, 
      isLoading, 
      setIsLoading, 
      savedViews, 
      saveView, 
      deleteView 
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
