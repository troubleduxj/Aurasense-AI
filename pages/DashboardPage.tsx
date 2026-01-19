
import React, { useState, useEffect } from 'react';
import { Dashboard, ChartConfig, Device, DataView, ControllerConfig, GridLayoutItem, ShareToken } from '../types';
import { RenderChart } from '../components/RenderChart';
import { ControllerBar } from '../components/ControllerBar';
import { Responsive } from 'react-grid-layout';
import * as RGL from 'react-grid-layout';
import { MOCK_SHARE_TOKENS } from '../mockData';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

// Safe initialization of ResponsiveGridLayout
const WidthProvider = (RGL as any).WidthProvider;
const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardPageProps {
  dashboards: Dashboard[];
  charts: ChartConfig[];
  devices: Device[];
  dataViews?: DataView[]; 
  onUpdateDashboards: (newDashboards: Dashboard[]) => void;
  onSaveChart: (chart: ChartConfig) => void;
  onLaunchFullScreen: (dashboards: Dashboard[], interval?: number) => void;
}

const CYCLE_OPTIONS = [
    { label: '15 秒', value: 15000 },
    { label: '30 秒', value: 30000 },
    { label: '1 分钟', value: 60000 },
    { label: '5 分钟', value: 300000 },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ dashboards, charts, devices, dataViews, onUpdateDashboards, onSaveChart, onLaunchFullScreen }) => {
  const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null);
  const [dashboardToAddChart, setDashboardToAddChart] = useState<string | null>(null);
  const [isCreatingDashboard, setIsCreatingDashboard] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  
  // Controller Config State
  const [controllerConfigDashId, setControllerConfigDashId] = useState<string | null>(null);
  const [tempControllers, setTempControllers] = useState<ControllerConfig[]>([]);

  // Share Modal State
  const [sharingDashboard, setSharingDashboard] = useState<Dashboard | null>(null);
  const [shareTokens, setShareTokens] = useState<ShareToken[]>([]);
  const [shareForm, setShareForm] = useState({ label: '', expiryDays: 7, password: '', usePassword: false });
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  // Auto Cycle State
  const [isAutoCycleModalOpen, setIsAutoCycleModalOpen] = useState(false);
  const [cycleInterval, setCycleInterval] = useState(15000);
  const [selectedDashboardIds, setSelectedDashboardIds] = useState<string[]>([]);

  // Collapse State
  const [expandedDashboardIds, setExpandedDashboardIds] = useState<string[]>([]);

  // --- Effects ---
  useEffect(() => {
      if (dashboards.length > 0 && selectedDashboardIds.length === 0) {
          setSelectedDashboardIds(dashboards.map(d => d.id));
      }
  }, [dashboards]);

  // Init temp controllers when opening modal
  useEffect(() => {
      if (controllerConfigDashId) {
          const dash = dashboards.find(d => d.id === controllerConfigDashId);
          setTempControllers(dash?.controllers || []);
      }
  }, [controllerConfigDashId]);

  // Init share tokens when opening modal
  useEffect(() => {
      if (sharingDashboard) {
          setShareTokens(MOCK_SHARE_TOKENS.filter(t => t.dashboardId === sharingDashboard.id));
          setGeneratedToken(null);
          setShareForm({ label: '', expiryDays: 7, password: '', usePassword: false });
      }
  }, [sharingDashboard]);

  // --- Handlers ---

  const toggleExpand = (id: string) => {
      setExpandedDashboardIds(prev => 
          prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
      );
  };

  const handleCreateDashboard = () => {
      if (!newDashboardName.trim()) return;
      const newDash: Dashboard = {
          id: `dash-${Date.now()}`,
          name: newDashboardName,
          charts: []
      };
      onUpdateDashboards([...dashboards, newDash]);
      setIsCreatingDashboard(false);
      setNewDashboardName('');
      setExpandedDashboardIds(prev => [...prev, newDash.id]);
  };

  const handleDeleteDashboard = (dashId: string) => {
      if (window.confirm('确定要删除此仪表盘吗？其中的图表配置不会被删除，但布局将丢失。')) {
          onUpdateDashboards(dashboards.filter(d => d.id !== dashId));
      }
  };

  const handleRemoveChartFromDashboard = (dashboardId: string, chartId: string) => {
    onUpdateDashboards(dashboards.map(d => {
        if (d.id === dashboardId) {
            const newLayout = d.layout?.filter(l => l.i !== chartId);
            return { ...d, charts: d.charts.filter(c => c !== chartId), layout: newLayout };
        }
        return d;
    }));
  };

  const handleAddChartToDashboard = (chartId: string) => {
    if (!dashboardToAddChart) return;
    onUpdateDashboards(dashboards.map(d => {
        if (d.id === dashboardToAddChart) {
            const newCharts = [...d.charts, chartId];
            const maxY = d.layout ? Math.max(...d.layout.map(l => l.y + l.h), 0) : 0;
            const newItem: GridLayoutItem = {
                i: chartId,
                x: 0,
                y: maxY,
                w: 6,
                h: 4
            };
            const newLayout = [...(d.layout || []), newItem];
            return { ...d, charts: newCharts, layout: newLayout };
        }
        return d;
    }));
    setDashboardToAddChart(null);
  };

  const handleSaveControllers = () => {
      if (!controllerConfigDashId) return;
      onUpdateDashboards(dashboards.map(d => 
          d.id === controllerConfigDashId ? { ...d, controllers: tempControllers } : d
      ));
      setControllerConfigDashId(null);
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

  const handleCreateShareLink = () => {
      if (!sharingDashboard) return;
      const newToken: ShareToken = {
          id: `token-${Math.random().toString(36).substr(2, 9)}`,
          dashboardId: sharingDashboard.id,
          label: shareForm.label || 'Untitled Share Link',
          createdAt: new Date().toISOString(),
          status: 'active',
          password: shareForm.usePassword ? shareForm.password : undefined,
          expiresAt: new Date(Date.now() + shareForm.expiryDays * 86400000).toISOString()
      };
      setShareTokens([newToken, ...shareTokens]);
      setGeneratedToken(newToken.id);
  };

  const getLayout = (dash: Dashboard, isEditing: boolean): GridLayoutItem[] => {
      const validLayout = dash.layout?.filter(l => dash.charts.includes(l.i) || l.i === 'add-button');
      const missingCharts = dash.charts.filter(cId => !validLayout?.find(l => l.i === cId));
      
      if (validLayout && missingCharts.length === 0) {
          if (isEditing && !validLayout.find(l => l.i === 'add-button')) {
             const maxY = Math.max(...validLayout.map(l => l.y + l.h), 0);
             return [...validLayout, { i: 'add-button', x: 0, y: maxY, w: 12, h: 2, static: true }];
          }
          if (!isEditing) return validLayout.filter(l => l.i !== 'add-button');
          return validLayout;
      }

      let currentX = 0;
      let currentY = 0;
      const ROW_HEIGHT = 4;

      const generated: GridLayoutItem[] = dash.charts.map((chartId) => {
          const existingItem = validLayout?.find(l => l.i === chartId);
          if (existingItem) return existingItem;

          const chart = charts.find(c => c.id === chartId);
          const legacySpan = chart?.style?.colSpan || 1;
          const width = legacySpan === 3 ? 12 : legacySpan === 2 ? 8 : 4; 
          
          const item = { i: chartId, x: currentX, y: currentY, w: width, h: ROW_HEIGHT };
          currentX += width;
          if (currentX >= 12) { currentX = 0; currentY += ROW_HEIGHT; }
          return item;
      });

      if (isEditing) {
          const maxY = Math.max(...generated.map(l => l.y + l.h), 0);
          generated.push({ i: 'add-button', x: 0, y: maxY, w: 12, h: 2, static: true });
      }

      return generated;
  };

  const handleLayoutChange = (dashboardId: string, layout: GridLayoutItem[]) => {
      const cleanLayout = layout.filter(l => l.i !== 'add-button').map(l => ({
          i: l.i, x: l.x, y: l.y, w: l.w, h: l.h
      }));
      onUpdateDashboards(dashboards.map(d => 
          d.id === dashboardId ? { ...d, layout: cleanLayout } : d
      ));
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Top Action Bar */}
      <Card className="flex justify-between items-center p-4 sticky top-0 z-40 bg-white/90 backdrop-blur">
          <div>
              <h2 className="text-lg font-black text-slate-800">看板配置管理</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dashboard Config & Layout</p>
          </div>
          <div className="flex gap-3">
               <Button 
                  onClick={() => setIsAutoCycleModalOpen(true)}
                  variant="outline" // Use outline for better visibility on white bg
                  icon={<svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
               >
                  自动轮播
               </Button>

               <Button 
                  onClick={() => setIsCreatingDashboard(true)}
                  variant="primary"
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>}
               >
                  新建仪表盘
               </Button>
          </div>
      </Card>

      {/* Dashboard List */}
      {dashboards.map(dash => {
          const isEditing = editingDashboardId === dash.id;
          const currentLayout = getLayout(dash, isEditing);
          const isExpanded = expandedDashboardIds.includes(dash.id);
          
          return (
          <div key={dash.id} className={`animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isEditing ? 'ring-2 ring-indigo-500/20' : ''}`}>
              {/* Header */}
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
                          <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{dash.charts.length} Charts</span>
                              {isEditing && <span className="text-[9px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded font-black uppercase animate-pulse">Editing Layout...</span>}
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                          size="sm"
                          variant={isEditing ? 'success' : 'secondary'}
                          onClick={() => setEditingDashboardId(isEditing ? null : dash.id)}
                          icon={isEditing ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                      >
                          {isEditing ? '完成' : '自定义布局'}
                      </Button>

                      <Button 
                          size="sm"
                          variant="secondary"
                          onClick={() => setControllerConfigDashId(dash.id)}
                          icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
                      >
                          筛选器
                      </Button>

                      <Button 
                          size="sm"
                          variant="primary"
                          className="bg-slate-800 border-slate-800"
                          onClick={() => onLaunchFullScreen([dash], cycleInterval)}
                          icon={<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                      >
                          大屏
                      </Button>

                      <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSharingDashboard(dash)}
                          icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>}
                      >
                          分享
                      </Button>

                      {isEditing && (
                           <Button 
                             size="sm"
                             variant="danger"
                             onClick={() => handleDeleteDashboard(dash.id)}
                             icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                           />
                      )}
                  </div>
              </div>
              
              {/* Content */}
              {isExpanded && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50/30 animate-in slide-in-from-top-4 duration-300">
                      {dash.controllers && dash.controllers.length > 0 && (
                          <div className="mb-6 pointer-events-none opacity-60 scale-95 origin-top-left">
                              <ControllerBar controllers={dash.controllers} filterState={{}} onFilterChange={() => {}} />
                          </div>
                      )}

                      <div className={isEditing ? 'bg-slate-50/50 rounded-[32px] border-2 border-dashed border-indigo-100 p-4' : ''}>
                          <ResponsiveGridLayout
                            className="layout"
                            layouts={{ lg: currentLayout }}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                            rowHeight={60}
                            isDraggable={isEditing}
                            isResizable={isEditing}
                            margin={[16, 16]}
                            onLayoutChange={(layout) => handleLayoutChange(dash.id, layout)}
                            draggableCancel=".non-draggable"
                          >
                              {currentLayout.map(item => {
                                  if (item.i === 'add-button') {
                                      return (
                                        <div key="add-button" onClick={() => setDashboardToAddChart(dash.id)} className="border-2 border-dashed border-slate-200 bg-white rounded-[32px] flex flex-col items-center justify-center text-slate-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-white/50 transition-all cursor-pointer">
                                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                            <span className="text-xs font-bold uppercase tracking-widest">添加图表</span>
                                        </div>
                                      );
                                  }

                                  const chart = charts.find(c => c.id === item.i);
                                  if (!chart) return <div key={item.i}></div>;
                                  const chartView = dataViews?.find(v => v.id === chart.viewId);

                                  return (
                                      <div key={item.i} className={`relative transition-all duration-200 ${isEditing ? 'ring-2 ring-indigo-5 border border-indigo-100 rounded-[34px] shadow-lg bg-white z-10' : ''}`}>
                                          {isEditing && (
                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); handleRemoveChartFromDashboard(dash.id, chart.id); }}
                                                  className="non-draggable absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md z-50 hover:scale-110 transition-transform cursor-pointer"
                                              >
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                              </button>
                                          )}
                                          <div className="h-full w-full pointer-events-none">
                                              <RenderChart 
                                                chart={chart} 
                                                devices={devices} 
                                                dataView={chartView} 
                                                dataViews={dataViews} 
                                                allCharts={charts} 
                                              />
                                          </div>
                                      </div>
                                  );
                              })}
                          </ResponsiveGridLayout>
                      </div>
                  </div>
              )}
          </div>
      )})}

      {/* --- Modals --- */}

      {/* Controller Config Modal */}
      <Modal
          isOpen={!!controllerConfigDashId}
          onClose={() => setControllerConfigDashId(null)}
          title="配置全局筛选器"
          subtitle="Dashboard Global Filters"
          size="lg"
          footer={
              <div className="flex gap-4 w-full">
                  <Button onClick={handleSaveControllers} className="flex-1">保存配置</Button>
                  <Button variant="secondary" onClick={() => setControllerConfigDashId(null)}>取消</Button>
              </div>
          }
      >
          <div className="space-y-6">
              {tempControllers.map((ctrl, idx) => (
                  <div key={ctrl.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                      <button onClick={() => setTempControllers(tempControllers.filter(c => c.id !== ctrl.id))} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      <div className="grid grid-cols-2 gap-4">
                          <Input label="Label" value={ctrl.label} onChange={e => setTempControllers(tempControllers.map(c => c.id === ctrl.id ? { ...c, label: e.target.value } : c))} />
                          <Select 
                            label="Type"
                            value={ctrl.type} 
                            onChange={e => setTempControllers(tempControllers.map(c => c.id === ctrl.id ? { ...c, type: e.target.value as any } : c))}
                            options={[{label:'Select',value:'SELECT'},{label:'Radio',value:'RADIO_GROUP'},{label:'Time Range',value:'TIME_RANGE'},{label:'Text Input',value:'TEXT_INPUT'}]}
                          />
                          <Input label="Key" value={ctrl.key} onChange={e => setTempControllers(tempControllers.map(c => c.id === ctrl.id ? { ...c, key: e.target.value } : c))} className="font-mono" />
                          <Input label="Options (comma sep)" value={ctrl.options?.join(', ')} onChange={e => setTempControllers(tempControllers.map(c => c.id === ctrl.id ? { ...c, options: e.target.value.split(',').map(s => s.trim()) } : c))} />
                      </div>
                  </div>
              ))}
              <Button variant="secondary" onClick={() => setTempControllers([...tempControllers, { id: `ctrl-${Date.now()}`, label: '新筛选器', type: 'SELECT', key: 'key', options: ['Option'] }])} className="w-full border-dashed">
                  + Add Controller
              </Button>
          </div>
      </Modal>

      {/* Advanced Share Modal */}
      <Modal
          isOpen={!!sharingDashboard}
          onClose={() => setSharingDashboard(null)}
          title={`分享看板: ${sharingDashboard?.name}`}
          subtitle="Secure Sharing Management"
          size="lg"
      >
          <div className="space-y-6">
              {generatedToken ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center space-y-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div>
                          <h4 className="font-bold text-emerald-800">Link Generated!</h4>
                          <p className="text-xs text-emerald-600 mt-1">Ready to share.</p>
                      </div>
                      <Input readOnly value={`https://aurasense.io/share/${generatedToken}`} className="font-mono text-emerald-700 bg-white" />
                      <Button variant="ghost" onClick={() => setGeneratedToken(null)} className="text-emerald-600">Create Another</Button>
                  </div>
              ) : (
                  <>
                      <Input label="链接描述" value={shareForm.label} onChange={e => setShareForm({...shareForm, label: e.target.value})} placeholder="e.g. For Client Review" />
                      <div className="grid grid-cols-2 gap-4">
                          <Select 
                            label="有效期"
                            value={shareForm.expiryDays} 
                            onChange={e => setShareForm({...shareForm, expiryDays: parseInt(e.target.value)})}
                            options={[{label:'7 Days',value:7},{label:'30 Days',value:30},{label:'1 Year',value:365}]}
                          />
                          <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">访问密码</label>
                              <div className="flex items-center gap-3 h-[46px]">
                                  <input type="checkbox" checked={shareForm.usePassword} onChange={e => setShareForm({...shareForm, usePassword: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                  <Input disabled={!shareForm.usePassword} value={shareForm.password} onChange={e => setShareForm({...shareForm, password: e.target.value})} placeholder="Optional Code" className="flex-1" />
                              </div>
                          </div>
                      </div>
                      <Button onClick={handleCreateShareLink} disabled={!shareForm.label} className="w-full">Generate Secure Link</Button>
                  </>
              )}
              
              {shareTokens.length > 0 && (
                  <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 mb-3">Active Links</h4>
                      <div className="space-y-2">
                          {shareTokens.map(token => (
                              <div key={token.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                                  <span className="font-bold text-slate-600">{token.label}</span>
                                  <span className="text-slate-400 font-mono">Expires: {token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : 'Never'}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </Modal>

      {/* New Dashboard Modal */}
      <Modal
          isOpen={isCreatingDashboard}
          onClose={() => setIsCreatingDashboard(false)}
          title="新建仪表盘视图"
          size="md"
          footer={
              <div className="flex gap-4 w-full">
                  <Button onClick={handleCreateDashboard} className="flex-1">创建</Button>
                  <Button variant="secondary" onClick={() => setIsCreatingDashboard(false)}>取消</Button>
              </div>
          }
      >
          <Input 
            label="Dashboard Name" 
            value={newDashboardName} 
            onChange={e => setNewDashboardName(e.target.value)} 
            placeholder="e.g. 二车间生产大屏" 
            autoFocus 
          />
      </Modal>

      {/* Add Chart Modal */}
      <Modal
          isOpen={!!dashboardToAddChart}
          onClose={() => setDashboardToAddChart(null)}
          title="添加图表"
          size="lg"
      >
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
              {charts.filter(c => !dashboards.find(d => d.id === dashboardToAddChart)?.charts.includes(c.id)).map(c => (
                  <div key={c.id} onClick={() => handleAddChartToDashboard(c.id)} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer flex justify-between items-center group">
                      <div>
                          <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase mt-1 inline-block">{c.type}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:bg-indigo-500 group-hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg></div>
                  </div>
              ))}
          </div>
      </Modal>

      {/* Auto Cycle Modal */}
      <Modal
          isOpen={isAutoCycleModalOpen}
          onClose={() => setIsAutoCycleModalOpen(false)}
          title="设置轮播参数"
          size="md"
          footer={<Button onClick={handleStartCycle} className="w-full">开始全屏轮播</Button>}
      >
          <div className="space-y-6">
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">切换间隔时间</label>
                  <div className="grid grid-cols-2 gap-3">
                      {CYCLE_OPTIONS.map(opt => (
                          <button 
                            key={opt.value}
                            onClick={() => setCycleInterval(opt.value)}
                            className={`py-3 rounded-xl text-xs font-bold transition-all border ${cycleInterval === opt.value ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-600 border-slate-200'}`}
                          >
                              {opt.label}
                          </button>
                      ))}
                  </div>
              </div>
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">选择轮播看板</label>
                  <div className="space-y-2 border border-slate-100 rounded-2xl p-2 bg-slate-50 max-h-48 overflow-y-auto">
                      {dashboards.map(d => (
                          <div 
                            key={d.id} 
                            onClick={() => toggleDashboardSelection(d.id)}
                            className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${selectedDashboardIds.includes(d.id) ? 'bg-white shadow-sm border border-indigo-100' : 'hover:bg-white/50 text-slate-500'}`}
                          >
                              <span className={`text-xs font-bold ${selectedDashboardIds.includes(d.id) ? 'text-indigo-700' : 'text-slate-600'}`}>{d.name}</span>
                              {selectedDashboardIds.includes(d.id) && <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-white"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </Modal>
    </div>
  );
};
