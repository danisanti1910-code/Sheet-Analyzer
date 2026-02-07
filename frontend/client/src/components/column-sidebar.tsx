import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Hash, Calendar, Type, ToggleLeft, Filter } from "lucide-react";
import { SheetData } from "@/lib/sheet-utils";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ColumnSidebarProps {
  data: SheetData;
  selectedColumns: string[];
  onSelectionChange: (cols: string[]) => void;
  filteredValues: Record<string, string[]>;
  onFilterChange: (col: string, values: string[]) => void;
  onSelectView?: (view: any) => void; // Keeping for compatibility or refactor if needed
}

export function ColumnSidebar({ data, selectedColumns, onSelectionChange, filteredValues, onFilterChange }: ColumnSidebarProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredColumns = data?.columns.filter(col => 
    col.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  if (!data) return null;

  return (
    <div className="w-full h-full flex flex-col border-r bg-sidebar">
      <div className="p-4 border-b space-y-4">
        <div>
          <h2 className="font-semibold text-lg tracking-tight">Columnas</h2>
          <p className="text-xs text-muted-foreground">Variables detectadas</p>
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
      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {filteredColumns.map((col) => {
              const profile = data.columnProfiles[col];
              const isSelected = selectedColumns.includes(col);
              const uniqueValues = Array.from(new Set(data.rows.map(r => String(r[col])))).sort();
              const selectedFilters = filteredValues[col] || uniqueValues;

              return (
                <div 
                  key={col}
                  className={`
                    flex items-start space-x-3 p-2 rounded-md transition-colors group
                    ${isSelected ? 'bg-accent' : 'hover:bg-sidebar-accent/50'}
                  `}
                >
                  <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={() => toggleColumn(col)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium truncate cursor-pointer" onClick={() => toggleColumn(col)}>{col}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected && profile.type !== 'numeric' && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100">
                                <Filter className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2" align="start">
                              <div className="space-y-2">
                                <p className="text-xs font-bold px-1 uppercase tracking-wider text-muted-foreground">Filtrar valores</p>
                                <ScrollArea className="h-48 pr-3">
                                  <div className="space-y-1">
                                    {uniqueValues.map(val => (
                                      <div key={val} className="flex items-center gap-2 p-1 hover:bg-muted rounded text-xs">
                                        <Checkbox 
                                          checked={selectedFilters.includes(val)}
                                          onCheckedChange={(checked) => {
                                            const newFilters = checked 
                                              ? [...selectedFilters, val]
                                              : selectedFilters.filter(v => v !== val);
                                            onFilterChange(col, newFilters);
                                          }}
                                        />
                                        <span className="truncate">{val}</span>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                        <Badge variant="secondary" className={`h-4 px-1 text-[9px] gap-0.5 ${getTypeColor(profile.type)}`}>
                          {getIcon(profile.type)}
                          {profile.type.substring(0, 3)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {profile.uniqueCount} datos únicos detectados
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
      <div className="p-4 border-t text-xs text-muted-foreground text-center">
        {selectedColumns.length} seleccionadas
      </div>
    </div>
  );
}
