import { SheetData, ColumnProfile } from '@/lib/sheet-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Wand2, Check, Filter } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InsightsPanelProps {
  sheetData: SheetData;
  sourceData: SheetData;
  selectedColumns: string[];
  filteredValues: Record<string, string[]>;
  onFilterChange: (col: string, values: string[]) => void;
}

export function InsightsPanel({ sheetData, sourceData, selectedColumns, filteredValues, onFilterChange }: InsightsPanelProps) {
  
  const generateNarrative = () => {
    const narratives: string[] = [];
    
    selectedColumns.forEach(col => {
      const profile = sheetData.columnProfiles[col];
      if (!profile) return;
      
      if (profile.type === 'numeric') {
      const formatNum = (num: number | undefined) => {
        if (num === undefined) return '-';
        return new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 3,
          minimumFractionDigits: 0
        }).format(num);
      };
      narratives.push(`La columna "${col}" tiene un promedio de ${formatNum(profile.mean)} y una desviación estándar de ${formatNum(profile.std)}. Los valores oscilan entre ${formatNum(profile.min)} y ${formatNum(profile.max)}.`);
    } else if (profile.type === 'categorical') {
        const top = profile.topCategories?.[0];
        narratives.push(`En "${col}", la categoría más común es "${top?.value}" con ${top?.count} apariciones.`);
      }
    });

    if (narratives.length === 0) return "Selecciona columnas para generar insights.";
    return narratives.join(" ");
  };

  const [narrative, setNarrative] = React.useState<string | null>(null);

  if (selectedColumns.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Selecciona columnas para ver estadísticas e insights.
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in slide-in-from-right duration-500 w-full">
      <div className="flex flex-col gap-3">
        {selectedColumns.map(col => {
          const profile = sheetData.columnProfiles[col];
          if (!profile) return null;

          const allPossibleValues = Array.from(new Set(sourceData.rows.map(r => String(r[col])))).sort();
          const selectedFilters = filteredValues[col] || allPossibleValues;

          return (
            <Card key={col} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow w-full">
              <CardHeader className="pb-2 bg-muted/10">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col min-w-0">
                    <CardTitle className="text-sm font-semibold truncate" title={col}>
                      {col}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider w-fit mt-1">{profile.type}</Badge>
                  </div>
                  
                  {(profile.type === 'categorical' || profile.type === 'boolean' || profile.type === 'numeric' || profile.type === 'datetime') && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" data-testid={`button-filter-${col}`}>
                          <Filter className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="end">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filtrar</span>
                            {(profile.type === 'categorical' || profile.type === 'boolean') ? (
                              <div className="flex gap-1">
                                <Button 
                                    variant="ghost" 
                                    className="h-6 text-[10px] px-2" 
                                    onClick={() => onFilterChange(col, allPossibleValues)}
                                >
                                    Todos
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="h-6 text-[10px] px-2 text-destructive" 
                                    onClick={() => onFilterChange(col, [])}
                                >
                                    Ninguno
                                </Button>
                              </div>
                            ) : (
                                <Button 
                                    variant="ghost" 
                                    className="h-6 text-[10px] px-2" 
                                    onClick={() => onFilterChange(col, [])}
                                >
                                    Reset
                                </Button>
                            )}
                          </div>

                          {profile.type === 'numeric' ? (
                            <div className="space-y-3 pt-1">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Min</Label>
                                  <Input 
                                    type="number" 
                                    className="h-7 text-xs" 
                                    placeholder={String(profile.min)}
                                    value={filteredValues[`${col}_min`]?.[0] || ''}
                                    onChange={(e) => onFilterChange(`${col}_min`, [e.target.value])}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Max</Label>
                                  <Input 
                                    type="number" 
                                    className="h-7 text-xs" 
                                    placeholder={String(profile.max)}
                                    value={filteredValues[`${col}_max`]?.[0] || ''}
                                    onChange={(e) => onFilterChange(`${col}_max`, [e.target.value])}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : profile.type === 'datetime' ? (
                            <div className="space-y-3 pt-1">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Desde</Label>
                                  <Input 
                                    type="date" 
                                    className="h-7 text-xs" 
                                    value={filteredValues[`${col}_min`]?.[0] || ''}
                                    onChange={(e) => onFilterChange(`${col}_min`, [e.target.value])}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Hasta</Label>
                                  <Input 
                                    type="date" 
                                    className="h-7 text-xs" 
                                    value={filteredValues[`${col}_max`]?.[0] || ''}
                                    onChange={(e) => onFilterChange(`${col}_max`, [e.target.value])}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <ScrollArea className="h-48 pr-2">
                              <div className="space-y-1">
                                {allPossibleValues.map((val) => {
                                  const isSelected = selectedFilters.includes(val);
                                  return (
                                    <div key={val} className="flex items-center gap-2 p-1.5 hover:bg-muted rounded text-[11px]">
                                      <Checkbox 
                                        id={`filter-${col}-${val}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          const newFilters = checked 
                                            ? [...selectedFilters, val]
                                            : selectedFilters.filter(v => v !== val);
                                          onFilterChange(col, newFilters);
                                        }}
                                      />
                                      <label htmlFor={`filter-${col}-${val}`} className="truncate flex-1 cursor-pointer">
                                        {val}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faltantes:</span>
                  <span className={profile.missingCount > 0 ? "text-amber-600 font-medium" : "text-green-600"}>
                    {new Intl.NumberFormat('en-US').format(profile.missingCount)} ({profile.missingPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Únicos:</span>
                  <span>{new Intl.NumberFormat('en-US').format(profile.uniqueCount)}</span>
                </div>

                {profile.type === 'numeric' && (
                  <>
                    <div className="border-t pt-2 mt-2 space-y-1">
                      {(() => {
                        const formatNum = (num: number | undefined) => {
                          if (num === undefined) return '-';
                          return new Intl.NumberFormat('en-US', {
                            maximumFractionDigits: 3,
                            minimumFractionDigits: 0
                          }).format(num);
                        };
                        return (
                          <>
                            <div className="flex justify-between"><span className="text-muted-foreground">Media:</span> <span>{formatNum(profile.mean)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Mediana:</span> <span>{formatNum(profile.median)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Min/Max:</span> <span>{formatNum(profile.min)} / {formatNum(profile.max)}</span></div>
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}

                {(profile.type === 'categorical' || profile.type === 'boolean') && profile.topCategories && (
                   <div className="border-t pt-2 mt-2">
                     <span className="text-[10px] text-muted-foreground mb-1 block">Frecuencia (top):</span>
                     <ul className="space-y-1">
                       {profile.topCategories.slice(0, 3).map((cat, i) => (
                         <li key={i} className="flex justify-between text-[10px]">
                           <span className="truncate max-w-[120px]">{cat.value}</span>
                           <span className="font-mono bg-muted px-1 rounded">{new Intl.NumberFormat('en-US').format(cat.count)}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <Button 
            onClick={() => setNarrative(generateNarrative())}
            className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
            data-testid="button-generate-narrative"
        >
            <Wand2 className="w-4 h-4" />
            Generar Resumen Narrativo
        </Button>
      </div>

      {narrative && (
        <Card className="bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900">
            <CardContent className="pt-6">
                <p className="text-indigo-900 dark:text-indigo-100 leading-relaxed text-sm" data-testid="text-narrative">
                    {narrative}
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
