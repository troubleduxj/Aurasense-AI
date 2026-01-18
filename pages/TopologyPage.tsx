
import React, { useState, useEffect, useRef } from 'react';
import { Device, ScadaNode, ScadaNodeType, ScadaBinding } from '../types';

interface TopologyPageProps {
    nodes: ScadaNode[];
    setNodes: (nodes: ScadaNode[]) => void;
    devices: Device[];
}

const PALETTE_ITEMS: { type: ScadaNodeType; label: string; icon: React.ReactNode }[] = [
    { type: 'tank', label: '储罐 (Tank)', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { type: 'pump', label: '水泵 (Pump)', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="2"/><path d="M12 7l5 9H7l5-9z" fill="currentColor"/></svg> },
    { type: 'pipe', label: '管道 (Pipe)', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h16" /></svg> },
    { type: 'led', label: '指示灯 (LED)', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg> },
    { type: 'value', label: '数值 (Value)', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg> },
    { type: 'label', label: '标签 (Text)', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg> },
];

export const TopologyPage: React.FC<TopologyPageProps> = ({ nodes, setNodes, devices }) => {
    const [mode, setMode] = useState<'edit' | 'run'>('edit');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Initial Palette Drag
    const handleDragStart = (e: React.DragEvent, type: ScadaNodeType) => {
        e.dataTransfer.setData('nodeType', type);
    };

    // Drop on Canvas (Create New)
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (mode !== 'edit') return;
        
        const type = e.dataTransfer.getData('nodeType') as ScadaNodeType;
        if (!type) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Calculate Position relative to canvas
        const x = Math.round((e.clientX - rect.left) / 20) * 20; // Snap to 20
        const y = Math.round((e.clientY - rect.top) / 20) * 20;

        const newNode: ScadaNode = {
            id: `${type}-${Date.now()}`,
            type,
            x,
            y,
            w: type === 'pipe' ? 100 : type === 'tank' ? 80 : 40,
            h: type === 'pipe' ? 10 : type === 'tank' ? 100 : 40,
            text: type === 'label' ? 'Label' : type === 'value' ? '0.00' : undefined,
            fill: '#6366f1'
        };

        setNodes([...nodes, newNode]);
        setSelectedNodeId(newNode.id);
    };

    const handleCanvasDragOver = (e: React.DragEvent) => e.preventDefault();

    // Internal Dragging Logic (Move Existing)
    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        if (mode !== 'edit') return;
        e.stopPropagation();
        setDraggedNodeId(id);
        setSelectedNodeId(id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggedNodeId || mode !== 'edit') return;
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Simple drag follow (center snap)
        const x = Math.max(0, Math.round((e.clientX - rect.left - 20) / 20) * 20);
        const y = Math.max(0, Math.round((e.clientY - rect.top - 20) / 20) * 20);

        setNodes(nodes.map(n => n.id === draggedNodeId ? { ...n, x, y } : n));
    };

    const handleMouseUp = () => {
        setDraggedNodeId(null);
    };

    const handleDeleteNode = () => {
        if (selectedNodeId) {
            setNodes(nodes.filter(n => n.id !== selectedNodeId));
            setSelectedNodeId(null);
        }
    };

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    // --- Renderer ---
    const renderNode = (node: ScadaNode) => {
        // Resolve Binding Value
        let displayValue = 0;
        let bindingActive = false;

        if (mode === 'run' && node.binding) {
            const dev = devices.find(d => d.id === node.binding!.deviceId);
            if (dev && dev.metrics[node.binding!.metricKey]) {
                const history = dev.metrics[node.binding!.metricKey];
                if (history.length > 0) {
                    displayValue = history[history.length - 1].value;
                    bindingActive = true;
                }
            }
        }

        const isSelected = selectedNodeId === node.id && mode === 'edit';
        
        // Common Props
        const groupProps = {
            transform: `translate(${node.x}, ${node.y}) rotate(${node.rotation || 0} ${node.w/2} ${node.h/2})`,
            onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, node.id),
            // FIX: Stop propagation on click to prevent canvas from clearing selection immediately
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
            style: { cursor: mode === 'edit' ? 'move' : 'default' }
        };

        // Render shapes based on Type
        switch (node.type) {
            case 'tank':
                // Tank logic: inner rect height depends on binding 'level'
                const fillHeight = bindingActive && node.binding?.targetProp === 'level' 
                    ? Math.min(100, Math.max(0, (displayValue / (node.binding.max || 100)) * 100)) 
                    : 50; // default 50%
                
                return (
                    <g {...groupProps}>
                        <rect width={node.w} height={node.h} rx="4" fill="white" stroke="#94a3b8" strokeWidth="2" />
                        {/* Liquid Level */}
                        <rect 
                            x="2" 
                            y={node.h - (node.h * fillHeight / 100) - 2} 
                            width={node.w - 4} 
                            height={(node.h * fillHeight / 100)} 
                            fill={node.fill || '#6366f1'} 
                            rx="2"
                            className="transition-all duration-500 ease-in-out"
                        />
                        {/* Scale lines */}
                        <line x1={node.w} y1={node.h * 0.25} x2={node.w - 5} y2={node.h * 0.25} stroke="#cbd5e1" />
                        <line x1={node.w} y1={node.h * 0.5} x2={node.w - 8} y2={node.h * 0.5} stroke="#cbd5e1" />
                        <line x1={node.w} y1={node.h * 0.75} x2={node.w - 5} y2={node.h * 0.75} stroke="#cbd5e1" />
                        {isSelected && <rect width={node.w} height={node.h} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" />}
                        {node.label && <text x={node.w/2} y={-5} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">{node.label}</text>}
                    </g>
                );
            case 'pump':
                const pumpColor = bindingActive && node.binding?.targetProp === 'fill' 
                    ? (displayValue > 0 ? '#22c55e' : '#ef4444') // Green if >0 (running), Red if 0
                    : '#94a3b8';
                
                return (
                    <g {...groupProps}>
                        <circle cx={node.w/2} cy={node.h/2} r={Math.min(node.w, node.h)/2} fill={pumpColor} stroke="white" strokeWidth="2" className="transition-colors duration-300" />
                        <path d={`M${node.w/2-5} ${node.h/2-5} L${node.w/2-5} ${node.h/2+5} L${node.w/2+6} ${node.h/2} Z`} fill="white" />
                        {isSelected && <rect x="-2" y="-2" width={node.w+4} height={node.h+4} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" />}
                        {node.label && <text x={node.w/2} y={node.h + 12} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">{node.label}</text>}
                    </g>
                );
            case 'pipe':
                // Flow animation class if binding active
                const isFlowing = mode === 'run' && bindingActive && displayValue > 0;
                return (
                    <g {...groupProps}>
                        <rect width={node.w} height={node.h} fill="#e2e8f0" stroke="#cbd5e1" />
                        {/* Animated Overlay for flow */}
                        {isFlowing && (
                            <line x1="0" y1={node.h/2} x2={node.w} y2={node.h/2} stroke={node.fill || '#6366f1'} strokeWidth={node.h/2} strokeDasharray="10 5" className="scada-flow-anim" />
                        )}
                        {isSelected && <rect width={node.w} height={node.h} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" />}
                    </g>
                );
            case 'led':
                const ledColor = bindingActive 
                    ? (displayValue > 0 ? '#22c55e' : '#ef4444')
                    : '#cbd5e1';
                return (
                    <g {...groupProps}>
                        <circle cx={node.w/2} cy={node.h/2} r={Math.min(node.w, node.h)/2 - 2} fill={ledColor} stroke="#fff" strokeWidth="2" 
                            style={{ filter: bindingActive && displayValue > 0 ? 'drop-shadow(0 0 4px #22c55e)' : 'none' }}
                        />
                        {isSelected && <rect width={node.w} height={node.h} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" />}
                    </g>
                );
            case 'value':
                return (
                    <g {...groupProps}>
                        <rect width={node.w} height={node.h} fill="#1e293b" rx="4" />
                        <text x={node.w/2} y={node.h/2 + 4} textAnchor="middle" fill={bindingActive ? '#22c55e' : '#fff'} fontSize="12" fontFamily="monospace" fontWeight="bold">
                            {bindingActive ? displayValue.toFixed(1) : node.text}
                        </text>
                        {isSelected && <rect width={node.w} height={node.h} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" />}
                    </g>
                );
            case 'label':
                return (
                    <g {...groupProps}>
                        <text x={0} y={12} fontSize="12" fontWeight="bold" fill="#334155">{node.text}</text>
                        {isSelected && <rect width={node.w} height={20} fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="2" />}
                    </g>
                );
            default: return null;
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4">
            {/* Left: Palette (Only in Edit Mode) */}
            {mode === 'edit' && (
                <div className="w-48 bg-white rounded-[32px] border border-slate-100 shadow-sm p-4 flex flex-col gap-3 overflow-y-auto animate-in slide-in-from-left-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Component Palette</h3>
                    {PALETTE_ITEMS.map(item => (
                        <div 
                            key={item.type}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.type)}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 cursor-grab active:cursor-grabbing transition-all group bg-slate-50"
                        >
                            <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">{item.icon}</div>
                            <span className="text-xs font-bold text-slate-600">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Center: Canvas */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Toolbar */}
                <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center px-4">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setMode('edit')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${mode === 'edit' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit
                        </button>
                        <button 
                            onClick={() => { setMode('run'); setSelectedNodeId(null); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${mode === 'run' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Run Monitor
                        </button>
                    </div>
                    {mode === 'edit' && (
                        <div className="text-[10px] font-mono text-slate-400">
                            Grid Snap: 20px | {nodes.length} Objects
                        </div>
                    )}
                </div>

                {/* SVG Area */}
                <div 
                    ref={canvasRef}
                    className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-inner relative overflow-hidden"
                    onDrop={handleDrop}
                    onDragOver={handleCanvasDragOver}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onClick={() => setSelectedNodeId(null)}
                    style={{ 
                        backgroundImage: mode === 'edit' ? 'radial-gradient(#cbd5e1 1px, transparent 1px)' : 'none',
                        backgroundSize: '20px 20px'
                    }}
                >
                    <svg width="100%" height="100%" className="absolute inset-0">
                        {nodes.map(node => renderNode(node))}
                    </svg>
                </div>
            </div>

            {/* Right: Property Panel (Only in Edit Mode and Selection) */}
            {mode === 'edit' && selectedNode && (
                <div className="w-72 bg-white rounded-[32px] border border-slate-100 shadow-xl p-6 overflow-y-auto animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-slate-800">Properties</h3>
                        <button onClick={handleDeleteNode} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Geometry */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Geometry</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">X</label>
                                    <input type="number" value={selectedNode.x} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, x: parseInt(e.target.value) } : n))} className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs font-bold border-none outline-none" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Y</label>
                                    <input type="number" value={selectedNode.y} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, y: parseInt(e.target.value) } : n))} className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs font-bold border-none outline-none" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">W</label>
                                    <input type="number" value={selectedNode.w} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, w: parseInt(e.target.value) } : n))} className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs font-bold border-none outline-none" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">H</label>
                                    <input type="number" value={selectedNode.h} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, h: parseInt(e.target.value) } : n))} className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs font-bold border-none outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Visuals */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Visuals</label>
                            <div className="space-y-3">
                                {(selectedNode.type === 'label' || selectedNode.type === 'tank' || selectedNode.type === 'pump') && (
                                    <div>
                                        <label className="text-[9px] text-slate-400 font-bold block mb-1">Label Text</label>
                                        <input type="text" value={selectedNode.label || ''} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n))} className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs font-bold border-none outline-none" />
                                    </div>
                                )}
                                {(selectedNode.type === 'value' || selectedNode.type === 'label') && (
                                    <div>
                                        <label className="text-[9px] text-slate-400 font-bold block mb-1">Display Text</label>
                                        <input type="text" value={selectedNode.text || ''} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, text: e.target.value } : n))} className="w-full px-3 py-2 bg-slate-50 rounded-lg text-xs font-bold border-none outline-none" />
                                    </div>
                                )}
                                <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Fill Color</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={selectedNode.fill} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, fill: e.target.value } : n))} className="h-8 w-10 p-0 border-none rounded cursor-pointer" />
                                        <input type="text" value={selectedNode.fill} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, fill: e.target.value } : n))} className="flex-1 px-3 py-2 bg-slate-50 rounded-lg text-xs font-mono outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Data Binding */}
                        <div className="pt-4 border-t border-slate-50">
                            <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Data Binding</label>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">Device</label>
                                    <select 
                                        value={selectedNode.binding?.deviceId || ''}
                                        onChange={e => {
                                            const devId = e.target.value;
                                            const newBinding = devId ? { deviceId: devId, metricKey: '', targetProp: 'value' as const, max: 100 } : undefined;
                                            setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, binding: newBinding } : n));
                                        }}
                                        className="w-full px-3 py-2 bg-indigo-50 rounded-lg text-xs font-bold outline-none border border-indigo-100 focus:border-indigo-300"
                                    >
                                        <option value="">-- No Binding --</option>
                                        {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>

                                {selectedNode.binding?.deviceId && (
                                    <>
                                        <div>
                                            <label className="text-[9px] text-slate-400 font-bold block mb-1">Metric</label>
                                            <select 
                                                value={selectedNode.binding.metricKey || ''}
                                                onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, binding: { ...n.binding!, metricKey: e.target.value } } : n))}
                                                className="w-full px-3 py-2 bg-indigo-50 rounded-lg text-xs font-bold outline-none border border-indigo-100 focus:border-indigo-300"
                                            >
                                                <option value="">-- Select Metric --</option>
                                                {Object.keys(devices.find(d => d.id === selectedNode.binding?.deviceId)?.metrics || {}).map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-400 font-bold block mb-1">Target Property</label>
                                            <select 
                                                value={selectedNode.binding.targetProp}
                                                onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, binding: { ...n.binding!, targetProp: e.target.value as any } } : n))}
                                                className="w-full px-3 py-2 bg-indigo-50 rounded-lg text-xs font-bold outline-none border border-indigo-100 focus:border-indigo-300"
                                            >
                                                <option value="value">Display Value</option>
                                                <option value="level">Fill Level (Tank)</option>
                                                <option value="fill">Fill Color (On/Off)</option>
                                                <option value="flow_anim">Flow Animation (Pipe)</option>
                                            </select>
                                        </div>
                                        {(selectedNode.binding.targetProp === 'level') && (
                                            <div>
                                                <label className="text-[9px] text-slate-400 font-bold block mb-1">Max Scale</label>
                                                <input 
                                                    type="number" 
                                                    value={selectedNode.binding.max} 
                                                    onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, binding: { ...n.binding!, max: parseFloat(e.target.value) } } : n))} 
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" 
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
