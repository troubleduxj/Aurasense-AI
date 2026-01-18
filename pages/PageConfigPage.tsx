
import React, { useState } from 'react';
import { CustomPage, CustomPageType, Dashboard } from '../types';

interface PageConfigPageProps {
    customPages: CustomPage[];
    dashboards: Dashboard[]; // Pass dashboards to allow selection
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
            <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">自定义页面配置</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Custom Content Management</p>
                </div>
                <button onClick={handleStartAdd} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    <span>新建页面</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customPages.map(page => (
                    <div key={page.id} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg mb-1">{page.name}</h4>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                    page.type === 'MARKDOWN' ? 'bg-indigo-50 text-indigo-600' : 
                                    page.type === 'IFRAME' ? 'bg-emerald-50 text-emerald-600' : 
                                    'bg-purple-50 text-purple-600'
                                }`}>
                                    {page.type}
                                </span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(page)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => onDeletePage(page.id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 h-8">{page.description || 'No description provided.'}</p>
                        <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-mono truncate">
                            ID: {page.id}
                        </div>
                    </div>
                ))}
                {customPages.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-[28px]">
                        No custom pages defined.
                    </div>
                )}
            </div>

            {(isAdding || editingPage) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white rounded-[40px] shadow-2xl border border-white/40 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/30 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800">{isAdding ? '新建页面' : '编辑页面'}</h3>
                            <button onClick={() => { setIsAdding(false); setEditingPage(null); }} className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">页面名称</label>
                                <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">页面类型</label>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as CustomPageType, content: ''})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none appearance-none">
                                        <option value="MARKDOWN">Markdown Document</option>
                                        <option value="IFRAME">Embedded Website (IFrame)</option>
                                        <option value="DASHBOARD">Dashboard Wrapper (DIY)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">简要描述</label>
                                    <input type="text" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-600 outline-none" />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-[300px]">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {formData.type === 'IFRAME' ? '目标 URL (Target URL)' : formData.type === 'DASHBOARD' ? '关联看板 (Linked Dashboard)' : 'Markdown 内容'}
                                </label>
                                
                                {formData.type === 'IFRAME' && (
                                    <input 
                                        type="text" 
                                        value={formData.content || ''} 
                                        onChange={e => setFormData({...formData, content: e.target.value})} 
                                        placeholder="https://example.com"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-sm text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100"
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
                                    <div className="relative">
                                        <select
                                            value={formData.content || ''}
                                            onChange={e => setFormData({...formData, content: e.target.value})}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none appearance-none focus:ring-4 focus:ring-indigo-100 cursor-pointer"
                                        >
                                            <option value="">-- Select Dashboard --</option>
                                            {dashboards.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                        <svg className="w-4 h-4 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button onClick={handleSave} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-all">保存配置</button>
                            <button onClick={() => { setIsAdding(false); setEditingPage(null); }} className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-100 transition-all">取消</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
