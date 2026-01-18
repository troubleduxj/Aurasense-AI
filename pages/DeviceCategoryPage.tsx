
import React, { useState, useEffect } from 'react';
import { DeviceCategory, DataSource } from '../types';
import { MOCK_TDENGINE_SCHEMA } from '../mockData';

interface DeviceCategoryPageProps {
  categories: DeviceCategory[];
  dataSources: DataSource[];
  onSaveCategory: (category: DeviceCategory) => void;
  onDeleteCategory: (id: string) => void;
}

export const DeviceCategoryPage: React.FC<DeviceCategoryPageProps> = ({ categories, dataSources, onSaveCategory, onDeleteCategory }) => {
  const [editingCategory, setEditingCategory] = useState<DeviceCategory | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<DeviceCategory>>({});

  // Reset form when opening modal
  useEffect(() => {
      if (editingCategory) {
          setFormData(editingCategory);
      } else if (isAdding) {
          setFormData({ 
              name: '', 
              code: '', 
              description: '', 
              deviceCount: 0, 
              sourceId: '',
              tdengineSuperTable: '', 
              defaultDisplayMetric: '',
              metricDefinitions: []
          });
      }
  }, [editingCategory, isAdding]);

  // --- Logic for TDengine Schema Loading ---
  const handleSourceChange = (sourceId: string) => {
      const source = dataSources.find(s => s.id === sourceId);
      let newFormData = { ...formData, sourceId };
      
      // Reset dependent fields
      newFormData.tdengineSuperTable = '';
      newFormData.defaultDisplayMetric = '';
      newFormData.metricDefinitions = [];

      if (source?.type === 'TDengine') {
          // Attempt to auto-load stable from config
          try {
              const config = JSON.parse(source.config || '{}');
              if (config.stable) {
                  newFormData.tdengineSuperTable = config.stable;
                  // Auto load schema for this stable
                  const schema = MOCK_TDENGINE_SCHEMA[config.stable];
                  if (schema) {
                      const allMetrics = [...schema.columns, ...schema.tags];
                      newFormData.defaultDisplayMetric = schema.columns[0] || allMetrics[0];
                      newFormData.metricDefinitions = [...allMetrics, 'ts'];
                  }
              }
          } catch(e) { console.error('Error parsing TDengine config', e); }
      }
      
      setFormData(newFormData);
  };

  const handleSuperTableChange = (stable: string) => {
      const schema = MOCK_TDENGINE_SCHEMA[stable];
      let newFormData = { ...formData, tdengineSuperTable: stable };
      
      if (schema) {
          const allMetrics = [...schema.columns, ...schema.tags];
          newFormData.defaultDisplayMetric = schema.columns[0] || allMetrics[0];
          newFormData.metricDefinitions = [...allMetrics, 'ts']; // ts is mandatory and last
      } else {
          newFormData.defaultDisplayMetric = '';
          newFormData.metricDefinitions = [];
      }
      setFormData(newFormData);
  };

  const handleEdit = (category: DeviceCategory) => {
    setEditingCategory(category);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) return;
    
    const categoryToSave: DeviceCategory = {
      id: editingCategory?.id || `cat-${Date.now()}`,
      name: formData.name,
      code: formData.code,
      description: formData.description || '',
      deviceCount: formData.deviceCount || 0,
      sourceId: formData.sourceId || '',
      tdengineSuperTable: formData.tdengineSuperTable || '',
      defaultDisplayMetric: formData.defaultDisplayMetric || '',
      metricDefinitions: formData.metricDefinitions || []
    };
    
    onSaveCategory(categoryToSave);
    setEditingCategory(null);
    setIsAdding(false);
  };

  // Helper to determine if selected source is TDengine
  const selectedSource = dataSources.find(s => s.id === formData.sourceId);
  const isTDengine = selectedSource?.type === 'TDengine';
  const hasDefaultStable = isTDengine && (() => {
      try {
          const conf = JSON.parse(selectedSource?.config || '{}');
          return !!conf.stable;
      } catch { return false; }
  })();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div>
           <h3 className="text-xl font-black text-slate-800 tracking-tight">设备分类定义</h3>
           <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Classification Standards</p>
        </div>
        <button 
           onClick={handleAdd}
           className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
        >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
           <span>新增分类</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {categories.map(cat => (
           <div key={cat.id} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                  <button onClick={() => handleEdit(cat)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => onDeleteCategory(cat.id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
              </div>

              <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                     <span className="text-lg font-black">{cat.code?.charAt(0)}</span>
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 text-lg">{cat.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400 bg-slate-50 inline-block px-1.5 py-0.5 rounded mt-1">{cat.code}</p>
                  </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 h-10 line-clamp-2">{cat.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">关联设备</span>
                      <span className="text-sm font-bold text-slate-800">{cat.deviceCount || 0}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                       {cat.tdengineSuperTable && (
                           <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded" title="Super Table">{cat.tdengineSuperTable}</span>
                       )}
                       {cat.defaultDisplayMetric && (
                           <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1" title="Key Metric">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                               {cat.defaultDisplayMetric}
                           </span>
                       )}
                  </div>
              </div>
           </div>
         ))}
         
         <div 
            onClick={handleAdd}
            className="border-2 border-dashed border-slate-200 rounded-[28px] flex flex-col items-center justify-center p-6 text-slate-300 cursor-pointer hover:border-indigo-300 hover:text-indigo-400 hover:bg-slate-50/50 transition-all min-h-[220px]"
         >
             <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             <span className="text-xs font-bold uppercase tracking-widest">添加新分类</span>
         </div>
      </div>

      {/* --- 分类编辑/新增弹窗 --- */}
      {(isAdding || editingCategory) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] shadow-2xl border border-white/40 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
             <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/30 flex justify-between items-center flex-shrink-0">
                 <div>
                    <h3 className="text-xl font-black text-slate-800">{editingCategory ? '编辑分类' : '新建分类'}</h3>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">Category Metadata</p>
                 </div>
                 <button onClick={() => { setIsAdding(false); setEditingCategory(null); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
             </div>
             <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">分类名称</label>
                         <input 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                            placeholder="e.g. 工业机器人"
                         />
                     </div>
                     <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">分类代码 (Code)</label>
                         <input 
                            type="text" 
                            value={formData.code || ''} 
                            onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-sm font-bold text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all uppercase"
                            placeholder="e.g. ROBOT_ARM"
                         />
                     </div>
                 </div>

                 {/* Source Selection */}
                 <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">绑定数据源 (Data Source)</label>
                     <div className="relative">
                         <select 
                            value={formData.sourceId || ''} 
                            onChange={e => handleSourceChange(e.target.value)}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all appearance-none"
                         >
                             <option value="">-- 选择设备数据源 --</option>
                             {dataSources.map(ds => <option key={ds.id} value={ds.id}>{ds.name} ({ds.type})</option>)}
                         </select>
                         <svg className="w-4 h-4 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                     </div>
                 </div>
                 
                 {/* TDengine Specific Fields */}
                 {isTDengine && (
                     <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                         <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> TDengine Configuration
                         </h4>
                         
                         <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">超级表 (Super Table)</label>
                             <div className="relative">
                                 <select 
                                    value={formData.tdengineSuperTable || ''}
                                    onChange={e => handleSuperTableChange(e.target.value)}
                                    disabled={hasDefaultStable}
                                    className={`w-full px-5 py-3.5 border rounded-2xl font-mono text-sm outline-none appearance-none transition-all ${hasDefaultStable ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200 text-indigo-600 focus:ring-4 focus:ring-indigo-100'}`}
                                 >
                                     <option value="">-- Select STable --</option>
                                     {Object.keys(MOCK_TDENGINE_SCHEMA).map(st => <option key={st} value={st}>{st}</option>)}
                                 </select>
                                 {!hasDefaultStable && <svg className="w-4 h-4 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>}
                             </div>
                         </div>

                         {/* Default Metric Selection (Auto-populated) */}
                         {formData.tdengineSuperTable && (
                             <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">默认监控指标 (Golden Signal)</label>
                                 <div className="relative">
                                     <select 
                                        value={formData.defaultDisplayMetric || ''}
                                        onChange={e => setFormData({...formData, defaultDisplayMetric: e.target.value})}
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-mono text-sm text-emerald-600 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 appearance-none"
                                     >
                                         {formData.metricDefinitions?.filter(m => m !== 'ts').map(m => (
                                             <option key={m} value={m}>{m}</option>
                                         ))}
                                     </select>
                                     <svg className="w-4 h-4 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                 </div>
                                 <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                     System will fetch: <span className="font-mono text-slate-600">{formData.metricDefinitions?.join(', ')}</span>
                                 </p>
                             </div>
                         )}
                     </div>
                 )}

                 {/* Non-TDengine Logic (Manual) */}
                 {!isTDengine && formData.sourceId && (
                     <div className="animate-in fade-in slide-in-from-top-2">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">默认监控指标 Key (Manual Entry)</label>
                         <input 
                            type="text" 
                            value={formData.defaultDisplayMetric || ''} 
                            onChange={e => setFormData({...formData, defaultDisplayMetric: e.target.value})}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-sm font-bold text-emerald-600 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                            placeholder="e.g. temperature"
                         />
                     </div>
                 )}

                 <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">描述说明</label>
                     <textarea 
                        value={formData.description || ''} 
                        onChange={e => setFormData({...formData,description: e.target.value})}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-xs text-slate-600 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all resize-none h-24"
                        placeholder="请输入该分类的详细用途说明..."
                     />
                 </div>
             </div>
             <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={handleSave} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">保存配置</button>
                <button onClick={() => { setIsAdding(false); setEditingCategory(null); }} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">取消</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
