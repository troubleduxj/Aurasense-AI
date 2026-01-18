
import React, { useState, useEffect, useMemo } from 'react';
import { DataView, DataSource, CalculatedField, DataViewField } from '../types';
import { MOCK_TDENGINE_SCHEMA } from '../mockData';
import { generateSQLFromText } from '../geminiService'; // Import the new service

// ... (keep existing interfaces and default fields) ...
interface ViewPageProps {
  dataViews: DataView[];
  dataSources: DataSource[];
  onSaveView: (view: DataView, isNew: boolean) => void;
  onDeleteView: (id: string) => void;
}

const DEFAULT_FIELD_GROUPS = {
  Time: ['ts', 'lastActive', 'lastMaintenance'],
  Metadata: ['id', 'name', 'type', 'status', 'location', 'ip', 'firmware', 'manufacturer'],
  Metrics: ['temperature', 'cpu', 'memory', 'battery', 'voltage', 'current', 'pressure', 'humidity', 'vibration', 'rpm']
};

export const ViewPage: React.FC<ViewPageProps> = ({ dataViews, dataSources, onSaveView, onDeleteView }) => {
  // ... (keep existing state) ...
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');
  
  // NEW State for AI SQL
  const [nlQuery, setNlQuery] = useState('');
  const [isGeneratingSQL, setIsGeneratingSQL] = useState(false);

  const [viewForm, setViewForm] = useState<{
    name: string;
    sourceId: string;
    tableName: string;
    fields: string[];
    model: Record<string, DataViewField>;
    calculatedFields: CalculatedField[]; 
    filter: string;
    mode: 'GUI' | 'SQL';
    customSql: string;
  }>({
    name: '未命名视图',
    sourceId: '',
    tableName: '',
    fields: ['name', 'status', 'temperature'],
    model: {},
    calculatedFields: [],
    filter: "status == 'online'",
    mode: 'GUI',
    customSql: "SELECT name, status, temperature FROM devices WHERE status = 'online'"
  });

  const [newCalcField, setNewCalcField] = useState<CalculatedField>({ name: '', expression: '' });

  // ... (keep useEffect for loading viewForm) ...
  useEffect(() => {
    if (currentViewId) {
      const view = dataViews.find(v => v.id === currentViewId);
      if (view) {
        setViewForm({
          name: view.name,
          sourceId: view.sourceId,
          tableName: view.tableName || '',
          fields: view.fields,
          model: view.model || {}, // Load existing model
          calculatedFields: view.calculatedFields || [],
          filter: view.filter || '',
          mode: view.mode || 'GUI',
          customSql: view.customSql || "SELECT name, status, temperature FROM devices"
        });
      }
    } else {
      // Default Init
      const defaultFields = ['name', 'status'];
      const defaultModel: Record<string, DataViewField> = {};
      defaultFields.forEach(f => defaultModel[f] = { name: f });

      setViewForm({
        name: '新数据视图 ' + (dataViews.length + 1),
        sourceId: dataSources[0]?.id || '',
        tableName: '',
        fields: defaultFields,
        model: defaultModel,
        calculatedFields: [],
        filter: '',
        mode: 'GUI',
        customSql: "SELECT name, status, temperature FROM devices"
      });
    }
  }, [currentViewId, dataViews, dataSources]);

  // ... (keep useEffect for SQL Parsing) ...
  useEffect(() => {
      if (viewForm.mode === 'SQL' && viewForm.customSql) {
          try {
              // Very simple regex to extract columns between SELECT and FROM
              const match = viewForm.customSql.match(/SELECT\s+(.+?)\s+FROM/i);
              if (match && match[1]) {
                  const columns = match[1].split(',').map(c => {
                      const parts = c.trim().split(/\s+AS\s+/i);
                      return parts.length > 1 ? parts[1].trim() : parts[0].trim();
                  });
                  // Remove * if present, replace with default fields for demo
                  if (columns.includes('*')) {
                      // Mock logic for *
                      const fields = ['name', 'status', 'temperature', 'cpu', 'ts'];
                      const model = { ...viewForm.model };
                      fields.forEach(f => { if(!model[f]) model[f] = { name: f }; });
                      setViewForm(prev => ({ ...prev, fields, model }));
                  } else {
                      const fields = columns;
                      const model = { ...viewForm.model };
                      fields.forEach(f => { if(!model[f]) model[f] = { name: f }; });
                      setViewForm(prev => ({ ...prev, fields, model }));
                  }
              }
          } catch(e) { /* ignore parse errors while typing */ }
      }
  }, [viewForm.customSql, viewForm.mode]);

  // ... (keep memoized helpers) ...
  const selectedSource = useMemo(() => 
    dataSources.find(s => s.id === viewForm.sourceId), 
  [viewForm.sourceId, dataSources]);

  const isTDengine = selectedSource?.type === 'TDengine';
  
  const sourceConfig = useMemo(() => {
      if (!selectedSource) return {};
      try {
          return typeof selectedSource.config === 'string' ? JSON.parse(selectedSource.config) : selectedSource.config;
      } catch {
          return {};
      }
  }, [selectedSource]);

  const effectiveStable = useMemo(() => {
      if (!isTDengine) return null;
      if (sourceConfig.stable) return sourceConfig.stable;
      return viewForm.tableName;
  }, [isTDengine, sourceConfig.stable, viewForm.tableName]);

  // ... (keep rest of effects and handlers up to handleGenerateSQL) ...
  useEffect(() => {
      if (isTDengine && sourceConfig.stable && viewForm.tableName !== sourceConfig.stable) {
          setViewForm(prev => ({ ...prev, tableName: sourceConfig.stable }));
      }
  }, [isTDengine, sourceConfig.stable]);

  const activeFieldGroups = useMemo(() => {
      if (isTDengine && effectiveStable && MOCK_TDENGINE_SCHEMA[effectiveStable]) {
          const schema = MOCK_TDENGINE_SCHEMA[effectiveStable];
          return {
              'Tags (Dimensions)': schema.tags,
              'Metrics (Values)': schema.columns,
              'System Fields': ['ts']
          };
      }
      return DEFAULT_FIELD_GROUPS;
  }, [isTDengine, effectiveStable]);

  // ... (keep toggleField, modelUpdate, calcField handlers) ...
  const handleToggleField = (field: string) => {
    setViewForm(prev => {
      const exists = prev.fields.includes(field);
      const newFields = exists ? prev.fields.filter(f => f !== field) : [...prev.fields, field];
      
      const newModel = { ...prev.model };
      if (!exists) {
          newModel[field] = { name: field, alias: '', type: 'STRING' }; 
      } else {
          delete newModel[field];
      }

      return {
        ...prev,
        fields: newFields,
        model: newModel
      };
    });
  };

  const handleModelUpdate = (key: string, field: keyof DataViewField, value: any) => {
      setViewForm(prev => ({
          ...prev,
          model: {
              ...prev.model,
              [key]: { ...prev.model[key], [field]: value }
          }
      }));
  };

  const handleAddCalculatedField = () => {
      if (!newCalcField.name || !newCalcField.expression) return;
      const newModel = { ...viewForm.model };
      newModel[newCalcField.name] = { name: newCalcField.name, alias: newCalcField.name, type: 'NUMBER' }; 
      setViewForm(prev => ({
          ...prev,
          calculatedFields: [...prev.calculatedFields, { ...newCalcField }],
          model: newModel
      }));
      setNewCalcField({ name: '', expression: '' });
  };

  const handleRemoveCalculatedField = (idx: number) => {
      const fieldName = viewForm.calculatedFields[idx].name;
      const newModel = { ...viewForm.model };
      delete newModel[fieldName];
      setViewForm(prev => ({
          ...prev,
          calculatedFields: prev.calculatedFields.filter((_, i) => i !== idx),
          model: newModel
      }));
  };

  // --- NEW AI HANDLER ---
  const handleGenerateSQL = async () => {
      if (!nlQuery.trim()) return;
      setIsGeneratingSQL(true);
      
      // Prepare schema context for AI
      let schemaStr = "Generic Table (id, name, status, temperature, cpu...)";
      if (effectiveStable && MOCK_TDENGINE_SCHEMA[effectiveStable]) {
          const s = MOCK_TDENGINE_SCHEMA[effectiveStable];
          schemaStr = `Super Table: ${effectiveStable}\nTags: ${s.tags.join(', ')}\nColumns: ${s.columns.join(', ')}`;
      }

      const generatedSQL = await generateSQLFromText(nlQuery, schemaStr);
      setViewForm(prev => ({ ...prev, customSql: generatedSQL }));
      setIsGeneratingSQL(false);
  };

  const handleSave = () => {
    const newView: DataView = {
      id: currentViewId || `view-${Date.now()}`,
      name: viewForm.name,
      sourceId: viewForm.sourceId,
      tableName: viewForm.tableName,
      fields: viewForm.fields,
      model: viewForm.model,
      calculatedFields: viewForm.calculatedFields,
      filter: viewForm.filter,
      mode: viewForm.mode,
      customSql: viewForm.customSql
    };
    onSaveView(newView, !currentViewId);
    
    if (!currentViewId) {
        setCurrentViewId(newView.id);
    }
    
    const btn = document.getElementById('save-view-btn');
    if (btn) {
      const originalText = btn.innerText;
      btn.innerText = '已保存 ✓';
      btn.classList.add('bg-emerald-500');
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-emerald-500');
      }, 1000);
    }
  };

  const allEditableFields = useMemo(() => {
      return [
          ...viewForm.fields, 
          ...viewForm.calculatedFields.map(f => f.name)
      ];
  }, [viewForm.fields, viewForm.calculatedFields]);

  return (
    <div className="flex h-full gap-4 relative overflow-hidden pb-4">
        {/* Toggle Button for Sidebar (When closed) */}
        {!isSidebarOpen && (
             <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-0 z-20 p-2 bg-white shadow-md border border-slate-200 rounded-r-xl text-slate-500 hover:text-indigo-600 transition-all hover:pl-3"
                title="展开视图列表"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
             </button>
        )}

        {/* ... (keep Sidebar code) ... */}
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden ${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 border-0 pointer-events-none'}`}>
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-slate-800">视图资产</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentViewId(null)}
                        className="p-2 bg-white border border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="新建视图"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        title="收起列表"
                    >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {dataViews.map(view => (
                    <div 
                    key={view.id} 
                    onClick={() => setCurrentViewId(view.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all group ${currentViewId === view.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:shadow-md'}`}
                    >
                        <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm mb-1">{view.name}</h4>
                        {currentViewId === view.id && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>}
                        </div>
                        <div className="flex justify-between items-center">
                            <p className={`text-[10px] font-mono opacity-80 ${currentViewId === view.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {dataSources.find(s => s.id === view.sourceId)?.name || 'Unknown Source'}
                            </p>
                            {view.mode === 'SQL' && <span className={`text-[9px] font-black uppercase px-1.5 rounded ${currentViewId === view.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>SQL</span>}
                        </div>
                        
                        {/* Delete Action (visible on hover or active) */}
                        <div className={`mt-2 pt-2 border-t flex justify-end ${currentViewId === view.id ? 'border-indigo-500/30' : 'border-slate-50'}`}>
                             <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteView(view.id); }}
                                className={`text-[10px] font-bold uppercase hover:underline ${currentViewId === view.id ? 'text-indigo-200 hover:text-white' : 'text-slate-300 hover:text-rose-500'}`}
                             >
                                删除
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 右侧：编辑区域 (Main Content) */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            
            {/* 顶部操作栏 */}
            <div className="flex-shrink-0 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center">
                 <div className="flex-1 mr-8">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">视图名称</label>
                    <input 
                    type="text" 
                    value={viewForm.name}
                    onChange={(e) => setViewForm({...viewForm, name: e.target.value})}
                    className="w-full text-2xl font-black text-slate-800 bg-transparent border-b-2 border-transparent focus:border-indigo-100 hover:border-slate-100 outline-none transition-colors placeholder-slate-200"
                    placeholder="输入视图名称..."
                    />
                </div>
                
                {/* Mode Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl mr-4">
                    <button 
                        onClick={() => setViewForm({...viewForm, mode: 'GUI'})}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${viewForm.mode === 'GUI' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        GUI Mode
                    </button>
                    <button 
                        onClick={() => setViewForm({...viewForm, mode: 'SQL'})}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${viewForm.mode === 'SQL' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        SQL Mode
                    </button>
                </div>

                <button 
                    id="save-view-btn"
                    onClick={handleSave}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    保存配置
                </button>
            </div>

            {/* 可滚动配置内容区 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                
                {viewForm.mode === 'GUI' ? (
                    // ... (keep GUI mode content exactly as is)
                    <>
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 animate-in fade-in">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">1</div>
                                <h3 className="font-bold text-slate-800">数据源与过滤</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Source Selection */}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">选择数据连接</label>
                                    <div className="relative">
                                        <select 
                                            value={viewForm.sourceId}
                                            onChange={(e) => setViewForm({...viewForm, sourceId: e.target.value, tableName: ''})} 
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-sm text-slate-700 appearance-none outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
                                        >
                                            {dataSources.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                                        </select>
                                        <svg className="w-4 h-4 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                {/* Filter Input */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">查询过滤 (WHERE Clause)</label>
                                        {isTDengine && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">TDengine Enabled</span>}
                                    </div>
                                    <div className="relative">
                                        <input 
                                        type="text"
                                        value={viewForm.filter}
                                        onChange={(e) => setViewForm({...viewForm, filter: e.target.value})}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-mono text-xs text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all placeholder-slate-300"
                                        placeholder={isTDengine ? "e.g. ts > NOW - 1h" : "e.g. status = 'active'"}
                                        />
                                    </div>
                                </div>
                                
                                {/* Super Table Selection (Only for TDengine) */}
                                {isTDengine && (
                                    <div className="col-span-full md:col-span-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">目标超级表 (Super Table)</label>
                                        <div className="relative">
                                            <select
                                                value={effectiveStable || ''}
                                                onChange={(e) => setViewForm({...viewForm, tableName: e.target.value})}
                                                disabled={!!sourceConfig.stable} 
                                                className={`w-full px-5 py-4 border border-slate-100 rounded-[20px] font-bold text-sm text-slate-700 appearance-none outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all ${!!sourceConfig.stable ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 cursor-pointer hover:bg-white'}`}
                                            >
                                                <option value="">-- 请选择超级表 --</option>
                                                {Object.keys(MOCK_TDENGINE_SCHEMA).map(st => (
                                                    <option key={st} value={st}>{st}</option>
                                                ))}
                                            </select>
                                            {!sourceConfig.stable && <svg className="w-4 h-4 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Field Selection */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 animate-in fade-in">
                            {/* ... (keep GUI field selection) ... */}
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">2</div>
                                    <h3 className="font-bold text-slate-800">字段选择 (Field Selection)</h3>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="搜索字段..." 
                                        value={fieldSearchTerm}
                                        onChange={(e) => setFieldSearchTerm(e.target.value)}
                                        className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:w-56 w-40 transition-all focus:border-indigo-200"
                                    />
                                    <svg className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {Object.entries(activeFieldGroups).map(([category, fields]) => {
                                    const visibleFields = fields.filter(f => f.toLowerCase().includes(fieldSearchTerm.toLowerCase()));
                                    if (visibleFields.length === 0) return null;
                                    return (
                                        <div key={category} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">{category}</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {visibleFields.map(field => {
                                                    const isSelected = viewForm.fields.includes(field);
                                                    return (
                                                        <button key={field} onClick={() => handleToggleField(field)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}`}>
                                                            {field}
                                                            {isSelected && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Calc Fields */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 animate-in fade-in">
                            {/* ... (keep calc fields) ... */}
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">3</div>
                                <h3 className="font-bold text-slate-800">计算字段 (Calculated Fields)</h3>
                            </div>
                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                <div className="grid grid-cols-12 gap-4 items-end">
                                    <div className="col-span-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Field Name</label>
                                        <input type="text" value={newCalcField.name} onChange={(e) => setNewCalcField({...newCalcField, name: e.target.value})} placeholder="e.g. temp_f" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-400 font-bold text-xs" />
                                    </div>
                                    <div className="col-span-7">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expression (JS Syntax)</label>
                                        <input type="text" value={newCalcField.expression} onChange={(e) => setNewCalcField({...newCalcField, expression: e.target.value})} placeholder="e.g. temperature * 1.8 + 32" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-400 font-mono text-xs text-slate-600" />
                                    </div>
                                    <div className="col-span-2">
                                        <button onClick={handleAddCalculatedField} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">Add Field</button>
                                    </div>
                                </div>
                                {viewForm.calculatedFields.length > 0 && (
                                    <div className="mt-6 space-y-3">
                                        {viewForm.calculatedFields.map((field, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{field.name}</span>
                                                    <span className="text-[10px] font-black text-slate-300">=</span>
                                                    <span className="text-xs font-mono text-slate-600">{field.expression}</span>
                                                </div>
                                                <button onClick={() => handleRemoveCalculatedField(idx)} className="text-slate-400 hover:text-rose-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. Semantic Layer */}
                        {allEditableFields.length > 0 && (
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 animate-in fade-in">
                                {/* ... (keep semantic layer) ... */}
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">4</div>
                                    <h3 className="font-bold text-slate-800">语义模型配置 (Semantic Layer)</h3>
                                </div>
                                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                                    {/* ... table content ... */}
                                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-slate-700">字段属性定义</h4>
                                        <span className="text-[10px] text-slate-400 font-mono">{allEditableFields.length} Fields (Source + Calculated)</span>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase w-40">Key</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Alias (显示名)</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase w-32">Type</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase w-32">Unit</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {allEditableFields.map(key => {
                                                const isCalculated = viewForm.calculatedFields.some(f => f.name === key);
                                                const fieldConfig = viewForm.model[key] || { name: key };
                                                return (
                                                    <tr key={key} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-mono font-bold text-slate-600">{key}</span>
                                                                {isCalculated && (
                                                                    <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1 rounded uppercase font-bold tracking-tight">Calc</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={fieldConfig.alias || ''} 
                                                                onChange={e => handleModelUpdate(key, 'alias', e.target.value)}
                                                                className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 outline-none text-xs font-medium py-1 px-1 transition-colors"
                                                                placeholder={key}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <select 
                                                                value={fieldConfig.type || 'STRING'} 
                                                                onChange={e => handleModelUpdate(key, 'type', e.target.value)}
                                                                className="bg-transparent border border-transparent hover:bg-white hover:border-slate-200 rounded text-xs font-bold text-slate-600 outline-none py-1 px-2 cursor-pointer"
                                                            >
                                                                <option value="STRING">STRING</option>
                                                                <option value="NUMBER">NUMBER</option>
                                                                <option value="DATE">DATE</option>
                                                                <option value="BOOLEAN">BOOLEAN</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={fieldConfig.unit || ''} 
                                                                onChange={e => handleModelUpdate(key, 'unit', e.target.value)}
                                                                className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 outline-none text-xs font-medium py-1 px-1"
                                                                placeholder="-"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={fieldConfig.description || ''} 
                                                                onChange={e => handleModelUpdate(key, 'description', e.target.value)}
                                                                className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 outline-none text-xs text-slate-500 py-1 px-1"
                                                                placeholder="Description..."
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* --- SQL MODE (AI Enhanced) --- */
                    <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-2xl space-y-6 h-full flex flex-col animate-in fade-in">
                        <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-sm text-lg">SQL</div>
                                <h3 className="font-bold text-white">Advanced Query Editor</h3>
                             </div>
                             <div className="bg-slate-800/80 px-3 py-1 rounded-lg text-[10px] text-slate-400 font-bold uppercase backdrop-blur border border-white/10">
                                {isTDengine ? 'TDengine SQL' : 'Standard SQL'}
                            </div>
                        </div>

                        {/* AI Generator Input */}
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-3">
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                AI SQL Generator
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={nlQuery}
                                    onChange={(e) => setNlQuery(e.target.value)}
                                    placeholder="e.g. Find sensors with temp > 80 in the last 2 hours..."
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-all"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateSQL()}
                                />
                                <button 
                                    onClick={handleGenerateSQL}
                                    disabled={isGeneratingSQL}
                                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isGeneratingSQL ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                    Generate
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <textarea 
                                value={viewForm.customSql}
                                onChange={e => setViewForm({...viewForm, customSql: e.target.value})}
                                className="w-full h-full bg-slate-950 text-emerald-400 font-mono text-sm p-6 rounded-2xl border border-slate-800 outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
                                spellCheck={false}
                            />
                        </div>
                    </div>
                )}

                {/* 4. 实时预览 (Always Visible) */}
                <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl space-y-6">
                    {/* ... (keep preview) ... */}
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        </div>
                        <h3 className="text-white font-bold ml-2 text-sm uppercase tracking-wide opacity-80">Live Preview</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {/* Data Table Preview */}
                        <div className="bg-white rounded-xl overflow-hidden shadow-inner">
                            <table className="w-full text-left">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    {viewForm.fields.slice(0, 5).map(f => (
                                        <th key={f} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase">
                                            {viewForm.model[f]?.alias || f}
                                        </th>
                                    ))}
                                    {viewForm.calculatedFields.map(f => (
                                        <th key={f.name} className="px-4 py-3 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50">
                                            {viewForm.model[f.name]?.alias || f.name}
                                        </th>
                                    ))}
                                    {viewForm.fields.length > 5 && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase">...</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[1, 2, 3].map(i => {
                                    const rowData: any = {};
                                    viewForm.fields.forEach(f => {
                                         rowData[f] = f === 'status' ? (i === 1 ? 'online' : 'warning') : 
                                            f === 'temperature' ? (30 + i * 5) :
                                            f === 'cpu' ? (40 + i * 10) :
                                            f === 'voltage' ? 220 :
                                            f === 'current' ? (i + 1) :
                                            f === 'ts' ? new Date().toISOString() :
                                            f.includes('name') ? `Device-00${i}` : 
                                            10 * i;
                                    });

                                    return (
                                        <tr key={i}>
                                            {viewForm.fields.slice(0, 5).map((f, idx) => (
                                                <td key={idx} className="px-4 py-2.5 text-xs text-slate-600 font-mono">
                                                    {rowData[f]}
                                                </td>
                                            ))}
                                            {viewForm.calculatedFields.map(cf => {
                                                let val = 0;
                                                try {
                                                    const func = new Function(...Object.keys(rowData), `return ${cf.expression};`);
                                                    val = func(...Object.values(rowData));
                                                } catch(e) { val = 0; }
                                                return (
                                                    <td key={cf.name} className="px-4 py-2.5 text-xs text-emerald-600 font-mono font-bold bg-emerald-50/30">
                                                        {typeof val === 'number' ? val.toFixed(2) : val}
                                                    </td>
                                                );
                                            })}
                                            {viewForm.fields.length > 5 && <td className="px-4 py-2.5 text-xs text-slate-400">...</td>}
                                        </tr>
                                    )
                                })}
                            </tbody>
                            </table>
                            <div className="bg-slate-50 px-4 py-2 text-[10px] text-slate-400 text-center border-t border-slate-100">
                            仅展示模拟的前 3 条数据预览 · Mock Data
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
