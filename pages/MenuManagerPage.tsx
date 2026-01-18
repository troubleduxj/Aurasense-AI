
import React, { useState } from 'react';
import { MenuItem, MenuTargetType, SystemPageKey, Dashboard, Role, CustomPage } from '../types';

interface MenuManagerPageProps {
  menuConfig: MenuItem[];
  dashboards: Dashboard[];
  customPages: CustomPage[]; // Added custom pages prop
  roles: Role[]; 
  onUpdateMenu: (newConfig: MenuItem[]) => void;
}

const ICON_PRESETS = [
    'M4 6h16M4 12h16M4 18h16', // Hamburger
    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', // Home
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', // Chart
    'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', // User
    'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', // Device
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', // Settings
    'M13 10V3L4 14h7v7l9-11h-7z', // Lightning
];

export const MenuManagerPage: React.FC<MenuManagerPageProps> = ({ menuConfig, dashboards, customPages, roles, onUpdateMenu }) => {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [parentIdForAdd, setParentIdForAdd] = useState<string | null>(null); 
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<MenuItem>>({});

  // --- Drag and Drop State ---
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'top' | 'bottom' | 'inside' } | null>(null);

  // --- Recursive Render Helper ---
  const renderTree = (items: MenuItem[], parentId: string | null = null, level = 0) => {
      return items.map((item, index) => {
          const isDragging = draggedId === item.id;
          const isDropTarget = dropTarget?.id === item.id;
          const dropPos = isDropTarget ? dropTarget?.position : null;

          return (
              <div 
                  key={item.id} 
                  className={`
                      relative transition-all
                      ${isDragging ? 'opacity-50' : 'opacity-100'}
                      ${level === 0 ? 'mb-4' : 'mb-1'}
                  `}
                  draggable
                  onDragStart={(e) => {
                      e.stopPropagation();
                      setDraggedId(item.id);
                      e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                      e.preventDefault(); // Allow drop
                      e.stopPropagation();
                      if (draggedId === item.id) return;

                      const rect = e.currentTarget.getBoundingClientRect();
                      const relY = e.clientY - rect.top;
                      const height = rect.height;
                      
                      let pos: 'top' | 'bottom' | 'inside' = 'bottom';
                      
                      if (item.type === 'FOLDER') {
                          if (relY < height * 0.25) pos = 'top';
                          else if (relY > height * 0.75) pos = 'bottom';
                          else pos = 'inside';
                      } else {
                          if (relY < height * 0.5) pos = 'top';
                          else pos = 'bottom';
                      }
                      setDropTarget({ id: item.id, position: pos });
                  }}
                  onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                  }}
                  onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDrop();
                  }}
              >
                  {/* Drop Indicators */}
                  {isDropTarget && dropPos === 'top' && (
                      <div className="absolute -top-1 left-0 right-0 h-1 bg-indigo-500 rounded-full z-20 pointer-events-none"></div>
                  )}
                  {isDropTarget && dropPos === 'bottom' && (
                      <div className="absolute -bottom-1 left-0 right-0 h-1 bg-indigo-500 rounded-full z-20 pointer-events-none"></div>
                  )}
                  
                  {/* Item Content - Added 'group' class here for hover effect */}
                  <div 
                      className={`
                          border rounded-xl overflow-hidden cursor-move select-none group
                          ${isDropTarget && dropPos === 'inside' ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}
                          ${level === 0 ? 'bg-slate-50/50' : 'bg-white ml-6'}
                      `}
                  >
                      <div className="flex justify-between items-center p-3">
                          <div className="flex items-center gap-3">
                              {/* Drag Handle Icon */}
                              <div className="text-slate-300 cursor-grab active:cursor-grabbing">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" /></svg>
                              </div>
                              <div className={`p-1.5 rounded-lg ${level === 0 ? 'bg-indigo-50 text-indigo-500' : 'text-slate-400'}`}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon || 'M4 6h16M4 12h16M4 18h16'} /></svg>
                              </div>
                              <span className={`text-xs font-bold ${level === 0 ? 'text-slate-800' : 'text-slate-600'}`}>{item.label}</span>
                              {item.type === 'FOLDER' && <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">Folder</span>}
                              {item.roles && item.roles.length > 0 && (
                                  <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                      {item.roles.length} Roles
                                  </span>
                              )}
                          </div>
                          
                          {/* Action Buttons - Now visible on parent group hover */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.type === 'FOLDER' && (
                                  <button onClick={() => handleStartAdd(item.id)} className="p-1.5 hover:bg-indigo-50 text-indigo-500 rounded" title="Add Child"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg></button>
                              )}
                              <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-slate-100 text-slate-400 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                              <button onClick={() => handleDelete(item.id, parentId || undefined)} className="p-1.5 hover:bg-rose-50 text-rose-400 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                          </div>
                      </div>
                  </div>

                  {/* Children Recursion */}
                  {item.children && item.children.length > 0 && (
                      <div className="pt-1">
                          {renderTree(item.children, item.id, level + 1)}
                      </div>
                  )}
              </div>
          );
      });
  };

  // --- Logic Handlers ---

  const findPath = (items: MenuItem[], id: string, path: number[] = []): number[] | null => {
      for (let i = 0; i < items.length; i++) {
          if (items[i].id === id) return [...path, i];
          if (items[i].children) {
              const childPath = findPath(items[i].children!, id, [...path, i]);
              if (childPath) return childPath;
          }
      }
      return null;
  };

  const handleDrop = () => {
      if (!draggedId || !dropTarget) return;
      if (draggedId === dropTarget.id) {
          setDraggedId(null);
          setDropTarget(null);
          return;
      }

      const newConfig = JSON.parse(JSON.stringify(menuConfig)) as MenuItem[];

      const sourcePath = findPath(newConfig, draggedId);
      if (!sourcePath) return;

      const removeAt = (items: MenuItem[], path: number[]): MenuItem => {
          if (path.length === 1) {
              const [removed] = items.splice(path[0], 1);
              return removed;
          }
          return removeAt(items[path[0]].children!, path.slice(1));
      };
      
      const sourceItem = removeAt(newConfig, sourcePath);
      const targetPath = findPath(newConfig, dropTarget.id);
      
      if (!targetPath) {
          setDraggedId(null);
          setDropTarget(null);
          return;
      }

      const insertAt = (items: MenuItem[], path: number[], item: MenuItem, pos: 'top' | 'bottom' | 'inside') => {
          if (path.length === 1) {
              const idx = path[0];
              if (pos === 'inside') {
                  if (!items[idx].children) items[idx].children = [];
                  items[idx].children!.push(item);
              } else if (pos === 'top') {
                  items.splice(idx, 0, item);
              } else { // bottom
                  items.splice(idx + 1, 0, item);
              }
              return;
          }
          insertAt(items[path[0]].children!, path.slice(1), item, pos);
      };

      insertAt(newConfig, targetPath, sourceItem, dropTarget.position);

      onUpdateMenu(newConfig);
      setDraggedId(null);
      setDropTarget(null);
  };

  const handleEdit = (item: MenuItem) => {
      setEditingItem(item);
      setFormData({ ...item });
      setIsAdding(false);
  };

  const handleStartAdd = (parentId: string | null) => {
      setParentIdForAdd(parentId);
      setEditingItem(null);
      setFormData({ 
          label: '新菜单', 
          type: parentId ? 'PAGE' : 'FOLDER', 
          icon: ICON_PRESETS[0], 
          targetType: 'system_page',
          targetId: 'monitor',
          roles: []
      });
      setIsAdding(true);
  };

  const handleDelete = (itemId: string, parentId?: string) => {
      if (!window.confirm('Are you sure you want to delete this menu item?')) return;
      
      let newConfig = JSON.parse(JSON.stringify(menuConfig)); 
      const path = findPath(newConfig, itemId);
      
      if (path) {
          const removeRecursively = (items: MenuItem[], p: number[]) => {
              if (p.length === 1) {
                  items.splice(p[0], 1);
              } else {
                  removeRecursively(items[p[0]].children!, p.slice(1));
              }
          };
          removeRecursively(newConfig, path);
          onUpdateMenu(newConfig);
      }
  };

  const handleSave = () => {
      if (!formData.label) return;

      const newItem: MenuItem = {
          id: editingItem?.id || `menu-${Date.now()}`,
          label: formData.label,
          type: formData.type || 'PAGE',
          icon: formData.icon || '',
          targetType: formData.targetType,
          targetId: formData.targetId,
          children: editingItem?.children || [],
          roles: formData.roles || [] 
      };

      let newConfig = JSON.parse(JSON.stringify(menuConfig)) as MenuItem[];

      if (isAdding) {
          if (parentIdForAdd) {
              const parentPath = findPath(newConfig, parentIdForAdd);
              if (parentPath) {
                  const addToParent = (items: MenuItem[], p: number[]) => {
                      if (p.length === 1) { 
                          if(!items[p[0]].children) items[p[0]].children = [];
                          items[p[0]].children!.push(newItem);
                      } else {
                          addToParent(items[p[0]].children!, p.slice(1));
                      }
                  };
                  addToParent(newConfig, parentPath);
              }
          } else {
              newConfig.push(newItem);
          }
      } else {
          // Editing
          const itemPath = findPath(newConfig, newItem.id);
          if (itemPath) {
              const editAt = (items: MenuItem[], p: number[]) => {
                  if (p.length === 1) {
                      items[p[0]] = { ...items[p[0]], ...newItem };
                  } else {
                      editAt(items[p[0]].children!, p.slice(1));
                  }
              };
              editAt(newConfig, itemPath);
          }
      }

      onUpdateMenu(newConfig);
      setEditingItem(null);
      setIsAdding(false);
  };

  const toggleRole = (roleId: string) => {
      setFormData(prev => {
          const currentRoles = prev.roles || [];
          if (currentRoles.includes(roleId)) {
              return { ...prev, roles: currentRoles.filter(r => r !== roleId) };
          } else {
              return { ...prev, roles: [...currentRoles, roleId] };
          }
      });
  };

  return (
    <div className="flex h-full gap-6">
        {/* Left: Tree Preview */}
        <div className="w-1/3 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">菜单结构</h3>
                <button onClick={() => handleStartAdd(null)} className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold uppercase hover:bg-indigo-700">Add Folder</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" onDragOver={e => e.preventDefault()}>
                {draggedId && (
                    <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg z-50 pointer-events-none animate-in fade-in">
                        Dragging Menu Item...
                    </div>
                )}
                {renderTree(menuConfig)}
            </div>
        </div>

        {/* Right: Edit Form */}
        <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
            {(isAdding || editingItem) ? (
                <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-xl font-black text-slate-800 mb-6">{isAdding ? '新增菜单项' : '编辑菜单项'}</h3>
                    <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">显示名称</label>
                            <input type="text" value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">类型</label>
                            <div className="flex gap-4">
                                {['FOLDER', 'PAGE'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setFormData({...formData, type: t as any})}
                                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase border transition-all ${formData.type === t ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200'}`}
                                    >
                                        {t === 'FOLDER' ? '分组目录 (Folder)' : '功能页面 (Page)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {formData.type === 'PAGE' && (
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">页面类型</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setFormData({...formData, targetType: 'system_page', targetId: 'monitor'})} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${formData.targetType === 'system_page' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>System Native</button>
                                        <button onClick={() => setFormData({...formData, targetType: 'dashboard', targetId: dashboards[0]?.id})} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${formData.targetType === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>Custom Dashboard</button>
                                        <button onClick={() => setFormData({...formData, targetType: 'custom_content', targetId: customPages[0]?.id})} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${formData.targetType === 'custom_content' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>Custom Page</button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">目标页面</label>
                                    {formData.targetType === 'dashboard' ? (
                                        <select 
                                            value={formData.targetId || ''} 
                                            onChange={e => setFormData({...formData, targetId: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                        >
                                            {dashboards.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    ) : formData.targetType === 'custom_content' ? (
                                        <select 
                                            value={formData.targetId || ''} 
                                            onChange={e => setFormData({...formData, targetId: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                        >
                                            {customPages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    ) : (
                                        <select 
                                            value={formData.targetId || ''} 
                                            onChange={e => setFormData({...formData, targetId: e.target.value})}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                                        >
                                            <option value="dashboard_monitor">Monitoring Overview</option>
                                            <option value="monitor">Realtime Monitor</option>
                                            <option value="inventory">Asset Inventory</option>
                                            <option value="history_analysis">History Analysis</option>
                                            <option value="device_class">Device Categories</option>
                                            <option value="source">Data Sources</option>
                                            <option value="view">Data Views</option>
                                            <option value="chart">Chart Lab</option>
                                            <option value="dashboard_manage">Dashboard Config</option>
                                            <option value="users">User Management</option>
                                            <option value="roles">Role Management</option>
                                            <option value="security">Security & SSO</option>
                                            <option value="llm">LLM Config</option>
                                            <option value="menu_manage">Menu Manager</option>
                                            <option value="page_config">Page Configuration</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Roles Configuration */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">可见角色权限 (Role Access)</label>
                            <p className="text-[10px] text-slate-400 mb-3">Select roles that can view this menu item. Leave empty for public access.</p>
                            <div className="flex flex-wrap gap-2">
                                {roles.map(role => {
                                    const isSelected = formData.roles?.includes(role.id);
                                    return (
                                        <button 
                                            key={role.id}
                                            onClick={() => toggleRole(role.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isSelected ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            {role.name}
                                            {isSelected && <span className="ml-1 text-amber-500">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">图标</label>
                            <div className="grid grid-cols-8 gap-2">
                                {ICON_PRESETS.map((icon, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setFormData({...formData, icon})}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${formData.icon === icon ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} /></svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                        <button onClick={handleSave} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 shadow-lg">Save Configuration</button>
                        <button onClick={() => { setIsAdding(false); setEditingItem(null); }} className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-50">Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-200">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </div>
                    <p className="text-sm font-bold">Select a menu item to edit</p>
                    <p className="text-xs opacity-60">or drag items to reorder</p>
                </div>
            )}
        </div>
    </div>
  );
};
