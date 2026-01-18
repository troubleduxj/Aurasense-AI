
import React from 'react';
import { MenuItem } from '../types';

interface NavItemProps {
  item: MenuItem;
  isActive: boolean;
  isSidebarExpanded: boolean;
  onClick: (id: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, isSidebarExpanded, onClick }) => {
  return (
    <button 
      onClick={() => onClick(item.id)} 
      className={`relative flex items-center p-3.5 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] w-full group overflow-hidden mb-1 ${
        isActive 
          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-100' 
          : 'text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm'
      } ${!isSidebarExpanded ? 'justify-center' : ''}`}
      title={!isSidebarExpanded ? item.label : ''}
    >
      {/* Icon Wrapper with Scaling Effect */}
      <div className={`relative z-10 flex items-center justify-center transition-all duration-300 ${isSidebarExpanded ? 'mr-3' : 'scale-110'}`}>
        <svg className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon || 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </div>

      {/* Label Wrapper - Animated Slide/Fade */}
      <div className={`flex items-center whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out origin-left ${isSidebarExpanded ? 'w-auto opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4'}`}>
        <span className="relative z-10 text-[13px] font-bold tracking-tight">{item.label}</span>
      </div>

      {/* Active Indicator Line (Only visible when collapsed) */}
      {!isSidebarExpanded && isActive && (
         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full animate-in fade-in duration-300"></div>
      )}
    </button>
  );
};

interface SidebarProps {
  menuConfig: MenuItem[];
  activeMenuId: string;
  onMenuClick: (menuId: string) => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ menuConfig, activeMenuId, onMenuClick, isSidebarExpanded, setIsSidebarExpanded }) => {
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
      
      {/* Navigation Groups - Dynamic Rendering */}
      <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 gap-6">
        {menuConfig.map((item) => {
            if (item.type === 'FOLDER') {
                return (
                    <div key={item.id}>
                        {/* Folder Header */}
                        <div className={`overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'h-auto opacity-100 mb-3 px-3' : 'h-0 opacity-0 mb-0'}`}>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60 whitespace-nowrap">
                                {item.label}
                            </p>
                        </div>
                        {/* Folder Children */}
                        {item.children?.map(subItem => (
                            <NavItem 
                                key={subItem.id} 
                                item={subItem} 
                                isActive={activeMenuId === subItem.id} 
                                isSidebarExpanded={isSidebarExpanded} 
                                onClick={onMenuClick} 
                            />
                        ))}
                    </div>
                );
            } else {
                // Top-level Page Link
                return (
                    <NavItem 
                        key={item.id} 
                        item={item} 
                        isActive={activeMenuId === item.id} 
                        isSidebarExpanded={isSidebarExpanded} 
                        onClick={onMenuClick} 
                    />
                );
            }
        })}
      </div>
    </aside>
  );
};
