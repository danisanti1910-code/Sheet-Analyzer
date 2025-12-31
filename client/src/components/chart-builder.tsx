import React, { useEffect, useState, useRef, useMemo } from 'react';
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
import { Download, Share2, Palette, LayoutDashboard, Plus } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface ChartBuilderProps {
  data: SheetData;
  selectedColumns: string[];
  hideControls?: boolean;
  initialConfig?: {
    chartType: ChartType;
    xAxis: string;
    yAxis: string[];
    aggregation?: AggregationType;
    colorScheme?: string[];
    title?: string;
  };
}

type ChartType = 'bar' | 'line' | 'area' | 'scatter' | 'pie';
type AggregationType = 'none' | 'sum' | 'avg' | 'count';

const COLOR_SCHEMES = {
  default: ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'],
  vibrant: ['#ff006e', '#8338ec', '#3a86ff', '#ffbe0b', '#fb5607'],
  ocean: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#03045e'],
  forest: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'],
  sunset: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8']
};

export function ChartBuilder({ data, selectedColumns, hideControls = false, initialConfig }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<ChartType>(initialConfig?.chartType || 'bar');
  const [xAxis, setXAxis] = useState<string>(initialConfig?.xAxis || '');
  const [yAxis, setYAxis] = useState<string[]>(initialConfig?.yAxis || []);
  const [aggregation, setAggregation] = useState<AggregationType>(initialConfig?.aggregation || 'none');
  const [chartTitle, setChartTitle] = useState(initialConfig?.title || '');
  const [isAddingToDashboard, setIsAddingToDashboard] = useState(false);
  
  const [activeColorScheme, setActiveColorScheme] = useState<keyof typeof COLOR_SCHEMES>(
    (Object.keys(COLOR_SCHEMES).find(k => JSON.stringify(COLOR_SCHEMES[k as keyof typeof COLOR_SCHEMES]) === JSON.stringify(initialConfig?.colorScheme)) as any) || 'default'
  );
  
  const chartRef = useRef<HTMLDivElement>(null);
  const { saveView } = useSheet();
  const { toast } = useToast();

  const colors = COLOR_SCHEMES[activeColorScheme];

  useEffect(() => {
    if (initialConfig) return;
    if (selectedColumns.length === 0) return;

    const numerics = selectedColumns.filter(c => data.columnProfiles[c].type === 'numeric');
    const categoricals = selectedColumns.filter(c => data.columnProfiles[c].type === 'categorical' || data.columnProfiles[c].type === 'boolean');
    const datetimes = selectedColumns.filter(c => data.columnProfiles[c].type === 'datetime');

    if (datetimes.length > 0 && numerics.length > 0) {
      setChartType('line');
      setXAxis(datetimes[0]);
      setYAxis([numerics[0]]);
    } else if (categoricals.length > 0 && numerics.length > 0) {
      setChartType('bar');
      setXAxis(categoricals[0]);
      setYAxis([numerics[0]]);
    } else if (numerics.length >= 2) {
      setChartType('scatter');
      setXAxis(numerics[0]);
      setYAxis([numerics[1]]);
    } else if (categoricals.length > 0) {
        setChartType('bar');
        setXAxis(categoricals[0]);
        setYAxis([]);
    } else if (numerics.length === 1) {
        setChartType('bar');
        setXAxis(numerics[0]);
        setYAxis([]);
    }
  }, [selectedColumns, data, initialConfig]);

  const processedData = useMemo(() => {
    if (aggregation === 'none' || !xAxis || yAxis.length === 0) {
      return data.rows.slice(0, 1000);
    }

    const groups: Record<string, any> = {};
    data.rows.forEach(row => {
      const key = String(row[xAxis]);
      if (!groups[key]) {
        groups[key] = { [xAxis]: key };
        yAxis.forEach(y => {
          groups[key][y] = aggregation === 'count' ? 0 : [];
        });
      }
      
      yAxis.forEach(y => {
        if (aggregation === 'count') {
          groups[key][y]++;
        } else {
          const val = Number(row[y]);
          if (!isNaN(val)) groups[key][y].push(val);
        }
      });
    });

    return Object.values(groups).map(group => {
      const result = { ...group };
      yAxis.forEach(y => {
        if (aggregation === 'sum') {
          result[y] = group[y].reduce((a: number, b: number) => a + b, 0);
        } else if (aggregation === 'avg') {
          result[y] = group[y].length ? group[y].reduce((a: number, b: number) => a + b, 0) / group[y].length : 0;
        }
      });
      return result;
    }).slice(0, 500);
  }, [data.rows, xAxis, yAxis, aggregation]);

  const handleSaveToDashboard = () => {
    saveView({
      name: chartTitle || `Gráfico de ${xAxis}`,
      chartType,
      xAxis,
      yAxis,
      selectedColumns,
      colorScheme: colors
    });
    setIsAddingToDashboard(false);
    toast({
      title: "Guardado en Dashboard",
      description: "El gráfico se ha añadido a tu tablero.",
    });
  };

  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xAxis} tick={{fontSize: 10}} />
            <YAxis tick={{fontSize: 10}} />
            <Tooltip />
            <Legend />
            {yAxis.map((y, i) => (
              <Bar key={y} dataKey={y} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xAxis} tick={{fontSize: 10}} />
            <YAxis tick={{fontSize: 10}} />
            <Tooltip />
            <Legend />
            {yAxis.map((y, i) => (
              <Line key={y} type="monotone" dataKey={y} stroke={colors[i % colors.length]} strokeWidth={2} dot={processedData.length < 50} />
            ))}
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={processedData.slice(0, 10)}
              cx="50%" cy="50%"
              innerRadius={60} outerRadius={80}
              paddingAngle={5}
              dataKey={yAxis[0] || 'value'}
              nameKey={xAxis}
            >
              {processedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      default:
        return <div className="flex items-center justify-center h-full">Tipo de gráfico no soportado</div>;
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-sm border bg-card overflow-hidden">
      {!hideControls && (
        <CardHeader className="pb-4 border-b px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Dialog open={isAddingToDashboard} onOpenChange={setIsAddingToDashboard}>
              <DialogTrigger asChild>
                <Button variant="primary" size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <LayoutDashboard className="w-4 h-4" /> Agregar al dashboard
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Nuevo gráfico</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título</Label>
                    <Input id="title" value={chartTitle} onChange={(e) => setChartTitle(e.target.value)} placeholder="Ej: Ventas por categoría" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo de gráfico</Label>
                    <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Columnas</SelectItem>
                        <SelectItem value="line">Líneas</SelectItem>
                        <SelectItem value="area">Área</SelectItem>
                        <SelectItem value="pie">Circular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Eje X / Categoría</Label>
                    <Select value={xAxis} onValueChange={setXAxis}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar columna" /></SelectTrigger>
                      <SelectContent>
                        {data.columns.map(c => <SelectItem key={c} value={c}>{data.columnProfiles[c].name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Eje Y / Valor (opcional)</Label>
                    <Select value={yAxis[0] || ''} onValueChange={(v) => setYAxis(v ? [v] : [])}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar columna numérica" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ninguno (conteo)</SelectItem>
                        {data.columns.filter(c => data.columnProfiles[c].type === 'numeric').map(c => (
                          <SelectItem key={c} value={c}>{data.columnProfiles[c].name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Agregación</Label>
                    <Select value={aggregation} onValueChange={(v: any) => setAggregation(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin agregación</SelectItem>
                        <SelectItem value="sum">Suma</SelectItem>
                        <SelectItem value="avg">Promedio</SelectItem>
                        <SelectItem value="count">Recuento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveToDashboard} className="w-full">Agregar al dashboard</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8"><Palette className="w-4 h-4" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2">
                  <div className="space-y-1">
                    {Object.keys(COLOR_SCHEMES).map((scheme) => (
                      <button
                        key={scheme}
                        onClick={() => setActiveColorScheme(scheme as any)}
                        className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-muted flex items-center gap-2 ${activeColorScheme === scheme ? 'bg-muted font-bold' : ''}`}
                      >
                        <div className="flex gap-0.5">
                          {COLOR_SCHEMES[scheme as keyof typeof COLOR_SCHEMES].slice(0, 3).map((c, i) => (
                            <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <span className="capitalize">{scheme}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => {
                if (chartRef.current) {
                  htmlToImage.toPng(chartRef.current).then(url => download(url, 'grafico.png'));
                }
              }}><Download className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="flex-1 min-h-[400px] p-6" ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
