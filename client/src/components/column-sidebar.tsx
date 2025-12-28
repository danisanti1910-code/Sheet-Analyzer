import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Hash, Calendar, Type, ToggleLeft } from "lucide-react";
import { SheetData } from "@/lib/sheet-utils";

interface ColumnSidebarProps {
  data: SheetData;
  selectedColumns: string[];
  onSelectionChange: (cols: string[]) => void;
}

export function ColumnSidebar({ data, selectedColumns, onSelectionChange }: ColumnSidebarProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredColumns = data.columns.filter(col => 
    col.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleColumn = (col: string) => {
    if (selectedColumns.includes(col)) {
      onSelectionChange(selectedColumns.filter(c => c !== col));
    } else {
      onSelectionChange([...selectedColumns, col]);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'numeric': return <Hash className="w-3 h-3" />;
      case 'datetime': return <Calendar className="w-3 h-3" />;
      case 'boolean': return <ToggleLeft className="w-3 h-3" />;
      default: return <Type className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'numeric': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30';
      case 'datetime': return 'text-purple-500 bg-purple-50 dark:bg-purple-950/30';
      case 'boolean': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/30';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/50';
    }
  };

  return (
    <div className="w-full h-full flex flex-col border-r bg-sidebar">
      <div className="p-4 border-b space-y-4">
        <div>
          <h2 className="font-semibold text-lg tracking-tight">Columnas</h2>
          <p className="text-xs text-muted-foreground">Selecciona variables para analizar</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar..." 
            className="pl-8 h-9" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {filteredColumns.map((col) => {
            const profile = data.columnProfiles[col];
            const isSelected = selectedColumns.includes(col);
            return (
              <div 
                key={col}
                className={`
                  flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors
                  ${isSelected ? 'bg-accent' : 'hover:bg-sidebar-accent/50'}
                `}
                onClick={() => toggleColumn(col)}
              >
                <Checkbox 
                  checked={isSelected} 
                  onCheckedChange={() => toggleColumn(col)}
                  className="translate-y-[1px]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate pr-2">{col}</span>
                    <Badge variant="secondary" className={`h-5 px-1.5 text-[10px] gap-1 ${getTypeColor(profile.type)} hover:bg-opacity-80`}>
                      {getIcon(profile.type)}
                      {profile.type.substring(0, 3)}
                    </Badge>
                  </div>
                  <div className="flex items-center text-[10px] text-muted-foreground mt-0.5 gap-2">
                    <span>{profile.missingPercentage > 0 ? `${profile.missingPercentage.toFixed(0)}% null` : '100% full'}</span>
                    <span>•</span>
                    <span>{profile.uniqueCount} unique</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="p-4 border-t text-xs text-muted-foreground text-center">
        {selectedColumns.length} seleccionadas
      </div>
    </div>
  );
}
import React from 'react';
