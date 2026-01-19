
import React, { useState } from 'react';
import { CustomPage, CustomPageType, Dashboard } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

interface PageConfigPageProps {
    customPages: CustomPage[];
    dashboards: Dashboard[]; 
    onSavePage: (page: CustomPage) => void;
    onDeletePage: (id: string) => void;
}

export const PageConfigPage: React.FC<PageConfigPageProps> = ({ customPages, dashboards, onSavePage, onDeletePage }) => {
    const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<Partial<CustomPage>>({});

    const handleEdit = (page: CustomPage) => {
        setEditingPage(page);
        setFormData(page);
        setIsAdding(false);
    };

    const handleStartAdd = () => {
        setEditingPage(null);
        setFormData({ name: '', type: 'MARKDOWN', content: '', description: '' });
        setIsAdding(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.content) return;
        const newPage: CustomPage = {
            id: editingPage?.id || `page-${Date.now()}`,
            name: formData.name,
            type: formData.type || 'MARKDOWN',
            content: formData.content,
            description: formData.description || ''
        };
        onSavePage(newPage);
        setEditingPage(null);
        setIsAdding(false);
    };

    return (
        <div className="space-y-6">
            <Card className="flex justify-between items-center p-6">
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">自定义页面配置</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Custom Content Management</p>
                </div>
                <Button onClick={handleStartAdd} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>}>
                    新建页面
                </Button>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customPages.map(page => (
                    <Card key={page.id} hoverEffect className="group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg mb-1">{page.name}</h4>
                                <Badge variant={page.type === 'MARKDOWN' ? 'primary' : page.type === 'IFRAME' ? 'success' : 'warning'}>
                                    {page.type}
                                </Badge>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="secondary" onClick={() => handleEdit(page)} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>} />
                                <Button size="sm" variant="danger" onClick={() => onDeletePage(page.id)} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>} />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 h-8">{page.description || 'No description provided.'}</p>
                        <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-mono truncate">
                            ID: {page.id}
                        </div>
                    </Card>
                ))}
                {customPages.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-[28px]">
                        No custom pages defined.
                    </div>
                )}
            </div>

            <Modal
                isOpen={isAdding || !!editingPage}
                onClose={() => { setIsAdding(false); setEditingPage(null); }}
                title={isAdding ? '新建页面' : '编辑页面'}
                subtitle={isAdding ? 'New Custom Content' : 'Edit Content'}
                footer={
                    <div className="flex gap-4 w-full">
                        <Button onClick={handleSave} className="flex-1">Save Page</Button>
                        <Button variant="secondary" onClick={() => { setIsAdding(false); setEditingPage(null); }}>Cancel</Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <Input label="页面名称" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    
                    <div className="grid grid-cols-2 gap-6">
                        <Select 
                            label="页面类型" 
                            value={formData.type} 
                            onChange={e => setFormData({...formData, type: e.target.value as CustomPageType, content: ''})}
                            options={[
                                { label: 'Markdown Document', value: 'MARKDOWN' },
                                { label: 'Embedded Website (IFrame)', value: 'IFRAME' },
                                { label: 'Dashboard Wrapper (DIY)', value: 'DASHBOARD' }
                            ]}
                        />
                        <Input label="简要描述" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>

                    <div className="flex-1 flex flex-col min-h-[300px]">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            {formData.type === 'IFRAME' ? '目标 URL (Target URL)' : formData.type === 'DASHBOARD' ? '关联看板 (Linked Dashboard)' : 'Markdown 内容'}
                        </label>
                        
                        {formData.type === 'IFRAME' && (
                            <Input 
                                value={formData.content || ''} 
                                onChange={e => setFormData({...formData, content: e.target.value})} 
                                placeholder="https://example.com"
                                className="font-mono text-indigo-600"
                            />
                        )}

                        {formData.type === 'MARKDOWN' && (
                            <textarea 
                                value={formData.content || ''} 
                                onChange={e => setFormData({...formData, content: e.target.value})} 
                                className="w-full flex-1 p-5 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-sm text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 resize-none"
                                placeholder="# Title..."
                            />
                        )}

                        {formData.type === 'DASHBOARD' && (
                            <Select 
                                value={formData.content || ''}
                                onChange={e => setFormData({...formData, content: e.target.value})}
                                options={[
                                    { label: '-- Select Dashboard --', value: '' },
                                    ...dashboards.map(d => ({ label: d.name, value: d.id }))
                                ]}
                            />
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};
