
import React, { useState, useEffect } from 'react';
import { DeviceCategory, DataSource } from '../types';
import { MOCK_TDENGINE_SCHEMA } from '../mockData';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

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

  const handleSourceChange = (sourceId: string) => {
      const source = dataSources.find(s => s.id === sourceId);
      let newFormData = { ...formData, sourceId };
      
      newFormData.tdengineSuperTable = '';
      newFormData.defaultDisplayMetric = '';
      newFormData.metricDefinitions = [];

      if (source?.type === 'TDengine') {
          try {
              const config = JSON.parse(source.config || '{}');
              if (config.stable) {
                  newFormData.tdengineSuperTable = config.stable;
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
          newFormData.metricDefinitions = [...allMetrics, 'ts'];
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
      <Card className="flex justify-between items-center p-6">
        <div>
           <h3 className="text-xl font-black text-slate-800 tracking-tight">设备分类定义</h3>
           <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Classification Standards</p>
        </div>
        <Button onClick={handleAdd} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>}>
           新增分类
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {categories.map(cat => (
           <Card key={cat.id} hoverEffect className="group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(cat)} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>} />
                  <Button variant="danger" size="sm" onClick={() => onDeleteCategory(cat.id)} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>} />
              </div>

              <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                     <span className="text-lg font-black">{cat.code?.charAt(0)}</span>
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 text-lg">{cat.name}</h4>
                      <Badge variant="neutral" className="mt-1 font-mono text-[9px]">{cat.code}</Badge>
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
                           <Badge variant="primary" className="font-mono">{cat.tdengineSuperTable}</Badge>
                       )}
                       {cat.defaultDisplayMetric && (
                           <Badge variant="success" className="font-mono flex items-center gap-1">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                               {cat.defaultDisplayMetric}
                           </Badge>
                       )}
                  </div>
              </div>
           </Card>
         ))}
         
         <div 
            onClick={handleAdd}
            className="border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center p-6 text-slate-300 cursor-pointer hover:border-indigo-300 hover:text-indigo-400 hover:bg-slate-50/50 transition-all min-h-[220px]"
         >
             <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             <span className="text-xs font-bold uppercase tracking-widest">添加新分类</span>
         </div>
      </div>

      {/* --- 分类编辑/新增弹窗 --- */}
      <Modal
        isOpen={isAdding || !!editingCategory}
        onClose={() => { setIsAdding(false); setEditingCategory(null); }}
        title={editingCategory ? '编辑分类' : '新建分类'}
        subtitle="Category Metadata"
        footer={
            <div className="flex gap-4 w-full">
                <Button variant="primary" onClick={handleSave} className="flex-1">保存配置</Button>
                <Button variant="secondary" onClick={() => { setIsAdding(false); setEditingCategory(null); }}>取消</Button>
            </div>
        }
      >
             <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                     <Input 
                        label="分类名称" 
                        value={formData.name || ''} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. 工业机器人"
                     />
                     <Input 
                        label="分类代码 (Code)" 
                        value={formData.code || ''} 
                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        className="font-mono text-indigo-600 uppercase"
                        placeholder="e.g. ROBOT_ARM"
                     />
                 </div>

                 <Select 
                    label="绑定数据源 (Data Source)"
                    value={formData.sourceId || ''} 
                    onChange={e => handleSourceChange(e.target.value)}
                    options={[
                        { label: '-- 选择设备数据源 --', value: '' },
                        ...dataSources.map(ds => ({ label: `${ds.name} (${ds.type})`, value: ds.id }))
                    ]}
                 />
                 
                 {/* TDengine Specific Fields */}
                 {isTDengine && (
                     <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in">
                         <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> TDengine Configuration
                         </h4>
                         
                         <Select 
                            label="超级表 (Super Table)"
                            value={formData.tdengineSuperTable || ''}
                            onChange={e => handleSuperTableChange(e.target.value)}
                            disabled={hasDefaultStable}
                            className={hasDefaultStable ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'text-indigo-600'}
                            options={[
                                { label: '-- Select STable --', value: '' },
                                ...Object.keys(MOCK_TDENGINE_SCHEMA).map(st => ({ label: st, value: st }))
                            ]}
                         />

                         {formData.tdengineSuperTable && (
                             <div>
                                 <Select 
                                    label="默认监控指标 (Golden Signal)"
                                    value={formData.defaultDisplayMetric || ''}
                                    onChange={e => setFormData({...formData, defaultDisplayMetric: e.target.value})}
                                    className="font-mono text-emerald-600"
                                    options={formData.metricDefinitions?.filter(m => m !== 'ts').map(m => ({ label: m, value: m }))}
                                 />
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
                     <div className="animate-in fade-in">
                         <Input 
                            label="默认监控指标 Key (Manual Entry)"
                            value={formData.defaultDisplayMetric || ''} 
                            onChange={e => setFormData({...formData, defaultDisplayMetric: e.target.value})}
                            className="font-mono font-bold text-emerald-600"
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
      </Modal>
    </div>
  );
};
