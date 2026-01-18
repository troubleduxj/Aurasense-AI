
import React, { useState, useEffect } from 'react';
import { Dashboard, ChartConfig, Device, ChartInteractionPayload, DataView, DashboardFilterState, GridLayoutItem } from '../types';
import { RenderChart } from '../components/RenderChart';
import { ControllerBar } from '../components/ControllerBar';
import { Responsive } from 'react-grid-layout';
import * as RGL from 'react-grid-layout';

// Workaround for potential type definition mismatch for WidthProvider
const WidthProvider = (RGL as any).WidthProvider;
const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardMonitorPageProps {
  dashboards: Dashboard[];
  charts: ChartConfig[];
  devices: Device[];
  dataViews?: DataView[]; 
  onLaunchFullScreen: (dashboards: Dashboard[], interval?: number) => void;
  onChartClick?: (payload: ChartInteractionPayload) => void; 
}

const CYCLE_OPTIONS = [
    { label: '15 秒', value: 15000 },
    { label: '30 秒', value: 30000 },
    { label: '1 分钟', value: 60000 },
    { label: '5 分钟', value: 300000 },
];

export const DashboardMonitorPage: React.FC<DashboardMonitorPageProps> = ({ dashboards, charts, devices, dataViews, onLaunchFullScreen, onChartClick }) => {
  const [dashboardFilters, setDashboardFilters] = useState<Record<string, DashboardFilterState>>({});
  
  // Auto Cycle State
  const [isAutoCycleModalOpen, setIsAutoCycleModalOpen] = useState(false);
  const [cycleInterval, setCycleInterval] = useState(15000);
  const [selectedDashboardIds, setSelectedDashboardIds] = useState<string[]>([]);

  // Collapse State: IDs of expanded dashboards. Default empty = all collapsed.
  const [expandedDashboardIds, setExpandedDashboardIds] = useState<string[]>([]);

  // Initialize selected dashboards for cycle when modal opens or dashboards change
  useEffect(() => {
      if (dashboards.length > 0 && selectedDashboardIds.length === 0) {
          setSelectedDashboardIds(dashboards.map(d => d.id));
      }
  }, [dashboards]);

  const handleFilterChange = (dashboardId: string, key: string, value: any) => {
      setDashboardFilters(prev => ({
          ...prev,
          [dashboardId]: { ...(prev[dashboardId] || {}), [key]: value }
      }));
  };

  const handleChartInteract = (dashboardId: string, payload: ChartInteractionPayload) => {
      console.log('Chart Clicked:', payload);
      if (payload.dimensionKey) {
          const currentVal = dashboardFilters[dashboardId]?.[payload.dimensionKey];
          const newVal = currentVal === payload.name ? 'ALL' : payload.name;
          handleFilterChange(dashboardId, payload.dimensionKey, newVal);
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

  // Helper to generate layout for monitor mode (read-only)
  const getLayout = (dash: Dashboard) => {
      if (dash.layout && dash.layout.length > 0) return dash.layout;
      
      // Fallback Layout Generation
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
             {/* Auto-Cycle Button */}
             <button 
                onClick={() => setIsAutoCycleModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all shadow-lg hover:shadow-slate-200"
             >
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
          const layout = getLayout(dash);
          const isExpanded = expandedDashboardIds.includes(dash.id);
          
          return (
          <div key={dash.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Dashboard Header Bar */}
              <div 
                className="flex items-center justify-between p-6 cursor-pointer bg-gradient-to-r from-white to-slate-50/50"
                onClick={() => toggleExpand(dash.id)}
              >
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
                      <button 
                          onClick={(e) => { e.stopPropagation(); onLaunchFullScreen([dash], cycleInterval); }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:border-indigo-300 hover:text-indigo-600 transition-all"
                      >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          演示此看板
                      </button>
                  </div>
              </div>
              
              {/* Expandable Content */}
              {isExpanded && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50/30 animate-in slide-in-from-top-4 duration-300">
                      <ControllerBar 
                          controllers={dash.controllers || []} 
                          filterState={dashboardFilters[dash.id] || {}} 
                          onFilterChange={(key, value) => handleFilterChange(dash.id, key, value)}
                      />

                      <div className="relative">
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
                                            onInteract={(payload) => handleChartInteract(dash.id, payload)} 
                                            allCharts={charts}
                                          />
                                      </div>
                                  );
                              })}
                          </ResponsiveGridLayout>
                          {dash.charts.length === 0 && (
                              <div className="col-span-full h-40 border-2 border-dashed border-slate-100 rounded-[32px] flex items-center justify-center text-slate-300 text-xs font-bold uppercase">
                                  看板暂无图表数据
                              </div>
                          )}
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
                      {/* Interval Setting */}
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">切换间隔时间</label>
                          <div className="grid grid-cols-2 gap-3">
                              {CYCLE_OPTIONS.map(opt => (
                                  <button 
                                    key={opt.value}
                                    onClick={() => setCycleInterval(opt.value)}
                                    className={`py-3 rounded-xl text-xs font-bold transition-all border ${cycleInterval === opt.value ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                  >
                                      {opt.label}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Dashboard Selection */}
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
                                  <div 
                                    key={d.id} 
                                    onClick={() => toggleDashboardSelection(d.id)}
                                    className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${selectedDashboardIds.includes(d.id) ? 'bg-white shadow-sm border border-indigo-100' : 'hover:bg-white/50 text-slate-500'}`}
                                  >
                                      <span className={`text-xs font-bold ${selectedDashboardIds.includes(d.id) ? 'text-indigo-700' : 'text-slate-600'}`}>{d.name}</span>
                                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedDashboardIds.includes(d.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 bg-white'}`}>
                                          {selectedDashboardIds.includes(d.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                      </div>
                                  </div>
                              ))}
                              {dashboards.length === 0 && <div className="text-center text-xs text-slate-400 py-4">无可用看板</div>}
                          </div>
                      </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 flex-shrink-0">
                      <button 
                        onClick={handleStartCycle}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-2"
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          开始全屏轮播 ({selectedDashboardIds.length})
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
