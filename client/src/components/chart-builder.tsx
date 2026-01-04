import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation } from 'wouter';
import { SheetData } from '@/lib/sheet-utils';
import { useSheet, SavedChart } from '@/lib/sheet-context';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter,
  AreaChart, Area,
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Palette, LayoutDashboard, Type } from 'lucide-react';
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
  initialConfig?: SavedChart['chartConfig'] & { title?: string };
  onSave?: (config: SavedChart['chartConfig'] & { name: string }, options: { addToProjectDashboard: boolean, addToGlobalDashboard: boolean }) => void;
  isEditing?: boolean;
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

export function ChartBuilder({ data, selectedColumns, hideControls = false, initialConfig, onSave, isEditing = false }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<ChartType>(initialConfig?.chartType || 'bar');
  const [xAxis, setXAxis] = useState<string>(initialConfig?.xAxis || '');
  const [yAxis, setYAxis] = useState<string[]>(initialConfig?.yAxis || []);
  const [aggregation, setAggregation] = useState<AggregationType>((initialConfig?.aggregation as AggregationType) || 'none');
  const [chartTitle, setChartTitle] = useState(initialConfig?.title || '');
  const [isAddingToDashboard, setIsAddingToDashboard] = useState(false);
  const [isAddingToGlobal, setIsAddingToGlobal] = useState(false);
  const [showLabels, setShowLabels] = useState(initialConfig?.showLabels || false);
  
  // Dialog State
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  
  const [activeColorScheme, setActiveColorScheme] = useState<keyof typeof COLOR_SCHEMES>(
    (Object.keys(COLOR_SCHEMES).find(k => k === initialConfig?.activeColorScheme) as any) || 
    (Object.keys(COLOR_SCHEMES).find(k => JSON.stringify(COLOR_SCHEMES[k as keyof typeof COLOR_SCHEMES]) === JSON.stringify(initialConfig?.colorScheme)) as any) || 'default'
  );
  
  const chartRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const colors = COLOR_SCHEMES[activeColorScheme];

  useEffect(() => {
    if (initialConfig) {
      setChartType(initialConfig.chartType as ChartType);
      setXAxis(initialConfig.xAxis);
      setYAxis([...(initialConfig.yAxis || [])]);
      setAggregation((initialConfig.aggregation as AggregationType) || 'none');
      setChartTitle(initialConfig.title || '');
      setShowLabels(initialConfig.showLabels || false);
      if (initialConfig.activeColorScheme) {
        setActiveColorScheme(initialConfig.activeColorScheme as any);
      }
      return;
    }
    
    // Auto-selection logic for NEW charts only
    if (selectedColumns.length > 0) {
      const numerics = selectedColumns.filter(c => data.columnProfiles[c]?.type === 'numeric');
      const categoricals = selectedColumns.filter(c => data.columnProfiles[c]?.type === 'categorical' || data.columnProfiles[c]?.type === 'boolean');
      const datetimes = selectedColumns.filter(c => data.columnProfiles[c]?.type === 'datetime');

      if (datetimes.length > 0 && numerics.length > 0) {
        setChartType('line');
        setXAxis(datetimes[0]);
        setYAxis([numerics[0]]);
        setAggregation('none');
      } else if (categoricals.length > 0 && numerics.length > 0) {
        setChartType('bar');
        setXAxis(categoricals[0]);
        setYAxis([numerics[0]]);
        setAggregation('sum');
      } else if (numerics.length >= 2) {
        setChartType('scatter');
        setXAxis(numerics[0]);
        setYAxis([numerics[1]]);
        setAggregation('none');
      } else if (categoricals.length > 0) {
          setChartType('bar');
          setXAxis(categoricals[0]);
          setYAxis([]);
          setAggregation('count');
      } else if (numerics.length === 1) {
          setChartType('bar');
          setXAxis(numerics[0]);
          setYAxis([numerics[0]]);
          setAggregation('none');
      }
    }

    if (selectedColumns.length === 0) {
      setXAxis('');
      setYAxis([]);
    }
  }, [selectedColumns, data.columnProfiles, JSON.stringify(initialConfig)]);

  const processedData = useMemo(() => {
    if (!data.rows || data.rows.length === 0 || !xAxis) return [];

    if (aggregation === 'none' || (aggregation === 'count' && yAxis.length === 0)) {
      if (yAxis.length === 0 || aggregation === 'count') {
        const groups: Record<string, any> = {};
        data.rows.forEach(row => {
          const key = String(row[xAxis]);
          if (!groups[key]) groups[key] = { [xAxis]: key, count: 0 };
          groups[key].count++;
        });
        return Object.values(groups).sort((a, b) => b.count - a.count).slice(0, 1000);
      }
      return data.rows.map(row => {
        const item: any = { [xAxis]: row[xAxis] };
        yAxis.forEach(y => { item[y] = row[y]; });
        return item;
      }).slice(0, 1000);
    }

    const groups: Record<string, any> = {};
    const effectiveYAxis = yAxis.length > 0 ? yAxis : ['count'];

    data.rows.forEach(row => {
      const key = String(row[xAxis]);
      if (!groups[key]) {
        groups[key] = { [xAxis]: key };
        effectiveYAxis.forEach(y => {
          groups[key][y] = (aggregation === 'count' || y === 'count') ? 0 : [];
        });
      }
      
      effectiveYAxis.forEach(y => {
        if (y === 'count' || aggregation === 'count') {
          groups[key][y]++;
        } else {
          const val = Number(row[y]);
          if (!isNaN(val)) groups[key][y].push(val);
        }
      });
    });

    return Object.values(groups).map(group => {
      const result = { ...group };
      effectiveYAxis.forEach(y => {
        if (Array.isArray(group[y])) {
          if (aggregation === 'sum') {
            result[y] = group[y].reduce((a: number, b: number) => a + b, 0);
          } else if (aggregation === 'avg') {
            result[y] = group[y].length ? group[y].reduce((a: number, b: number) => a + b, 0) / group[y].length : 0;
          }
        }
      });
      return result;
    }).slice(0, 500);
  }, [data.rows, xAxis, yAxis, aggregation]);

  const openSaveDialog = () => {
    setSaveName(chartTitle || `Gráfico de ${xAxis}`);
    setIsSaveDialogOpen(true);
  };

  const confirmSave = () => {
    if (onSave) {
      onSave({
        name: saveName,
        chartType,
        xAxis,
        yAxis: yAxis.length > 0 ? yAxis : ['count'],
        selectedColumns,
        colorScheme: colors,
        aggregation,
        showLabels,
        activeColorScheme
      }, {
        addToProjectDashboard: isAddingToDashboard,
        addToGlobalDashboard: isAddingToGlobal
      });
    }
    setIsSaveDialogOpen(false);
  };

  const renderChart = () => {
    if (!processedData || processedData.length === 0) return <div className="flex items-center justify-center h-full text-muted-foreground">Sin datos para visualizar</div>;

    const commonProps = {
      data: processedData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    let plotKeys = yAxis.length > 0 ? yAxis : (processedData[0]?.count !== undefined ? ['count'] : ['value']);
    if (plotKeys.every(k => processedData[0][k] === undefined)) {
        plotKeys = processedData[0]?.value !== undefined ? ['value'] : ['count'];
    }

    const formatValue = (val: any) => {
      if (typeof val !== 'number') return val;
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 3,
        minimumFractionDigits: 0
      }).format(val);
    };

    const renderChartByType = () => {
      const pieKey = plotKeys[0];
      const containerHeight = hideControls ? "100%" : 400;
      
      switch (chartType) {
        case 'bar':
          return (
            <ResponsiveContainer width="100%" height={containerHeight}>
              <BarChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey={xAxis} tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} tickFormatter={formatValue} />
                <Tooltip formatter={formatValue} />
                <Legend />
                {plotKeys.map((y, i) => (
                  <Bar key={y} dataKey={y} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]}>
                    {showLabels && <LabelList dataKey={y} position="top" style={{fontSize: 10, fill: '#666'}} formatter={formatValue} />}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
        case 'line':
          return (
            <ResponsiveContainer width="100%" height={containerHeight}>
              <LineChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey={xAxis} tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} tickFormatter={formatValue} />
                <Tooltip formatter={formatValue} />
                <Legend />
                {plotKeys.map((y, i) => (
                  <Line key={y} type="monotone" dataKey={y} stroke={colors[i % colors.length]} strokeWidth={2} dot={processedData.length < 50}>
                    {showLabels && <LabelList dataKey={y} position="top" style={{fontSize: 10, fill: '#666', marginBottom: 5}} formatter={formatValue} />}
                  </Line>
                ))}
              </LineChart>
            </ResponsiveContainer>
          );
        case 'area':
          return (
            <ResponsiveContainer width="100%" height={containerHeight}>
              <AreaChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey={xAxis} tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} tickFormatter={formatValue} />
                <Tooltip formatter={formatValue} />
                <Legend />
                {plotKeys.map((y, i) => (
                  <Area key={y} type="monotone" dataKey={y} fill={colors[i % colors.length]} stroke={colors[i % colors.length]} fillOpacity={0.3}>
                    {showLabels && <LabelList dataKey={y} position="top" style={{fontSize: 10, fill: '#666'}} formatter={formatValue} />}
                  </Area>
                ))}
              </AreaChart>
            </ResponsiveContainer>
          );
        case 'pie':
          return (
            <ResponsiveContainer width="100%" height={containerHeight}>
              <PieChart>
                <Pie
                  data={processedData.slice(0, 10)}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5}
                  dataKey={pieKey}
                  nameKey={xAxis}
                  label={showLabels ? ({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    value,
                    index
                  }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = 25 + outerRadius;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill={colors[index % colors.length]} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px]">
                        {formatValue(value)}
                      </text>
                    );
                  } : false}
                >
                  {processedData.slice(0, 10).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={formatValue} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          );
        default:
          return <div className="flex items-center justify-center h-full">Tipo de gráfico no soportado</div>;
      }
    };

    return renderChartByType();
  };

  return (
    <Card className="h-full flex flex-col shadow-sm border bg-card overflow-hidden">
      <CardHeader className="pb-4 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 mr-auto">
            {!hideControls && (
              <>
                <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="Tipo de gráfico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Columnas</SelectItem>
                    <SelectItem value="line">Líneas</SelectItem>
                    <SelectItem value="area">Área</SelectItem>
                    <SelectItem value="pie">Circular</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="default" 
                  size="sm" 
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs px-3 shadow-sm border border-primary/20"
                  onClick={openSaveDialog}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> {isEditing ? 'Actualizar Gráfica' : 'Guardar Gráfica'}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={`h-8 w-8 ${showLabels ? 'bg-primary/10 text-primary border-primary/50' : ''}`}
              onClick={() => setShowLabels(!showLabels)}
              title="Mostrar etiquetas de datos"
            >
              <Type className="w-4 h-4" />
            </Button>
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
      <CardContent className="flex-1 min-h-[400px] p-6" ref={chartRef}>
        {renderChart()}
      </CardContent>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Actualizar Gráfica' : 'Guardar Gráfica'}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="chart-name">Nombre de la gráfica</Label>
              <Input 
                id="chart-name" 
                value={saveName} 
                onChange={(e) => setSaveName(e.target.value)} 
                placeholder="Ej. Ventas por mes"
              />
            </div>
            <div className="bg-muted/40 p-4 rounded-lg space-y-4">
              <div className="flex items-start space-x-3">
                 <input 
                    type="checkbox" 
                    id="add-dashboard" 
                    className="mt-1"
                    checked={isAddingToDashboard}
                    onChange={e => setIsAddingToDashboard(e.target.checked)}
                 />
                 <div className="space-y-1">
                    <label htmlFor="add-dashboard" className="font-medium text-sm block cursor-pointer">Añadir al Dashboard del Proyecto</label>
                    <p className="text-xs text-muted-foreground">Visualízala junto con otras métricas de este proyecto.</p>
                 </div>
              </div>

              <div className="flex items-start space-x-3">
                 <input 
                    type="checkbox" 
                    id="add-global" 
                    className="mt-1"
                    checked={isAddingToGlobal}
                    onChange={e => setIsAddingToGlobal(e.target.checked)}
                 />
                 <div className="space-y-1">
                    <label htmlFor="add-global" className="font-medium text-sm block cursor-pointer">Añadir al Dashboard Principal</label>
                    <p className="text-xs text-muted-foreground">Fija esta gráfica en tu tablero global para acceso rápido.</p>
                 </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmSave} type="submit">Guardar Gráfica</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
