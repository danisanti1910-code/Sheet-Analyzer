import React, { useEffect, useState, useRef } from 'react';
import { SheetData } from '@/lib/sheet-utils';
import { useSheet } from '@/lib/sheet-context';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter,
  AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Share2, PlusCircle } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';
import { useToast } from '@/hooks/use-toast';

interface ChartBuilderProps {
  data: SheetData;
  selectedColumns: string[];
  hideControls?: boolean;
  initialConfig?: {
    chartType: ChartType;
    xAxis: string;
    yAxis: string[];
  };
}

type ChartType = 'bar' | 'line' | 'area' | 'scatter' | 'pie' | 'histogram';

export function ChartBuilder({ data, selectedColumns, hideControls = false, initialConfig }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<ChartType>(initialConfig?.chartType || 'bar');
  const [xAxis, setXAxis] = useState<string>(initialConfig?.xAxis || '');
  const [yAxis, setYAxis] = useState<string[]>(initialConfig?.yAxis || []);
  const chartRef = useRef<HTMLDivElement>(null);
  const { saveView } = useSheet();
  const { toast } = useToast();

  // Auto-config effect
  useEffect(() => {
    if (initialConfig) return;
    if (selectedColumns.length === 0) return;

    // Smart Defaults Logic
    const numerics = selectedColumns.filter(c => data.columnProfiles[c].type === 'numeric');
    const categoricals = selectedColumns.filter(c => data.columnProfiles[c].type === 'categorical' || data.columnProfiles[c].type === 'boolean');
    const datetimes = selectedColumns.filter(c => data.columnProfiles[c].type === 'datetime');

    if (datetimes.length > 0 && numerics.length > 0) {
      setChartType('line');
      setXAxis(datetimes[0]);
      setYAxis(numerics);
    } else if (categoricals.length > 0 && numerics.length > 0) {
      setChartType('bar');
      setXAxis(categoricals[0]);
      setYAxis(numerics);
    } else if (numerics.length >= 2) {
      setChartType('scatter');
      setXAxis(numerics[0]);
      setYAxis([numerics[1]]);
    } else if (categoricals.length > 0) {
        setChartType('bar'); // Counts
        setXAxis(categoricals[0]);
        setYAxis([]);
    } else if (numerics.length === 1) {
        setChartType('bar'); // Histogram-ish
        setXAxis(numerics[0]);
        setYAxis([]);
    }
  }, [selectedColumns, data, initialConfig]);

  const exportImage = async () => {
    if (chartRef.current) {
      const dataUrl = await htmlToImage.toPng(chartRef.current);
      download(dataUrl, 'chart-export.png');
    }
  };

  const handleSaveToDashboard = () => {
    saveView({
      name: `Gráfico de ${xAxis} vs ${yAxis.join(', ')}`,
      chartType,
      xAxis,
      yAxis,
      selectedColumns
    });
    toast({
      title: "Guardado en Dashboard",
      description: "La vista se ha guardado correctamente.",
    });
  };

  const exportData = () => {
    // Simple CSV export of current view
    const header = [xAxis, ...yAxis].join(',');
    const rows = chartData.map(row => 
      [row[xAxis], ...yAxis.map(y => row[y])].join(',')
    ).join('\n');
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    download(url, 'chart-data.csv', 'text/csv');
  };

  // Prepare Data
  const chartData = React.useMemo(() => {
      // Limit to 100 points for performance if scatter, or aggregate if bar
      if (data.rows.length > 2000) {
          return data.rows.slice(0, 1000); 
      }
      return data.rows;
  }, [data]);

  // Colors
  const COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xAxis} tick={{fontSize: 10}} />
            <YAxis tick={{fontSize: 10}} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            {yAxis.length > 0 ? yAxis.map((y, i) => (
              <Bar key={y} dataKey={y} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            )) : <Bar dataKey={xAxis} fill={COLORS[0]} /> }
          </BarChart>
        );
      case 'line':
      case 'area':
        const isLine = chartType === 'line';
        const ChartComp = isLine ? LineChart : AreaChart;
        
        return (
          <ChartComp {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xAxis} tick={{fontSize: 10}} />
            <YAxis tick={{fontSize: 10}} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            {yAxis.map((y, i) => (
               isLine ? (
                  <Line 
                    key={y} 
                    type="monotone" 
                    dataKey={y} 
                    stroke={COLORS[i % COLORS.length]} 
                    strokeWidth={2}
                    dot={false}
                  />
               ) : (
                  <Area
                    key={y}
                    type="monotone"
                    dataKey={y}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.3}
                  />
               )
            ))}
          </ChartComp>
        );
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey={xAxis} name={xAxis} />
            <YAxis type="number" dataKey={yAxis[0]} name={yAxis[0]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name={`${xAxis} vs ${yAxis[0]}`} data={chartData} fill={COLORS[0]} />
          </ScatterChart>
        );
      case 'pie':
        let pieData = chartData;
        if (data.columnProfiles[xAxis]?.type === 'categorical') {
            const counts: any = {};
            chartData.forEach(row => {
                const key = row[xAxis];
                counts[key] = (counts[key] || 0) + 1;
            });
            pieData = Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
            pieData = pieData.sort((a, b) => b.value - a.value).slice(0, 10);
        }

        return (
          <PieChart>
             <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
            >
              {pieData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      default:
        return <div>Tipo de gráfico no soportado</div>;
    }
  };

  if (selectedColumns.length === 0 && !initialConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground border-2 border-dashed rounded-xl">
        <p>Selecciona columnas para visualizar</p>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-sm border-none bg-card overflow-hidden">
      {!hideControls && (
        <CardHeader className="pb-4 border-b px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold text-foreground/80">Visualización</CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
               <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                  <SelectTrigger className="w-[100px] h-8 text-[11px]">
                      <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="bar">Barras</SelectItem>
                      <SelectItem value="line">Líneas</SelectItem>
                      <SelectItem value="area">Area</SelectItem>
                      <SelectItem value="scatter">Dispersión</SelectItem>
                      <SelectItem value="pie">Pastel</SelectItem>
                  </SelectContent>
               </Select>

               <Select value={xAxis} onValueChange={setXAxis}>
                  <SelectTrigger className="w-[110px] h-8 text-[11px]">
                      <SelectValue placeholder="Eje X" />
                  </SelectTrigger>
                  <SelectContent>
                      {selectedColumns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
               </Select>

               <div className="flex gap-1 border-l pl-2 ml-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleSaveToDashboard} title="Guardar en Dashboard">
                      <PlusCircle className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={exportImage} title="Exportar PNG">
                      <Download className="w-4 h-4" />
                  </Button>
               </div>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={`flex-1 min-h-[300px] p-4 ${!hideControls ? 'bg-slate-50/30 dark:bg-slate-900/10' : ''}`} ref={chartRef}>
         <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            {renderChart()}
         </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
