
import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_DEVICES, MOCK_CATEGORIES, BI_SOURCES, BI_VIEWS, BI_CHARTS, BI_DASHBOARDS, INITIAL_MENU_CONFIG, MOCK_CUSTOM_PAGES } from './mockData';
import { METRIC_METADATA } from './constants';
import { Device, DeviceStatus, ChartConfig, DataView, DataSource, Dashboard, DeviceCategory, User, Role, LLMConfig, AuthConfig, DeviceMetric, DeviceType, ChartInteractionPayload, MetricConfig, MenuItem, SystemPageKey, CustomPage, DashboardFilterState } from './types';
import ReactMarkdown from 'react-markdown';

// Components
import { Sidebar } from './components/Sidebar';
import { BigScreenView } from './components/BigScreenView';
import { AICopilot } from './components/AICopilot'; // [V3.0] New Component

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { DashboardMonitorPage } from './pages/DashboardMonitorPage';
import { MonitorPage } from './pages/MonitorPage';
import { HistoryAnalysisPage } from './pages/HistoryAnalysisPage'; 
import { InventoryPage } from './pages/InventoryPage';
import { DeviceCategoryPage } from './pages/DeviceCategoryPage';
import { MetricManagerPage } from './pages/MetricManagerPage'; 
import { SourcePage } from './pages/SourcePage';
import { ViewPage } from './pages/ViewPage';
import { ChartLabPage } from './pages/ChartLabPage';
import { UsersPage, RolesPage, SecurityPage, LLMConfigPage } from './pages/SystemPages';
import { MenuManagerPage } from './pages/MenuManagerPage';
import { PageConfigPage } from './pages/PageConfigPage';

interface DrillDownItem {
    viewType: 'dashboard';
    id: string;
    label: string;
    filters: DashboardFilterState;
}

const App: React.FC = () => {
  // --- Global Domain State ---
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [categories, setCategories] = useState<DeviceCategory[]>(MOCK_CATEGORIES);
  const [metricConfig, setMetricConfig] = useState<MetricConfig>(METRIC_METADATA); 
  const [dataSources, setDataSources] = useState<DataSource[]>(BI_SOURCES);
  const [dataViews, setDataViews] = useState<DataView[]>(BI_VIEWS);
  const [charts, setCharts] = useState<ChartConfig[]>(BI_CHARTS);
  const [dashboards, setDashboards] = useState<Dashboard[]>(BI_DASHBOARDS);
  const [customPages, setCustomPages] = useState<CustomPage[]>(MOCK_CUSTOM_PAGES);
  
  // --- V3: Dynamic Menu State ---
  const [menuConfig, setMenuConfig] = useState<MenuItem[]>(INITIAL_MENU_CONFIG);
  const [activeMenuId, setActiveMenuId] = useState<string>('menu_mon_1'); 

  // --- [V3.2] Drill Down Stack ---
  const [drillDownStack, setDrillDownStack] = useState<DrillDownItem[]>([]);

  // --- System Management State ---
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Admin', email: 'admin@aurasense.io', roleId: '1', status: 'Active', lastLogin: '2023-10-27T10:00:00Z' },
    { id: '2', name: 'Engineer_01', email: 'eng1@aurasense.io', roleId: '2', status: 'Active' },
  ]);
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: '超级管理员', permissions: ['ALL'], description: '系统最高权限，可管理所有模块' },
    { id: '2', name: '运维工程师', permissions: ['manage_devices', 'view_dashboard'], description: '负责设备维护与监控' },
    { id: '3', name: '数据分析师', permissions: ['view_reports', 'manage_charts'], description: '负责数据分析与可视化' },
  ]);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
      provider: 'Gemini',
      apiKey: '',
      modelName: 'gemini-1.5-pro',
      temperature: 0.7,
      maxTokens: 2048
  });
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
      enabled: false,
      provider: 'OIDC',
      clientId: '',
      clientSecret: '',
      issuerUrl: '',
      redirectUri: 'https://aurasense.io/auth/callback'
  });

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // --- Big Screen State ---
  const [fullScreenDashboards, setFullScreenDashboards] = useState<Dashboard[] | null>(null);
  const [cycleInterval, setCycleInterval] = useState(15000); 

  // --- Inventory Filter State ---
  const [inventoryFilters, setInventoryFilters] = useState({
      search: '',
      type: 'ALL',
      status: 'ALL'
  });

  // Reset drill down stack when menu changes
  useEffect(() => {
      setDrillDownStack([]);
  }, [activeMenuId]);

  const activeMenuItem = useMemo(() => {
      const findMenuItem = (items: MenuItem[], id: string): MenuItem | undefined => {
          for (const item of items) {
              if (item.id === id) return item;
              if (item.children) {
                  const found = findMenuItem(item.children, id);
                  if (found) return found;
              }
          }
          return undefined;
      };
      return findMenuItem(menuConfig, activeMenuId);
  }, [menuConfig, activeMenuId]);

  // --- Interaction Handler (Drill Down) ---
  const handleChartClick = (payload: ChartInteractionPayload) => {
      // ... (keep existing logic)
      console.log('Chart Clicked:', payload);
      
      const chart = charts.find(c => c.id === payload.chartId);
      if (chart?.interaction && chart.interaction.type !== 'none') {
          const config = chart.interaction;
          
          if (config.type === 'navigate_dashboard' && config.targetId) {
              const targetDash = dashboards.find(d => d.id === config.targetId);
              if (targetDash) {
                  const filters: DashboardFilterState = {};
                  config.params?.forEach(p => {
                      let val: any;
                      if (p.sourceKey === 'name') val = payload.name;
                      else if (p.sourceKey === 'value') val = payload.value;
                      else if (p.sourceKey === 'series') val = payload.series;
                      else if (p.sourceKey === 'row_field' && p.sourceField && payload.row) {
                          val = payload.row[p.sourceField];
                      }
                      if (val !== undefined) filters[p.targetKey] = val;
                  });

                  setDrillDownStack(prev => [...prev, {
                      viewType: 'dashboard',
                      id: targetDash.id,
                      label: targetDash.name,
                      filters
                  }]);
                  return;
              }
          }
          // ... other interaction types
      }
  };

  // --- Real-time Data Simulation ---
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prev => prev.map(dev => {
        if (dev.status === DeviceStatus.OFFLINE) return dev;
        const updatedMetrics: Record<string, DeviceMetric[]> = {};
        Object.keys(dev.metrics).forEach(key => {
            const history = dev.metrics[key];
            if (!history || history.length === 0) return;
            const last = history[history.length - 1];
            const newVal = Math.max(0, last.value + (Math.random() * 4 - 2)); 
            const newHistory = [...history.slice(history.length > 20 ? 1 : 0), { 
                ...last, 
                value: Number(newVal.toFixed(1)), 
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            }];
            updatedMetrics[key] = newHistory;
        });
        return { ...dev, metrics: updatedMetrics };
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Derived Stats ---
  const stats = useMemo(() => ({
    online: devices.filter(d => d.status === DeviceStatus.ONLINE).length,
  }), [devices]);

  // --- Copilot Navigation Handler ---
  const handleCopilotNavigate = (targetKey: string) => {
      // Simple mapping logic. In a real app, use a proper router/lookup
      let foundId = '';
      
      // 1. Try to find in system pages
      const systemPageMap: Record<string, string> = {
          'monitor': 'menu_mon_2',
          'inventory': 'menu_ast_1',
          'dashboard_monitor': 'menu_mon_1',
          'history_analysis': 'menu_mon_3',
      };
      
      if (systemPageMap[targetKey]) {
          foundId = systemPageMap[targetKey];
      } else {
          // 2. Try to find exact menu ID or dashboard ID match
          // Simplified: just check if targetKey matches a menu ID
          foundId = 'menu_mon_1'; // Fallback
      }
      
      // Since we don't have a full flat map of menu IDs readily available in this simple logic, 
      // we'll just set it if we mapped it, otherwise default to home.
      // Ideally, recurse menuConfig to find the ID.
      
      const findMenuIdByTarget = (items: MenuItem[], target: string): string | null => {
          for(const item of items) {
              if (item.targetId === target) return item.id;
              if (item.children) {
                  const res = findMenuIdByTarget(item.children, target);
                  if (res) return res;
              }
          }
          return null;
      };

      const smartId = findMenuIdByTarget(menuConfig, targetKey);
      if (smartId) setActiveMenuId(smartId);
      else if (systemPageMap[targetKey]) setActiveMenuId(systemPageMap[targetKey]);
      else alert(`AI tried to navigate to '${targetKey}' but page was not found.`);
  };

  // --- Handlers (CRUD) ---
  const handleSaveDevice = (devicePartial: Partial<Device>) => { /* ... */
    if (!devicePartial.name) return;
    const existingIndex = devices.findIndex(d => d.id === devicePartial.id);
    if (existingIndex >= 0 && devicePartial.id) {
       const updatedDevices = [...devices];
       updatedDevices[existingIndex] = { ...updatedDevices[existingIndex], ...devicePartial } as Device;
       setDevices(updatedDevices);
    } else {
       const newDevice = { ...devicePartial, id: devicePartial.id || `DEV-${Date.now().toString().slice(-4)}`, metrics: devicePartial.metrics || {} } as Device;
       setDevices(prev => [...prev, newDevice]);
    }
  };
  const handleDeleteDevice = (id: string) => { if (window.confirm('确定要删除此设备资产吗？')) setDevices(prev => prev.filter(d => d.id !== id)); };
  const handleSaveCategory = (c: DeviceCategory) => setCategories(prev => { const exists = prev.some(item => item.id === c.id); return exists ? prev.map(item => item.id === c.id ? c : item) : [...prev, c]; });
  const handleDeleteCategory = (id: string) => { if (window.confirm('Confirm delete?')) setCategories(prev => prev.filter(c => c.id !== id)); };
  const handleUpdateMetricConfig = (c: MetricConfig) => setMetricConfig(c);
  const handleSaveSource = (s: DataSource) => setDataSources(prev => { const exists = prev.some(item => item.id === s.id); return exists ? prev.map(item => item.id === s.id ? s : item) : [...prev, s]; });
  const handleSaveView = (v: DataView, isNew: boolean) => { if (isNew) setDataViews(prev => [...prev, v]); else setDataViews(prev => prev.map(item => item.id === v.id ? v : item)); };
  const handleDeleteView = (id: string) => setDataViews(prev => prev.filter(v => v.id !== id));
  const handleSaveChart = (c: ChartConfig) => setCharts(prev => { const exists = prev.some(item => item.id === c.id); return exists ? prev.map(item => item.id === c.id ? c : item) : [...prev, c]; });
  const handleDeleteChart = (id: string) => setCharts(prev => prev.filter(c => c.id !== id));
  const handleUpdateDashboards = (d: Dashboard[]) => setDashboards(d);
  const handleSaveUser = (u: User) => setUsers(prev => { const exists = prev.some(item => item.id === u.id); return exists ? prev.map(item => item.id === u.id ? u : item) : [...prev, u]; });
  const handleDeleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));
  const handleSaveRole = (r: Role) => setRoles(prev => { const exists = prev.some(item => item.id === r.id); return exists ? prev.map(item => item.id === r.id ? r : item) : [...prev, r]; });
  const handleDeleteRole = (id: string) => setRoles(prev => prev.filter(r => r.id !== id));
  const handleLaunchFullScreen = (d: Dashboard[], i?: number) => { setCycleInterval(i || 15000); setFullScreenDashboards(d); };
  const handleUpdateMenu = (m: MenuItem[]) => setMenuConfig(m);
  const handleSavePage = (p: CustomPage) => setCustomPages(prev => { const exists = prev.some(item => item.id === p.id); return exists ? prev.map(item => item.id === p.id ? p : item) : [...prev, p]; });
  const handleDeletePage = (id: string) => { if (window.confirm('Confirm delete?')) setCustomPages(prev => prev.filter(p => p.id !== id)); };

  if (fullScreenDashboards && fullScreenDashboards.length > 0) {
      return <BigScreenView dashboards={fullScreenDashboards} charts={charts} devices={devices} dataViews={dataViews} onExit={() => setFullScreenDashboards(null)} cycleInterval={cycleInterval} />;
  }

  // --- Router Logic ---
  const renderContent = () => {
      // ... (keep existing render logic)
      if (drillDownStack.length > 0) {
          const currentDrill = drillDownStack[drillDownStack.length - 1];
          if (currentDrill.viewType === 'dashboard') {
              const dash = dashboards.filter(d => d.id === currentDrill.id);
              if (dash.length === 0) return <div>Dashboard not found</div>;
              return (
                  <DashboardMonitorPage 
                      dashboards={dash} 
                      charts={charts} 
                      devices={devices} 
                      dataViews={dataViews} 
                      onLaunchFullScreen={handleLaunchFullScreen} 
                      onChartClick={handleChartClick} 
                      singleView={true}
                      initialFilters={currentDrill.filters}
                  />
              );
          }
      }

      if (!activeMenuItem) return <div>404 Menu Item Not Found</div>;

      if (activeMenuItem.type === 'PAGE') {
          if (activeMenuItem.targetType === 'dashboard') {
              const specificDash = dashboards.filter(d => d.id === activeMenuItem.targetId);
              if (specificDash.length === 0) return <div className="p-8 text-center text-slate-400 font-bold">Dashboard not found: {activeMenuItem.targetId}</div>;
              return <DashboardMonitorPage dashboards={specificDash} charts={charts} devices={devices} dataViews={dataViews} onLaunchFullScreen={handleLaunchFullScreen} onChartClick={handleChartClick} singleView={true} />;
          }

          if (activeMenuItem.targetType === 'custom_content') {
              const customPage = customPages.find(p => p.id === activeMenuItem.targetId);
              if (!customPage) return <div className="p-8 text-center text-slate-400 font-bold">Content not found</div>;
              if (customPage.type === 'IFRAME') return <div className="h-full w-full bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden relative"><iframe src={customPage.content} className="w-full h-full border-none" title={customPage.name} /></div>;
              if (customPage.type === 'DASHBOARD') {
                  const linkedDash = dashboards.filter(d => d.id === customPage.content);
                  if (linkedDash.length === 0) return <div className="p-8 text-center text-slate-400 font-bold">Linked Dashboard not found</div>;
                  return <div className="h-full flex flex-col"><div className="mb-4 px-2"><h3 className="text-xl font-black text-slate-800">{customPage.name}</h3></div><div className="flex-1 min-h-0"><DashboardMonitorPage dashboards={linkedDash} charts={charts} devices={devices} dataViews={dataViews} onLaunchFullScreen={handleLaunchFullScreen} onChartClick={handleChartClick} singleView={true} /></div></div>;
              }
              // MARKDOWN RENDER
              return (
                  <div className="h-full w-full bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 overflow-y-auto custom-scrollbar">
                      <div className="max-w-4xl mx-auto prose prose-slate prose-headings:font-black prose-a:text-indigo-600 prose-img:rounded-xl">
                          <ReactMarkdown>{customPage.content}</ReactMarkdown>
                      </div>
                  </div>
              );
          }

          if (activeMenuItem.targetType === 'system_page') {
              switch (activeMenuItem.targetId as SystemPageKey) {
                  case 'dashboard_monitor': return <DashboardMonitorPage dashboards={dashboards} charts={charts} devices={devices} dataViews={dataViews} onLaunchFullScreen={handleLaunchFullScreen} onChartClick={handleChartClick} />;
                  case 'monitor': return <MonitorPage devices={devices} categories={categories} metricConfig={metricConfig} />;
                  case 'history_analysis': return <HistoryAnalysisPage devices={devices} metricConfig={metricConfig} />;
                  case 'inventory': return <InventoryPage devices={devices} categories={categories} onSaveDevice={handleSaveDevice} onDeleteDevice={handleDeleteDevice} filters={inventoryFilters} onFilterChange={setInventoryFilters} />;
                  case 'device_class': return <DeviceCategoryPage categories={categories} dataSources={dataSources} onSaveCategory={handleSaveCategory} onDeleteCategory={handleDeleteCategory} />;
                  case 'metric_def': return <MetricManagerPage metricConfig={metricConfig} onUpdateConfig={handleUpdateMetricConfig} />;
                  case 'source': return <SourcePage dataSources={dataSources} onSaveSource={handleSaveSource} />;
                  case 'view': return <ViewPage dataViews={dataViews} dataSources={dataSources} onSaveView={handleSaveView} onDeleteView={handleDeleteView} />;
                  case 'chart': return <ChartLabPage charts={charts} dataViews={dataViews} devices={devices} dashboards={dashboards} onSaveChart={handleSaveChart} onDeleteChart={handleDeleteChart} />;
                  case 'dashboard_manage': return <DashboardPage dashboards={dashboards} charts={charts} devices={devices} dataViews={dataViews} onUpdateDashboards={handleUpdateDashboards} onSaveChart={handleSaveChart} onLaunchFullScreen={handleLaunchFullScreen} />;
                  case 'users': return <UsersPage users={users} roles={roles} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} />;
                  case 'roles': return <RolesPage roles={roles} onSaveRole={handleSaveRole} onDeleteRole={handleDeleteRole} />;
                  case 'security': return <SecurityPage authConfig={authConfig} onSaveConfig={setAuthConfig} />;
                  case 'llm': return <LLMConfigPage llmConfig={llmConfig} onSaveConfig={setLlmConfig} />;
                  case 'menu_manage': return <MenuManagerPage menuConfig={menuConfig} dashboards={dashboards} customPages={customPages} roles={roles} onUpdateMenu={handleUpdateMenu} />;
                  case 'page_config': return <PageConfigPage customPages={customPages} dashboards={dashboards} onSavePage={handleSavePage} onDeletePage={handleDeletePage} />;
                  default: return <div>Unknown Page</div>;
              }
          }
      }
      return <div className="p-8 text-center text-slate-400 font-bold">Please select a page</div>;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4f8]">
      <Sidebar menuConfig={menuConfig} activeMenuId={activeMenuId} onMenuClick={setActiveMenuId} isSidebarExpanded={isSidebarExpanded} setIsSidebarExpanded={setIsSidebarExpanded} />
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        <header className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2">
                {drillDownStack.length > 0 && (
                    <button onClick={() => setDrillDownStack(prev => prev.slice(0, -1))} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                )}
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                    {drillDownStack.length > 0 ? drillDownStack[drillDownStack.length - 1].label : (activeMenuItem?.label || 'AuraSense AI')}
                </h2>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-1">
                {drillDownStack.length > 0 ? 'Drill-down View' : (activeMenuItem?.type === 'PAGE' ? (activeMenuItem.targetType === 'dashboard' ? 'Custom Dashboard' : activeMenuItem.targetType === 'custom_content' ? 'Custom Page' : activeMenuItem.targetId?.toUpperCase().replace('_', ' ')) : 'Section')}
            </p>
          </div>
          <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
            <div className="px-4 py-2 text-[10px] font-black text-emerald-600 flex items-center gap-1.5 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {stats.online} 在线</div>
          </div>
        </header>
        {renderContent()}
      </main>
      
      {/* V3.0 AI Copilot Floating Component */}
      <AICopilot 
          devices={devices} 
          dashboards={dashboards} 
          onNavigate={handleCopilotNavigate} 
      />
    </div>
  );
};

export default App;
