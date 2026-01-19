
import React, { useState, useEffect } from 'react';
import { AlarmRule, AlarmEvent, DeviceType, AlarmSeverity } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { suggestThresholds } from '../geminiService'; // Assume this exists now

interface AlarmPageProps {
    rules: AlarmRule[];
    events: AlarmEvent[];
    onSaveRule: (rule: AlarmRule) => void;
    onDeleteRule: (id: string) => void;
    onAcknowledgeEvent: (id: string) => void;
}

export const AlarmPage: React.FC<AlarmPageProps> = ({ rules, events, onSaveRule, onDeleteRule, onAcknowledgeEvent }) => {
    const [activeTab, setActiveTab] = useState<'events' | 'rules'>('events');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<AlarmRule>>({});
    
    // AI Suggestion State
    const [isSuggesting, setIsSuggesting] = useState(false);

    const handleEdit = (rule?: AlarmRule) => {
        if (rule) {
            setFormData(rule);
        } else {
            setFormData({ name: '', deviceType: 'SENSOR', metricKey: '', operator: '>', threshold: 0, severity: 'warning', enabled: true });
        }
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.metricKey) return;
        const newRule: AlarmRule = {
            id: formData.id || `rule-${Date.now()}`,
            name: formData.name,
            deviceType: formData.deviceType || 'ALL',
            metricKey: formData.metricKey,
            operator: formData.operator || '>',
            threshold: Number(formData.threshold),
            severity: formData.severity || 'info',
            enabled: formData.enabled ?? true
        };
        onSaveRule(newRule);
        setIsEditing(false);
    };

    const handleSuggest = async () => {
        if (!formData.deviceType || !formData.metricKey) return;
        setIsSuggesting(true);
        try {
            const suggestions = await suggestThresholds(formData.deviceType, formData.metricKey);
            if (suggestions && suggestions.recommended_threshold) {
                setFormData(prev => ({ 
                    ...prev, 
                    threshold: suggestions.recommended_threshold,
                    name: `AI: ${formData.deviceType} ${formData.metricKey} Alert`
                }));
            }
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="flex justify-between items-center p-6">
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">告警中心</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Alarm Engine & History</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={activeTab === 'events' ? 'primary' : 'ghost'} onClick={() => setActiveTab('events')}>实时告警</Button>
                    <Button variant={activeTab === 'rules' ? 'primary' : 'ghost'} onClick={() => setActiveTab('rules')}>规则配置</Button>
                </div>
            </Card>

            {activeTab === 'events' && (
                <Card className="p-0 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Severity</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Time</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Rule Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Device</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Details</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {events.map(event => (
                                <tr key={event.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <Badge variant={event.severity === 'critical' ? 'danger' : event.severity === 'warning' ? 'warning' : 'primary'} dot>
                                            {event.severity}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{event.ruleName}</td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="font-bold text-slate-700">{event.deviceName}</div>
                                        <div className="font-mono text-[10px] text-slate-400">{event.deviceId}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-600">
                                        {event.metricKey}: <span className="font-bold text-rose-500">{event.value}</span> (Threshold: {event.threshold})
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black uppercase ${event.status === 'active' ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {event.status === 'active' && (
                                            <Button size="sm" variant="secondary" onClick={() => onAcknowledgeEvent(event.id)}>Acknowledge</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {events.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No active alarms. System is healthy.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            )}

            {activeTab === 'rules' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={() => handleEdit()} variant="primary" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>}>New Rule</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rules.map(rule => (
                            <Card key={rule.id} className="relative group hover:border-indigo-200">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(rule)}>Edit</Button>
                                    <Button size="sm" variant="danger" onClick={() => onDeleteRule(rule.id)}>Del</Button>
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <Badge variant={rule.severity === 'critical' ? 'danger' : rule.severity === 'warning' ? 'warning' : 'primary'}>{rule.severity}</Badge>
                                    <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm mb-1">{rule.name}</h4>
                                <div className="text-xs text-slate-500 font-mono mb-4">
                                    If <span className="font-bold text-indigo-600">{rule.metricKey}</span> {rule.operator} {rule.threshold}
                                </div>
                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Target</span>
                                    <Badge variant="neutral" className="font-mono text-[10px]">{rule.deviceType}</Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title={formData.id ? '编辑告警规则' : '创建告警规则'}
                subtitle="Rule Configuration"
                footer={
                    <div className="flex gap-4 w-full">
                        <Button onClick={handleSave} className="flex-1">Save Rule</Button>
                        <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <Input label="Rule Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. High Temp Warning" />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Select 
                            label="Device Type"
                            value={formData.deviceType}
                            onChange={e => setFormData({...formData, deviceType: e.target.value})}
                            options={[
                                { label: 'All Devices', value: 'ALL' },
                                ...Object.values(DeviceType).map(t => ({ label: t, value: t }))
                            ]}
                        />
                        <Input label="Metric Key" value={formData.metricKey || ''} onChange={e => setFormData({...formData, metricKey: e.target.value})} placeholder="e.g. temperature" className="font-mono" />
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Trigger Condition</label>
                        <div className="flex gap-4 items-center">
                            <span className="text-sm font-bold text-slate-600">If Value</span>
                            <Select 
                                value={formData.operator}
                                onChange={e => setFormData({...formData, operator: e.target.value as any})}
                                className="w-24"
                                options={['>', '>=', '<', '<=', '==', '!='].map(o => ({ label: o, value: o }))}
                            />
                            <Input 
                                type="number" 
                                value={formData.threshold} 
                                onChange={e => setFormData({...formData, threshold: parseFloat(e.target.value)})} 
                                className="flex-1 font-mono text-center text-lg font-bold"
                            />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button size="sm" variant="ghost" className="text-indigo-600 bg-white" onClick={handleSuggest} disabled={isSuggesting}>
                                {isSuggesting ? 'Thinking...' : '✨ AI Suggest Threshold'}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select 
                            label="Severity"
                            value={formData.severity}
                            onChange={e => setFormData({...formData, severity: e.target.value as AlarmSeverity})}
                            options={['info', 'warning', 'critical'].map(s => ({ label: s.toUpperCase(), value: s }))}
                        />
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.enabled ?? true} onChange={e => setFormData({...formData, enabled: e.target.checked})} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm font-bold text-slate-700">Rule Enabled</span>
                            </label>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
