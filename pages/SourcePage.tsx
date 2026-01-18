
import React, { useState, useEffect } from 'react';
import { DataSource } from '../types';
import { MOCK_TDENGINE_SCHEMA } from '../mockData';

// Helper Component for Key-Value Editing (e.g. Headers)
const KeyValueEditor = ({ items, onChange, title }: { items: { key: string, value: string }[], onChange: (items: { key: string, value: string }[]) => void, title: string }) => {
    const add = () => onChange([...items, { key: '', value: '' }]);
    const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
    const update = (idx: number, field: 'key' | 'value', val: string) => {
        const newItems = [...items];
        newItems[idx][field] = val;
        onChange(newItems);
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</label>
                <button onClick={add} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded transition-colors">+ Add Item</button>
            </div>
            <div className="space-y-2">
                {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 group">
                        <input type="text" placeholder="Key" value={item.key} onChange={e => update(idx, 'key', e.target.value)} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-400 transition-all placeholder-slate-300" />
                        <input type="text" placeholder="Value" value={item.value} onChange={e => update(idx, 'value', e.target.value)} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-400 transition-all placeholder-slate-300" />
                        <button onClick={() => remove(idx)} className="text-slate-300 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
                {items.length === 0 && <div className="text-[10px] text-slate-400 italic py-2 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50">No headers configured</div>}
            </div>
        </div>
    );
};

interface SourcePageProps {
  dataSources: DataSource[];
  onSaveSource: (source: DataSource) => void;
}

export const SourcePage: React.FC<SourcePageProps> = ({ dataSources, onSaveSource }) => {
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [sourceForm, setSourceForm] = useState<{
      name: string;
      type: DataSource['type'];
      config: any;
  }>({
      name: '',
      type: 'API',
      config: { url: '', method: 'GET', headers: [], body: '' }
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [healthStatus, setHealthStatus] = useState<Record<string, 'checking' | 'healthy' | 'unhealthy' | null>>({});

  useEffect(() => {
    if (editingSource) {
      let parsedConfig;
      try {
        parsedConfig = JSON.parse(editingSource.config);
      } catch (e) {
        parsedConfig = { url: editingSource.config };
      }

      // Ensure API fields structure exists for legacy data
      if (editingSource.type === 'API') {
          if (!parsedConfig.method) parsedConfig.method = 'GET';
          if (!parsedConfig.headers) parsedConfig.headers = [];
          if (!parsedConfig.body) parsedConfig.body = '';
          // Migrate old token field to Headers if present
          if (parsedConfig.token) {
              parsedConfig.headers.push({ key: 'Authorization', value: `Bearer ${parsedConfig.token}` });
              delete parsedConfig.token;
          }
      }

      setSourceForm({
        name: editingSource.name,
        type: editingSource.type,
        config: parsedConfig
      });
    } else if (isAddingSource) {
      setSourceForm({
        name: '',
        type: 'API',
        config: { url: '', method: 'GET', headers: [{ key: 'Content-Type', value: 'application/json' }], body: '' }
      });
    }
    setValidationErrors([]);
    setTestResult(null);
  }, [editingSource, isAddingSource]);

  const handleTypeChange = (newType: DataSource['type']) => {
    const defaultConfigs: Record<DataSource['type'], any> = {
      API: { url: '', method: 'GET', headers: [{ key: 'Accept', value: 'application/json' }], body: '' },
      MySQL: { host: 'localhost', port: '3306', user: '', password: '', db: '' },
      PostgreSQL: { host: 'localhost', port: '5432', user: '', password: '', db: '' },
      TDengine: { host: 'localhost', port: '6030', user: 'root', password: '', db: '', stable: '' }
    };
    setSourceForm(prev => ({
      ...prev,
      type: newType,
      config: defaultConfigs[newType]
    }));
    setValidationErrors([]);
  };

  const testConnection = () => {
    setIsTestingConnection(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTestingConnection(false);
      setTestResult(Math.random() > 0.3 ? 'success' : 'error');
    }, 1500);
  };

  const checkSourceHealth = (id: string) => {
    setHealthStatus(prev => ({ ...prev, [id]: 'checking' }));
    setTimeout(() => {
      const isHealthy = Math.random() > 0.2; 
      setHealthStatus(prev => ({ ...prev, [id]: isHealthy ? 'healthy' : 'unhealthy' }));
    }, 1500);
  };

  const handleSave = () => {
    const { name, type, config } = sourceForm;
    const errors: string[] = [];
    
    if (!name.trim()) errors.push('name');
    if (type === 'API' && !config.url) errors.push('url');
    if (type !== 'API' && (!config.host || !config.db)) {
      if (!config.host) errors.push('host');
      if (!config.db) errors.push('db');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const sourceData: DataSource = {
      id: editingSource?.id || `src-${Date.now()}`,
      name: name.trim(),
      type,
      config: JSON.stringify(config)
    };
    
    onSaveSource(sourceData);
    setSaveSuccess(true);
    setTimeout(() => {
      setEditingSource(null);
      setIsAddingSource(false);
      setSaveSuccess(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">活动数据源</h3>
            <button onClick={() => setIsAddingSource(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all">新增连接</button>
        </div>
        <div className="grid grid-cols-2 gap-6">
            {dataSources.map(source => (
            <div key={source.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-all group">
                <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg></div>
                <div>
                    <h4 className="font-black text-slate-800 text-lg">{source.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">{source.type}</span>
                        {healthStatus[source.id] === 'healthy' && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">● 可用</span>}
                        {healthStatus[source.id] === 'unhealthy' && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">● 异常</span>}
                    </div>
                </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                    onClick={() => checkSourceHealth(source.id)} 
                    disabled={healthStatus[source.id] === 'checking'}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
                        healthStatus[source.id] === 'checking' ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-wait' : 
                        'bg-white text-slate-500 border-slate-200 hover:border-indigo-500 hover:text-indigo-600'
                    }`}
                    >
                    {healthStatus[source.id] === 'checking' ? <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    <span>{healthStatus[source.id] === 'checking' ? '检测中...' : '健康检查'}</span>
                    </button>
                    <button onClick={() => setEditingSource(source)} className="p-3 text-slate-400 hover:text-indigo-600 transition-all bg-slate-50 hover:bg-indigo-50 rounded-xl">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                </div>
            </div>
            ))}
        </div>

        {/* --- 数据源配置弹窗 --- */}
      {(isAddingSource || editingSource) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] shadow-2xl border border-white/40 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
             <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white to-slate-50/30">
               <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingSource ? '编辑连接配置' : '连接新数据源'}</h3>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1">Connectivity Driver</p>
               </div>
               <button onClick={() => { setIsAddingSource(false); setEditingSource(null); }} className="p-3 text-slate-400 hover:text-rose-500 rounded-2xl transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
             
             <div className="flex-1 p-10 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">连接标识名称</label>
                    <input 
                      type="text" 
                      value={sourceForm.name}
                      onChange={(e) => setSourceForm(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-6 py-4 bg-slate-50 border rounded-[20px] focus:ring-4 outline-none transition-all font-bold text-slate-700 ${validationErrors.includes('name') ? 'border-rose-400 ring-rose-50' : 'border-slate-100 focus:ring-indigo-100 focus:border-indigo-400'}`}
                      placeholder="e.g. 生产数据库-01"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">连接引擎类型</label>
                    <div className="relative">
                      <select 
                        value={sourceForm.type}
                        onChange={(e) => handleTypeChange(e.target.value as any)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                      >
                        <option value="API">RESTful API Connector</option>
                        <option value="MySQL">MySQL Database</option>
                        <option value="PostgreSQL">PostgreSQL Database</option>
                        <option value="TDengine">TDengine Time-Series Engine</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[32px] bg-slate-50/50 border border-slate-100 space-y-6">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                       {sourceForm.type} 配置详情
                  </h4>

                  {sourceForm.type === 'API' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex gap-4">
                          <div className="w-1/4">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Method</label>
                              <div className="relative">
                                  <select 
                                      value={sourceForm.config.method || 'GET'}
                                      onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, method: e.target.value } }))}
                                      className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 font-black text-xs text-slate-700 appearance-none"
                                  >
                                      {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                  <svg className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                              </div>
                          </div>
                          <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Endpoint URL</label>
                              <input 
                                  type="text" 
                                  value={sourceForm.config.url || ''}
                                  onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, url: e.target.value } }))}
                                  className={`w-full px-5 py-3.5 bg-white border rounded-xl outline-none focus:border-indigo-400 font-mono text-xs text-indigo-600 ${validationErrors.includes('url') ? 'border-rose-400' : 'border-slate-200'}`}
                                  placeholder="https://api.example.com/v1/resource"
                              />
                          </div>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-2xl p-4">
                          <KeyValueEditor 
                              title="Request Headers" 
                              items={sourceForm.config.headers || []} 
                              onChange={items => setSourceForm(prev => ({ ...prev, config: { ...prev.config, headers: items } }))}
                          />
                      </div>

                      {['POST', 'PUT', 'PATCH'].includes(sourceForm.config.method) && (
                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Request Body (JSON)</label>
                              <textarea 
                                  value={sourceForm.config.body || ''}
                                  onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, body: e.target.value } }))}
                                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 font-mono text-xs text-slate-600 h-32 resize-none"
                                  placeholder='{"key": "value"}'
                              />
                          </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-12 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="col-span-9">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Host / IP</label>
                        <input type="text" value={sourceForm.config.host} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, host: e.target.value } }))} className={`w-full px-5 py-3.5 bg-white border rounded-xl outline-none font-mono text-xs ${validationErrors.includes('host') ? 'border-rose-400' : 'border-slate-100 focus:border-indigo-400'}`} />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Port</label>
                        <input type="text" value={sourceForm.config.port} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, port: e.target.value } }))} className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-xl outline-none" />
                      </div>
                      <div className="col-span-6"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">User</label><input type="text" value={sourceForm.config.user} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, user: e.target.value } }))} className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-xl outline-none" /></div>
                      <div className="col-span-6"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Pass</label><input type="password" value={sourceForm.config.password} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, password: e.target.value } }))} className="w-full px-5 py-3.5 bg-white border border-slate-100 rounded-xl outline-none" /></div>
                      <div className="col-span-12">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Database Name</label>
                        <input type="text" value={sourceForm.config.db} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, db: e.target.value } }))} className={`w-full px-5 py-3.5 bg-white border rounded-xl outline-none font-bold text-xs ${validationErrors.includes('db') ? 'border-rose-400' : 'border-slate-100 focus:border-indigo-400'}`} />
                      </div>

                      {/* TDengine Specific Config: Super Table Selection */}
                      {sourceForm.type === 'TDengine' && (
                          <>
                             <div className="col-span-12 pt-4 border-t border-slate-100 mt-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Super Table (STable)</label>
                                <div className="relative">
                                    <select 
                                        value={sourceForm.config.stable || ''}
                                        onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, stable: e.target.value } }))}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-700 appearance-none cursor-pointer hover:bg-white transition-colors"
                                    >
                                        <option value="">-- Select Super Table --</option>
                                        {Object.keys(MOCK_TDENGINE_SCHEMA).map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                             </div>

                             {/* Automatic Schema Loading Preview */}
                             {sourceForm.config.stable && MOCK_TDENGINE_SCHEMA[sourceForm.config.stable] && (
                                <div className="col-span-12 mt-2 bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                                     <div className="flex items-center gap-2 mb-4">
                                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                         <h5 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Auto-Detected Schema</h5>
                                     </div>
                                     <div className="grid grid-cols-2 gap-6">
                                         <div>
                                             <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block border-b border-indigo-100/50 pb-1">Metadata (Tags)</span>
                                             <div className="flex flex-wrap gap-2 mt-2">
                                                 {MOCK_TDENGINE_SCHEMA[sourceForm.config.stable].tags.map(tag => (
                                                     <span key={tag} className="px-2 py-1 bg-white border border-indigo-100 text-indigo-600 text-[10px] font-mono font-bold rounded-lg shadow-sm">{tag}</span>
                                                 ))}
                                             </div>
                                         </div>
                                         <div>
                                             <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block border-b border-indigo-100/50 pb-1">Metrics (Columns)</span>
                                             <div className="flex flex-wrap gap-2 mt-2">
                                                 {MOCK_TDENGINE_SCHEMA[sourceForm.config.stable].columns.map(col => (
                                                     <span key={col} className="px-2 py-1 bg-white border border-emerald-100 text-emerald-600 text-[10px] font-mono font-bold rounded-lg shadow-sm">{col}</span>
                                                 ))}
                                             </div>
                                         </div>
                                     </div>
                                </div>
                             )}
                          </>
                      )}
                    </div>
                  )}

                  <div className="pt-4 flex items-center justify-between border-t border-slate-200/50 mt-6">
                    <button 
                      onClick={testConnection} 
                      disabled={isTestingConnection}
                      className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 ${isTestingConnection ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-sm'}`}
                    >
                      {isTestingConnection ? (
                        <>
                          <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                          正在测试...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          测试连接连通性
                        </>
                      )}
                    </button>
                    
                    {testResult && (
                      <div className={`text-[10px] font-black uppercase flex items-center gap-2 animate-in slide-in-from-right-2 fade-in duration-300 ${testResult === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {testResult === 'success' ? (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            连接成功 · 已就绪
                          </>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                            连接失败 · 请检查网络
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
             </div>

             <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={handleSave}
                  className={`flex-1 py-4.5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${saveSuccess ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'}`}
                >
                  {saveSuccess ? <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> 已保存连接</> : '确认应用并部署'}
                </button>
                <button 
                  onClick={() => { setIsAddingSource(false); setEditingSource(null); }}
                  className="px-10 py-4.5 bg-white border border-slate-200 text-slate-500 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  取消
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
