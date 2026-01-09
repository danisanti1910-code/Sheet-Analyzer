import { useMemo } from 'react';
import { ChartBuilder } from '@/components/chart-builder';
import { InsightsPanel } from '@/components/insights-panel';
import { SavedChart } from '@/lib/sheet-context';
import { SheetData } from '@/lib/sheet-utils';

interface ChartPreviewProps {
  chart: SavedChart;
  data: SheetData;
}

export function ChartPreview({ chart, data }: ChartPreviewProps) {
  const selectedColumns = useMemo(() => {
    if (chart.chartConfig.selectedColumns?.length) return chart.chartConfig.selectedColumns;
    const fallback: string[] = [];
    if (chart.chartConfig.xAxis) fallback.push(chart.chartConfig.xAxis);
    if (Array.isArray(chart.chartConfig.yAxis)) fallback.push(...chart.chartConfig.yAxis);
    return fallback;
  }, [chart.chartConfig.selectedColumns, chart.chartConfig.xAxis, chart.chartConfig.yAxis]);

  const filteredData = useMemo(() => {
    if (!chart.chartConfig.filteredValues) return data;

    let rows = data.rows;
    Object.entries(chart.chartConfig.filteredValues).forEach(([col, values]) => {
      if (!values || values.length === 0) return;

      if (col.endsWith('_min')) {
        const actualCol = col.replace('_min', '');
        const type = data.columnProfiles[actualCol]?.type;
        if (type === 'numeric') {
          rows = rows.filter(r => Number(r[actualCol]) >= Number(values[0]));
        } else if (type === 'datetime') {
          rows = rows.filter(r => new Date(r[actualCol]) >= new Date(values[0]));
        }
      } else if (col.endsWith('_max')) {
        const actualCol = col.replace('_max', '');
        const type = data.columnProfiles[actualCol]?.type;
        if (type === 'numeric') {
          rows = rows.filter(r => Number(r[actualCol]) <= Number(values[0]));
        } else if (type === 'datetime') {
          rows = rows.filter(r => new Date(r[actualCol]) <= new Date(values[0]));
        }
      } else {
        rows = rows.filter(r => values.includes(String(r[col])));
      }
    });

    const profiles: SheetData['columnProfiles'] = {};
    data.columns.forEach(col => {
      const values = rows.map(r => r[col]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const missingCount = values.length - nonNullValues.length;
      const type = data.columnProfiles[col]?.type || 'unknown';
      const uniqueValues = new Set(nonNullValues);

      let stats: Record<string, number | any[]> = {};
      if (type === 'numeric' && nonNullValues.length > 0) {
        const nums = nonNullValues.map(v => Number(v)).sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        const mean = sum / nums.length;
        const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
        stats = {
          min: nums[0],
          max: nums[nums.length - 1],
          mean,
          median: nums[Math.floor(nums.length / 2)],
          std: Math.sqrt(variance)
        };
      } else if ((type === 'categorical' || type === 'boolean') && nonNullValues.length > 0) {
        const counts: Record<string, number> = {};
        nonNullValues.forEach(v => {
          const key = String(v);
          counts[key] = (counts[key] || 0) + 1;
        });
        stats = {
          topCategories: Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([value, count]) => ({ value, count }))
        };
      }

      profiles[col] = {
        ...data.columnProfiles[col],
        missingCount,
        missingPercentage: rows.length ? (missingCount / rows.length) * 100 : 0,
        uniqueCount: uniqueValues.size,
        ...stats
      };
    });

    return { ...data, rows, rowCount: rows.length, columnProfiles: profiles };
  }, [chart.chartConfig.filteredValues, data]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-2 overflow-hidden pointer-events-auto">
      <div className={`flex-1 min-h-0 min-w-0 ${chart.includeInsights ? 'md:w-2/3' : 'w-full'}`}>
        <ChartBuilder 
          data={filteredData} 
          selectedColumns={selectedColumns}
          hideControls
          initialConfig={chart.chartConfig}
        />
      </div>
      {chart.includeInsights && (
        <div className="md:w-1/3 min-w-0 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900/50 p-2 rounded border flex flex-col">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1 shrink-0">Insights</h4>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <InsightsPanel 
              sheetData={filteredData} 
              sourceData={data}
              selectedColumns={chart.chartConfig.selectedColumns} 
              filteredValues={chart.chartConfig.filteredValues || {}}
              onFilterChange={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
