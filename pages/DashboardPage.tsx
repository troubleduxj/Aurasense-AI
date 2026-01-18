
import React, { useState, useEffect } from 'react';
import { Dashboard, ChartConfig, Device, ChartStyle, DataView, ControllerConfig, GridLayoutItem, ShareToken } from '../types';
import { RenderChart } from '../components/RenderChart';
import { ControllerBar } from '../components/ControllerBar';
import { Responsive } from 'react-grid-layout';
import * as RGL from 'react-grid-layout';
import _ from 'lodash';
import { MOCK_SHARE_TOKENS } from '../mockData'; // Mock Data for initial state

// Workaround for potential type definition mismatch for WidthProvider
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

// --- Controller Modal (Minimized for brevity) ---
const ControllerEditorModal: React.FC<{
    dashboard: Dashboard;
    onSave: (updatedControllers: ControllerConfig[]) => void;
    onClose: () => void;
}> = ({ dashboard, onSave, onClose }) => {
    const [controllers, setControllers] = useState<ControllerConfig[]>(dashboard.controllers || []);
    const handleAdd = () => setControllers([...controllers, { id: `ctrl-${Date.now()}`, label: '新筛选器', type: 'SELECT', key: 'status', options: ['Option 1'] }]);
    const handleRemove = (id: string) => setControllers(controllers.filter(c => c.id !== id));
    const handleChange = (id: string, f: keyof ControllerConfig, v: any) => setControllers(controllers.map(c => c.id === id ? { ...c, [f]: f === 'options' && typeof v === 'string' ? v.split(',').map(s => s.trim()) : v } : c));

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[40px] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800">配置全局筛选器</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {controllers.map((ctrl, idx) => (
                        <div key={ctrl.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative">
                            <button onClick={() => handleRemove(ctrl.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            <div className="grid grid-cols-2 gap-4">
                                <input value={ctrl.label} onChange={e => handleChange(ctrl.id, 'label', e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold" placeholder="Label" />
                                <select value={ctrl.type} onChange={e => handleChange(ctrl.id, 'type', e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"><option value="SELECT">Select</option><option value="RADIO_GROUP">Radio</option><option value="TIME_RANGE">Time</option></select>
                                <input value={ctrl.key} onChange={e => handleChange(ctrl.id, 'key', e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono" placeholder="Key" />
                                <input value={ctrl.options?.join(', ')} onChange={e => handleChange(ctrl.id, 'options', e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs" placeholder="Options (comma sep)" />
                            </div>
                        </div>
                    ))}
                    <button onClick={handleAdd} className="w-full py-3 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-400 font-bold text-xs">Add Controller</button>
                </div>
                <div className="p-6 bg-slate-50 flex justify-end gap-4"><button onClick={onClose} className="px-6 py-2 bg-white rounded-xl text-xs font-bold">Cancel</button><button onClick={() => onSave(controllers)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save</button></div>
            </div>
        </div>
    );
};

// --- [V3.6] Advanced Share Modal ---
const AdvancedShareModal: React.FC<{
    dashboard: Dashboard;
    onClose: () => void;
}> = ({ dashboard, onClose }) => {
    // In a real app, this would come from an API. Here we use local state + mock data.
    const [tokens, setTokens] = useState<ShareToken[]>(
        MOCK_SHARE_TOKENS.filter(t => t.dashboardId === dashboard.id)
    );
    const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
    
    // Form State
    const [formLabel, setFormLabel] = useState('');
    const [expiryDays, setExpiryDays] = useState<number | 'never'>(7);
    const [password, setPassword] = useState('');
    const [usePassword, setUsePassword] = useState(false);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);

    const handleCreate = () => {
        const newToken: ShareToken = {
            id: `token-${Math.random().toString(36).substr(2, 9)}`,
            dashboardId: dashboard.id,
            label: formLabel || 'Untitled Share Link',
            createdAt: new Date().toISOString(),
            status: 'active',
            password: usePassword ? password : undefined,
            expiresAt: expiryDays === 'never' 
                ? undefined 
                : new Date(Date.now() + (expiryDays as number) * 86400000).toISOString()
        };

        setTokens([newToken, ...tokens]);
        setGeneratedToken(newToken.id);
        // Reset form partially
        setFormLabel('');
        setPassword('');
    };

    const handleRevoke = (id: string) => {
        if(window.confirm('Are you sure you want to revoke this link? Users will lose access immediately.')) {
            setTokens(prev => prev.map(t => t.id === id ? { ...t, status: 'revoked' } : t));
        }
    };

    const getShareUrl = (tokenId: string) => `https://aurasense.io/share/${tokenId}`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800">分享看板: {dashboard.name}</h3>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">Secure Sharing Management</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-8">
                    <button 
                        onClick={() => setActiveTab('create')}
                        className={`py-4 px-4 text-xs font-bold border-b-2 transition-all ${activeTab === 'create' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        创建新链接
                    </button>
                    <button 
                        onClick={() => setActiveTab('manage')}
                        className={`py-4 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'manage' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        管理已分享
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md text-[9px]">{tokens.length}</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'create' && (
                        <div className="space-y-6 animate-in slide-in-from-left-4">
                            {generatedToken ? (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center space-y-4">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-800">Link Generated Successfully!</h4>
                                        <p className="text-xs text-emerald-600 mt-1">This link is now active and ready to share.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <input readOnly value={getShareUrl(generatedToken)} className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-3 text-xs font-mono text-emerald-700 outline-none" />
                                        <button onClick={() => copyToClipboard(getShareUrl(generatedToken))} className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-lg shadow-emerald-200">Copy</button>
                                    </div>
                                    <button onClick={() => setGeneratedToken(null)} className="text-xs text-emerald-600 font-bold hover:underline">Create Another</button>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">链接描述 / 用途</label>
                                        <input type="text" value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="e.g. For Client Review Q3" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">有效期</label>
                                            <select value={expiryDays} onChange={e => setExpiryDays(e.target.value === 'never' ? 'never' : parseInt(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none">
                                                <option value={1}>1 Day</option>
                                                <option value={7}>7 Days</option>
                                                <option value={30}>30 Days</option>
                                                <option value="never">Permanent (Never Expire)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">访问密码 (可选)</label>
                                            <div className="flex items-center gap-3 h-[46px]">
                                                <input type="checkbox" checked={usePassword} onChange={e => setUsePassword(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                <input 
                                                    type="text" 
                                                    disabled={!usePassword} 
                                                    value={password} 
                                                    onChange={e => setPassword(e.target.value)} 
                                                    placeholder="Set Access Code" 
                                                    className={`flex-1 px-4 py-3 border border-slate-100 rounded-xl font-mono text-sm outline-none transition-all ${usePassword ? 'bg-white focus:ring-2 focus:ring-indigo-100' : 'bg-slate-50 text-slate-400'}`} 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-3 items-start">
                                        <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p className="text-xs text-indigo-800 leading-relaxed">
                                            Anyone with this link will have <strong>Read-Only</strong> access to this dashboard. 
                                            They cannot edit charts or see other system pages.
                                        </p>
                                    </div>

                                    <button 
                                        onClick={handleCreate}
                                        disabled={!formLabel}
                                        className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${!formLabel ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
                                    >
                                        Generate Secure Link
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'manage' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            {tokens.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                                    <p className="text-slate-400 font-bold text-sm">No active share links.</p>
                                </div>
                            ) : (
                                tokens.map(token => (
                                    <div key={token.id} className={`p-4 rounded-2xl border transition-all ${token.status === 'active' ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-bold text-sm ${token.status === 'active' ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{token.label}</h4>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${token.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>{token.status}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 font-mono">Created: {new Date(token.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            {token.status === 'active' && (
                                                <button onClick={() => handleRevoke(token.id)} className="text-[10px] font-bold text-rose-500 hover:bg-rose-50 px-2 py-1 rounded transition-colors">Revoke</button>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                <span>{token.password ? 'Password Protected' : 'No Password'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span>{token.expiresAt ? `Expires: ${new Date(token.expiresAt).toLocaleDateString()}` : 'Never Expires'}</span>
                                            </div>
                                            <button onClick={() => copyToClipboard(getShareUrl(token.id))} className="ml-auto text-indigo-600 font-bold hover:underline">Copy Link</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ dashboards, charts, devices, dataViews, onUpdateDashboards, onSaveChart, onLaunchFullScreen }) => {
  // Changed from global boolean to specific ID to edit one at a time
  const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null);
  
  const [dashboardToAddChart, setDashboardToAddChart] = useState<string | null>(null);
  
  // Dashboard Management State
  const [isCreatingDashboard, setIsCreatingDashboard] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [controllerConfigDashId, setControllerConfigDashId] = useState<string | null>(null);
  const [sharingDashboard, setSharingDashboard] = useState<Dashboard | null>(null);

  // Auto Cycle State
  const [isAutoCycleModalOpen, setIsAutoCycleModalOpen] = useState(false);
  const [cycleInterval, setCycleInterval] = useState(15000);
  const [selectedDashboardIds, setSelectedDashboardIds] = useState<string[]>([]);

  // Collapse State
  const [expandedDashboardIds, setExpandedDashboardIds] = useState<string[]>([]);

  // Initialize selected dashboards for cycle when modal opens or dashboards change
  useEffect(() => {
      if (dashboards.length > 0 && selectedDashboardIds.length === 0) {
          setSelectedDashboardIds(dashboards.map(d => d.id));
      }
  }, [dashboards]);

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
      // Auto expand new dashboard
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
            // Remove from charts list AND layout
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
            // Add to charts list
            const newCharts = [...d.charts, chartId];
            
            // Generate default layout item
            // Logic: Find bottom-most item and place below it, or default to 0,0
            const maxY = d.layout ? Math.max(...d.layout.map(l => l.y + l.h), 0) : 0;
            const newItem: GridLayoutItem = {
                i: chartId,
                x: 0,
                y: maxY,
                w: 6, // Default width (half screen on lg)
                h: 4  // Default height
            };
            const newLayout = [...(d.layout || []), newItem];

            return { ...d, charts: newCharts, layout: newLayout };
        }
        return d;
    }));
    setDashboardToAddChart(null);
  };

  const handleSaveControllers = (dashId: string, controllers: ControllerConfig[]) => {
      onUpdateDashboards(dashboards.map(d => 
          d.id === dashId ? { ...d, controllers } : d
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

  // --- React Grid Layout Logic ---
  const generateLayout = (dashboard: Dashboard, isEditing: boolean): GridLayoutItem[] => {
      // If layout exists and matches chart count, use it.
      const validLayout = dashboard.layout?.filter(l => dashboard.charts.includes(l.i) || l.i === 'add-button');
      
      const missingCharts = dashboard.charts.filter(cId => !validLayout?.find(l => l.i === cId));
      
      if (validLayout && missingCharts.length === 0) {
          // Ensure add-button is present if editing
          if (isEditing && !validLayout.find(l => l.i === 'add-button')) {
             const maxY = Math.max(...validLayout.map(l => l.y + l.h), 0);
             return [...validLayout, { i: 'add-button', x: 0, y: maxY, w: 12, h: 2, static: true }];
          }
          // Remove add-button if not editing
          if (!isEditing) {
              return validLayout.filter(l => l.i !== 'add-button');
          }
          return validLayout;
      }

      let currentX = 0;
      let currentY = 0;
      const ROW_HEIGHT = 4;

      const generated: GridLayoutItem[] = dashboard.charts.map((chartId) => {
          const existingItem = validLayout?.find(l => l.i === chartId);
          if (existingItem) return existingItem;

          const chart = charts.find(c => c.id === chartId);
          const legacySpan = chart?.style?.colSpan || 1;
          const width = legacySpan === 3 ? 12 : legacySpan === 2 ? 8 : 4; 
          
          const item = {
              i: chartId,
              x: currentX,
              y: currentY,
              w: width,
              h: ROW_HEIGHT
          };

          currentX += width;
          if (currentX >= 12) {
              currentX = 0;
              currentY += ROW_HEIGHT;
          }
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
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm sticky top-0 z-40 bg-white/90 backdrop-blur">
          <div>
              <h2 className="text-lg font-black text-slate-800">看板配置管理</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dashboard Config & Layout</p>
          </div>
          <div className="flex gap-3">
               {/* Auto Cycle Button */}
               <button 
                  onClick={() => setIsAutoCycleModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all shadow-lg hover:shadow-slate-200"
               >
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>自动轮播所有看板</span>
               </button>

               <button 
                  onClick={() => setIsCreatingDashboard(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  <span>新建仪表盘</span>
              </button>
          </div>
      </div>

      {dashboards.map(dash => {
          const isEditing = editingDashboardId === dash.id;
          const currentLayout = generateLayout(dash, isEditing);
          const isExpanded = expandedDashboardIds.includes(dash.id);
          
          return (
          <div key={dash.id} className={`animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isEditing ? 'ring-2 ring-indigo-500/20' : ''}`}>
              {/* Dashboard Header Bar */}
              <div 
                className="flex items-center justify-between p-6 cursor-pointer bg-gradient-to-r from-white to-slate-50/50"
                onClick={() => toggleExpand(dash.id)}
              >
                  <div className="flex items-center gap-4">
                      {/* Collapse/Expand Icon */}
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
                  
                  {/* Actions Row - Only specific to this dashboard */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                          onClick={() => setEditingDashboardId(isEditing ? null : dash.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                              isEditing 
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                          }`}
                      >
                          {isEditing ? (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                完成
                              </>
                          ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                自定义布局
                              </>
                          )}
                      </button>

                      <button 
                          onClick={() => setControllerConfigDashId(dash.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:text-indigo-600 hover:border-indigo-300 transition-all"
                      >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                          筛选器
                      </button>

                      <button 
                          onClick={() => onLaunchFullScreen([dash], cycleInterval)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-700 hover:scale-105 transition-all shadow-md ml-2"
                      >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          大屏
                      </button>

                      {/* Updated Share Button (Advanced) */}
                      <button
                          onClick={() => setSharingDashboard(dash)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:text-indigo-600 hover:border-indigo-300 transition-all ml-2"
                      >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                          分享
                      </button>

                      {isEditing && (
                           <button 
                             onClick={() => handleDeleteDashboard(dash.id)}
                             className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all ml-2"
                             title="删除看板"
                           >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                      )}
                  </div>
              </div>
              
              {/* Expandable Content */}
              {isExpanded && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50/30 animate-in slide-in-from-top-4 duration-300">
                      {dash.controllers && dash.controllers.length > 0 && (
                          <div className="mb-6 pointer-events-none opacity-60 scale-95 origin-top-left">
                              <ControllerBar controllers={dash.controllers} filterState={{}} onFilterChange={() => {}} />
                          </div>
                      )}

                      {/* React Grid Layout */}
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

      {/* --- Modals (Keep existing ones) --- */}
      {controllerConfigDashId && (
          <ControllerEditorModal 
              dashboard={dashboards.find(d => d.id === controllerConfigDashId)!}
              onSave={(controllers) => handleSaveControllers(controllerConfigDashId, controllers)}
              onClose={() => setControllerConfigDashId(null)}
          />
      )}

      {/* Advanced Share Modal (Replaced) */}
      {sharingDashboard && (
          <AdvancedShareModal 
              dashboard={sharingDashboard}
              onClose={() => setSharingDashboard(null)}
          />
      )}

      {/* New Dashboard Modal */}
      {isCreatingDashboard && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[40px] shadow-2xl border border-white/40 w-full max-w-md p-8 space-y-6">
                <h3 className="text-xl font-black text-slate-800">新建仪表盘视图</h3>
                <input 
                    type="text" 
                    value={newDashboardName}
                    onChange={e => setNewDashboardName(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-slate-700 outline-none"
                    placeholder="e.g. 二车间生产大屏"
                    autoFocus
                />
                <div className="flex gap-4">
                    <button onClick={() => setIsCreatingDashboard(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-[24px] font-bold text-xs uppercase">取消</button>
                    <button onClick={handleCreateDashboard} className="flex-1 py-4 bg-indigo-600 text-white rounded-[24px] font-bold text-xs uppercase shadow-lg">创建</button>
                </div>
            </div>
          </div>
      )}

      {/* Add Chart Modal */}
      {dashboardToAddChart && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[40px] shadow-2xl border border-white/40 w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
               <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-800">添加图表</h3>
                  <button onClick={() => setDashboardToAddChart(null)} className="text-slate-400 hover:text-rose-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
               </div>
               <div className="p-6 overflow-y-auto custom-scrollbar space-y-3">
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
            </div>
         </div>
      )}

      {/* Auto Cycle Modal (Shared UI) */}
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
