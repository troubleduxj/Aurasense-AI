
import React, { useState, useEffect } from 'react';
import { DataSource } from '../types';
import { MOCK_TDENGINE_SCHEMA } from '../mockData';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

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
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</label>
                <Button variant="ghost" size="sm" onClick={add} className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100">+ Add Item</Button>
            </div>
            <div className="space-y-2">
                {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 group">
                        <Input placeholder="Key" value={item.key} onChange={e => update(idx, 'key', e.target.value)} className="flex-1 py-2 text-xs" />
                        <Input placeholder="Value" value={item.value} onChange={e => update(idx, 'value', e.target.value)} className="flex-1 py-2 text-xs" />
                        <Button variant="ghost" size="sm" onClick={() => remove(idx)} className="text-slate-300 hover:text-rose-500 px-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </Button>
                    </div>
                ))}
                {items.length === 0 && <div className="text-[10px] text-slate-400 italic py-3 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">No headers configured</div>}
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

      if (editingSource.type === 'API') {
          if (!parsedConfig.method) parsedConfig.method = 'GET';
          if (!parsedConfig.headers) parsedConfig.headers = [];
          if (!parsedConfig.body) parsedConfig.body = '';
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
      TDengine: { host: 'localhost', port: '6030', user: 'root', password: '', db: '', stable: '' },
      Oracle: { host: 'localhost', port: '1521', user: '', password: '', db: '', sid: 'ORCL' },
      SQLServer: { host: 'localhost', port: '1433', user: 'sa', password: '', db: '', instance: '' },
      MQTT: { brokerUrl: 'mqtt://broker.hivemq.com', port: '1883', topic: 'sensors/#', clientId: '', username: '', password: '' },
      Kafka: { bootstrapServers: 'localhost:9092', topic: 'iot-events', groupId: 'aurasense-consumer' },
      InfluxDB: { url: 'http://localhost:8086', token: '', org: 'my-org', bucket: 'iot_bucket' }
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
    
    // Basic validation based on type
    if (type === 'API' && !config.url) errors.push('url');
    if (['MySQL', 'PostgreSQL', 'TDengine', 'Oracle', 'SQLServer'].includes(type)) {
       if (!config.host) errors.push('host');
       if (!config.db) errors.push('db');
    }
    if (type === 'MQTT' && !config.brokerUrl) errors.push('brokerUrl');
    if (type === 'Kafka' && !config.bootstrapServers) errors.push('bootstrapServers');
    if (type === 'InfluxDB' && !config.url) errors.push('url');

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

  // Helper to determine if we should render standard DB fields
  const isStandardDB = ['MySQL', 'PostgreSQL', 'TDengine', 'Oracle', 'SQLServer'].includes(sourceForm.type);

  return (
    <div className="space-y-6">
        <Card className="flex justify-between items-center p-6">
            <div>
                <h3 className="text-lg font-black text-slate-800">活动数据源</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Data Source Connections</p>
            </div>
            <Button onClick={() => setIsAddingSource(true)} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>}>新增连接</Button>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataSources.map(source => (
            <Card key={source.id} className="flex items-center justify-between group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                        {['MQTT', 'Kafka'].includes(source.type) ? (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        ) : source.type === 'InfluxDB' ? (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                        )}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 text-lg">{source.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="primary">{source.type}</Badge>
                            {healthStatus[source.id] === 'healthy' && <Badge variant="success" dot>可用</Badge>}
                            {healthStatus[source.id] === 'unhealthy' && <Badge variant="danger" dot>异常</Badge>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => checkSourceHealth(source.id)} 
                        disabled={healthStatus[source.id] === 'checking'}
                        icon={healthStatus[source.id] === 'checking' ? <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    >
                        {healthStatus[source.id] === 'checking' ? '检测中...' : '检测'}
                    </Button>
                    <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingSource(source)}
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                    />
                </div>
            </Card>
            ))}
        </div>

        {/* --- 数据源配置弹窗 --- */}
        <Modal
            isOpen={isAddingSource || !!editingSource}
            onClose={() => { setIsAddingSource(false); setEditingSource(null); }}
            title={editingSource ? '编辑连接配置' : '连接新数据源'}
            subtitle="Connectivity Driver Configuration"
            footer={
                <div className="flex gap-4 w-full">
                    <Button 
                        variant="primary" 
                        onClick={handleSave} 
                        className="flex-1"
                        icon={saveSuccess ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : undefined}
                    >
                        {saveSuccess ? '已保存' : '确认并连接'}
                    </Button>
                    <Button variant="secondary" onClick={() => { setIsAddingSource(false); setEditingSource(null); }}>取消</Button>
                </div>
            }
        >
             <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <Input 
                      label="连接名称" 
                      placeholder="e.g. 生产数据库-01"
                      value={sourceForm.name}
                      onChange={(e) => setSourceForm(prev => ({ ...prev, name: e.target.value }))}
                      className={validationErrors.includes('name') ? 'border-rose-400' : ''}
                  />

                  <Select
                    label="引擎类型"
                    value={sourceForm.type}
                    onChange={(e) => handleTypeChange(e.target.value as any)}
                  >
                    <optgroup label="Database">
                        <option value="MySQL">MySQL</option>
                        <option value="PostgreSQL">PostgreSQL</option>
                        <option value="Oracle">Oracle</option>
                        <option value="SQLServer">SQL Server</option>
                    </optgroup>
                    <optgroup label="Time-Series & IoT">
                        <option value="TDengine">TDengine</option>
                        <option value="InfluxDB">InfluxDB</option>
                        <option value="MQTT">MQTT Broker</option>
                        <option value="Kafka">Apache Kafka</option>
                    </optgroup>
                    <optgroup label="Other">
                        <option value="API">RESTful API</option>
                    </optgroup>
                  </Select>
                </div>

                <div className="p-6 rounded-[24px] bg-slate-50/50 border border-slate-100 space-y-6">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                       {sourceForm.type} 配置详情
                  </h4>

                  {sourceForm.type === 'API' && (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="flex gap-4">
                          <div className="w-1/4">
                              <Select 
                                  label="Method"
                                  value={sourceForm.config.method || 'GET'}
                                  onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, method: e.target.value } }))}
                                  options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => ({ label: m, value: m }))}
                              />
                          </div>
                          <div className="flex-1">
                              <Input 
                                  label="Endpoint URL"
                                  value={sourceForm.config.url || ''}
                                  onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, url: e.target.value } }))}
                                  placeholder="https://api.example.com/v1/resource"
                                  className={`font-mono text-indigo-600 ${validationErrors.includes('url') ? 'border-rose-400' : ''}`}
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
                  )}

                  {/* Standard Relational DBs & TDengine */}
                  {isStandardDB && (
                    <div className="grid grid-cols-12 gap-4 animate-in fade-in">
                      <div className="col-span-9">
                        <Input label="Host / IP" value={sourceForm.config.host} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, host: e.target.value } }))} className="font-mono" />
                      </div>
                      <div className="col-span-3">
                        <Input label="Port" value={sourceForm.config.port} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, port: e.target.value } }))} className="font-mono" />
                      </div>
                      <div className="col-span-6">
                          <Input label="Username" value={sourceForm.config.user} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, user: e.target.value } }))} />
                      </div>
                      <div className="col-span-6">
                          <Input label="Password" type="password" value={sourceForm.config.password} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, password: e.target.value } }))} />
                      </div>
                      
                      {sourceForm.type === 'Oracle' ? (
                          <div className="col-span-12">
                            <Input label="SID / Service Name" value={sourceForm.config.sid} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, sid: e.target.value } }))} />
                          </div>
                      ) : (
                          <div className="col-span-12">
                            <Input label="Database Name" value={sourceForm.config.db} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, db: e.target.value } }))} />
                          </div>
                      )}

                      {/* TDengine Specific Config: Super Table Selection */}
                      {sourceForm.type === 'TDengine' && (
                          <>
                             <div className="col-span-12 pt-4 border-t border-slate-100 mt-2">
                                <Select 
                                    label="Target Super Table (STable)"
                                    value={sourceForm.config.stable || ''}
                                    onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, stable: e.target.value } }))}
                                >
                                    <option value="">-- Select Super Table --</option>
                                    {Object.keys(MOCK_TDENGINE_SCHEMA).map(st => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </Select>
                             </div>

                             {sourceForm.config.stable && MOCK_TDENGINE_SCHEMA[sourceForm.config.stable] && (
                                <div className="col-span-12 mt-2 bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 animate-in fade-in">
                                     <div className="flex items-center gap-2 mb-4">
                                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                         <h5 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Auto-Detected Schema</h5>
                                     </div>
                                     <div className="grid grid-cols-2 gap-6">
                                         <div>
                                             <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block border-b border-indigo-100/50 pb-1">Metadata (Tags)</span>
                                             <div className="flex flex-wrap gap-2 mt-2">
                                                 {MOCK_TDENGINE_SCHEMA[sourceForm.config.stable].tags.map(tag => (
                                                     <Badge key={tag} variant="primary" className="font-mono text-[9px]">{tag}</Badge>
                                                 ))}
                                             </div>
                                         </div>
                                         <div>
                                             <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block border-b border-indigo-100/50 pb-1">Metrics (Columns)</span>
                                             <div className="flex flex-wrap gap-2 mt-2">
                                                 {MOCK_TDENGINE_SCHEMA[sourceForm.config.stable].columns.map(col => (
                                                     <Badge key={col} variant="success" className="font-mono text-[9px]">{col}</Badge>
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

                  {/* Message Queues (MQTT / Kafka) */}
                  {(sourceForm.type === 'MQTT' || sourceForm.type === 'Kafka') && (
                      <div className="grid grid-cols-12 gap-4 animate-in fade-in">
                          <div className="col-span-12">
                              <Input 
                                label={sourceForm.type === 'MQTT' ? 'Broker URL' : 'Bootstrap Servers'}
                                value={sourceForm.type === 'MQTT' ? sourceForm.config.brokerUrl : sourceForm.config.bootstrapServers} 
                                onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, [sourceForm.type === 'MQTT' ? 'brokerUrl' : 'bootstrapServers']: e.target.value } }))} 
                                placeholder={sourceForm.type === 'MQTT' ? 'mqtt://broker.hivemq.com' : 'localhost:9092,localhost:9093'}
                                className="font-mono text-indigo-600"
                              />
                          </div>
                          <div className="col-span-6">
                              <Input label="Topic Subscription" value={sourceForm.config.topic} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, topic: e.target.value } }))} />
                          </div>
                          {sourceForm.type === 'MQTT' ? (
                              <div className="col-span-6">
                                  <Input label="Client ID" value={sourceForm.config.clientId} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, clientId: e.target.value } }))} />
                              </div>
                          ) : (
                              <div className="col-span-6">
                                  <Input label="Consumer Group ID" value={sourceForm.config.groupId} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, groupId: e.target.value } }))} />
                              </div>
                          )}
                          {sourceForm.type === 'MQTT' && (
                              <>
                                <div className="col-span-6"><Input label="Username" value={sourceForm.config.username} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, username: e.target.value } }))} /></div>
                                <div className="col-span-6"><Input label="Password" type="password" value={sourceForm.config.password} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, password: e.target.value } }))} /></div>
                              </>
                          )}
                      </div>
                  )}

                  {/* InfluxDB */}
                  {sourceForm.type === 'InfluxDB' && (
                      <div className="grid grid-cols-12 gap-4 animate-in fade-in">
                          <div className="col-span-12">
                              <Input label="URL" value={sourceForm.config.url} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, url: e.target.value } }))} className="font-mono" />
                          </div>
                          <div className="col-span-12">
                              <Input label="Token" type="password" value={sourceForm.config.token} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, token: e.target.value } }))} className="font-mono" />
                          </div>
                          <div className="col-span-6">
                              <Input label="Organization" value={sourceForm.config.org} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, org: e.target.value } }))} />
                          </div>
                          <div className="col-span-6">
                              <Input label="Bucket" value={sourceForm.config.bucket} onChange={(e) => setSourceForm(prev => ({ ...prev, config: { ...prev.config, bucket: e.target.value } }))} />
                          </div>
                      </div>
                  )}

                  <div className="pt-4 flex items-center justify-between border-t border-slate-200/50 mt-6">
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={testConnection} 
                      disabled={isTestingConnection}
                      icon={isTestingConnection ? <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    >
                      {isTestingConnection ? 'Testing...' : 'Test Connection'}
                    </Button>
                    
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
        </Modal>
    </div>
  );
};
