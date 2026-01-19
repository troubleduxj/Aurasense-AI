
import React, { useState, useEffect } from 'react';
import { Dashboard, ChartConfig, Device, ChartInteractionPayload, DataView, DashboardFilterState, GridLayoutItem } from '../types';
import { RenderChart } from '../components/RenderChart';
import { ControllerBar } from '../components/ControllerBar';
import { Responsive } from 'react-grid-layout';
import * as RGL from 'react-grid-layout';
import { Button } from '../components/ui/Button';

// Safe initialization of ResponsiveGridLayout
const WidthProvider = (RGL as any).WidthProvider;
const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardMonitorPageProps {
  dashboards: Dashboard[];
  charts: ChartConfig[];
  devices: Device[];
  dataViews?: DataView[]; 
  onLaunchFullScreen: (dashboards: Dashboard[], interval?: number) => void;
  onChartClick?: (payload: ChartInteractionPayload) => void; 
  singleView?: boolean; 
  initialFilters?: DashboardFilterState; // [V3.2] Allow external filters (e.g. from drill-down)
}

const CYCLE_OPTIONS = [
    { label: '15 秒', value: 15000 },
    { label: '30 秒', value: 30000 },
    { label: '1 分钟', value: 60000 },
    { label: '5 分钟', value: 300000 },
];

export const DashboardMonitorPage: React.FC<DashboardMonitorPageProps> = ({ 
    dashboards, 
    charts, 
    devices, 
    dataViews, 
    onLaunchFullScreen, 
    onChartClick,
    singleView = false,
    initialFilters 
}) => {
  const [dashboardFilters, setDashboardFilters] = useState<Record<string, DashboardFilterState>>({});
  
  // Auto Cycle State
  const [isAutoCycleModalOpen, setIsAutoCycleModalOpen] = useState(false);
  const [cycleInterval, setCycleInterval] = useState(15000);
  const [selectedDashboardIds, setSelectedDashboardIds] = useState<string[]>([]);

  // Collapse State
  const [expandedDashboardIds, setExpandedDashboardIds] = useState<string[]>([]);

  // Runtime Layout Overrides
  const [runtimeLayouts, setRuntimeLayouts] = useState<Record<string, GridLayoutItem[]>>({});

  // Initialize selected dashboards for cycle
  useEffect(() => {
      if (!singleView && dashboards.length > 0 && selectedDashboardIds.length === 0) {
          setSelectedDashboardIds(dashboards.map(d => d.id));
      }
  }, [dashboards, singleView]);

  // [V3.2] Apply initial filters if provided
  useEffect(() => {
      if (initialFilters && dashboards.length === 1) {
          const dashId = dashboards[0].id;
          setDashboardFilters(prev => ({
              ...prev,
              [dashId]: { ...(prev[dashId] || {}), ...initialFilters }
          }));
      }
  }, [initialFilters, dashboards]);

  const handleFilterChange = (dashboardId: string, key: string, value: any) => {
      setDashboardFilters(prev => ({
          ...prev,
          [dashboardId]: { ...(prev[dashboardId] || {}), [key]: value }
      }));
  };

  const handleChartInteract = (dashboardId: string, payload: ChartInteractionPayload) => {
      // Case 1: Resize Event
      if (payload.name === 'resize' && payload.dimensionKey === 'pageSize' && payload.series) {
          const chartId = payload.series; 
          const pageSize = payload.value;
          
          const ROW_HEIGHT_PX = 60;
          const MARGIN_PX = 16;
          const OVERHEAD_PX = 140; 
          const SINGLE_ROW_PX = 45; 
          
          const requiredHeightPx = OVERHEAD_PX + (pageSize * SINGLE_ROW_PX);
          const newH = Math.ceil((requiredHeightPx + MARGIN_PX) / (ROW_HEIGHT_PX + MARGIN_PX));

          setRuntimeLayouts(prev => {
              const currentLayout = prev[dashboardId] || getLayout(dashboards.find(d => d.id === dashboardId)!);
              const updatedLayout = currentLayout.map(item => {
                  if (item.i === chartId) {
                      return { ...item, h: newH };
                  }
                  return item;
              });
              return { ...prev, [dashboardId]: updatedLayout };
          });
          return;
      }

      // Case 2: Bubble up to Parent (App.tsx) for Drill Down or filtering
      if (onChartClick) {
          onChartClick(payload);
      } else {
          // Fallback: Local Filter Interaction
          if (payload.dimensionKey) {
              const currentVal = dashboardFilters[dashboardId]?.[payload.dimensionKey];
              const newVal = currentVal === payload.name ? 'ALL' : payload.name;
              handleFilterChange(dashboardId, payload.dimensionKey, newVal);
          }
      }
  };

  const toggleDashboardSelection = (id: string) => {
      setSelectedDashboardIds(prev => 
          prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
      );
  };

  const handleStartCycle = () => {
      const selected = dashboards.filter(d => selectedDashboardIds.includes(d.id));
      if (selected.length === 0) {
          alert('请至少选择一个要轮播的看板');
          return;
      }
      onLaunchFullScreen(selected, cycleInterval);
      setIsAutoCycleModalOpen(false);
  };

  const toggleExpand = (id: string) => {
      setExpandedDashboardIds(prev => 
          prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
      );
  };

  const handleExport = () => {
      alert("正在导出当前查询结果为 Excel 文件...");
  };

  const getLayout = (dash: Dashboard) => {
      if (dash.layout && dash.layout.length > 0) return dash.layout;
      
      let currentX = 0;
      let currentY = 0;
      const ROW_HEIGHT = 4; 
      
      return dash.charts.map(chartId => {
          const chart = charts.find(c => c.id === chartId);
          const legacySpan = chart?.style?.colSpan || 1;
          const width = legacySpan === 3 ? 12 : legacySpan === 2 ? 8 : 4; 
          
          const item = { i: chartId, x: currentX, y: currentY, w: width, h: ROW_HEIGHT };
          currentX += width;
          if (currentX >= 12) { currentX = 0; currentY += ROW_HEIGHT; }
          return item;
      });
  };

  // --- SINGLE VIEW MODE ---
  if (singleView && dashboards.length === 1) {
      const dash = dashboards[0];
      const layout = runtimeLayouts[dash.id] || getLayout(dash);
      
      return (
          <div className="flex flex-col h-full space-y-6">
              {/* Top Controls */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-shrink-0">
                  <div className="flex-1 w-full md:w-auto">
                      {dash.controllers && dash.controllers.length > 0 ? (
                          <div className="-mb-6">
                            <ControllerBar 
                                controllers={dash.controllers} 
                                filterState={dashboardFilters[dash.id] || {}} 
                                onFilterChange={(key, value) => handleFilterChange(dash.id, key, value)}
                            />
                          </div>
                      ) : (
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest py-2">
                              {dash.name} - View Mode
                          </div>
                      )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 self-end md:self-center">
                      <button onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          导出 Excel
                      </button>
                  </div>
              </div>

              {/* Grid Layout Content */}
              <div className="flex-1 relative min-h-0">
                  <ResponsiveGridLayout
                    className="layout"
                    layouts={{ lg: layout }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={60}
                    isDraggable={false}
                    isResizable={false}
                    margin={[16, 16]}
                  >
                      {layout.map(item => {
                          const chart = charts.find(c => c.id === item.i);
                          if (!chart) return <div key={item.i}></div>;
                          const chartView = dataViews?.find(v => v.id === chart.viewId);

                          return (
                              <div key={item.i}>
                                  <RenderChart 
                                    chart={chart} 
                                    devices={devices}
                                    dataView={chartView}
                                    dataViews={dataViews}
                                    filters={dashboardFilters[dash.id]} 
                                    onInteract={(payload) => handleChartInteract(dash.id, { ...payload, chartId: chart.id })} // Inject chartId
                                    allCharts={charts}
                                  />
                              </div>
                          );
                      })}
                  </ResponsiveGridLayout>
                  {dash.charts.length === 0 && (
                      <div className="h-full border-2 border-dashed border-slate-100 rounded-[32px] flex items-center justify-center text-slate-300 text-xs font-bold uppercase min-h-[400px]">
                          看板暂无图表数据 (No Charts Configured)
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- LIST MODE ---
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm sticky top-0 z-40 bg-white/90 backdrop-blur">
          <div>
              <h2 className="text-lg font-black text-slate-800">监测看板</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Monitor Dashboard</p>
          </div>
          <div className="flex gap-3 items-center">
             <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                Interactive Mode
             </div>
             <button onClick={() => setIsAutoCycleModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all shadow-lg hover:shadow-slate-200">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>自动轮播</span>
             </button>
          </div>
      </div>

      {dashboards.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
              <p className="text-slate-400 font-bold mb-2">暂无已发布的看板</p>
              <p className="text-xs text-slate-300">请前往“数据管理 > 看板配置”创建您的第一个监控看板。</p>
          </div>
      )}

      {dashboards.map(dash => {
          const layout = runtimeLayouts[dash.id] || getLayout(dash);
          const isExpanded = expandedDashboardIds.includes(dash.id);
          
          return (
          <div key={dash.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between p-6 cursor-pointer bg-gradient-to-r from-white to-slate-50/50" onClick={() => toggleExpand(dash.id)}>
                  <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                          <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-slate-800">{dash.name}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{dash.charts.length} Charts Included</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); onLaunchFullScreen([dash], cycleInterval); }} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:border-indigo-300 hover:text-indigo-600 transition-all">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          演示此看板
                      </button>
                  </div>
              </div>
              
              {isExpanded && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50/30 animate-in slide-in-from-top-4 duration-300">
                      <ControllerBar 
                          controllers={dash.controllers || []} 
                          filterState={dashboardFilters[dash.id] || {}} 
                          onFilterChange={(key, value) => handleFilterChange(dash.id, key, value)}
                      />
                      <div className="relative">
                          <ResponsiveGridLayout className="layout" layouts={{ lg: layout }} breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }} rowHeight={60} isDraggable={false} isResizable={false} margin={[16, 16]}>
                              {layout.map(item => {
                                  const chart = charts.find(c => c.id === item.i);
                                  if (!chart) return <div key={item.i}></div>;
                                  const chartView = dataViews?.find(v => v.id === chart.viewId);
                                  return (
                                      <div key={item.i}>
                                          <RenderChart 
                                            chart={chart} 
                                            devices={devices}
                                            dataView={chartView}
                                            dataViews={dataViews}
                                            filters={dashboardFilters[dash.id]} 
                                            onInteract={(payload) => handleChartInteract(dash.id, { ...payload, chartId: chart.id })} 
                                            allCharts={charts}
                                          />
                                      </div>
                                  );
                              })}
                          </ResponsiveGridLayout>
                      </div>
                  </div>
              )}
          </div>
      )})}

      {/* Auto Cycle Modal */}
      {isAutoCycleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
              <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center mb-6 flex-shrink-0">
                      <h3 className="text-lg font-black text-slate-800">设置轮播参数</h3>
                      <button onClick={() => setIsAutoCycleModalOpen(false)} className="text-slate-400 hover:text-rose-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">切换间隔时间</label>
                          <div className="grid grid-cols-2 gap-3">
                              {CYCLE_OPTIONS.map(opt => (
                                  <button key={opt.value} onClick={() => setCycleInterval(opt.value)} className={`py-3 rounded-xl text-xs font-bold transition-all border ${cycleInterval === opt.value ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                                      {opt.label}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <div className="flex justify-between items-center mb-3">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">选择轮播看板</label>
                              <div className="flex gap-2">
                                  <button onClick={() => setSelectedDashboardIds(dashboards.map(d => d.id))} className="text-[10px] text-indigo-500 font-bold hover:underline">Select All</button>
                                  <span className="text-slate-300">|</span>
                                  <button onClick={() => setSelectedDashboardIds([])} className="text-[10px] text-slate-400 font-bold hover:underline">Clear</button>
                              </div>
                          </div>
                          <div className="space-y-2 border border-slate-100 rounded-2xl p-2 bg-slate-50">
                              {dashboards.map(d => (
                                  <div key={d.id} onClick={() => toggleDashboardSelection(d.id)} className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${selectedDashboardIds.includes(d.id) ? 'bg-white shadow-sm border border-indigo-100' : 'hover:bg-white/50 text-slate-500'}`}>
                                      <span className={`text-xs font-bold ${selectedDashboardIds.includes(d.id) ? 'text-indigo-700' : 'text-slate-600'}`}>{d.name}</span>
                                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedDashboardIds.includes(d.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 bg-white'}`}>
                                          {selectedDashboardIds.includes(d.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-100 flex-shrink-0">
                      <Button onClick={handleStartCycle} className="w-full bg-slate-900 text-white hover:bg-indigo-600" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
                          开始全屏轮播 ({selectedDashboardIds.length})
                      </Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
