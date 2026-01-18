
import React from 'react';

interface NavItemProps {
  id: string;
  icon: string;
  label: string;
  activeTab: string;
  isSidebarExpanded: boolean;
  onClick: (id: any) => void;
}

const NavItem: React.FC<NavItemProps> = ({ id, icon, label, activeTab, isSidebarExpanded, onClick }) => {
  const isActive = activeTab === id;
  return (
    <button 
      onClick={() => onClick(id)} 
      className={`relative flex items-center p-3.5 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] w-full group overflow-hidden mb-1 ${
        isActive 
          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-100' 
          : 'text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm'
      } ${!isSidebarExpanded ? 'justify-center' : ''}`}
    >
      {/* Icon Wrapper with Scaling Effect */}
      <div className={`relative z-10 flex items-center justify-center transition-all duration-300 ${isSidebarExpanded ? 'mr-3' : 'scale-110'}`}>
        <svg className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
        </svg>
      </div>

      {/* Label Wrapper - Animated Slide/Fade */}
      <div className={`flex items-center whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out origin-left ${isSidebarExpanded ? 'w-auto opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4'}`}>
        <span className="relative z-10 text-[13px] font-bold tracking-tight">{label}</span>
      </div>

      {/* Active Indicator Line (Only visible when collapsed) */}
      {!isSidebarExpanded && isActive && (
         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full animate-in fade-in duration-300"></div>
      )}
    </button>
  );
};

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isSidebarExpanded, setIsSidebarExpanded }) => {
  return (
    <aside 
      className={`glass-panel border-r border-slate-200 flex flex-col z-30 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] relative ${
        isSidebarExpanded ? 'w-[280px]' : 'w-[90px]'
      }`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} 
        className="absolute -right-3 top-12 bg-white border border-slate-200 rounded-full p-1.5 shadow-xl hover:text-indigo-600 hover:scale-110 transition-all duration-300 z-40"
      >
        <svg 
            className={`w-4 h-4 transition-transform duration-500 ease-in-out ${isSidebarExpanded ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Header / Logo Area */}
      <div className={`flex items-center pt-8 pb-10 px-6 transition-all duration-300 ${isSidebarExpanded ? 'justify-start' : 'justify-center'}`}>
        <div className={`w-11 h-11 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-[18px] flex items-center justify-center text-white font-black shadow-xl flex-shrink-0 transition-transform duration-300 ${isSidebarExpanded ? 'scale-100' : 'scale-110'}`}>
            AS
        </div>
        
        {/* Animated App Title */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out flex flex-col justify-center ${isSidebarExpanded ? 'w-40 opacity-100 ml-4 translate-x-0' : 'w-0 opacity-0 ml-0 -translate-x-4'}`}>
            <h1 className="text-lg font-black text-slate-800 leading-tight uppercase whitespace-nowrap">AuraSense</h1>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest opacity-80 whitespace-nowrap">AI IoT OS</span>
        </div>
      </div>
      
      {/* Navigation Groups */}
      <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 gap-6">
        {/* Group 1: 监测与分析 */}
        <div>
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'h-auto opacity-100 mb-3 px-3' : 'h-0 opacity-0 mb-0'}`}>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60 whitespace-nowrap">监测与分析</p>
          </div>
          <NavItem id="dashboard_monitor" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" label="监测看板" />
          <NavItem id="monitor" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M13 10V3L4 14h7v7l9-11h-7z" label="实时监控中心" />
          <NavItem id="history_analysis" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" label="历史数据分析" />
        </div>

        {/* Group 2: 资产管理 */}
        <div>
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'h-auto opacity-100 mb-3 px-3' : 'h-0 opacity-0 mb-0'}`}>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60 whitespace-nowrap">资产管理</p>
          </div>
          <NavItem id="inventory" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" label="设备资产管理" />
          <NavItem id="device_class" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4zm2 5a2 2 0 110-4 2 2 0 010 4z" label="设备分类定义" />
          <NavItem id="metric_def" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z M13.5 9a4.5 4.5 0 114.5 4.5H13.5V9z" label="指标定义管理" />
        </div>

        {/* Group 3: 数据管理 */}
        <div>
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'h-auto opacity-100 mb-3 px-3' : 'h-0 opacity-0 mb-0'}`}>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60 whitespace-nowrap">数据管理</p>
          </div>
          <NavItem id="source" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" label="数据源配置" />
          <NavItem id="view" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm3-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zm-9-8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm12 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2 2V7z" label="数据视图定义" />
          <NavItem id="chart" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" label="图表实验室" />
          <NavItem id="dashboard_manage" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" label="看板配置" />
          <NavItem id="scada" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" label="SCADA 组态" />
        </div>

        {/* Group 4 (Footer) */}
        <div className="mt-auto">
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'h-auto opacity-100 mb-3 px-3' : 'h-0 opacity-0 mb-0'}`}>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60 whitespace-nowrap">系统管理</p>
          </div>
          <NavItem id="users" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" label="用户管理" />
          <NavItem id="roles" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" label="角色管理" />
          <NavItem id="security" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" label="安全权限" />
          <NavItem id="llm" activeTab={activeTab} isSidebarExpanded={isSidebarExpanded} onClick={setActiveTab} icon="M13 10V3L4 14h7v7l9-11h-7z" label="LLM 配置" />
        </div>
      </div>
    </aside>
  );
};
