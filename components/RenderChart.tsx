import React, { useMemo, useState, useEffect } from 'react';
import * as echarts from 'echarts';
import { ChartConfig, Device, ChartInteractionPayload, DataView, DashboardFilterState, AggregationType, FormatConfig, ThresholdRule, ReferenceLine } from '../types';
import { BaseEChart } from './charts/BaseEChart';
import { SuperTable } from './charts/SuperTable';

interface RenderChartProps {
  chart: ChartConfig;
  devices: Device[];
  dataView?: DataView; // Current chart's specific view (Legacy/Direct support)
  dataViews?: DataView[]; // [V2-5] All available views (Needed for container to resolve child views)
  filters?: DashboardFilterState; 
  theme?: 'light' | 'dark';
  onInteract?: (payload: ChartInteractionPayload) => void; 
  allCharts?: ChartConfig[]; // [V2-5] Needed for container to find children
}

// ... (Keep existing helpers: DEFAULT_COLORS, STATUS_COLOR_MAP, evaluateExpression, aggregateValues, calculateMovingAverage, formatValue, getThresholdColor, buildMarkLines) ...
const DEFAULT_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
];

// Semantic Color Map for Status consistency
const STATUS_COLOR_MAP: Record<string, string> = {
  'online': '#10b981', // Emerald
  'healthy': '#10b981',
  'normal': '#10b981',
  'warning': '#f59e0b', // Amber
  'risk': '#f59e0b',
  'critical': '#ef4444', // Rose
  'error': '#ef4444',
  'offline': '#94a3b8', // Slate
  'inactive': '#cbd5e1'
};

// Helper to safely evaluate simple expressions
const evaluateExpression = (expression: string, context: Record<string, number>) => {
    try {
        const keys = Object.keys(context);
        const values = Object.values(context);
        const func = new Function(...keys, `return ${expression};`);
        const result = func(...values);
        return isNaN(result) ? 0 : result;
    } catch (e) {
        return 0;
    }
};

// Helper: Aggregation Logic
const aggregateValues = (values: number[], type: AggregationType = 'AVG'): number => {
    if (values.length === 0) return 0;
    
    switch (type) {
        case 'SUM':
            return values.reduce((a, b) => a + b, 0);
        case 'MAX':
            return Math.max(...values);
        case 'MIN':
            return Math.min(...values);
        case 'COUNT':
            return values.length;
        case 'LAST':
            return values[values.length - 1];
        case 'AVG':
        default:
            return values.reduce((a, b) => a + b, 0) / values.length;
    }
};

// [V2-8] Helper: Simple Moving Average
const calculateMovingAverage = (data: number[], windowSize: number): (number | null)[] => {
    if (windowSize <= 1) return data;
    const result: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < windowSize - 1) {
            result.push(null); // Not enough data for full window
            continue;
        }
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
            sum += data[i - j];
        }
        result.push(sum / windowSize);
    }
    return result;
};

// [V2-1] Helper: Value Formatter
const formatValue = (value: number, config?: FormatConfig): string => {
    if (value === undefined || value === null || isNaN(value)) return '-';
    if (!config) return value.toFixed(1); // Default

    const precision = config.precision ?? 1;
    let formatted = value.toFixed(precision);
    
    if (config.type === 'percent') {
        formatted += '%';
    }
    
    if (config.unitSuffix) {
        formatted += ` ${config.unitSuffix}`;
    }
    
    return formatted;
};

// [V2-2] Helper: Threshold Color
const getThresholdColor = (value: number, rules?: ThresholdRule[], defaultColor?: string): string => {
    if (!rules || rules.length === 0) return defaultColor || '#6366f1';
    
    for (const rule of rules) {
        let match = false;
        switch(rule.operator) {
            case '>': match = value > rule.value; break;
            case '>=': match = value >= rule.value; break;
            case '<': match = value < rule.value; break;
            case '<=': match = value <= rule.value; break;
            case '==': match = value === rule.value; break;
            case '!=': match = value !== rule.value; break;
        }
        if (match) return rule.color;
    }
    return defaultColor || '#6366f1';
};

// [V2-3] Helper: Build MarkLines
const buildMarkLines = (refLines?: ReferenceLine[], isDark?: boolean) => {
    if (!refLines || refLines.length === 0) return undefined;
    
    const data = refLines.map(line => {
        let definition: any = { 
            name: line.name || '',
            lineStyle: { color: line.color || '#ef4444', type: 'dashed', width: 2 },
            label: { position: 'end', formatter: '{b}: {c}', color: line.color || (isDark ? '#fff' : '#64748b') }
        };

        if (line.type === 'constant' && line.value !== undefined) {
            definition.yAxis = line.value;
        } else {
            definition.type = line.type; // 'average', 'min', 'max'
        }
        return definition;
    });

    return { data, symbol: ['none', 'none'] };
};

export const RenderChart: React.FC<RenderChartProps> = ({ chart, devices, dataView, dataViews, filters = {}, theme = 'light', onInteract, allCharts }) => {
  const isDark = theme === 'dark';

  // --- [V2-5] Container Logic ---
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
      if (chart.type !== 'container' || !chart.container?.childChartIds || chart.container.childChartIds.length <= 1) return;
      
      const interval = chart.container.interval || 5; // Default 5s
      if (isPaused) return;

      const timer = setInterval(() => {
          setActiveIndex(prev => (prev + 1) % (chart.container?.childChartIds.length || 1));
      }, interval * 1000);

      return () => clearInterval(timer);
  }, [chart, isPaused]);

  // --- Style Extraction with Defaults ---
  const styles = useMemo(() => {
    return {
      colors: (chart.style?.colors && chart.style.colors.length > 0) ? chart.style.colors : DEFAULT_COLORS,
      showGrid: chart.style?.showGrid !== false,
      showLegend: chart.style?.showLegend !== false,
      legendPosition: chart.style?.legendPosition || 'top',
      xAxisLabel: chart.style?.xAxisLabel !== false,
      yAxisLabel: chart.style?.yAxisLabel !== false,
      thresholds: chart.style?.thresholds || [],
      referenceLines: chart.style?.referenceLines || [],
      fontSize: chart.style?.fontSize || 14,
      textAlign: chart.style?.textAlign || 'left',
      background: chart.style?.background || undefined,
      textColor: chart.style?.textColor || undefined,
      borderRadius: chart.style?.borderRadius ?? 32, // Default 32px
      // V3.0 Table
      enablePagination: chart.style?.enablePagination || false,
      pageSize: chart.style?.pageSize || 10,
      showRowNumber: chart.style?.showRowNumber || false,
      // V3.3 Table Advanced
      columnWidths: chart.style?.columnWidths || {},
      rowActions: chart.style?.rowActions || []
    };
  }, [chart.style]);

  // --- Consistent Color Mapping ---
  const consistentColorMap = useMemo(() => {
      const map = new Map<string, string>();
      const uniqueNames = Array.from(new Set(devices.map(d => d.name))).sort();
      uniqueNames.forEach((name, index) => {
          const color = styles.colors[index % styles.colors.length];
          map.set(name, color);
      });
      return map;
  }, [devices, styles.colors]);

  // --- P0: Apply Global Filters ---
  const filteredDevices = useMemo(() => {
      let result = devices;

      Object.keys(filters).forEach(filterKey => {
          const filterValue = filters[filterKey];
          if (!filterValue || filterValue === 'ALL') return;
          if (filterKey === '_time_range') return;

          result = result.filter(d => {
              // Fuzzy search for TEXT_INPUT logic
              // If device property contains value string (case insensitive)
              // @ts-ignore
              const propVal = d[filterKey];
              if (typeof propVal === 'string' && typeof filterValue === 'string') {
                  if (propVal.toLowerCase().includes(filterValue.toLowerCase())) return true;
              }
              // Also check exact match for IDs/Status etc
              return String(propVal) === String(filterValue) || d.name === filterValue; 
          });
      });

      return result;
  }, [devices, filters]);

  // --- P3: Enrich Devices with Calculated Fields (Using Filtered Devices) ---
  const enrichedDevices = useMemo(() => {
      const timeRange = filters['_time_range'];
      let devicesToProcess = filteredDevices;

      if (timeRange && timeRange !== 'ALL') {
          // Mock Logic: 1h = 5 points, 24h = 20 points
          const limit = timeRange === '1h' ? 5 : timeRange === '6h' ? 10 : 20;
          
          devicesToProcess = filteredDevices.map(d => {
              const slicedMetrics: any = {};
              Object.keys(d.metrics).forEach(mKey => {
                  slicedMetrics[mKey] = d.metrics[mKey].slice(-limit);
              });
              return { ...d, metrics: slicedMetrics };
          });
      }

      if (!dataView?.calculatedFields || dataView.calculatedFields.length === 0) {
          return devicesToProcess;
      }

      return devicesToProcess.map(device => {
          const newMetrics = { ...device.metrics };
          const baseMetricKey = Object.keys(device.metrics)[0];
          if (!baseMetricKey) return device; 
          
          const baseHistory = device.metrics[baseMetricKey];

          dataView.calculatedFields!.forEach(field => {
               const calculatedHistory = baseHistory.map((_, index) => {
                   const context: Record<string, number> = {};
                   Object.keys(device.metrics).forEach(key => {
                       context[key] = device.metrics[key][index]?.value || 0;
                   });

                   const val = evaluateExpression(field.expression, context);
                   
                   return {
                       timestamp: baseHistory[index].timestamp,
                       label: field.name,
                       value: val
                   };
               });
               newMetrics[field.name] = calculatedHistory;
          });

          return { ...device, metrics: newMetrics };
      });
  }, [filteredDevices, dataView, filters]);


  const primaryMetric = chart.metrics[0]; 
  const primaryAgg = chart.aggregations?.[primaryMetric] || 'AVG';

  // --- Common Data Prep (Single Metric Focus) ---
  const singleMetricData = useMemo(() => {
      if (!primaryMetric) return [];
      return enrichedDevices.map(d => ({
          name: d.name,
          value: primaryAgg === 'LAST' 
              ? (d.metrics[primaryMetric]?.[d.metrics[primaryMetric]?.length - 1]?.value || 0)
              : aggregateValues(d.metrics[primaryMetric]?.map(m => m.value) || [], primaryAgg),
          history: d.metrics[primaryMetric] || []
      })).filter(d => d.history.length > 0);
  }, [enrichedDevices, primaryMetric, primaryAgg]);

  // --- [V3.0] Table Data Prep (Multi-Column) ---
  const tableData = useMemo(() => {
      if (chart.type !== 'table') return [];
      
      return enrichedDevices.map(d => {
          const row: any = { ...d }; // Base metadata (id, name, ip, status...)
          
          // Flatten Metrics (Calculate Aggregation for each selected metric)
          chart.metrics.forEach(mKey => {
              const agg = chart.aggregations?.[mKey] || 'LAST';
              const history = d.metrics[mKey];
              if (history && history.length > 0) {
                  if (agg === 'LAST') {
                      row[mKey] = history[history.length - 1].value;
                  } else {
                      row[mKey] = aggregateValues(history.map(x => x.value), agg);
                  }
              } else {
                  row[mKey] = null;
              }
          });
          
          return row;
      });
  }, [enrichedDevices, chart.type, chart.metrics, chart.aggregations]);

  // --- Cross-Device Aggregation (KPI / Gauge) ---
  const aggregatedSingleValue = useMemo(() => 
      singleMetricData.length > 0 
          ? aggregateValues(singleMetricData.map(d => d.value), primaryAgg) 
          : 0
  , [singleMetricData, primaryAgg]);

  // --- Helper to resolve semantic label and unit from DataView Model ---
  const resolveFieldMeta = (key: string) => {
      const fieldDef = dataView?.model?.[key];
      return {
          label: fieldDef?.alias || key,
          unit: fieldDef?.unit || ''
      };
  };

  // --- Multi-Series Data Prep (Line/Area) ---
  const multiSeriesData = useMemo(() => {
      if (chart.type !== 'line' && chart.type !== 'area') return null;

      const seriesList = chart.metrics.map((metricKey, index) => {
          const aggType = chart.aggregations?.[metricKey] || 'AVG';
          const meta = resolveFieldMeta(metricKey);
          
          const validDevices = enrichedDevices.filter(d => d.metrics[metricKey] && d.metrics[metricKey].length > 0);
          if (validDevices.length === 0) return null;

          const maxLength = Math.max(...validDevices.map(d => d.metrics[metricKey].length));

          // Calculate aggregated history across all devices for this metric
          const aggregatedHistory = Array.from({length: maxLength}).map((_, idx) => {
              // Collect values at this timestamp from all devices
              const valuesAtTimestamp = validDevices.map(dev => {
                  const devMetric = dev.metrics[metricKey];
                  const devIdx = devMetric.length - (maxLength - idx);
                  return devIdx >= 0 ? devMetric[devIdx].value : 0;
              });
              
              return aggregateValues(valuesAtTimestamp, aggType);
          });

          // [V2-2 Fix] Calculate color based on the latest value vs Thresholds
          const lastValue = aggregatedHistory.length > 0 ? aggregatedHistory[aggregatedHistory.length - 1] : 0;
          const paletteColor = styles.colors[index % styles.colors.length];
          const finalColor = getThresholdColor(lastValue, styles.thresholds, paletteColor);

          // [New Feature] Detect if this is a Status metric to enable Step Line
          const isStatus = metricKey.toLowerCase().includes('status');

          return {
              key: `${meta.label} (${aggType})`, // Use alias in legend
              originalKey: metricKey,
              unit: meta.unit,
              color: finalColor, // Apply threshold or palette color
              data: aggregatedHistory,
              isStatus // Flag for step rendering
          };
      }).filter(Boolean) as { key: string, originalKey: string, unit: string, color: string, data: number[], isStatus: boolean }[];
      
      let labels: string[] = [];
      if (chart.metrics.length > 0 && enrichedDevices.length > 0) {
           const firstMetric = chart.metrics[0];
           const dev = enrichedDevices.find(d => d.metrics[firstMetric]?.length > 0);
           if (dev) {
               labels = dev.metrics[firstMetric].map(m => m.timestamp);
           }
      }

      return { series: seriesList, labels };
  }, [enrichedDevices, chart.metrics, chart.aggregations, chart.type, isDark, styles.colors, styles.thresholds, dataView?.model]);


  // --- ECharts Options Generation ---
  const eChartOptions = useMemo((): echarts.EChartsOption | null => {
      if (enrichedDevices.length === 0) return null;

      const markLine = buildMarkLines(styles.referenceLines, isDark);

      const commonOptions: echarts.EChartsOption = {
          backgroundColor: 'transparent',
          textStyle: {
              fontFamily: 'Inter, sans-serif'
          },
          grid: {
              top: styles.showLegend ? 40 : 20,
              left: 10,
              right: 10,
              bottom: 10,
              containLabel: true,
              show: styles.showGrid
          },
          tooltip: {
              trigger: 'axis',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              textStyle: {
                  color: isDark ? '#f1f5f9' : '#334155',
                  fontSize: 12,
                  fontWeight: 'bold'
              },
              padding: [8, 12],
              borderRadius: 8,
              // V2-1: Formatter
              formatter: (params: any) => {
                  if (Array.isArray(params)) {
                      let html = `<div style="margin-bottom:4px;opacity:0.5">${params[0].axisValue}</div>`;
                      params.forEach((p: any) => {
                          // Try to find the series unit from multiSeriesData
                          const seriesMeta = multiSeriesData?.series.find(s => s.key === p.seriesName);
                          const unit = seriesMeta?.unit || '';
                          
                          // Use formatter if configured, else default to value + optional view unit
                          const valStr = typeof p.value === 'number' 
                              ? formatValue(p.value, chart.format) 
                              : '-';
                          
                          // Append view unit if not using percentage format which adds %
                          const displayStr = (chart.format?.type === 'percent' || chart.format?.unitSuffix) 
                              ? valStr 
                              : (unit ? `${valStr} ${unit}` : valStr);

                          html += `<div style="display:flex;align-items:center;gap:4px">
                                    <div style="width:8px;height:8px;border-radius:50%;background-color:${p.color}"></div>
                                    <span>${p.seriesName}:</span>
                                    <span style="font-weight:900">${displayStr}</span>
                                   </div>`;
                      });
                      return html;
                  }
                  return '';
              },
              axisPointer: { type: 'cross', label: { backgroundColor: '#6366f1' } }
          },
          legend: {
              show: styles.showLegend,
              top: styles.legendPosition === 'bottom' ? 'bottom' : 'top',
              textStyle: { color: styles.textColor || (isDark ? '#cbd5e1' : '#64748b') },
              icon: 'circle'
          },
          color: styles.colors
      };

      // 1. Line & Area
      if ((chart.type === 'line' || chart.type === 'area') && multiSeriesData) {
          
          // [V2-8] Apply Moving Average if enabled
          const displaySeries = multiSeriesData.series.flatMap(s => {
              
              // [Optimization] If it's a 'status' metric, use Step Line (Square Wave)
              const isStep = s.isStatus;

              const originalSeries: any = {
                  name: s.key,
                  type: 'line' as const,
                  data: s.data,
                  smooth: !isStep, // Disable smooth for status
                  step: isStep ? 'start' : undefined, // Enable step for status
                  symbol: 'none',
                  lineStyle: { width: 3 },
                  itemStyle: { color: s.color },
                  markLine: markLine, 
                  areaStyle: chart.type === 'area' || isStep ? { // Enable area for Step too (looks like digital signal)
                      opacity: 0.2,
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                          { offset: 0, color: s.color },
                          { offset: 1, color: 'rgba(255,255,255,0)' }
                      ])
                  } : undefined
              };

              // If Trend Analysis is enabled AND it's NOT a status metric, add a smoothed line
              if (chart.analysis?.enableMovingAverage && chart.analysis.movingAverageWindow && !isStep) {
                  const maData = calculateMovingAverage(s.data, chart.analysis.movingAverageWindow);
                  const trendSeries = {
                      name: `${s.key} (MA-${chart.analysis.movingAverageWindow})`,
                      type: 'line' as const,
                      data: maData,
                      smooth: true,
                      symbol: 'none',
                      lineStyle: { 
                          width: 2, 
                          type: 'dashed' as const, 
                          color: chart.analysis.trendLineColor || '#ffffff' 
                      },
                      itemStyle: { color: chart.analysis.trendLineColor || '#ffffff' },
                      z: 10 // Render on top
                  };
                  return [originalSeries, trendSeries];
              }

              return [originalSeries];
          });

          return {
              ...commonOptions,
              tooltip: { ...commonOptions.tooltip, trigger: 'axis' },
              xAxis: {
                  type: 'category' as const,
                  data: multiSeriesData.labels,
                  show: styles.xAxisLabel,
                  axisLine: { show: false },
                  axisTick: { show: false },
                  axisLabel: { color: styles.textColor || (isDark ? '#64748b' : '#94a3b8'), fontSize: 10 }
              },
              yAxis: {
                  type: 'value' as const,
                  show: styles.yAxisLabel,
                  splitLine: { show: styles.showGrid, lineStyle: { type: 'dashed', color: isDark ? '#334155' : '#e2e8f0' } },
                  axisLabel: { 
                      color: styles.textColor || (isDark ? '#64748b' : '#94a3b8'), 
                      fontSize: 10,
                      formatter: (val: number) => formatValue(val, { ...chart.format, type: 'number', precision: 0 }) 
                  }
              },
              series: displaySeries
          };
      }

      // 2. Bar Chart
      if (chart.type === 'bar') {
          return {
              ...commonOptions,
              tooltip: { 
                  trigger: 'item',
                  // V2-1 Formatter
                  formatter: (p: any) => {
                      const meta = resolveFieldMeta(primaryMetric);
                      return `
                      <div style="font-weight:bold">${p.name}</div>
                      <div>${p.seriesName}: ${formatValue(p.value, chart.format)} ${meta.unit}</div>
                  `}
              },
              xAxis: {
                  type: 'category' as const,
                  data: singleMetricData.map(d => d.name),
                  show: styles.xAxisLabel,
                  axisLine: { show: false },
                  axisTick: { show: false },
                  axisLabel: { color: styles.textColor || (isDark ? '#64748b' : '#94a3b8'), fontSize: 10, interval: 0, width: 60, overflow: 'truncate' }
              },
              yAxis: {
                  type: 'value' as const,
                  show: styles.yAxisLabel,
                  splitLine: { show: styles.showGrid, lineStyle: { type: 'dashed', color: isDark ? '#334155' : '#e2e8f0' } },
                  axisLabel: { 
                      color: styles.textColor || (isDark ? '#64748b' : '#94a3b8'), 
                      fontSize: 10,
                      formatter: (val: number) => formatValue(val, { ...chart.format, type: 'number', precision: 0 }) 
                  }
              },
              series: [{
                  name: `${resolveFieldMeta(primaryMetric).label} (${primaryAgg})`,
                  type: 'bar' as const,
                  markLine: markLine, // [V2-3] Reference Lines
                  data: singleMetricData.map((d, i) => {
                      const semanticColor = STATUS_COLOR_MAP[d.name.toLowerCase()];
                      // V2-2: Check Thresholds First, then Semantic, then Palette
                      const thresholdColor = getThresholdColor(d.value, styles.thresholds);
                      
                      const baseColor = thresholdColor !== '#6366f1' 
                          ? thresholdColor 
                          : (semanticColor || consistentColorMap.get(d.name) || styles.colors[i % styles.colors.length]);
                      
                      return {
                          value: d.value,
                          itemStyle: {
                              color: semanticColor || (thresholdColor !== '#6366f1') ? baseColor : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                  { offset: 0, color: baseColor },
                                  { offset: 1, color: baseColor + '80' }
                              ]),
                              borderRadius: [4, 4, 0, 0] as [number, number, number, number]
                          }
                      };
                  }),
                  barMaxWidth: 40
              }]
          };
      }

      // 3. Pie Chart
      if (chart.type === 'pie') {
          return {
              ...commonOptions,
              tooltip: { 
                  trigger: 'item',
                  formatter: (p: any) => `
                      <div style="font-weight:bold">${p.name}</div>
                      <div>${p.value} (${p.percent}%)</div>
                  `
              },
              legend: { ...commonOptions.legend, icon: 'circle' },
              series: [{
                  name: `${resolveFieldMeta(primaryMetric).label} (${primaryAgg})`,
                  type: 'pie' as const,
                  radius: ['40%', '70%'],
                  center: ['50%', '55%'],
                  itemStyle: {
                      borderRadius: 5,
                      borderColor: styles.background || (isDark ? '#1e293b' : '#fff'),
                      borderWidth: 2
                  },
                  label: { show: false },
                  data: singleMetricData.slice(0, 8).map((d, i) => {
                      const semanticColor = STATUS_COLOR_MAP[d.name.toLowerCase()];
                      const finalColor = semanticColor || consistentColorMap.get(d.name) || styles.colors[i % styles.colors.length];
                      return { 
                          value: d.value, 
                          name: d.name,
                          itemStyle: { color: finalColor }
                      };
                  })
              }]
          };
      }

      // 4. Radar Chart
      if (chart.type === 'radar') {
          return {
              ...commonOptions,
              radar: {
                  indicator: singleMetricData.slice(0, 6).map(d => ({ name: d.name, max: Math.max(...singleMetricData.map(x=>x.value)) * 1.2 })),
                  shape: 'circle',
                  splitArea: { show: false },
                  axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } }
              },
              series: [{
                  name: 'Metrics',
                  type: 'radar' as const,
                  data: [{
                      value: singleMetricData.slice(0, 6).map(d => d.value),
                      name: `${resolveFieldMeta(primaryMetric).label} (${primaryAgg})`,
                      areaStyle: { opacity: 0.2, color: styles.colors[0] },
                      itemStyle: { color: styles.colors[0] }
                  }]
              }]
          };
      }

      // 5. Gauge Chart
      if (chart.type === 'gauge') {
          // V2-2: Gauge color based on threshold of aggregated value
          const gaugeColor = getThresholdColor(aggregatedSingleValue, styles.thresholds, styles.colors[0]);
          const meta = resolveFieldMeta(primaryMetric);
          
          return {
              ...commonOptions,
              series: [{
                  type: 'gauge' as const,
                  startAngle: 180,
                  endAngle: 0,
                  min: 0,
                  max: 100,
                  splitNumber: 5,
                  itemStyle: { color: gaugeColor },
                  progress: { show: true, width: 12 },
                  pointer: { show: false },
                  axisLine: { lineStyle: { width: 12, color: [[1, isDark ? '#334155' : '#e2e8f0']] } },
                  axisTick: { show: false },
                  splitLine: { show: false },
                  axisLabel: { show: false },
                  detail: {
                      valueAnimation: true,
                      offsetCenter: [0, '-10%'],
                      fontSize: 30,
                      fontWeight: 'bolder',
                      formatter: (val: number) => `${formatValue(val, { ...chart.format, precision: 0 })}${meta.unit}`,
                      color: styles.textColor || (isDark ? '#fff' : '#334155')
                  },
                  data: [{ value: aggregatedSingleValue }]
              }]
          };
      }

      return null;
  }, [chart.type, chart.format, chart.analysis, multiSeriesData, singleMetricData, primaryMetric, primaryAgg, aggregatedSingleValue, isDark, styles, consistentColorMap, dataView?.model]);


  // Dynamic Styles for Container
  const containerStyle: React.CSSProperties = {
      borderRadius: `${styles.borderRadius}px`
  };
  if (styles.background) containerStyle.backgroundColor = styles.background;
  if (styles.textColor) containerStyle.color = styles.textColor;

  const bgClass = styles.background 
      ? `border-transparent shadow-sm` // Custom background implies no border usually, or specific border logic
      : (isDark ? 'bg-slate-800/50 backdrop-blur-md border-white/10' : 'bg-white border-slate-100');

  const textPrimary = styles.textColor ? '' : (isDark ? 'text-white' : 'text-slate-800');
  const textSecondary = styles.textColor ? 'opacity-80' : (isDark ? 'text-slate-400' : 'text-slate-400');
  const textMuted = styles.textColor ? 'opacity-60' : (isDark ? 'text-slate-500' : 'text-slate-300');

  // --- Interaction Handler ---
  const handleEvents = useMemo(() => {
      if (!onInteract) return undefined;
      return {
          click: (params: any) => {
              const dimKey = chart.dimensions && chart.dimensions.length > 0 ? chart.dimensions[0] : 'name';
              
              onInteract({ 
                  name: params.name, 
                  value: Array.isArray(params.value) ? params.value[params.value.length-1] : params.value, 
                  series: params.seriesName,
                  dimensionKey: dimKey
              });
          }
      };
  }, [onInteract, chart.dimensions]);

  // [V2-6] Rich Media Handling (Text / Image) - Return early, no data processing needed
  if (chart.type === 'text') {
      return (
          <div className={`h-full w-full p-4 flex flex-col justify-center overflow-hidden`} style={{ backgroundColor: styles.background, color: styles.textColor, borderRadius: `${styles.borderRadius}px` }}>
              <div 
                  style={{ 
                      fontSize: `${styles.fontSize}px`, 
                      textAlign: styles.textAlign, 
                      color: styles.textColor || (isDark ? '#fff' : '#1e293b'),
                      whiteSpace: 'pre-wrap',
                      fontWeight: 'bold'
                  }}
              >
                  {chart.content || '请输入文本内容'}
              </div>
          </div>
      );
  }

  if (chart.type === 'image') {
      return (
          <div className={`h-full w-full p-0 overflow-hidden flex items-center justify-center`} style={{ backgroundColor: styles.background, borderRadius: `${styles.borderRadius}px` }}>
              {chart.content ? (
                  <img src={chart.content} alt={chart.name} className="max-w-full max-h-full object-contain" />
              ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-xs font-bold uppercase">No Image URL</span>
                  </div>
              )}
          </div>
      );
  }

  // [V2-5] Container Rendering
  if (chart.type === 'container') {
      const childrenIds = chart.container?.childChartIds || [];
      const activeChildId = childrenIds[activeIndex];
      const activeChildChart = allCharts?.find(c => c.id === activeChildId);
      
      // Look up specific DataView for the child chart if possible
      const childDataView = activeChildChart && dataViews 
          ? dataViews.find(v => v.id === activeChildChart.viewId) 
          : dataView; // Fallback to passed dataView

      return (
          <div 
            className={`h-full w-full relative flex flex-col group/container overflow-hidden ${bgClass}`} 
            style={containerStyle}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
              <div className="flex-1 min-h-0 relative">
                  {activeChildChart ? (
                      <div key={activeChildChart.id} className="absolute inset-0 animate-in fade-in zoom-in-95 duration-500">
                          <RenderChart 
                              chart={activeChildChart} 
                              devices={devices} 
                              dataView={childDataView} 
                              dataViews={dataViews}
                              filters={filters}
                              theme={theme}
                              onInteract={onInteract}
                              allCharts={allCharts}
                          />
                      </div>
                  ) : (
                      <div className={`flex items-center justify-center h-full text-slate-300 border-2 border-dashed border-slate-100`} style={{ borderRadius: `${styles.borderRadius}px` }}>
                          <p className="text-xs font-bold uppercase">Empty Slot / Chart Not Found</p>
                      </div>
                  )}
              </div>

              {childrenIds.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-1.5 bg-black/20 backdrop-blur-sm rounded-full opacity-0 group-hover/container:opacity-100 transition-opacity duration-300 z-20">
                      {childrenIds.map((_, idx) => (
                          <button
                              key={idx}
                              onClick={() => setActiveIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-all ${idx === activeIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/80'}`}
                          />
                      ))}
                  </div>
              )}
          </div>
      );
  }

  // --- EMPTY STATE IF NO DATA ---
  if (enrichedDevices.length === 0) {
      return (
          <div className={`${bgClass} p-5 border shadow-sm h-full flex flex-col items-center justify-center`} style={containerStyle}>
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                 <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              </div>
              <p className={`text-xs font-bold ${textSecondary}`}>No Data Found</p>
              <p className={`text-[10px] ${textMuted}`}>Adjust filters to view data</p>
          </div>
      );
  }

  // V2-2: KPI Dynamic Styling
  const kpiColor = getThresholdColor(aggregatedSingleValue, styles.thresholds, styles.colors[0]);
  const isKpiThresholdActive = kpiColor !== styles.colors[0];
  const primaryMeta = resolveFieldMeta(primaryMetric);

  return (
      <div className={`${bgClass} p-5 border shadow-sm h-full flex flex-col relative group overflow-hidden transition-colors duration-300`} style={containerStyle}>
          {/* Header */}
          <div className="flex justify-between items-start mb-2 z-10 relative flex-shrink-0 h-6">
              <div className="flex-1 min-w-0">
                  <h4 className={`font-bold ${textPrimary} text-sm truncate pr-2`} style={{ color: styles.textColor }}>{chart.name}</h4>
              </div>
              <div className="flex items-center gap-1">
                  {chart.type !== 'kpi' && chart.type !== 'table' && primaryAgg !== 'AVG' && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded text-white font-bold uppercase ${primaryAgg === 'MAX' ? 'bg-rose-500' : primaryAgg === 'MIN' ? 'bg-emerald-500' : 'bg-indigo-500'}`}>{primaryAgg}</span>
                  )}
                  <span className={`text-[9px] px-2 py-0.5 rounded-lg uppercase font-black shrink-0 ${isDark ? 'bg-white/10 text-indigo-300 border-white/5 border' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>{chart.type}</span>
              </div>
          </div>

          {/* Chart Content Container */}
          <div className="flex-1 relative z-10 w-full min-h-0">
              
              {/* Render EChart if option generated */}
              {eChartOptions ? (
                  <BaseEChart 
                      options={eChartOptions} 
                      theme={theme}
                      onEvents={handleEvents}
                  />
              ) : (
                  // Fallback for HTML-based charts (KPI, Table)
                  <>
                      {/* 6. KPI Card */}
                      {chart.type === 'kpi' && (
                          <div className={`h-full w-full flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-all rounded-3xl ${isKpiThresholdActive ? '' : ''}`}
                               style={isKpiThresholdActive ? { backgroundColor: kpiColor + '20' } : {}}
                               onClick={() => onInteract?.({ name: primaryMetric, value: aggregatedSingleValue, dimensionKey: 'metric' })}>
                              <div className="text-4xl lg:text-5xl font-black tracking-tighter" style={{ color: kpiColor }}>
                                  {formatValue(aggregatedSingleValue, chart.format)} <span className="text-2xl opacity-50 font-medium">{primaryMeta.unit}</span>
                              </div>
                              <div className={`mt-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} style={{ color: isDark ? 'white' : kpiColor }}>
                                  {primaryAgg} {primaryMeta.label}
                              </div>
                          </div>
                      )}

                      {/* 8. Table (Replaced with SuperTable [V3.0]) */}
                      {chart.type === 'table' && (
                          <SuperTable 
                              data={tableData}
                              columns={[...chart.dimensions, ...chart.metrics]} // Show dimensions first, then metrics
                              // Rename headers using alias
                              columnHeaders={
                                  [...chart.dimensions, ...chart.metrics].reduce((acc, key) => {
                                      acc[key] = resolveFieldMeta(key).label;
                                      return acc;
                                  }, {} as Record<string, string>)
                              }
                              style={styles}
                              format={chart.format}
                              thresholds={styles.thresholds}
                              theme={theme}
                              onRowClick={(row) => onInteract?.({ name: 'row_click', value: 0, series: 'table', row })}
                              onPageSizeChange={(size) => onInteract?.({ name: 'resize', value: size, dimensionKey: 'pageSize', series: chart.id })} // Bubble up resize event
                              onActionClick={(actionId, row) => onInteract?.({ name: 'action_click', value: 0, series: actionId, row })} // Pass action click
                              onColumnResize={(col, width) => console.log('Resized:', col, width)} // Could save to chart config
                          />
                      )}
                  </>
              )}
          </div>
          
          {!styles.background && <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl -z-0 pointer-events-none`} style={{ backgroundColor: styles.colors[0] + '15' }}></div>}
      </div>
  );
};