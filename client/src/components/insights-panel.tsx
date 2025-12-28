import { SheetData, ColumnProfile } from '@/lib/sheet-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

interface InsightsPanelProps {
  sheetData: SheetData;
  selectedColumns: string[];
}

export function InsightsPanel({ sheetData, selectedColumns }: InsightsPanelProps) {
  
  const generateNarrative = () => {
    // Mock narrative generation - in a real app this could use an LLM
    // For MVP we construct a template based on stats
    const narratives: string[] = [];
    
    selectedColumns.forEach(col => {
      const profile = sheetData.columnProfiles[col];
      if (!profile) return;
      
      if (profile.type === 'numeric') {
        narratives.push(`La columna "${col}" tiene un promedio de ${profile.mean?.toFixed(2)} y una desviación estándar de ${profile.std?.toFixed(2)}. Los valores oscilan entre ${profile.min} y ${profile.max}.`);
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
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {selectedColumns.map(col => {
          const profile = sheetData.columnProfiles[col];
          if (!profile) return null;

          return (
            <Card key={col} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 bg-muted/10">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-semibold truncate" title={col}>
                    {col}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs uppercase tracking-wider">{profile.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faltantes:</span>
                  <span className={profile.missingCount > 0 ? "text-amber-600 font-medium" : "text-green-600"}>
                    {profile.missingCount} ({profile.missingPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Únicos:</span>
                  <span>{profile.uniqueCount}</span>
                </div>

                {profile.type === 'numeric' && (
                  <>
                    <div className="border-t pt-2 mt-2 space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">Media:</span> <span>{profile.mean?.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Mediana:</span> <span>{profile.median?.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Min/Max:</span> <span>{profile.min} / {profile.max}</span></div>
                    </div>
                  </>
                )}

                {profile.type === 'categorical' && profile.topCategories && (
                   <div className="border-t pt-2 mt-2">
                     <span className="text-xs text-muted-foreground mb-1 block">Top Categorías:</span>
                     <ul className="space-y-1">
                       {profile.topCategories.slice(0, 3).map((cat, i) => (
                         <li key={i} className="flex justify-between text-xs">
                           <span className="truncate max-w-[120px]">{cat.value}</span>
                           <span className="font-mono bg-muted px-1 rounded">{cat.count}</span>
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
        >
            <Wand2 className="w-4 h-4" />
            Generar Resumen Narrativo
        </Button>
      </div>

      {narrative && (
        <Card className="bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900">
            <CardContent className="pt-6">
                <p className="text-indigo-900 dark:text-indigo-100 leading-relaxed">
                    {narrative}
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

import React from 'react';
