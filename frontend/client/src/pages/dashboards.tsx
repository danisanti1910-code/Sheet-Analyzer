import { useSheet, SavedChart } from "@/lib/sheet-context";
import { Layout } from "@/components/layout";
import { ChartBuilder } from "@/components/chart-builder";
import { InsightsPanel } from "@/components/insights-panel";
import { SheetData } from "@/lib/sheet-utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  AlertCircle,
  Plus,
  Edit3,
  Settings2,
  LayoutDashboard,
  PanelRight,
  PanelRightClose,
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  AreaChart,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useLocation, useRoute } from "wouter";
import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Input } from "@/components/ui/input";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ResponsiveGridLayout = WidthProvider(Responsive);

const GRID_COLS = 12;
const ROW_HEIGHT = 100;
const MARGIN: [number, number] = [16, 16];
const CONTAINER_PADDING: [number, number] = [24, 24];

const CHART_TYPE_ICONS: Record<string, React.ReactNode> = {
  bar: <BarChart3 className="h-3 w-3" />,
  line: <LineChart className="h-3 w-3" />,
  area: <AreaChart className="h-3 w-3" />,
  pie: <PieChart className="h-3 w-3" />,
  scatter: <ScatterChart className="h-3 w-3" />,
};

const CHART_TYPE_LABELS: Record<string, string> = {
  bar: "Barras",
  line: "Líneas",
  area: "Área",
  pie: "Pastel",
  scatter: "Dispersión",
};

const AGGREGATION_LABELS: Record<string, string> = {
  sum: "Suma",
  avg: "Promedio",
  count: "Conteo",
  min: "Mínimo",
  max: "Máximo",
};

function DashboardChartWrapper({
  chart,
  data,
}: {
  chart: SavedChart;
  data: SheetData;
}) {
  // Apply filters if they exist
  const filteredData = useMemo(() => {
    if (!chart.chartConfig.filteredValues) return data;

    let rows = data.rows;
    Object.entries(chart.chartConfig.filteredValues).forEach(
      ([col, values]) => {
        if (!values || values.length === 0) return;

        if (col.endsWith("_min")) {
          const actualCol = col.replace("_min", "");
          const type = data.columnProfiles[actualCol]?.type;
          if (type === "numeric") {
            rows = rows.filter(
              (r) => Number(r[actualCol]) >= Number(values[0]),
            );
          } else if (type === "datetime") {
            rows = rows.filter(
              (r) => new Date(r[actualCol]) >= new Date(values[0]),
            );
          }
        } else if (col.endsWith("_max")) {
          const actualCol = col.replace("_max", "");
          const type = data.columnProfiles[actualCol]?.type;
          if (type === "numeric") {
            rows = rows.filter(
              (r) => Number(r[actualCol]) <= Number(values[0]),
            );
          } else if (type === "datetime") {
            rows = rows.filter(
              (r) => new Date(r[actualCol]) <= new Date(values[0]),
            );
          }
        } else {
          rows = rows.filter((r) => values.includes(String(r[col])));
        }
      },
    );

    // We should ideally recalculate profiles here but for performance in dashboard
    // we might skip it or do a lightweight version.
    // InsightsPanel needs profiles for the *filtered* data to show correct stats (mean/max etc).
    // Let's replicate the profile logic from analyze.tsx briefly or extract it?
    // For now, let's just return rows and reuse profiles (approximate) or recalculate if critical.
    // The InsightsPanel uses columnProfiles for stats. If we don't recalculate, it shows global stats.
    // Let's recalculate profiles for selected columns only to be efficient.

    const profiles: any = { ...data.columnProfiles };
    chart.chartConfig.selectedColumns.forEach((col) => {
      const values = rows.map((r) => r[col]);
      const nonNullValues = values.filter(
        (v) => v !== null && v !== undefined && v !== "",
      );
      const missingCount = values.length - nonNullValues.length;
      const type = data.columnProfiles[col]?.type || "unknown";
      const uniqueValues = new Set(nonNullValues);

      let stats: any = {};
      if (type === "numeric" && nonNullValues.length > 0) {
        const nums = nonNullValues.map((v) => Number(v)).sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        stats.min = nums[0];
        stats.max = nums[nums.length - 1];
        stats.mean = sum / nums.length;
        stats.median = nums[Math.floor(nums.length / 2)];
        const variance =
          nums.reduce((a, b) => a + Math.pow(b - stats.mean, 2), 0) /
          nums.length;
        stats.std = Math.sqrt(variance);
      } else if (
        (type === "categorical" || type === "boolean") &&
        nonNullValues.length > 0
      ) {
        const counts: Record<string, number> = {};
        nonNullValues.forEach((v) => {
          const key = String(v);
          counts[key] = (counts[key] || 0) + 1;
        });
        stats.topCategories = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([value, count]) => ({ value, count }));
      }

      profiles[col] = {
        ...data.columnProfiles[col],
        missingCount,
        missingPercentage: (missingCount / rows.length) * 100,
        uniqueCount: uniqueValues.size,
        ...stats,
      };
    });

    return { ...data, rows, rowCount: rows.length, columnProfiles: profiles };
  }, [data, chart.chartConfig.filteredValues]);

  return (
    <div className="w-full h-full flex gap-0 overflow-hidden pointer-events-auto">
      <div
        className={`h-full min-h-0 min-w-0 flex flex-col ${chart.includeInsights ? "w-[65%]" : "w-full"}`}
      >
        <ChartBuilder
          data={filteredData}
          selectedColumns={chart.chartConfig.selectedColumns}
          hideControls
          initialConfig={chart.chartConfig}
        />
      </div>
      {chart.includeInsights && (
        <div className="w-[35%] h-full min-w-0 border-l bg-slate-50/80 dark:bg-slate-900/30 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b bg-muted/30 shrink-0">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Análisis de Datos
            </h4>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2">
            <InsightsPanel
              sheetData={filteredData}
              sourceData={data}
              selectedColumns={chart.chartConfig.selectedColumns}
              filteredValues={chart.chartConfig.filteredValues || {}}
              onFilterChange={() => {}}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboards() {
  const {
    activeProject,
    deleteChart,
    updateChart,
    activeProjectId,
    setActiveProjectId,
    createChart,
    addToGlobalDashboard,
    projects,
  } = useSheet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [, params] = useRoute("/projects/:projectId/dashboards");

  useEffect(() => {
    if (
      params?.projectId &&
      params.projectId !== activeProjectId &&
      projects.length > 0
    ) {
      const projectExists = projects.some((p) => p.id === params.projectId);
      if (projectExists) {
        setActiveProjectId(params.projectId);
      }
    }
  }, [params?.projectId, activeProjectId, projects, setActiveProjectId]);

  const layout = useMemo(() => {
    if (!activeProject?.charts) return [];
    return activeProject.charts.map((chart, index) => ({
      i: chart.id,
      x: chart.dashboardLayout?.x ?? (index % 2) * 6,
      y: chart.dashboardLayout?.y ?? Math.floor(index / 2) * 4,
      w: chart.dashboardLayout?.w ?? 6,
      h: chart.dashboardLayout?.h ?? 4,
      minW: 2,
      minH: 2,
      maxW: GRID_COLS,
    }));
  }, [activeProject?.charts]);

  const handleLayoutChange = useCallback(
    (currentLayout: readonly any[], layouts: any) => {
      if (!activeProject?.charts) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        (currentLayout as any[]).forEach((l) => {
          const chart = activeProject.charts.find((c) => c.id === l.i);
          if (chart) {
            const hasChanged =
              chart.dashboardLayout?.x !== l.x ||
              chart.dashboardLayout?.y !== l.y ||
              chart.dashboardLayout?.w !== l.w ||
              chart.dashboardLayout?.h !== l.h;

            if (hasChanged) {
              updateChart(l.i, {
                dashboardLayout: { x: l.x, y: l.y, w: l.w, h: l.h },
              });
            }
          }
        });
      }, 300);
    },
    [activeProject?.charts, updateChart],
  );

  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragStop = useCallback(() => setIsDragging(false), []);
  const handleResizeStart = useCallback(() => setIsDragging(true), []);
  const handleResizeStop = useCallback(() => setIsDragging(false), []);

  const handleUpdateName = (id: string) => {
    updateChart(id, { name: tempName });
    setEditingId(null);
  };

  const handleNavigateToEdit = (chartId: string) => {
    setLocation(`/projects/${activeProjectId}/charts/${chartId}`);
  };

  const handleNewAnalysis = () => {
    if (!activeProjectId || !activeProject) return;
    const newId = createChart(
      activeProjectId,
      {
        chartType: "bar",
        xAxis: "",
        yAxis: [],
        selectedColumns: [],
      },
      `Análisis ${activeProject.charts.length + 1}`,
      false,
    );

    setLocation(`/projects/${activeProjectId}/charts/${newId}`);
  };

  if (!activeProject || !activeProject.sheetData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold">
            Selecciona un proyecto con datos
          </h2>
          <Button asChild>
            <Link href="/">Ir al Inicio</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {activeProject.name} - Dashboard
            </h1>
            <p className="text-muted-foreground text-xs">
              Panel interactivo con tus gráficas guardadas.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2"
            >
              Imprimir PDF
            </Button>
            <Button
              onClick={handleNewAnalysis}
              variant="default"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Nuevo Análisis
            </Button>
          </div>
        </div>

        {!activeProject.charts || activeProject.charts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-12">
            <p>No hay gráficas guardadas en este proyecto.</p>
          </div>
        ) : (
          <div className="pb-20 relative">
            {isDragging && (
              <div
                className="absolute inset-0 pointer-events-none z-0 rounded-lg"
                style={{
                  backgroundImage: `
                     linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                     linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                   `,
                  backgroundSize: `calc((100% - ${CONTAINER_PADDING[0] * 2}px) / ${GRID_COLS}) ${ROW_HEIGHT + MARGIN[1]}px`,
                  backgroundPosition: `${CONTAINER_PADDING[0]}px ${CONTAINER_PADDING[1]}px`,
                  border: "2px dashed rgba(59, 130, 246, 0.3)",
                }}
              />
            )}
            <ResponsiveGridLayout
              className="layout"
              layouts={{ lg: layout }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: GRID_COLS, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={ROW_HEIGHT}
              margin={MARGIN}
              containerPadding={CONTAINER_PADDING}
              onLayoutChange={handleLayoutChange}
              onDragStart={handleDragStart}
              onDragStop={handleDragStop}
              onResizeStart={handleResizeStart}
              onResizeStop={handleResizeStop}
              draggableHandle=".drag-handle"
              resizeHandles={["s", "w", "e", "n", "sw", "nw", "se", "ne"]}
              preventCollision={false}
              compactType="vertical"
              isBounded={true}
            >
              {activeProject.charts.map((chart) => {
                const chartType = chart.chartConfig.chartType;
                const xAxis = chart.chartConfig.xAxis;
                const yAxis = chart.chartConfig.yAxis;
                const aggregation = chart.chartConfig.aggregation || "sum";
                const filterCount = chart.chartConfig.filteredValues
                  ? Object.values(chart.chartConfig.filteredValues).filter(
                      (v: any) => v && v.length > 0,
                    ).length
                  : 0;

                return (
                  <div
                    key={chart.id}
                    className="bg-background shadow-md border rounded-lg overflow-hidden flex flex-col"
                  >
                    <CardHeader
                      className="flex flex-col gap-1 py-1 px-2 border-b bg-muted/20 shrink-0 drag-handle cursor-move min-h-[32px] max-h-[48px]"
                      style={{ height: "40px", padding: "4px 8px" }}
                    >
                      <div className="flex items-center justify-between w-full">
                        {editingId === chart.id ? (
                          <div
                            className="flex gap-1"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <Input
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="h-7 text-xs w-32"
                            />
                            <Button
                              size="sm"
                              className="h-7"
                              onClick={() => handleUpdateName(chart.id)}
                            >
                              OK
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/title">
                            <CardTitle className="text-xs font-bold truncate uppercase tracking-tight select-none">
                              {chart.name}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(chart.id);
                                setTempName(chart.name);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <div
                          className="flex items-center gap-1"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 ${chart.includeInsights ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
                            onClick={() =>
                              updateChart(chart.id, {
                                includeInsights: !chart.includeInsights,
                              })
                            }
                            title={
                              chart.includeInsights
                                ? "Ocultar Insights"
                                : "Mostrar Insights"
                            }
                          >
                            {chart.includeInsights ? (
                              <PanelRightClose className="w-4 h-4" />
                            ) : (
                              <PanelRight className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() =>
                              addToGlobalDashboard(activeProjectId!, chart.id)
                            }
                            title="Añadir al Dashboard Global"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => handleNavigateToEdit(chart.id)}
                          >
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => deleteChart(chart.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <TooltipProvider>
                        <div
                          className="flex items-center gap-1.5 flex-wrap"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="secondary"
                                className="h-5 text-[10px] gap-1 px-1.5"
                              >
                                {CHART_TYPE_ICONS[chartType] || (
                                  <BarChart3 className="h-3 w-3" />
                                )}
                                {CHART_TYPE_LABELS[chartType] || chartType}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>Tipo de gráfico</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className="h-5 text-[10px] px-1.5 max-w-[100px] truncate"
                              >
                                X: {xAxis || "Sin asignar"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>Eje X: {xAxis || "Sin asignar"}</p>
                            </TooltipContent>
                          </Tooltip>
                          {yAxis && yAxis.length > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="h-5 text-[10px] px-1.5 max-w-[120px] truncate"
                                >
                                  Y: {yAxis.join(", ")}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Eje(s) Y: {yAxis.join(", ")}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Badge
                            variant="outline"
                            className="h-5 text-[10px] px-1.5 bg-primary/5"
                          >
                            {AGGREGATION_LABELS[aggregation] || aggregation}
                          </Badge>
                          {filterCount > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="secondary"
                                  className="h-5 text-[10px] gap-1 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                >
                                  <Filter className="h-2.5 w-2.5" />
                                  {filterCount}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>{filterCount} filtro(s) activo(s)</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TooltipProvider>
                    </CardHeader>
                    <div className="flex-1 min-h-0 bg-white dark:bg-black/20 p-2 overflow-hidden pointer-events-none select-none">
                      {/* DashboardChartWrapper handles the content and filtering */}
                      <DashboardChartWrapper
                        chart={chart}
                        data={activeProject.sheetData!}
                      />
                    </div>
                  </div>
                );
              })}
            </ResponsiveGridLayout>
          </div>
        )}
      </div>
    </Layout>
  );
}
