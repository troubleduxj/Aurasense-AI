
import React, { useState, useEffect } from 'react';
import { ControllerConfig, DashboardFilterState } from '../types';

interface ControllerBarProps {
  controllers: ControllerConfig[];
  filterState: DashboardFilterState;
  onFilterChange: (key: string, value: any) => void;
}

const getChipClass = (value: string) => {
    const v = String(value).toLowerCase();
    if (v === 'online' || v === 'healthy' || v === 'normal') return 'bg-emerald-500 text-white shadow-emerald-200';
    if (v === 'warning' || v === 'risk') return 'bg-amber-500 text-white shadow-amber-200';
    if (v === 'critical' || v === 'error') return 'bg-rose-500 text-white shadow-rose-200';
    if (v === 'offline' || v === 'inactive') return 'bg-slate-400 text-white shadow-slate-200';
    return 'bg-indigo-600 text-white shadow-indigo-200';
};

export const ControllerBar: React.FC<ControllerBarProps> = ({ controllers, filterState, onFilterChange }) => {
  // Collect all active keys from filterState
  const activeKeys = Object.keys(filterState).filter(k => filterState[k] && filterState[k] !== 'ALL');
  
  // Find filters that do NOT match any controller (Added via Chart Interaction)
  const interactiveFilters = activeKeys.filter(k => !controllers?.some(c => c.key === k));

  // Local state for text input to debounce updates
  const [textValues, setTextValues] = useState<Record<string, string>>({});

  useEffect(() => {
      // Sync local text values with filter state
      const newTextValues: Record<string, string> = {};
      controllers?.filter(c => c.type === 'TEXT_INPUT').forEach(c => {
          newTextValues[c.key] = filterState[c.key] || '';
      });
      setTextValues(newTextValues);
  }, [filterState, controllers]);

  const handleTextChange = (key: string, val: string) => {
      setTextValues(prev => ({ ...prev, [key]: val }));
      // Debounce call to onFilterChange handled via simple delay? 
      // For simplicity in React without heavy lodash debounce:
      // We'll trigger onBlur or Enter, or live update if performance allows (Mock data is fast)
      onFilterChange(key, val);
  };

  return (
    <div className="flex flex-col gap-3 mb-6 animate-in fade-in slide-in-from-top-4">
        {/* Top Row: Defined Controllers */}
        {(controllers && controllers.length > 0) && (
            <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex flex-wrap items-center gap-6">
                {controllers.map(controller => (
                    <div key={controller.id} className="flex items-center gap-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            {controller.label}
                        </label>
                        
                        {/* 1. Select Controller */}
                        {controller.type === 'SELECT' && (
                            <div className="relative group">
                                <select
                                    value={filterState[controller.key] || 'ALL'}
                                    onChange={(e) => onFilterChange(controller.key, e.target.value)}
                                    className="appearance-none bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-white text-xs font-bold text-slate-700 py-2 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer min-w-[140px]"
                                >
                                    <option value="ALL">All Values</option>
                                    {controller.options?.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <svg className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        )}

                        {/* 2. Radio Group Controller (e.g. Status) */}
                        {controller.type === 'RADIO_GROUP' && (
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                <button
                                    onClick={() => onFilterChange(controller.key, 'ALL')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!filterState[controller.key] || filterState[controller.key] === 'ALL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    All
                                </button>
                                {controller.options?.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => onFilterChange(controller.key, opt)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterState[controller.key] === opt ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 3. Time Range */}
                        {controller.type === 'TIME_RANGE' && (
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                {controller.options?.map(opt => {
                                    const isActive = filterState[controller.key] === opt || (!filterState[controller.key] && opt === controller.defaultValue);
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => onFilterChange(controller.key, opt)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isActive ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* 4. [V3.0] Text Input Controller */}
                        {controller.type === 'TEXT_INPUT' && (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={textValues[controller.key] || ''}
                                    onChange={(e) => handleTextChange(controller.key, e.target.value)}
                                    placeholder={controller.placeholder || 'Search...'}
                                    className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 w-48 transition-all placeholder-slate-400"
                                />
                                <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Reset Button */}
                {activeKeys.length > 0 && (
                    <button 
                        onClick={() => {
                            controllers.forEach(c => onFilterChange(c.key, 'ALL'));
                            interactiveFilters.forEach(k => onFilterChange(k, 'ALL'));
                        }}
                        className="ml-auto text-[10px] font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        Clear All
                    </button>
                )}
            </div>
        )}

        {/* Bottom Row: Active Interactive Filters (Drill Down Chips) */}
        {interactiveFilters.length > 0 && (
            <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-left-2">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-1">Active Filters:</span>
                {interactiveFilters.map(key => (
                    <div key={key} className={`flex items-center gap-1 px-3 py-1 rounded-full shadow-md ${getChipClass(filterState[key])}`}>
                        <span className="text-[10px] font-mono opacity-70">{key}:</span>
                        <span className="text-xs font-bold">{filterState[key]}</span>
                        <button 
                            onClick={() => onFilterChange(key, 'ALL')}
                            className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};
