import React, { useEffect, useState, useRef } from 'react';
import { SheetData } from '@/lib/sheet-utils';
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
import { Download, Share2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';

interface ChartBuilderProps {
  data: SheetData;
  selectedColumns: string[];
}

type ChartType = 'bar' | 'line' | 'area' | 'scatter' | 'pie' | 'histogram';

export function ChartBuilder({ data, selectedColumns }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  // Auto-config effect
  useEffect(() => {
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
  }, [selectedColumns, data]);

  const exportImage = async () => {
    if (chartRef.current) {
      const dataUrl = await htmlToImage.toPng(chartRef.current);
      download(dataUrl, 'chart-export.png');
    }
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
            <XAxis dataKey={xAxis} tick={{fontSize: 12}} />
            <YAxis />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            {yAxis.length > 0 ? yAxis.map((y, i) => (
              <Bar key={y} dataKey={y} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            )) : <Bar dataKey={xAxis} fill={COLORS[0]} /> /* Fallback for counts logic needed, simplied for MVP */}
          </BarChart>
        );
      case 'line':
      case 'area':
        // Fix for JSX element type 'DataComponent' error: use conditional rendering directly
        // or ensure it's typed as React.ComponentType
        const isLine = chartType === 'line';
        const ChartComp = isLine ? LineChart : AreaChart;
        
        return (
          <ChartComp {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xAxis} tick={{fontSize: 12}} />
            <YAxis />
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
        // Pie needs aggregation logic normally, assuming data is ready or simple count
        // For MVP, if categorical, we might need to count frequencies. 
        // Let's do a simple count aggregation on the fly if it's categorical
        
        let pieData = chartData;
        if (data.columnProfiles[xAxis]?.type === 'categorical') {
            const counts: any = {};
            chartData.forEach(row => {
                const key = row[xAxis];
                counts[key] = (counts[key] || 0) + 1;
            });
            pieData = Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
            // Top 10
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
              nameKey="name" // or whatever key holds the label
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

  if (selectedColumns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground border-2 border-dashed rounded-xl">
        <p>Selecciona columnas para visualizar</p>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg font-medium">Visualización</CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
             <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
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
                <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Eje X" />
                </SelectTrigger>
                <SelectContent>
                    {selectedColumns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
             </Select>
             
             {/* Multi-select Y Axis is harder with standard Select, using first numeric for now or smart defaults */}
             {/* Ideally this would be a multi-select popover, but for MVP keep simple */}

             <div className="flex gap-1 border-l pl-2 ml-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={exportImage} title="Exportar PNG">
                    <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={exportData} title="Exportar CSV">
                    <Share2 className="w-4 h-4" />
                </Button>
             </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[400px] p-4 bg-slate-50/50 dark:bg-slate-900/20" ref={chartRef}>
         <ResponsiveContainer width="100%" height="100%" minHeight={350}>
            {renderChart()}
         </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
