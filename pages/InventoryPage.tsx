
import React, { useState, useMemo, useEffect } from 'react';
import { Device, DeviceStatus, DeviceType, DeviceCategory } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

interface InventoryPageProps {
  devices: Device[];
  categories: DeviceCategory[];
  onSaveDevice: (device: Partial<Device>) => void;
  onDeleteDevice: (id: string) => void;
  filters: {
      search: string;
      type: string;
      status: string;
  };
  onFilterChange: (filters: { search: string; type: string; status: string }) => void;
}

const getStatusVariant = (status: DeviceStatus) => {
    switch (status) {
      case DeviceStatus.ONLINE: return 'success';
      case DeviceStatus.WARNING: return 'warning';
      case DeviceStatus.CRITICAL: return 'danger';
      default: return 'neutral';
    }
};

export const InventoryPage: React.FC<InventoryPageProps> = ({ devices, categories, onSaveDevice, onDeleteDevice, filters, onFilterChange }) => {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
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
        metrics: {}
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
         {/* Top Filter Bar */}
         <Card className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 p-4">
             <div className="flex flex-wrap items-center gap-4 flex-1">
                 {/* Active Filter Indicator */}
                 {(filters.search || filters.type !== 'ALL' || filters.status !== 'ALL') && (
                     <div className="flex items-center gap-2 mr-2">
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Active Filters:</span>
                         <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onFilterChange({ search: '', type: 'ALL', status: 'ALL' })}
                            icon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>}
                         >
                             Clear
                         </Button>
                     </div>
                 )}

                 <div className="w-64">
                    <Input 
                        placeholder="搜索名称 / IP / ID..." 
                        value={filters.search}
                        onChange={e => onFilterChange({ ...filters, search: e.target.value })}
                        className="py-2.5 text-xs"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                    />
                 </div>
                 <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
                 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                     {['ALL', DeviceType.GATEWAY, DeviceType.SENSOR, DeviceType.SERVER].map(t => (
                         <Button 
                            key={t} 
                            variant={filters.type === t ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => onFilterChange({ ...filters, type: t })}
                            className={filters.type === t ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-none' : ''}
                         >
                             {t === 'ALL' ? '所有类型' : t}
                         </Button>
                     ))}
                 </div>
                 <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
                 <div className="flex items-center gap-2">
                     {['ALL', DeviceStatus.ONLINE, DeviceStatus.WARNING, DeviceStatus.OFFLINE].map(s => (
                         <Button 
                            key={s} 
                            variant={filters.status === s ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => onFilterChange({ ...filters, status: s })}
                            className={filters.status === s ? 'bg-slate-800 text-white border-slate-800' : ''}
                         >
                             {s === 'ALL' ? '全部状态' : s}
                         </Button>
                     ))}
                 </div>
             </div>

             <div className="flex items-center gap-3">
                 <div className="bg-slate-50 p-1 rounded-xl border border-slate-100 flex items-center">
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <button 
                        onClick={() => setViewMode('card')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </button>
                 </div>

                 <Button 
                    variant="primary"
                    size="md"
                    onClick={() => { setIsAddingDevice(true); setEditingDevice(null); }}
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>}
                 >
                    新增设备
                 </Button>
             </div>
         </Card>

         {/* Content Area */}
         {viewMode === 'table' ? (
             /* --- Table View --- */
             <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
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
                                          <Badge variant="neutral" className="text-[9px] px-1.5 py-0.5">{getCategoryName(d.categoryId)}</Badge>
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
                           <Badge variant={getStatusVariant(d.status)} dot>{d.status}</Badge>
                       </td>
                       <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button 
                                  variant="secondary"
                                  size="sm"
                                  className="p-2"
                                  onClick={() => { setEditingDevice(d); setIsAddingDevice(false); }}
                                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                               />
                               <Button 
                                  variant="danger"
                                  size="sm"
                                  className="p-2 bg-white"
                                  onClick={() => onDeleteDevice(d.id)}
                                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                               />
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
            /* --- Card View --- */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDevices.map(d => (
                    <Card key={d.id} hoverEffect className="relative overflow-hidden group">
                        {/* Status Stripe */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 opacity-80 ${d.status === DeviceStatus.ONLINE ? 'bg-emerald-500' : d.status === DeviceStatus.WARNING ? 'bg-amber-500' : d.status === DeviceStatus.CRITICAL ? 'bg-rose-500' : 'bg-slate-400'}`}></div>
                        
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                             <Button 
                                variant="secondary" 
                                size="sm" 
                                className="p-2 h-8 w-8"
                                onClick={() => { setEditingDevice(d); setIsAddingDevice(false); }}
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                             />
                             <Button 
                                variant="danger" 
                                size="sm" 
                                className="p-2 h-8 w-8 bg-white"
                                onClick={() => onDeleteDevice(d.id)}
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                             />
                        </div>

                        {/* Header Info */}
                        <div className="flex items-start gap-4 mb-5 mt-2">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${d.type === DeviceType.GATEWAY ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                                {d.type === DeviceType.GATEWAY ? <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> : <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>}
                            </div>
                            <div className="pr-12">
                                <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-1" title={d.name}>{d.name}</h4>
                                <div className="flex flex-wrap gap-1">
                                    <Badge className="bg-slate-100 text-slate-500">{d.type}</Badge>
                                    {d.categoryId && <Badge variant="primary" className="bg-indigo-50 text-indigo-500">{getCategoryName(d.categoryId)}</Badge>}
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
                                <Badge variant={getStatusVariant(d.status)} dot>{d.status}</Badge>
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
                    </Card>
                ))}
            </div>
         )}

         {/* --- Edit Modal --- */}
         <Modal 
            isOpen={isAddingDevice || !!editingDevice} 
            onClose={() => { setIsAddingDevice(false); setEditingDevice(null); }}
            title={editingDevice ? '维护设备资产' : '登记新设备'}
            subtitle="Device Metadata Management"
            footer={
                <>
                    <Button variant="primary" onClick={handleSave} className="flex-1">保存设备信息</Button>
                    <Button variant="secondary" onClick={() => { setIsAddingDevice(false); setEditingDevice(null); }}>取消</Button>
                </>
            }
         >
             <div className="space-y-6">
                <Input 
                    label="设备名称" 
                    placeholder="输入设备名称..." 
                    value={deviceForm.name || ''} 
                    onChange={e => setDeviceForm(prev => ({ ...prev, name: e.target.value }))}
                />

                <Select 
                    label="所属设备分类 (Device Category)"
                    value={deviceForm.categoryId || ''}
                    onChange={e => setDeviceForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    options={[
                        { label: '-- 请选择分类 --', value: '' },
                        ...categories.map(cat => ({ label: `${cat.name} (${cat.code})`, value: cat.id }))
                    ]}
                />
                
                <div className="grid grid-cols-2 gap-6">
                   <Select 
                        label="设备类型"
                        value={deviceForm.type}
                        onChange={e => setDeviceForm(prev => ({ ...prev, type: e.target.value as DeviceType }))}
                        options={Object.values(DeviceType).map(t => ({ label: t, value: t }))}
                   />
                   <Select 
                        label="初始状态"
                        value={deviceForm.status}
                        onChange={e => setDeviceForm(prev => ({ ...prev, status: e.target.value as DeviceStatus }))}
                        options={Object.values(DeviceStatus).map(s => ({ label: s, value: s }))}
                   />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <Input 
                        label="网络地址 (IP)" 
                        placeholder="0.0.0.0" 
                        value={deviceForm.ip || ''} 
                        onChange={e => setDeviceForm(prev => ({ ...prev, ip: e.target.value }))}
                        className="font-mono"
                   />
                   <Input 
                        label="物理位置" 
                        placeholder="e.g. 机房 A-01" 
                        value={deviceForm.location || ''} 
                        onChange={e => setDeviceForm(prev => ({ ...prev, location: e.target.value }))}
                   />
                </div>
             </div>
         </Modal>
    </div>
  );
};
