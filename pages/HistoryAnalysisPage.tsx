
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Device, ChartConfig, DeviceCategory, DeviceMetric, MetricConfig } from '../types';
import { RenderChart } from '../components/RenderChart';
import { resolveMetricMetadata } from '../constants';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';

interface HistoryAnalysisPageProps {
  devices: Device[];
  categories?: DeviceCategory[]; 
  metricConfig: MetricConfig; 
}

const TIME_RANGES = [
  { label: '1H', value: '1h', points: 10 },
  { label: '24H', value: '24h', points: 20 },
  { label: '7D', value: '7d', points: 20 },
  { label: '30D', value: '30d', points: 20 },
];

export const HistoryAnalysisPage: React.FC<HistoryAnalysisPageProps> = ({ devices, categories = [], metricConfig }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices.length > 0 ? devices[0].id : '');
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceCategoryFilter, setDeviceCategoryFilter] = useState('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [timeRange, setTimeRange] = useState('24h');
  const [viewMode, setViewMode] = useState<'grid' | 'combined'>('grid');
  const [expandedChartId, setExpandedChartId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDeviceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(deviceSearch.toLowerCase()) || 
                          d.id.toLowerCase().includes(deviceSearch.toLowerCase());
      const matchCat = deviceCategoryFilter === 'ALL' || d.categoryId === deviceCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [devices, deviceSearch, deviceCategoryFilter]);

  const selectedDevice = useMemo(() => 
    devices.find(d => d.id === selectedDeviceId), 
  [devices, selectedDeviceId]);

  const processedDevice = useMemo(() => {
      if (!selectedDevice) return null;
      
      const rangeConfig = TIME_RANGES.find(r => r.value === timeRange) || TIME_RANGES[1];
      const sliceCount = rangeConfig.points;

      const newMetrics: Record<string, DeviceMetric[]> = {};
      
      Object.keys(selectedDevice.metrics).forEach(key => {
          const history = selectedDevice.metrics[key];
          newMetrics[key] = history.slice(-sliceCount); 
      });

      return { ...selectedDevice, metrics: newMetrics };
  }, [selectedDevice, timeRange]);

  const metricCharts = useMemo(() => {
      if (!processedDevice || !processedDevice.metrics) return [];

      const keys = Object.keys(processedDevice.metrics);
      
      return keys.map((key) => {
          const meta = resolveMetricMetadata(metricConfig, key, processedDevice.type);
          
          const config: ChartConfig = {
              id: `hist-chart-${processedDevice.id}-${key}`,
              name: `${meta.label} (${meta.unit})`,
              viewId: 'generated-view',
              type: 'area',
              metrics: [key],
              dimensions: ['timestamp'],
              style: {
                  colSpan: 1, 
                  heightClass: 'h-80',
                  colors: [meta.color],
                  showGrid: true,
                  showLegend: false,
                  xAxisLabel: true,
                  yAxisLabel: true
              }
          };
          return config;
      });
  }, [processedDevice, metricConfig]);

  const combinedChartConfig = useMemo((): ChartConfig | null => {
      if (!processedDevice || !processedDevice.metrics) return null;
      const keys = Object.keys(processedDevice.metrics);
      if (keys.length === 0) return null;

      const combinedColors = keys.map(k => resolveMetricMetadata(metricConfig, k, processedDevice.type).color);

      return {
          id: `hist-combined-${processedDevice.id}`,
          name: '多指标趋势对比分析',
          viewId: 'generated-view',
          type: 'line',
          metrics: keys,
          dimensions: ['timestamp'],
          style: {
              colSpan: 3,
              heightClass: 'h-[500px]',
              colors: combinedColors,
              showGrid: true,
              showLegend: true,
              legendPosition: 'top',
              xAxisLabel: true,
              yAxisLabel: true
          }
      };
  }, [processedDevice, metricConfig]);

  return (
    <div className="space-y-6">
        <Card className="flex flex-col xl:flex-row justify-between xl:items-center gap-6 p-6">
            <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">历史数据分析</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Historical Metrics Trend</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 flex-1 w-full xl:justify-end items-center">
                
                {/* Device Selector */}
                <div className="relative z-20 w-full md:w-80" ref={dropdownRef}>
                    <div 
                        onClick={() => setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-indigo-200 transition-all flex items-center justify-between group"
                    >
                        <div className="truncate">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Selected Device</span>
                             <span className="text-sm font-bold text-slate-700">{selectedDevice ? selectedDevice.name : 'Select a device'}</span>
                        </div>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isDeviceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                    </div>

                    {isDeviceDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 p-3">
                            <div className="space-y-2 mb-2 pb-2 border-b border-slate-50">
                                <Input 
                                    placeholder="Search..."
                                    value={deviceSearch}
                                    onChange={(e) => setDeviceSearch(e.target.value)}
                                    className="py-2 text-xs"
                                    autoFocus
                                />
                                {categories && categories.length > 0 && (
                                    <Select 
                                        value={deviceCategoryFilter}
                                        onChange={(e) => setDeviceCategoryFilter(e.target.value)}
                                        className="py-2 text-[10px]"
                                        options={[
                                            { label: 'All Categories', value: 'ALL' },
                                            ...categories.map(c => ({ label: c.name, value: c.id }))
                                        ]}
                                    />
                                )}
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                                {filteredDevices.map(d => (
                                    <div 
                                        key={d.id}
                                        onClick={() => {
                                            setSelectedDeviceId(d.id);
                                            setIsDeviceDropdownOpen(false);
                                        }}
                                        className={`px-3 py-2 rounded-xl cursor-pointer flex items-center justify-between group ${selectedDeviceId === d.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <div>
                                            <div className="text-xs font-bold">{d.name}</div>
                                            <div className="text-[9px] font-mono opacity-60">{d.id}</div>
                                        </div>
                                        {selectedDeviceId === d.id && <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                ))}
                                {filteredDevices.length === 0 && <div className="text-center py-4 text-[10px] text-slate-400">No devices found</div>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                     {TIME_RANGES.map(range => (
                         <Button
                            key={range.value}
                            variant={timeRange === range.value ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeRange(range.value)}
                            className={timeRange === range.value ? 'shadow-sm' : ''}
                         >
                             {range.label}
                         </Button>
                     ))}
                </div>

                <div className="flex gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                     <Button
                        variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                     />
                     <Button
                        variant={viewMode === 'combined' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('combined')}
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 00-2 2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2 2h-2a2 2 0 00-2 2" /></svg>}
                     />
                </div>
            </div>
        </Card>

        {processedDevice ? (
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-2 text-slate-400">
                     <span className="text-xs">Analysis of</span>
                     <span className="text-xs font-bold text-slate-700">{processedDevice.name}</span>
                     <span className="text-xs">over the last</span>
                     <span className="text-xs font-bold text-indigo-600">{TIME_RANGES.find(t => t.value === timeRange)?.label}</span>
                </div>

                {viewMode === 'combined' && combinedChartConfig && (
                    <Card className="p-2 animate-in fade-in zoom-in-95">
                        <RenderChart 
                             chart={combinedChartConfig} 
                             devices={[processedDevice]} 
                        />
                    </Card>
                )}

                {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {metricCharts.length > 0 ? (
                            metricCharts.map(chart => (
                                <Card key={chart.id} className="h-80 relative group p-0 overflow-hidden">
                                    <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setExpandedChartId(chart.id)}
                                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
                                        />
                                    </div>
                                    <div className="h-full w-full p-4">
                                        <RenderChart 
                                            chart={chart} 
                                            devices={[processedDevice]} 
                                        />
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                                <p className="text-slate-400 font-bold text-sm">No historical metrics available for this device.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        ) : (
            <div className="py-32 text-center">
                <p className="text-slate-400 font-bold">Please select a device to analyze.</p>
            </div>
        )}

        {expandedChartId && processedDevice && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
                 <div className="bg-white rounded-[32px] w-full max-w-6xl h-[80vh] flex flex-col shadow-2xl overflow-hidden relative animate-in zoom-in-95">
                     <button 
                        onClick={() => setExpandedChartId(null)}
                        className="absolute top-6 right-6 p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-colors z-50"
                     >
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                     <div className="flex-1 p-8">
                         {(() => {
                             const chart = metricCharts.find(c => c.id === expandedChartId);
                             if (!chart) return null;
                             return (
                                 <RenderChart 
                                    chart={{
                                        ...chart, 
                                        style: { ...chart.style, colSpan: 3, heightClass: 'h-full' }
                                    }} 
                                    devices={[processedDevice]} 
                                 />
                             );
                         })()}
                     </div>
                 </div>
            </div>
        )}
    </div>
  );
};
