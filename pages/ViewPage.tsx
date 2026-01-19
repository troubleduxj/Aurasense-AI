
import React, { useState, useEffect, useMemo } from 'react';
import { DataView, DataSource, CalculatedField, DataViewField } from '../types';
import { MOCK_TDENGINE_SCHEMA, MOCK_DEVICES } from '../mockData'; // Imported mock data for preview
import { generateSQLFromText } from '../geminiService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';

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
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');
  
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

  // Load existing view
  useEffect(() => {
    if (currentViewId) {
      const view = dataViews.find(v => v.id === currentViewId);
      if (view) {
        setViewForm({
          name: view.name,
          sourceId: view.sourceId,
          tableName: view.tableName || '',
          fields: view.fields,
          model: view.model || {},
          calculatedFields: view.calculatedFields || [],
          filter: view.filter || '',
          mode: view.mode || 'GUI',
          customSql: view.customSql || "SELECT name, status, temperature FROM devices"
        });
      }
    } else {
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

  const handleToggleField = (field: string) => {
    setViewForm(prev => {
      const exists = prev.fields.includes(field);
      const newFields = exists ? prev.fields.filter(f => f !== field) : [...prev.fields, field];
      
      const newModel = { ...prev.model };
      if (!exists) {
          // Add to model with defaults
          newModel[field] = { name: field, alias: '', type: 'STRING' }; 
      } else {
          // Keep config even if unselected? Usually remove.
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

  const handleGenerateSQL = async () => {
      if (!nlQuery.trim()) return;
      setIsGeneratingSQL(true);
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
    if (!currentViewId) setCurrentViewId(newView.id);
  };

  const allEditableFields = useMemo(() => {
      return [
          ...viewForm.fields, 
          ...viewForm.calculatedFields.map(f => f.name)
      ];
  }, [viewForm.fields, viewForm.calculatedFields]);

  // Mock Preview Data Generation
  const previewData = useMemo(() => {
      if (viewForm.fields.length === 0) return [];
      // Use MOCK_DEVICES as base, try to map fields
      return MOCK_DEVICES.slice(0, 5).map(d => {
          const row: any = {};
          allEditableFields.forEach(key => {
              if (d[key as keyof typeof d]) {
                  row[key] = d[key as keyof typeof d];
              } else if (d.metrics && d.metrics[key]) {
                  const history = d.metrics[key];
                  row[key] = history.length > 0 ? history[history.length - 1].value : null;
              } else {
                  // calculated or random
                  row[key] = '-';
              }
          });
          return row;
      });
  }, [allEditableFields, viewForm.calculatedFields]);

  return (
    <div className="flex h-full gap-4 relative overflow-hidden pb-4">
        {/* Sidebar */}
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden ${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 border-0 pointer-events-none'}`}>
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-slate-800">视图资产</h3>
                <div className="flex gap-2">
                    <Button 
                        size="sm"
                        variant="secondary"
                        onClick={() => setCurrentViewId(null)}
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>}
                    />
                    <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsSidebarOpen(false)}
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>}
                    />
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

        {/* Toggle Button */}
        {!isSidebarOpen && (
             <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-0 z-20 p-2 bg-white shadow-md border border-slate-200 rounded-r-xl text-slate-500 hover:text-indigo-600 transition-all hover:pl-3"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
             </button>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <Card className="flex-shrink-0 flex justify-between items-center p-6">
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
                
                <div className="flex bg-slate-100 p-1 rounded-xl mr-4">
                    <Button 
                        size="sm"
                        variant={viewForm.mode === 'GUI' ? 'primary' : 'ghost'}
                        onClick={() => setViewForm({...viewForm, mode: 'GUI'})}
                        className={viewForm.mode === 'GUI' ? 'shadow-sm' : 'text-slate-400'}
                    >
                        GUI Mode
                    </Button>
                    <Button 
                        size="sm"
                        variant={viewForm.mode === 'SQL' ? 'success' : 'ghost'}
                        onClick={() => setViewForm({...viewForm, mode: 'SQL'})}
                        className={viewForm.mode === 'SQL' ? 'shadow-sm bg-emerald-600 text-white' : 'text-slate-400'}
                    >
                        SQL Mode
                    </Button>
                </div>

                <Button 
                    id="save-view-btn"
                    onClick={handleSave}
                    className="px-8 py-3 bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
                >
                    保存配置
                </Button>
            </Card>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                {viewForm.mode === 'GUI' ? (
                    <>
                        <Card className="p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">1</div>
                                <h3 className="font-bold text-slate-800">数据源与过滤</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Select 
                                    label="选择数据连接"
                                    value={viewForm.sourceId}
                                    onChange={(e) => setViewForm({...viewForm, sourceId: e.target.value, tableName: ''})} 
                                    options={dataSources.map(s => ({ label: `${s.name} (${s.type})`, value: s.id }))}
                                />

                                <Input 
                                    label={isTDengine ? "查询过滤 (ts > NOW - 1h)" : "查询过滤 (WHERE Clause)"}
                                    value={viewForm.filter}
                                    onChange={(e) => setViewForm({...viewForm, filter: e.target.value})}
                                    className="font-mono text-indigo-600"
                                />
                                
                                {isTDengine && (
                                    <div className="col-span-full md:col-span-2">
                                        <Select
                                            label="目标超级表 (Super Table)"
                                            value={effectiveStable || ''}
                                            onChange={(e) => setViewForm({...viewForm, tableName: e.target.value})}
                                            disabled={!!sourceConfig.stable} 
                                            options={[
                                                { label: '-- 请选择超级表 --', value: '' },
                                                ...Object.keys(MOCK_TDENGINE_SCHEMA).map(st => ({ label: st, value: st }))
                                            ]}
                                        />
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className="p-8 space-y-6">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">2</div>
                                    <h3 className="font-bold text-slate-800">字段选择</h3>
                                </div>
                                <Input 
                                    placeholder="搜索字段..." 
                                    value={fieldSearchTerm}
                                    onChange={(e) => setFieldSearchTerm(e.target.value)}
                                    className="py-1 text-xs w-48"
                                    icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                                />
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
                        </Card>

                        {/* Semantic Model Definition */}
                        {allEditableFields.length > 0 && (
                            <Card className="p-8 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">3</div>
                                    <h3 className="font-bold text-slate-800">语义模型定义 (自定义指标/字段映射)</h3>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">原始字段</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">显示名称 (Alias)</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">单位</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">数据类型</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {allEditableFields.map(key => {
                                                const fieldConfig = viewForm.model[key] || { name: key };
                                                return (
                                                    <tr key={key} className="hover:bg-slate-50/50">
                                                        <td className="px-6 py-3 text-xs font-mono font-bold text-slate-700">{key}</td>
                                                        <td className="px-6 py-2">
                                                            <input 
                                                                value={fieldConfig.alias || ''}
                                                                onChange={(e) => handleModelUpdate(key, 'alias', e.target.value)}
                                                                className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none text-xs py-1"
                                                                placeholder={key}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-2">
                                                            <input 
                                                                value={fieldConfig.unit || ''}
                                                                onChange={(e) => handleModelUpdate(key, 'unit', e.target.value)}
                                                                className="w-20 bg-transparent border-b border-transparent focus:border-indigo-300 outline-none text-xs py-1"
                                                                placeholder="-"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-2">
                                                            <select 
                                                                value={fieldConfig.type || 'STRING'}
                                                                onChange={(e) => handleModelUpdate(key, 'type', e.target.value)}
                                                                className="bg-transparent text-xs font-bold text-slate-500 outline-none cursor-pointer"
                                                            >
                                                                <option value="STRING">STRING</option>
                                                                <option value="NUMBER">NUMBER</option>
                                                                <option value="DATE">DATE</option>
                                                                <option value="BOOLEAN">BOOLEAN</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        <Card className="p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">4</div>
                                <h3 className="font-bold text-slate-800">计算字段</h3>
                            </div>
                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                <div className="grid grid-cols-12 gap-4 items-end">
                                    <div className="col-span-3">
                                        <Input label="Field Name" value={newCalcField.name} onChange={(e) => setNewCalcField({...newCalcField, name: e.target.value})} placeholder="e.g. temp_f" />
                                    </div>
                                    <div className="col-span-7">
                                        <Input label="Expression (JS)" value={newCalcField.expression} onChange={(e) => setNewCalcField({...newCalcField, expression: e.target.value})} placeholder="e.g. temp * 1.8 + 32" className="font-mono" />
                                    </div>
                                    <div className="col-span-2">
                                        <Button onClick={handleAddCalculatedField} variant="success" className="w-full">Add</Button>
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
                        </Card>
                    </>
                ) : (
                    <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-2xl space-y-6 h-full flex flex-col animate-in fade-in">
                        {/* SQL Editor UI unchanged but styled */}
                        <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-sm text-lg">SQL</div>
                                <h3 className="font-bold text-white">Advanced Query Editor</h3>
                             </div>
                             <div className="bg-slate-800/80 px-3 py-1 rounded-lg text-[10px] text-slate-400 font-bold uppercase backdrop-blur border border-white/10">
                                {isTDengine ? 'TDengine SQL' : 'Standard SQL'}
                            </div>
                        </div>

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
                                <Button 
                                    onClick={handleGenerateSQL}
                                    disabled={isGeneratingSQL}
                                    variant="success"
                                    className="bg-emerald-600 text-white"
                                    icon={isGeneratingSQL ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                >
                                    Generate
                                </Button>
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

                {/* Data Preview Panel */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                    <Card className="p-0 overflow-hidden bg-slate-50 border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Data Preview (Mock)</h3>
                            <span className="text-[10px] text-slate-400">Showing first 5 records</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 text-slate-500">
                                    <tr>
                                        {allEditableFields.map(field => (
                                            <th key={field} className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                                                {viewForm.model[field]?.alias || field}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {previewData.length > 0 ? previewData.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            {allEditableFields.map(field => (
                                                <td key={field} className="px-6 py-3 text-xs font-mono text-slate-600 whitespace-nowrap">
                                                    {String(row[field] ?? '-')}
                                                </td>
                                            ))}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={allEditableFields.length} className="px-6 py-8 text-center text-xs text-slate-400 italic">
                                                No fields selected or no data available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
};
