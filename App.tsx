
import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_DEVICES, MOCK_CATEGORIES, BI_SOURCES, BI_VIEWS, BI_CHARTS, BI_DASHBOARDS } from './mockData';
import { METRIC_METADATA } from './constants';
import { Device, DeviceStatus, ChartConfig, DataView, DataSource, Dashboard, DeviceCategory, User, Role, LLMConfig, AuthConfig, DeviceMetric, DeviceType, ChartInteractionPayload, MetricConfig, ScadaNode } from './types';

// Components
import { Sidebar } from './components/Sidebar';
import { BigScreenView } from './components/BigScreenView';

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
import { TopologyPage } from './pages/TopologyPage';

const App: React.FC = () => {
  // --- Global Domain State ---
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [categories, setCategories] = useState<DeviceCategory[]>(MOCK_CATEGORIES);
  const [metricConfig, setMetricConfig] = useState<MetricConfig>(METRIC_METADATA); // Lifted State for Metrics
  const [dataSources, setDataSources] = useState<DataSource[]>(BI_SOURCES);
  const [dataViews, setDataViews] = useState<DataView[]>(BI_VIEWS);
  const [charts, setCharts] = useState<ChartConfig[]>(BI_CHARTS);
  const [dashboards, setDashboards] = useState<Dashboard[]>(BI_DASHBOARDS);
  
  // --- SCADA State ---
  const [scadaNodes, setScadaNodes] = useState<ScadaNode[]>([
      { id: 'tank-1', type: 'tank', x: 100, y: 100, w: 80, h: 120, label: 'T-01' },
      { id: 'pump-1', type: 'pump', x: 250, y: 300, w: 60, h: 60, label: 'P-A' },
      { id: 'pipe-1', type: 'pipe', x: 140, y: 220, w: 20, h: 80 },
      { id: 'pipe-2', type: 'pipe', x: 140, y: 300, w: 110, h: 20 },
      { id: 'val-1', type: 'value', x: 100, y: 80, w: 80, h: 30, text: '0.0', fill: '#6366f1' }
  ]);

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


  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState<'dashboard_monitor' | 'monitor' | 'scada' | 'history_analysis' | 'inventory' | 'device_class' | 'metric_def' | 'source' | 'view' | 'dashboard_manage' | 'chart' | 'users' | 'roles' | 'security' | 'llm'>('dashboard_monitor');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // --- Big Screen State (Changed from ID to Array for Carousel support) ---
  const [fullScreenDashboards, setFullScreenDashboards] = useState<Dashboard[] | null>(null);
  const [cycleInterval, setCycleInterval] = useState(15000); // Default 15s

  // --- Inventory Filter State (Lifted for P2 Interactions) ---
  const [inventoryFilters, setInventoryFilters] = useState({
      search: '',
      type: 'ALL',
      status: 'ALL'
  });

  // --- Interaction Handler (Drill Down) ---
  const handleChartClick = (payload: ChartInteractionPayload) => {
      console.log('Chart Clicked:', payload);
      
      // Intelligent Routing Logic
      // 1. Check if name matches a Device Status
      const statusMatch = Object.values(DeviceStatus).find(s => s.toLowerCase() === payload.name.toLowerCase());
      if (statusMatch) {
          setInventoryFilters({ search: '', type: 'ALL', status: statusMatch });
          setActiveTab('inventory');
          return;
      }

      // 2. Check if name matches a Device Type
      const typeMatch = Object.values(DeviceType).find(t => t.toLowerCase() === payload.name.toLowerCase());
      if (typeMatch) {
          setInventoryFilters({ search: '', type: typeMatch, status: 'ALL' });
          setActiveTab('inventory');
          return;
      }

      // 3. Default: Assume it's a Device Name or specific ID -> Search
      setInventoryFilters({ search: payload.name, type: 'ALL', status: 'ALL' });
      setActiveTab('inventory');
  };


  // --- Real-time Data Simulation ---
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prev => prev.map(dev => {
        if (dev.status === DeviceStatus.OFFLINE) return dev;
        
        // Dynamic Metric Update
        const updatedMetrics: Record<string, DeviceMetric[]> = {};
        Object.keys(dev.metrics).forEach(key => {
            const history = dev.metrics[key];
            if (!history || history.length === 0) return;
            
            const last = history[history.length - 1];
            // Simulate random fluctuation
            const newVal = Math.max(0, last.value + (Math.random() * 4 - 2)); 
            
            // Keep roughly 20 points
            const newHistory = [...history.slice(history.length > 20 ? 1 : 0), { 
                ...last, 
                value: Number(newVal.toFixed(1)), 
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            }];
            updatedMetrics[key] = newHistory;
        });

        return {
          ...dev,
          metrics: updatedMetrics
        };
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Derived Stats ---
  const stats = useMemo(() => ({
    online: devices.filter(d => d.status === DeviceStatus.ONLINE).length,
  }), [devices]);

  // --- Handlers passed to pages ---

  // Inventory Handlers
  const handleSaveDevice = (devicePartial: Partial<Device>) => {
    // Logic to merge or add device
    if (!devicePartial.name) return;
    
    // Check if it's an update (has ID and exists)
    const existingIndex = devices.findIndex(d => d.id === devicePartial.id);
    
    if (existingIndex >= 0 && devicePartial.id) {
       // Update
       const updatedDevices = [...devices];
       updatedDevices[existingIndex] = { ...updatedDevices[existingIndex], ...devicePartial } as Device;
       setDevices(updatedDevices);
    } else {
       // Create
       const newDevice = {
           ...devicePartial,
           id: devicePartial.id || `DEV-${Date.now().toString().slice(-4)}`,
           metrics: devicePartial.metrics || {} // Ensure metrics object exists
       } as Device;
       setDevices(prev => [...prev, newDevice]);
    }
  };

  const handleDeleteDevice = (id: string) => {
    if (window.confirm('确定要删除此设备资产吗？此操作不可恢复。')) {
        setDevices(prev => prev.filter(d => d.id !== id));
    }
  };

  // Category Handlers
  const handleSaveCategory = (category: DeviceCategory) => {
      setCategories(prev => {
          const exists = prev.some(c => c.id === category.id);
          return exists ? prev.map(c => c.id === category.id ? category : c) : [...prev, category];
      });
  };

  const handleDeleteCategory = (id: string) => {
      if (window.confirm('确定要删除此分类吗？')) {
          setCategories(prev => prev.filter(c => c.id !== id));
      }
  };

  // Metric Handler
  const handleUpdateMetricConfig = (newConfig: MetricConfig) => {
      setMetricConfig(newConfig);
  };

  // Source Handlers
  const handleSaveSource = (source: DataSource) => {
      setDataSources(prev => {
          const exists = prev.some(s => s.id === source.id);
          return exists ? prev.map(s => s.id === source.id ? source : s) : [...prev, source];
      });
  };

  // View Handlers
  const handleSaveView = (view: DataView, isNew: boolean) => {
      if (isNew) {
          setDataViews(prev => [...prev, view]);
      } else {
          setDataViews(prev => prev.map(v => v.id === view.id ? view : v));
      }
  };

  const handleDeleteView = (id: string) => {
      setDataViews(prev => prev.filter(v => v.id !== id));
  };

  // Chart Handlers
  const handleSaveChart = (chart: ChartConfig) => {
      setCharts(prev => {
          const exists = prev.some(c => c.id === chart.id);
          return exists ? prev.map(c => c.id === chart.id ? chart : c) : [...prev, chart];
      });
  };

  const handleDeleteChart = (id: string) => {
      setCharts(prev => prev.filter(c => c.id !== id));
  };

  // Dashboard Handlers
  const handleUpdateDashboards = (newDashboards: Dashboard[]) => {
      setDashboards(newDashboards);
  };
  
  // System Management Handlers
  const handleSaveUser = (user: User) => {
      setUsers(prev => {
          const exists = prev.some(u => u.id === user.id);
          return exists ? prev.map(u => u.id === user.id ? user : u) : [...prev, user];
      });
  };
  const handleDeleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const handleSaveRole = (role: Role) => {
      setRoles(prev => {
          const exists = prev.some(r => r.id === role.id);
          return exists ? prev.map(r => r.id === role.id ? role : r) : [...prev, role];
      });
  };
  const handleDeleteRole = (id: string) => setRoles(prev => prev.filter(r => r.id !== id));

  // --- Full Screen / Cycle Handler ---
  // Updated to accept an explicit list of dashboards to cycle through
  const handleLaunchFullScreen = (targetDashboards: Dashboard[], interval: number = 15000) => {
      setCycleInterval(interval);
      setFullScreenDashboards(targetDashboards);
  };


  // --- Render Big Screen Mode if active (Supports Single or Carousel) ---
  if (fullScreenDashboards && fullScreenDashboards.length > 0) {
      return (
          <BigScreenView 
              dashboards={fullScreenDashboards} 
              charts={charts} 
              devices={devices} 
              dataViews={dataViews} 
              onExit={() => setFullScreenDashboards(null)} 
              cycleInterval={cycleInterval} // Use configured interval
          />
      );
  }


  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4f8]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarExpanded={isSidebarExpanded} 
        setIsSidebarExpanded={setIsSidebarExpanded} 
      />

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {activeTab === 'dashboard_monitor' && '监测看板'}
              {activeTab === 'monitor' && '实时监控中心'}
              {activeTab === 'scada' && 'SCADA 组态编辑器'}
              {activeTab === 'history_analysis' && '历史数据分析'}
              {activeTab === 'inventory' && '设备资产清单'}
              {activeTab === 'device_class' && '设备分类管理'}
              {activeTab === 'metric_def' && '指标定义管理'}
              {activeTab === 'source' && '数据源连接管理'}
              {activeTab === 'view' && '数据视图定义'}
              {activeTab === 'dashboard_manage' && '看板配置管理'}
              {activeTab === 'chart' && '可视化实验室'}
              {activeTab === 'users' && '用户账户管理'}
              {activeTab === 'roles' && '系统角色控制'}
              {activeTab === 'security' && '安全权限与SSO'}
              {activeTab === 'llm' && 'LLM 模型配置'}
            </h2>
          </div>
          <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
            <div className="px-4 py-2 text-[10px] font-black text-emerald-600 flex items-center gap-1.5 uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {stats.online} 在线
            </div>
          </div>
        </header>

        {/* Page Routing */}
        {activeTab === 'dashboard_monitor' && (
            <DashboardMonitorPage 
                dashboards={dashboards} 
                charts={charts} 
                devices={devices}
                dataViews={dataViews} 
                onLaunchFullScreen={handleLaunchFullScreen} 
                onChartClick={handleChartClick} 
            />
        )}
        {activeTab === 'monitor' && <MonitorPage devices={devices} categories={categories} metricConfig={metricConfig} />}
        {activeTab === 'scada' && <TopologyPage nodes={scadaNodes} setNodes={setScadaNodes} devices={devices} />}
        {activeTab === 'history_analysis' && <HistoryAnalysisPage devices={devices} metricConfig={metricConfig} />}
        {activeTab === 'inventory' && (
            <InventoryPage 
                devices={devices} 
                categories={categories} 
                onSaveDevice={handleSaveDevice} 
                onDeleteDevice={handleDeleteDevice} 
                filters={inventoryFilters}
                onFilterChange={setInventoryFilters}
            />
        )}
        {activeTab === 'device_class' && <DeviceCategoryPage categories={categories} dataSources={dataSources} onSaveCategory={handleSaveCategory} onDeleteCategory={handleDeleteCategory} />}
        {activeTab === 'metric_def' && <MetricManagerPage metricConfig={metricConfig} onUpdateConfig={handleUpdateMetricConfig} />}
        {activeTab === 'source' && <SourcePage dataSources={dataSources} onSaveSource={handleSaveSource} />}
        {activeTab === 'view' && <ViewPage dataViews={dataViews} dataSources={dataSources} onSaveView={handleSaveView} onDeleteView={handleDeleteView} />}
        {activeTab === 'dashboard_manage' && (
            <DashboardPage 
                dashboards={dashboards} 
                charts={charts} 
                devices={devices} 
                dataViews={dataViews} 
                onUpdateDashboards={handleUpdateDashboards} 
                onSaveChart={handleSaveChart} 
                onLaunchFullScreen={handleLaunchFullScreen} 
            />
        )}
        {activeTab === 'chart' && <ChartLabPage charts={charts} dataViews={dataViews} devices={devices} onSaveChart={handleSaveChart} onDeleteChart={handleDeleteChart} />}
        {activeTab === 'users' && <UsersPage users={users} roles={roles} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} />}
        {activeTab === 'roles' && <RolesPage roles={roles} onSaveRole={handleSaveRole} onDeleteRole={handleDeleteRole} />}
        {activeTab === 'security' && <SecurityPage authConfig={authConfig} onSaveConfig={setAuthConfig} />}
        {activeTab === 'llm' && <LLMConfigPage llmConfig={llmConfig} onSaveConfig={setLlmConfig} />}
      </main>

      {/* AI 悬浮窗 */}
      <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl border border-slate-700 flex items-center gap-4 hover:scale-105 transition-all cursor-pointer z-50">
         <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center animate-pulse"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg></div>
         <div><p className="text-[9px] font-black text-slate-500 uppercase leading-none mb-1 tracking-widest">Live Intelligence</p><p className="text-xs font-bold">健康度: 98.4%</p></div>
      </div>
    </div>
  );
};

export default App;
