
import React, { useState, useMemo } from 'react';
import { MetricConfig, MetricDefinition, DeviceType } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

interface MetricManagerPageProps {
  metricConfig: MetricConfig;
  onUpdateConfig: (config: MetricConfig) => void;
}

export const MetricManagerPage: React.FC<MetricManagerPageProps> = ({ metricConfig, onUpdateConfig }) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [metricCode, setMetricCode] = useState('');
  const [metricScope, setMetricScope] = useState<string>('GLOBAL');
  const [formData, setFormData] = useState<MetricDefinition>({ label: '', unit: '', color: '#6366f1' });

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
    
    const finalKey = metricScope === 'GLOBAL' ? metricCode.trim() : `${metricScope}__${metricCode.trim()}`;

    if (isAdding && metricConfig[finalKey]) {
        alert('This Metric Scope + Code combination already exists!');
        return;
    }

    const newConfig = { ...metricConfig };
    
    if (editingKey && editingKey !== finalKey) {
        delete newConfig[editingKey]; 
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
        <Card className="flex justify-between items-center p-6">
            <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">指标定义管理</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Metric Metadata Dictionary</p>
            </div>
            <Button onClick={handleStartAdd} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>}>
                注册新指标
            </Button>
        </Card>

        {Object.entries(groupedMetrics).sort((a, b) => a[0] === 'GLOBAL' ? -1 : 1).map(([scope, keys]) => {
            if (keys.length === 0) return null;
            return (
                <div key={scope} className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <Badge variant={scope === 'GLOBAL' ? 'neutral' : 'primary'} className="text-[10px]">
                            {scope === 'GLOBAL' ? 'Global Defaults' : `${scope} Specific`}
                        </Badge>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {keys.map(fullKey => {
                            const def = metricConfig[fullKey];
                            const { code } = parseKey(fullKey);
                            return (
                                <Card key={fullKey} hoverEffect className="group relative overflow-hidden">
                                    <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full" style={{ backgroundColor: def.color }}></div>
                                    <div className="flex justify-between items-start mt-2 mb-4">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{def.label}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-mono text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded">{code}</span>
                                                {def.unit && <Badge variant="primary" className="text-[9px] bg-indigo-50 text-indigo-500">{def.unit}</Badge>}
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full shadow-sm border border-slate-100" style={{ backgroundColor: def.color }}></div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="secondary" onClick={() => handleEdit(fullKey)} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>} />
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(fullKey)} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>} />
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            );
        })}

        <Modal
            isOpen={isAdding || !!editingKey}
            onClose={() => { setIsAdding(false); setEditingKey(null); }}
            title={isAdding ? '注册新指标' : '编辑指标定义'}
            subtitle={isAdding ? 'Create Metric' : 'Edit Metric'}
            footer={
                <div className="flex gap-4 w-full">
                    <Button onClick={handleSave} className="flex-1">保存配置</Button>
                    <Button variant="secondary" onClick={() => { setIsAdding(false); setEditingKey(null); }}>取消</Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                        <Select 
                            label="Scope (作用域)"
                            value={metricScope}
                            onChange={e => setMetricScope(e.target.value)}
                            disabled={!isAdding}
                            options={[
                                { label: 'GLOBAL (通用)', value: 'GLOBAL' },
                                ...Object.values(DeviceType).map(t => ({ label: t, value: t }))
                            ]}
                        />
                    </div>
                    <div className="col-span-2">
                        <Input 
                            label="Metric Key (Raw Code)"
                            value={metricCode}
                            onChange={e => setMetricCode(e.target.value)}
                            disabled={!isAdding}
                            placeholder="e.g. pressure"
                            className="font-mono text-indigo-600"
                        />
                    </div>
                </div>

                {metricScope !== 'GLOBAL' && (
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-[10px] text-indigo-700 leading-relaxed">
                        <span className="font-bold">提示：</span> 此配置仅对 <span className="font-bold">{metricScope}</span> 类型的设备生效。如果设备没有特定配置，将回退使用 GLOBAL 配置。
                    </div>
                )}

                <Input 
                    label="显示名称 (Label)"
                    value={formData.label}
                    onChange={e => setFormData({...formData, label: e.target.value})}
                    placeholder="e.g. 液压泵压力"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="单位 (Unit)"
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value})}
                        placeholder="e.g. MPa"
                    />
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">代表色 (Color)</label>
                        <div className="flex gap-2">
                            <input 
                                type="color" 
                                value={formData.color} 
                                onChange={e => setFormData({...formData, color: e.target.value})} 
                                className="h-11 w-12 rounded-xl cursor-pointer border border-slate-200 p-1 bg-white"
                            />
                            <Input 
                                value={formData.color} 
                                onChange={e => setFormData({...formData, color: e.target.value})} 
                                className="flex-1 font-mono text-xs uppercase"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    </div>
  );
};
