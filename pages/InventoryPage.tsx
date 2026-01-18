
import React, { useState, useMemo, useEffect } from 'react';
import { Device, DeviceStatus, DeviceType, DeviceCategory } from '../types';

interface InventoryPageProps {
  devices: Device[];
  categories: DeviceCategory[];
  onSaveDevice: (device: Partial<Device>) => void;
  onDeleteDevice: (id: string) => void;
  // Lifted state props
  filters: {
      search: string;
      type: string;
      status: string;
  };
  onFilterChange: (filters: { search: string; type: string; status: string }) => void;
}

const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case DeviceStatus.ONLINE: return 'bg-emerald-500';
      case DeviceStatus.WARNING: return 'bg-amber-500';
      case DeviceStatus.CRITICAL: return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
};

export const InventoryPage: React.FC<InventoryPageProps> = ({ devices, categories, onSaveDevice, onDeleteDevice, filters, onFilterChange }) => {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table'); // State for view switching
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [deviceForm, setDeviceForm] = useState<Partial<Device>>({});

  useEffect(() => {
    if (editingDevice) {
      setDeviceForm({ ...editingDevice });
    } else if (isAddingDevice) {
      setDeviceForm({
        name: '',
        type: DeviceType.SENSOR,
        status: DeviceStatus.ONLINE,
        location: '',
        ip: '',
        categoryId: '',
        metrics: {} // Initialize with empty metrics dictionary
      });
    }
  }, [editingDevice, isAddingDevice]);

  const filteredDevices = useMemo(() => {
      return devices.filter(d => {
          const matchesSearch = d.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                                d.ip.includes(filters.search) || 
                                d.id.toLowerCase().includes(filters.search.toLowerCase());
          const matchesType = filters.type === 'ALL' || d.type === filters.type;
          const matchesStatus = filters.status === 'ALL' || d.status === filters.status;
          return matchesSearch && matchesType && matchesStatus;
      });
  }, [devices, filters]);

  const handleSave = () => {
    onSaveDevice(deviceForm);
    setEditingDevice(null);
    setIsAddingDevice(false);
  };

  const getCategoryName = (catId?: string) => {
      if (!catId) return '';
      const cat = categories.find(c => c.id === catId);
      return cat ? cat.name : '';
  };

  return (
    <div className="space-y-6">
         {/* 顶部筛选栏 */}
         <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm gap-4">
             <div className="flex flex-wrap items-center gap-4 flex-1">
                 {/* Active Filter Indicator */}
                 {(filters.search || filters.type !== 'ALL' || filters.status !== 'ALL') && (
                     <div className="flex items-center gap-2 mr-2">
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Active Filters:</span>
                         <button 
                            onClick={() => onFilterChange({ search: '', type: 'ALL', status: 'ALL' })}
                            className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                         >
                             Clear All <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                     </div>
                 )}

                 <div className="relative">
                     <input 
                        type="text" 
                        placeholder="搜索名称 / IP / ID..." 
                        value={filters.search}
                        onChange={e => onFilterChange({ ...filters, search: e.target.value })}
                        className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 w-64 transition-all"
                     />
                     <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
                 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                     {['ALL', DeviceType.GATEWAY, DeviceType.SENSOR, DeviceType.SERVER].map(t => (
                         <button 
                            key={t} 
                            onClick={() => onFilterChange({ ...filters, type: t })}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border whitespace-nowrap ${filters.type === t ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-transparent text-slate-400 hover:bg-slate-50'}`}
                         >
                             {t === 'ALL' ? '所有类型' : t}
                         </button>
                     ))}
                 </div>
                 <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
                 <div className="flex items-center gap-2">
                     {['ALL', DeviceStatus.ONLINE, DeviceStatus.WARNING, DeviceStatus.OFFLINE].map(s => (
                         <button 
                            key={s} 
                            onClick={() => onFilterChange({ ...filters, status: s })}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border whitespace-nowrap ${filters.status === s ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-transparent text-slate-400 hover:bg-slate-50'}`}
                         >
                             {s === 'ALL' ? '全部状态' : s}
                         </button>
                     ))}
                 </div>
             </div>

             <div className="flex items-center gap-3">
                 {/* 视图切换按钮 */}
                 <div className="bg-slate-50 p-1 rounded-xl border border-slate-100 flex items-center">
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="列表视图"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <button 
                        onClick={() => setViewMode('card')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="卡片视图"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </button>
                 </div>

                 <button 
                    onClick={() => { setIsAddingDevice(true); setEditingDevice(null); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 whitespace-nowrap"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    <span>新增设备</span>
                 </button>
             </div>
         </div>

         {/* 内容展示区域：根据 viewMode 切换 */}
         {viewMode === 'table' ? (
             /* --- 列表模式 (Table View) --- */
             <div className="glass-panel border border-slate-200 rounded-[32px] overflow-hidden bg-white shadow-sm">
               <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">设备信息</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">网络与位置</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">最后活跃</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">状态</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">操作</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {filteredDevices.map(d => (
                     <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.type === DeviceType.GATEWAY ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                                  {d.type === DeviceType.GATEWAY ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>}
                               </div>
                               <div>
                                   <div className="flex items-center gap-2">
                                      <p className="font-bold text-slate-800 text-sm">{d.name}</p>
                                      {d.categoryId && (
                                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{getCategoryName(d.categoryId)}</span>
                                      )}
                                   </div>
                                   <p className="text-[10px] text-slate-400 font-mono mt-0.5">{d.id}</p>
                               </div>
                           </div>
                       </td>
                       <td className="px-8 py-5">
                           <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                   <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                   <span className="font-mono text-xs text-slate-600">{d.ip}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                   <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                   <span className="text-[10px] font-bold text-slate-400">{d.location}</span>
                               </div>
                           </div>
                       </td>
                       <td className="px-8 py-5">
                           <span className="text-xs text-slate-500 font-medium">刚刚</span>
                       </td>
                       <td className="px-8 py-5">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                               d.status === DeviceStatus.ONLINE ? 'bg-emerald-50 text-emerald-600' : 
                               d.status === DeviceStatus.WARNING ? 'bg-amber-50 text-amber-600' : 
                               'bg-slate-100 text-slate-500'
                           }`}>
                               <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(d.status)}`}></span>
                               {d.status}
                           </span>
                       </td>
                       <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                  onClick={() => { setEditingDevice(d); setIsAddingDevice(false); }}
                                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                               >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                               </button>
                               <button 
                                  onClick={() => onDeleteDevice(d.id)}
                                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
                               >
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                           </div>
                       </td>
                     </tr>
                   ))}
                   {filteredDevices.length === 0 && (
                       <tr>
                           <td colSpan={5} className="text-center py-20">
                               <p className="text-sm font-bold text-slate-400">未找到符合条件的设备</p>
                               <p className="text-xs text-slate-300 mt-1">请尝试调整筛选条件或添加新设备</p>
                           </td>
                       </tr>
                   )}
                 </tbody>
               </table>
             </div>
         ) : (
            /* --- 卡片模式 (Card View) --- */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDevices.map(d => (
                    <div key={d.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group relative overflow-hidden">
                        {/* Status Stripe */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${getStatusColor(d.status)} opacity-80`}></div>
                        
                        {/* Action Buttons (Absolute Top Right) */}
                         <div className="absolute top-4 right-4 flex gap-2">
                             <button 
                                onClick={() => { setEditingDevice(d); setIsAddingDevice(false); }}
                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                             >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                             </button>
                             <button 
                                onClick={() => onDeleteDevice(d.id)}
                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                             >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                         </div>

                        {/* Header Info */}
                        <div className="flex items-start gap-4 mb-5 mt-2">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${d.type === DeviceType.GATEWAY ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                                {d.type === DeviceType.GATEWAY ? <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> : <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>}
                            </div>
                            <div className="pr-12">
                                <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-1" title={d.name}>{d.name}</h4>
                                <div className="flex flex-wrap gap-1">
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{d.type}</span>
                                    {d.categoryId && <span className="text-[10px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-bold">{getCategoryName(d.categoryId)}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
                                <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${d.status === DeviceStatus.ONLINE ? 'text-emerald-500' : d.status === DeviceStatus.WARNING ? 'text-amber-500' : 'text-slate-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(d.status)}`}></span>
                                    {d.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase">IP Addr</span>
                                <span className="text-xs font-mono font-bold text-slate-600">{d.ip}</span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Location</span>
                                <span className="text-xs font-bold text-slate-600">{d.location}</span>
                            </div>
                        </div>

                         <div className="text-[10px] text-slate-400 font-mono text-center bg-slate-50 py-1.5 rounded-lg truncate">
                             ID: {d.id}
                         </div>
                    </div>
                ))}
                 {filteredDevices.length === 0 && (
                     <div className="col-span-full text-center py-20">
                         <p className="text-sm font-bold text-slate-400">未找到符合条件的设备</p>
                         <p className="text-xs text-slate-300 mt-1">请尝试调整筛选条件或添加新设备</p>
                     </div>
                 )}
            </div>
         )}

         {/* --- 设备编辑弹窗 --- */}
        {(isAddingDevice || editingDevice) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] shadow-2xl border border-white/40 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
             <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white to-slate-50/30">
               <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingDevice ? '维护设备资产' : '登记新设备'}</h3>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1">Device Metadata Management</p>
               </div>
               <button onClick={() => { setIsAddingDevice(false); setEditingDevice(null); }} className="p-3 text-slate-400 hover:text-rose-500 rounded-2xl transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
             
             <div className="flex-1 p-10 space-y-6 overflow-y-auto custom-scrollbar">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">设备名称</label>
                   <input 
                      type="text" 
                      value={deviceForm.name || ''} 
                      onChange={e => setDeviceForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                      placeholder="输入设备名称..." 
                   />
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">所属设备分类 (Device Category)</label>
                   <div className="relative">
                       <select 
                          value={deviceForm.categoryId || ''} 
                          onChange={e => setDeviceForm(prev => ({ ...prev, categoryId: e.target.value }))}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-slate-700 outline-none appearance-none focus:ring-4 focus:ring-indigo-100"
                       >
                           <option value="">-- 请选择分类 --</option>
                           {categories.map(cat => (
                               <option key={cat.id} value={cat.id}>{cat.name} ({cat.code})</option>
                           ))}
                       </select>
                       <svg className="w-4 h-4 text-slate-400 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">设备类型</label>
                       <div className="relative">
                           <select 
                              value={deviceForm.type} 
                              onChange={e => setDeviceForm(prev => ({ ...prev, type: e.target.value as DeviceType }))}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-slate-700 outline-none appearance-none"
                           >
                               {Object.values(DeviceType).map(t => <option key={t} value={t}>{t}</option>)}
                           </select>
                           <svg className="w-4 h-4 text-slate-400 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                       </div>
                   </div>
                   <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">初始状态</label>
                       <div className="relative">
                           <select 
                              value={deviceForm.status} 
                              onChange={e => setDeviceForm(prev => ({ ...prev, status: e.target.value as DeviceStatus }))}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-slate-700 outline-none appearance-none"
                           >
                               {Object.values(DeviceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                           <svg className="w-4 h-4 text-slate-400 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                       </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">网络地址 (IP)</label>
                       <input 
                          type="text" 
                          value={deviceForm.ip || ''} 
                          onChange={e => setDeviceForm(prev => ({ ...prev, ip: e.target.value }))}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-mono"
                          placeholder="0.0.0.0" 
                       />
                   </div>
                   <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">物理位置</label>
                       <input 
                          type="text" 
                          value={deviceForm.location || ''} 
                          onChange={e => setDeviceForm(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                          placeholder="e.g. 机房 A-01" 
                       />
                   </div>
                </div>
             </div>

             <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={handleSave} className="flex-1 py-4.5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">保存设备信息</button>
                <button onClick={() => { setIsAddingDevice(false); setEditingDevice(null); }} className="px-10 py-4.5 bg-white border border-slate-200 text-slate-500 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">取消</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
