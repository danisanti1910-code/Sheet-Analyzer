import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SheetData } from './sheet-utils';

interface SheetContextType {
  sheetData: SheetData | null;
  setSheetData: (data: SheetData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

export const SheetProvider = ({ children }: { children: ReactNode }) => {
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <SheetContext.Provider value={{ sheetData, setSheetData, isLoading, setIsLoading }}>
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
