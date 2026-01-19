
import React, { useState, useEffect, useRef } from 'react';
import { Device, ScadaNode, ScadaNodeType } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';

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

    const handleDragStart = (e: React.DragEvent, type: ScadaNodeType) => {
        e.dataTransfer.setData('nodeType', type);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (mode !== 'edit') return;
        
        const type = e.dataTransfer.getData('nodeType') as ScadaNodeType;
        if (!type) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = Math.round((e.clientX - rect.left) / 20) * 20; 
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

    const renderNode = (node: ScadaNode) => {
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
        
        const groupProps = {
            transform: `translate(${node.x}, ${node.y}) rotate(${node.rotation || 0} ${node.w/2} ${node.h/2})`,
            onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, node.id),
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
            style: { cursor: mode === 'edit' ? 'move' : 'default' }
        };

        switch (node.type) {
            case 'tank':
                const fillHeight = bindingActive && node.binding?.targetProp === 'level' 
                    ? Math.min(100, Math.max(0, (displayValue / (node.binding.max || 100)) * 100)) 
                    : 50;
                
                return (
                    <g {...groupProps}>
                        <rect width={node.w} height={node.h} rx="4" fill="white" stroke="#94a3b8" strokeWidth="2" />
                        <rect 
                            x="2" 
                            y={node.h - (node.h * fillHeight / 100) - 2} 
                            width={node.w - 4} 
                            height={(node.h * fillHeight / 100)} 
                            fill={node.fill || '#6366f1'} 
                            rx="2"
                            className="transition-all duration-500 ease-in-out"
                        />
                        <line x1={node.w} y1={node.h * 0.25} x2={node.w - 5} y2={node.h * 0.25} stroke="#cbd5e1" />
                        <line x1={node.w} y1={node.h * 0.5} x2={node.w - 8} y2={node.h * 0.5} stroke="#cbd5e1" />
                        <line x1={node.w} y1={node.h * 0.75} x2={node.w - 5} y2={node.h * 0.75} stroke="#cbd5e1" />
                        {isSelected && <rect width={node.w} height={node.h} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" />}
                        {node.label && <text x={node.w/2} y={-5} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">{node.label}</text>}
                    </g>
                );
            case 'pump':
                const pumpColor = bindingActive && node.binding?.targetProp === 'fill' 
                    ? (displayValue > 0 ? '#22c55e' : '#ef4444') 
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
                const isFlowing = mode === 'run' && bindingActive && displayValue > 0;
                return (
                    <g {...groupProps}>
                        <rect width={node.w} height={node.h} fill="#e2e8f0" stroke="#cbd5e1" />
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
            {/* Left: Palette */}
            {mode === 'edit' && (
                <Card className="w-48 p-4 flex flex-col gap-3 overflow-y-auto animate-in slide-in-from-left-4">
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
                </Card>
            )}

            {/* Center: Canvas */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Toolbar */}
                <Card className="p-2 flex justify-between items-center px-4">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant={mode === 'edit' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setMode('edit')}
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                        >
                            Edit
                        </Button>
                        <Button 
                            variant={mode === 'run' ? 'success' : 'secondary'}
                            size="sm"
                            className={mode === 'run' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}
                            onClick={() => { setMode('run'); setSelectedNodeId(null); }}
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        >
                            Run Monitor
                        </Button>
                    </div>
                    {mode === 'edit' && (
                        <div className="text-[10px] font-mono text-slate-400">
                            Grid Snap: 20px | {nodes.length} Objects
                        </div>
                    )}
                </Card>

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

            {/* Right: Property Panel */}
            {mode === 'edit' && selectedNode && (
                <Card className="w-72 p-6 overflow-y-auto animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-slate-800">Properties</h3>
                        <Button size="sm" variant="danger" className="p-2" onClick={handleDeleteNode} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>} />
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Geometry</label>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="X" type="number" value={selectedNode.x} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, x: parseInt(e.target.value) } : n))} />
                                <Input label="Y" type="number" value={selectedNode.y} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, y: parseInt(e.target.value) } : n))} />
                                <Input label="W" type="number" value={selectedNode.w} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, w: parseInt(e.target.value) } : n))} />
                                <Input label="H" type="number" value={selectedNode.h} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, h: parseInt(e.target.value) } : n))} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Visuals</label>
                            <div className="space-y-3">
                                {(selectedNode.type === 'label' || selectedNode.type === 'tank' || selectedNode.type === 'pump') && (
                                    <Input label="Label Text" value={selectedNode.label || ''} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n))} />
                                )}
                                {(selectedNode.type === 'value' || selectedNode.type === 'label') && (
                                    <Input label="Display Text" value={selectedNode.text || ''} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, text: e.target.value } : n))} />
                                )}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fill Color</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={selectedNode.fill} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, fill: e.target.value } : n))} className="h-11 w-12 rounded-xl cursor-pointer border border-slate-200 p-1 bg-white" />
                                        <Input value={selectedNode.fill} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, fill: e.target.value } : n))} className="font-mono text-xs" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                            <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Data Binding</label>
                            
                            <div className="space-y-3">
                                <Select 
                                    label="Device"
                                    value={selectedNode.binding?.deviceId || ''}
                                    onChange={e => {
                                        const devId = e.target.value;
                                        const newBinding = devId ? { deviceId: devId, metricKey: '', targetProp: 'value' as const, max: 100 } : undefined;
                                        setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, binding: newBinding } : n));
                                    }}
                                    options={[
                                        { label: '-- No Binding --', value: '' },
                                        ...devices.map(d => ({ label: d.name, value: d.id }))
                                    ]}
                                />

                                {selectedNode.binding?.deviceId && (
                                    <>
                                        <Select 
                                            label="Metric"
                                            value={selectedNode.binding.metricKey || ''}
                                            onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, binding: { ...n.binding!, metricKey: e.target.value } } : n))}
                                            options={[
                                                { label: '-- Select Metric --', value: '' },
                                                ...Object.keys(devices.find(d => d.id === selectedNode.binding?.deviceId)?.metrics || {}).map(m => ({ label: m, value: m }))
                                            ]}
                                        />
                                        <Select 
                                            label="Target Property"
                                            value={selectedNode.binding.targetProp}
                                            onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, binding: { ...n.binding!, targetProp: e.target.value as any } } : n))}
                                            options={[
                                                { label: 'Display Value', value: 'value' },
                                                { label: 'Fill Level (Tank)', value: 'level' },
                                                { label: 'Fill Color (On/Off)', value: 'fill' },
                                                { label: 'Flow Animation (Pipe)', value: 'flow_anim' },
                                            ]}
                                        />
                                        {(selectedNode.binding.targetProp === 'level') && (
                                            <Input label="Max Scale" type="number" value={selectedNode.binding.max} onChange={e => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, binding: { ...n.binding!, max: parseFloat(e.target.value) } } : n))} />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};
