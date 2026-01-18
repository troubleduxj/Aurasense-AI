
import React, { useState, useMemo } from 'react';
import { MetricConfig, MetricDefinition, DeviceType } from '../types';

interface MetricManagerPageProps {
  metricConfig: MetricConfig;
  onUpdateConfig: (config: MetricConfig) => void;
}

export const MetricManagerPage: React.FC<MetricManagerPageProps> = ({ metricConfig, onUpdateConfig }) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [metricCode, setMetricCode] = useState('');
  const [metricScope, setMetricScope] = useState<string>('GLOBAL'); // 'GLOBAL' or specific DeviceType
  const [formData, setFormData] = useState<MetricDefinition>({ label: '', unit: '', color: '#6366f1' });

  // Helper to parse key into [Scope, Code]
  // e.g. "Sensor__cpu" -> Scope="Sensor", Code="cpu"
  // e.g. "cpu" -> Scope="GLOBAL", Code="cpu"
  const parseKey = (fullKey: string) => {
      const parts = fullKey.split('__');
      if (parts.length === 2) {
          return { scope: parts[0], code: parts[1] };
      }
      return { scope: 'GLOBAL', code: fullKey };
  };

  const handleEdit = (fullKey: string) => {
    const { scope, code } = parseKey(fullKey);
    setEditingKey(fullKey);
    setMetricCode(code);
    setMetricScope(scope);
    setFormData({ ...metricConfig[fullKey] });
    setIsAdding(false);
  };

  const handleStartAdd = () => {
    setEditingKey(null);
    setMetricCode('');
    setMetricScope('GLOBAL');
    setFormData({ label: '', unit: '', color: '#6366f1' });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!metricCode.trim() || !formData.label) return;
    
    // Construct the actual key
    const finalKey = metricScope === 'GLOBAL' ? metricCode.trim() : `${metricScope}__${metricCode.trim()}`;

    // If adding new, check duplicates
    if (isAdding && metricConfig[finalKey]) {
        alert('This Metric Scope + Code combination already exists!');
        return;
    }

    // If editing, we need to handle key change (delete old, add new)
    // But here we simplify: if key matches editingKey, just update value.
    // If user changed scope/code during edit, treat as new entry and delete old? 
    // For simplicity, let's assume Add Mode for creating new scopes, and Edit Mode just updates values.
    // Or better: Re-create the config object.

    const newConfig = { ...metricConfig };
    
    if (editingKey && editingKey !== finalKey) {
        delete newConfig[editingKey]; // Remove old key if renamed/re-scoped
    }
    
    newConfig[finalKey] = formData;
    
    onUpdateConfig(newConfig);
    setIsAdding(false);
    setEditingKey(null);
  };

  const handleDelete = (key: string) => {
      if (window.confirm(`Delete definition for "${key}"?`)) {
          const newConfig = { ...metricConfig };
          delete newConfig[key];
          onUpdateConfig(newConfig);
      }
  };

  // Group metrics for display
  const groupedMetrics = useMemo(() => {
      const groups: Record<string, string[]> = { 'GLOBAL': [] };
      Object.keys(metricConfig).forEach(key => {
          const { scope } = parseKey(key);
          if (!groups[scope]) groups[scope] = [];
          groups[scope].push(key);
      });
      return groups;
  }, [metricConfig]);

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">指标定义管理</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Metric Metadata Dictionary</p>
            </div>
            <button 
                onClick={handleStartAdd}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                <span>注册新指标</span>
            </button>
        </div>

        {/* Display grouped by Scope */}
        {Object.entries(groupedMetrics).sort((a, b) => a[0] === 'GLOBAL' ? -1 : 1).map(([scope, keys]) => {
            if (keys.length === 0) return null;
            return (
                <div key={scope} className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${scope === 'GLOBAL' ? 'bg-slate-800 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                            {scope === 'GLOBAL' ? 'Global Defaults' : `${scope} Specific`}
                        </span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {keys.map(fullKey => {
                            const def = metricConfig[fullKey];
                            const { code } = parseKey(fullKey);
                            return (
                                <div key={fullKey} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group relative">
                                    <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full" style={{ backgroundColor: def.color }}></div>
                                    <div className="flex justify-between items-start mt-2 mb-4">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{def.label}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-mono text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded">{code}</span>
                                                {def.unit && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded">{def.unit}</span>}
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full shadow-sm border border-slate-100" style={{ backgroundColor: def.color }}></div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(fullKey)} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(fullKey)} className="p-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        })}

        {/* Edit/Add Modal */}
        {(isAdding || editingKey) && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white rounded-[40px] shadow-2xl border border-white/40 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-xl font-black text-slate-800">{isAdding ? '注册新指标' : '编辑指标定义'}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                            {isAdding ? 'Create Metric' : 'Edit Metric'}
                        </p>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Scope (作用域)</label>
                                <div className="relative">
                                    <select 
                                        value={metricScope} 
                                        onChange={e => setMetricScope(e.target.value)} 
                                        className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-100 appearance-none"
                                        // Disable scope change if editing, to prevent confusion or require "Save as new" logic
                                        disabled={!isAdding} 
                                    >
                                        <option value="GLOBAL">GLOBAL (通用)</option>
                                        {Object.values(DeviceType).map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    {isAdding && <svg className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Metric Key (Raw Code)</label>
                                <input 
                                    type="text" 
                                    value={metricCode} 
                                    onChange={e => setMetricCode(e.target.value)} 
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-sm font-bold text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100"
                                    placeholder="e.g. pressure"
                                    // Disable code change if editing for simplicity
                                    disabled={!isAdding}
                                />
                            </div>
                        </div>

                        {metricScope !== 'GLOBAL' && (
                            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-[10px] text-indigo-700 leading-relaxed">
                                <span className="font-bold">提示：</span> 此配置仅对 <span className="font-bold">{metricScope}</span> 类型的设备生效。如果设备没有特定配置，将回退使用 GLOBAL 配置。
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">显示名称 (Label)</label>
                            <input 
                                type="text" 
                                value={formData.label} 
                                onChange={e => setFormData({...formData, label: e.target.value})} 
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                                placeholder="e.g. 液压泵压力"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">单位 (Unit)</label>
                                <input 
                                    type="text" 
                                    value={formData.unit} 
                                    onChange={e => setFormData({...formData, unit: e.target.value})} 
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                                    placeholder="e.g. MPa"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">代表色 (Color)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        value={formData.color} 
                                        onChange={e => setFormData({...formData, color: e.target.value})} 
                                        className="h-11 w-12 rounded-xl cursor-pointer border border-slate-200 p-1 bg-white"
                                    />
                                    <input 
                                        type="text" 
                                        value={formData.color} 
                                        onChange={e => setFormData({...formData, color: e.target.value})} 
                                        className="flex-1 px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs uppercase text-slate-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                        <button onClick={handleSave} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-all">保存配置</button>
                        <button onClick={() => { setIsAdding(false); setEditingKey(null); }} className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-100 transition-all">取消</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
