
import React, { useState } from 'react';
import { User, Role, LLMConfig, AuthConfig } from '../types';

// --- Users Page ---
interface UsersPageProps {
  users: User[];
  roles: Role[];
  onSaveUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ users, roles, onSaveUser, onDeleteUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});

  const handleEdit = (user?: User) => {
    if (user) {
        setFormData(user);
    } else {
        setFormData({ name: '', email: '', roleId: roles[0]?.id || '', status: 'Active' });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    if(!formData.name || !formData.email) return;
    const userToSave: User = {
        id: formData.id || `user-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId || roles[0]?.id || '',
        status: formData.status || 'Active',
        lastLogin: formData.lastLogin || new Date().toISOString()
    };
    onSaveUser(userToSave);
    setIsEditing(false);
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">用户账户管理</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Access Control List</p>
            </div>
            <button onClick={() => handleEdit()} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase hover:bg-indigo-700 transition-all">新增用户</button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50"><tr className="border-b border-slate-100"><th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase">用户名</th><th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase">邮箱</th><th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase">系统角色</th><th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase">状态</th><th className="px-6 py-4 text-right"></th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                {users.map(u => {
                    const roleName = roles.find(r => r.id === u.roleId)?.name || 'Unknown';
                    return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-bold text-slate-700">{u.name}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{u.email}</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase">{roleName}</span></td>
                            <td className="px-6 py-4"><span className={`w-2 h-2 rounded-full inline-block mr-2 ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>{u.status}</td>
                            <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(u)} className="text-indigo-600 font-bold text-xs mr-3 hover:underline">编辑</button>
                                <button onClick={() => onDeleteUser(u.id)} className="text-rose-500 font-bold text-xs hover:underline">删除</button>
                            </td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>

        {isEditing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
                    <h3 className="text-lg font-black text-slate-800 mb-6">{formData.id ? '编辑用户' : '新增用户'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Full Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Email Address</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-sm text-slate-600" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Role</label>
                            <select value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700">
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Status</label>
                             <div className="flex gap-4">
                                 <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={formData.status === 'Active'} onChange={() => setFormData({...formData, status: 'Active'})} /> Active</label>
                                 <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={formData.status === 'Inactive'} onChange={() => setFormData({...formData, status: 'Inactive'})} /> Inactive</label>
                             </div>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-8">
                        <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-indigo-700">Save User</button>
                        <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-200">Cancel</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

// --- Roles Page ---
interface RolesPageProps {
    roles: Role[];
    onSaveRole: (role: Role) => void;
    onDeleteRole: (id: string) => void;
}

export const RolesPage: React.FC<RolesPageProps> = ({ roles, onSaveRole, onDeleteRole }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Role>>({});

    const availablePermissions = ['view_dashboard', 'manage_devices', 'manage_users', 'view_reports', 'manage_system'];

    const handleEdit = (role?: Role) => {
        if (role) {
            setFormData(role);
        } else {
            setFormData({ name: '', description: '', permissions: [] });
        }
        setIsEditing(true);
    };

    const togglePermission = (perm: string) => {
        const current = formData.permissions || [];
        if (current.includes(perm)) {
            setFormData({ ...formData, permissions: current.filter(p => p !== perm) });
        } else {
            setFormData({ ...formData, permissions: [...current, perm] });
        }
    };

    const handleSave = () => {
        if (!formData.name) return;
        const roleToSave: Role = {
            id: formData.id || `role-${Date.now()}`,
            name: formData.name,
            description: formData.description || '',
            permissions: formData.permissions || []
        };
        onSaveRole(roleToSave);
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">角色权限管理</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Role Based Access Control</p>
                </div>
                <button onClick={() => handleEdit()} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase hover:bg-indigo-700 transition-all">新增角色</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(r => (
                    <div key={r.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                             <button onClick={() => handleEdit(r)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                             <button onClick={() => onDeleteRole(r.id)} className="p-1.5 bg-rose-50 text-rose-500 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                        <h4 className="font-bold text-lg text-slate-800 mb-1">{r.name}</h4>
                        <p className="text-xs text-slate-500 mb-4 h-8 line-clamp-2">{r.description}</p>
                        <div className="flex flex-wrap gap-1">
                            {r.permissions.map(p => (
                                <span key={p} className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[9px] font-mono text-slate-500">{p}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

             {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-black text-slate-800 mb-6">{formData.id ? '编辑角色' : '新增角色'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Role Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm text-slate-600 h-20 resize-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Permissions</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    {availablePermissions.map(perm => (
                                        <label key={perm} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-white rounded-lg transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.permissions?.includes(perm) || false}
                                                onChange={() => togglePermission(perm)}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-xs font-mono text-slate-600">{perm}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-indigo-700">Save Role</button>
                            <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-200">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Security / SSO Page ---
interface SecurityPageProps {
    authConfig: AuthConfig;
    onSaveConfig: (config: AuthConfig) => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ authConfig, onSaveConfig }) => {
    const [config, setConfig] = useState(authConfig);
    const [isDirty, setIsDirty] = useState(false);

    const handleChange = (key: keyof AuthConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        onSaveConfig(config);
        setIsDirty(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-8">
                     <div>
                        <h3 className="text-xl font-black text-slate-800">安全权限与统一认证</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Single Sign-On (SSO) Integration</p>
                     </div>
                     <div className="flex items-center gap-3">
                         <span className={`text-xs font-bold uppercase ${config.enabled ? 'text-emerald-500' : 'text-slate-400'}`}>{config.enabled ? 'Enabled' : 'Disabled'}</span>
                         <button 
                            onClick={() => handleChange('enabled', !config.enabled)} 
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${config.enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                         >
                             <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                         </button>
                     </div>
                </div>

                <div className={`space-y-6 transition-opacity duration-300 ${config.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                     <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Identity Provider Protocol</label>
                         <div className="flex gap-4">
                             {['OIDC', 'SAML', 'LDAP'].map(p => (
                                 <button 
                                    key={p} 
                                    onClick={() => handleChange('provider', p)}
                                    className={`flex-1 py-3 rounded-xl border font-bold text-xs transition-all ${config.provider === p ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                                 >
                                     {p}
                                 </button>
                             ))}
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                         <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client ID / App ID</label>
                             <input type="text" value={config.clientId} onChange={e => handleChange('clientId', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-mono text-sm text-slate-700" />
                         </div>
                         <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client Secret</label>
                             <input type="password" value={config.clientSecret} onChange={e => handleChange('clientSecret', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-mono text-sm text-slate-700" />
                         </div>
                     </div>

                     <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Issuer URL / Metadata URL</label>
                         <input type="text" value={config.issuerUrl} onChange={e => handleChange('issuerUrl', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-mono text-sm text-slate-700" placeholder="https://auth.example.com/.well-known/openid-configuration" />
                     </div>

                     <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Redirect URI (Callback)</label>
                         <input type="text" value={config.redirectUri} readOnly className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-mono text-sm text-slate-500 cursor-not-allowed" />
                     </div>
                </div>

                {isDirty && (
                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                        <button onClick={handleSave} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-all shadow-lg">保存配置</button>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- LLM Config Page ---
interface LLMConfigPageProps {
    llmConfig: LLMConfig;
    onSaveConfig: (config: LLMConfig) => void;
}

export const LLMConfigPage: React.FC<LLMConfigPageProps> = ({ llmConfig, onSaveConfig }) => {
    const [config, setConfig] = useState(llmConfig);
    const [isDirty, setIsDirty] = useState(false);

    const handleChange = (key: keyof LLMConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="mb-8">
                     <h3 className="text-xl font-black text-slate-800">LLM 模型服务配置</h3>
                     <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Large Language Model Provider Settings</p>
                </div>

                <div className="space-y-6 relative z-10">
                     <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">AI Service Provider</label>
                         <div className="grid grid-cols-4 gap-4">
                             {['Gemini', 'OpenAI', 'Claude', 'LocalLLM'].map(p => (
                                 <button 
                                    key={p} 
                                    onClick={() => handleChange('provider', p)}
                                    className={`py-4 rounded-2xl border font-bold text-sm transition-all flex flex-col items-center gap-2 ${config.provider === p ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-4 ring-indigo-50' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                                 >
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.provider === p ? 'bg-indigo-200' : 'bg-slate-100'}`}>
                                         {/* Simple Icon Placeholders */}
                                         {p === 'Gemini' && 'G'}
                                         {p === 'OpenAI' && 'O'}
                                         {p === 'Claude' && 'C'}
                                         {p === 'LocalLLM' && 'L'}
                                     </div>
                                     {p}
                                 </button>
                             ))}
                         </div>
                     </div>

                     <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">API Key</label>
                         <div className="relative">
                            <input 
                                type="password" 
                                value={config.apiKey} 
                                onChange={e => handleChange('apiKey', e.target.value)} 
                                className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-mono text-sm text-slate-700" 
                                placeholder="sk-..."
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Model Name</label>
                             <input type="text" value={config.modelName} onChange={e => handleChange('modelName', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-mono text-sm text-slate-700" />
                        </div>
                        <div>
                             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Endpoint URL (Optional)</label>
                             <input type="text" value={config.endpoint || ''} onChange={e => handleChange('endpoint', e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-mono text-sm text-slate-700" placeholder="https://api.openai.com/v1" />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-8 pt-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temperature</label>
                                <span className="text-xs font-bold text-indigo-600">{config.temperature}</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="2" 
                                step="0.1" 
                                value={config.temperature} 
                                onChange={e => handleChange('temperature', parseFloat(e.target.value))} 
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Tokens</label>
                                <span className="text-xs font-bold text-indigo-600">{config.maxTokens}</span>
                            </div>
                            <input 
                                type="range" 
                                min="256" 
                                max="8192" 
                                step="256" 
                                value={config.maxTokens} 
                                onChange={e => handleChange('maxTokens', parseInt(e.target.value))} 
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                     </div>
                </div>

                {isDirty && (
                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                        <button onClick={() => { onSaveConfig(config); setIsDirty(false); }} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-all shadow-lg">更新模型配置</button>
                    </div>
                )}
            </div>
        </div>
    );
}
