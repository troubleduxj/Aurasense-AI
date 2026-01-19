
import React, { useState, useEffect } from 'react';
import { ChartConfig, DataView, Device, ChartStyle, AggregationType, FormatConfig, ThresholdRule, ReferenceLine, AnalysisConfig, ContainerConfig, RowAction, ChartInteractionConfig, InteractionParamMapping, Dashboard } from '../types';
import { RenderChart } from '../components/RenderChart';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

// Preset color palettes
const COLOR_PALETTES = [
  { name: 'Default Indigo', colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] },
  { name: 'Ocean Blue', colors: ['#0ea5e9', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'] },
  { name: 'Forest Green', colors: ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'] },
  { name: 'Sunset Orange', colors: ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'] },
  { name: 'Berry Red', colors: ['#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'] },
  { name: 'Neon Cyber', colors: ['#00ff9f', '#00b8ff', '#001eff', '#bd00ff', '#d600ff'] },
];

interface ChartLabPageProps {
  charts: ChartConfig[];
  dataViews: DataView[];
  devices: Device[];
  dashboards?: Dashboard[]; 
  onSaveChart: (chart: ChartConfig) => void;
  onDeleteChart: (id: string) => void;
}

export const ChartLabPage: React.FC<ChartLabPageProps> = ({ charts, dataViews, devices, dashboards = [], onSaveChart, onDeleteChart }) => {
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'data' | 'style' | 'interaction'>('data');
  
  const [chartForm, setChartForm] = useState<{
    name: string;
    viewId: string;
    type: ChartConfig['type'];
    metrics: string[];
    dimensions: string[];
    aggregations: Record<string, AggregationType>;
    style: ChartStyle;
    format: FormatConfig; 
    content: string; 
    analysis: AnalysisConfig; 
    container: ContainerConfig; 
    interaction: ChartInteractionConfig; 
  }>({
    name: '',
    viewId: '',
    type: 'line',
    metrics: [],
    dimensions: [],
    aggregations: {},
    style: {
      colors: COLOR_PALETTES[0].colors,
      showGrid: true,
      showLegend: true,
      legendPosition: 'top',
      xAxisLabel: true,
      yAxisLabel: true,
      thresholds: [],
      referenceLines: [],
      fontSize: 14,
      textAlign: 'left',
      background: undefined,
      textColor: undefined,
      borderRadius: 32,
      enablePagination: false, 
      pageSize: 10,
      showRowNumber: false,
      rowActions: [],
      columnWidths: {}
    },
    format: { type: 'number', precision: 1, unitSuffix: '' },
    content: '',
    analysis: { enableMovingAverage: false, movingAverageWindow: 5, trendLineColor: '#cbd5e1' },
    container: { childChartIds: [], interval: 5 },
    interaction: { type: 'none', params: [] }
  });

  // State for new items
  const [newThreshold, setNewThreshold] = useState<ThresholdRule>({ id: '', operator: '>', value: 80, color: '#ef4444' });
  const [newAction, setNewAction] = useState<RowAction>({ id: '', label: 'View', type: 'default', icon: '' });
  const [newParam, setNewParam] = useState<InteractionParamMapping>({ id: '', sourceKey: 'name', targetKey: '' });

  useEffect(() => {
    if (editingChart) {
      setChartForm({
        name: editingChart.name,
        viewId: editingChart.viewId,
        type: editingChart.type,
        metrics: editingChart.metrics,
        dimensions: editingChart.dimensions,
        aggregations: editingChart.aggregations || {},
        style: {
          colors: editingChart.style?.colors || COLOR_PALETTES[0].colors,
          showGrid: editingChart.style?.showGrid ?? true,
          showLegend: editingChart.style?.showLegend ?? true,
          legendPosition: editingChart.style?.legendPosition || 'top',
          xAxisLabel: editingChart.style?.xAxisLabel ?? true,
          yAxisLabel: editingChart.style?.yAxisLabel ?? true,
          colSpan: editingChart.style?.colSpan,
          heightClass: editingChart.style?.heightClass,
          thresholds: editingChart.style?.thresholds || [],
          referenceLines: editingChart.style?.referenceLines || [],
          fontSize: editingChart.style?.fontSize || 14,
          textAlign: editingChart.style?.textAlign || 'left',
          background: editingChart.style?.background,
          textColor: editingChart.style?.textColor,
          borderRadius: editingChart.style?.borderRadius ?? 32,
          enablePagination: editingChart.style?.enablePagination || false,
          pageSize: editingChart.style?.pageSize || 10,
          showRowNumber: editingChart.style?.showRowNumber || false,
          rowActions: editingChart.style?.rowActions || [],
          columnWidths: editingChart.style?.columnWidths || {}
        },
        format: editingChart.format || { type: 'number', precision: 1, unitSuffix: '' },
        content: editingChart.content || '',
        analysis: editingChart.analysis || { enableMovingAverage: false, movingAverageWindow: 5, trendLineColor: '#cbd5e1' },
        container: editingChart.container || { childChartIds: [], interval: 5 },
        interaction: editingChart.interaction || { type: 'none', params: [] }
      });
      setActiveTab('data'); 
    }
  }, [editingChart]);

  const handleCreateNewChart = () => {
    const newChart: ChartConfig = {
        id: `chart-${Date.now()}`,
        name: '未命名图表',
        viewId: dataViews[0]?.id || '',
        type: 'line',
        metrics: [],
        dimensions: [],
        aggregations: {},
        style: { colors: COLOR_PALETTES[0].colors }
    };
    setEditingChart(newChart);
  };

  const handleSave = () => {
    if (!editingChart) return;
    const updated: ChartConfig = { ...editingChart, ...chartForm };
    onSaveChart(updated);
    setEditingChart(null);
  };

  const handleAggregationChange = (metric: string, type: AggregationType) => {
      setChartForm(prev => ({ ...prev, aggregations: { ...prev.aggregations, [metric]: type } }));
  };
  const handleAddAction = () => {
      const finalId = newAction.id.trim() || `act-${Date.now()}`;
      setChartForm(prev => ({ ...prev, style: { ...prev.style, rowActions: [...(prev.style.rowActions || []), { ...newAction, id: finalId, label: newAction.label || 'Action' }] } }));
      setNewAction({ id: '', label: 'View', type: 'default', icon: '' });
  };
  const handleRemoveAction = (idx: number) => setChartForm(prev => ({ ...prev, style: { ...prev.style, rowActions: (prev.style.rowActions || []).filter((_, i) => i !== idx) } }));
  
  const handleToggleChildChart = (chartId: string) => {
      setChartForm(prev => {
          const currentIds = prev.container.childChartIds || [];
          const newIds = currentIds.includes(chartId) ? currentIds.filter(id => id !== chartId) : [...currentIds, chartId];
          return { ...prev, container: { ...prev.container, childChartIds: newIds } };
      });
  };

  const handleAddParam = () => {
      if(!newParam.targetKey) return;
      setChartForm(prev => ({
          ...prev,
          interaction: {
              ...prev.interaction,
              params: [...(prev.interaction.params || []), { ...newParam, id: `p-${Date.now()}` }]
          }
      }));
      setNewParam({ id: '', sourceKey: 'name', targetKey: '' });
  };

  const handleRemoveParam = (id: string) => {
      setChartForm(prev => ({
          ...prev,
          interaction: {
              ...prev.interaction,
              params: (prev.interaction.params || []).filter(p => p.id !== id)
          }
      }));
  };

  const isRichMedia = chartForm.type === 'text' || chartForm.type === 'image';
  const isContainer = chartForm.type === 'container';

  return (
    <div className="pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {charts.map(c => (
                <Card key={c.id} hoverEffect onClick={() => setEditingChart(c)} className="h-72 p-0 relative group overflow-hidden">
                   <div className="h-full w-full pointer-events-none p-4">
                       <RenderChart chart={c} devices={devices} dataView={dataViews.find(v => v.id === c.viewId)} dataViews={dataViews} allCharts={charts} />
                   </div>
                   <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button size="sm" variant="danger" className="p-2 bg-white" onClick={(e) => { e.stopPropagation(); if(window.confirm('Confirm delete?')) onDeleteChart(c.id); }} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>} />
                   </div>
                </Card>
            ))}
            
            <div onClick={handleCreateNewChart} className="h-72 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-white/50 transition-all cursor-pointer group">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-indigo-50 group-hover:border-indigo-100"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg></div>
                <span className="text-xs font-bold uppercase tracking-widest">创建新图表</span>
            </div>
        </div>

      <Modal
        isOpen={!!editingChart}
        onClose={() => setEditingChart(null)}
        title="图表配置实验室"
        subtitle="Visualization Configuration"
        size="xl"
        footer={
            <div className="flex gap-4 w-full">
                <Button onClick={handleSave} className="flex-1">保存图表配置</Button>
                <Button variant="secondary" onClick={() => setEditingChart(null)}>取消</Button>
            </div>
        }
      >
            <div className="flex flex-col gap-6">
                {/* Tab Switcher */}
               <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl w-fit">
                    <Button size="sm" variant={activeTab === 'data' ? 'primary' : 'ghost'} onClick={() => setActiveTab('data')}>数据配置</Button>
                    <Button size="sm" variant={activeTab === 'style' ? 'success' : 'ghost'} onClick={() => setActiveTab('style')} className={activeTab === 'style' ? 'bg-emerald-500 text-white' : ''}>样式告警</Button>
                    <Button size="sm" variant={activeTab === 'interaction' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('interaction')} className={activeTab === 'interaction' ? 'bg-purple-500 text-white border-purple-500' : ''}>交互钻取</Button>
               </div>

               <div className="flex gap-8 h-[600px]">
                    {/* Left: Configuration Form */}
                    <div className="w-1/2 overflow-y-auto custom-scrollbar pr-4 space-y-6">
                        {activeTab === 'data' && (
                            <div className="space-y-6 animate-in slide-in-from-left-4">
                                <Input label="组件名称" value={chartForm.name} onChange={e => setChartForm({...chartForm, name: e.target.value})} />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <Select 
                                        label="可视化类型"
                                        value={chartForm.type}
                                        onChange={e => setChartForm({...chartForm, type: e.target.value as any})}
                                        options={[
                                            { label: 'Line Chart (折线图)', value: 'line' },
                                            { label: 'Area Chart (面积图)', value: 'area' },
                                            { label: 'Bar Chart (柱状图)', value: 'bar' },
                                            { label: 'Pie Chart (饼图)', value: 'pie' },
                                            { label: 'Radar Chart (雷达图)', value: 'radar' },
                                            { label: 'KPI Card (指标卡)', value: 'kpi' },
                                            { label: 'Gauge Chart (仪表盘)', value: 'gauge' },
                                            { label: 'Table (表格)', value: 'table' },
                                            { label: 'Text (纯文本)', value: 'text' },
                                            { label: 'Image (图片)', value: 'image' },
                                            { label: 'Carousel (轮播)', value: 'container' },
                                        ]}
                                    />
                                    {!isRichMedia && !isContainer && (
                                        <Select 
                                            label="数据视图来源"
                                            value={chartForm.viewId}
                                            onChange={e => setChartForm({...chartForm, viewId: e.target.value, metrics: [], dimensions: []})}
                                            options={dataViews.map(v => ({ label: v.name, value: v.id }))}
                                        />
                                    )}
                                </div>

                                {isContainer && (
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4">
                                        <Input label="轮播间隔 (秒)" type="number" min={2} value={chartForm.container.interval} onChange={e => setChartForm({ ...chartForm, container: { ...chartForm.container, interval: parseInt(e.target.value) } })} />
                                        
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">选择子图表</label>
                                            <div className="max-h-40 overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl bg-white p-2 space-y-2">
                                                {charts.filter(c => c.id !== editingChart?.id && c.type !== 'container').map(c => {
                                                    const isSelected = chartForm.container.childChartIds.includes(c.id);
                                                    return (
                                                        <div key={c.id} onClick={() => handleToggleChildChart(c.id)} className={`p-2 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white'}`}>
                                                            <span className="text-xs font-bold">{c.name}</span>
                                                            {isSelected && <span className="text-[9px]">SELECTED</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isRichMedia && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{chartForm.type === 'text' ? '文本内容' : '图片 URL'}</label>
                                        {chartForm.type === 'text' ? (
                                            <textarea value={chartForm.content} onChange={e => setChartForm({ ...chartForm, content: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 h-32 resize-none" />
                                        ) : (
                                            <Input value={chartForm.content} onChange={e => setChartForm({ ...chartForm, content: e.target.value })} placeholder="https://example.com/logo.png" />
                                        )}
                                    </div>
                                )}

                                {!isRichMedia && !isContainer && (() => {
                                    const view = dataViews.find(v => v.id === chartForm.viewId);
                                    const allFields = [...(view ? view.fields : []), ...(view?.calculatedFields?.map(f => f.name) || [])];

                                    return (
                                        <div className="space-y-6 pt-4 border-t border-slate-50">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">维度 (X-Axis)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {allFields.map(f => {
                                                        const isSelected = chartForm.dimensions.includes(f);
                                                        return (
                                                            <button key={f} onClick={() => {
                                                                const newDims = isSelected ? chartForm.dimensions.filter(d => d !== f) : [...chartForm.dimensions, f];
                                                                setChartForm({...chartForm, dimensions: newDims});
                                                            }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                                                                {f}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">指标 (Y-Axis)</label>
                                                <div className="space-y-2">
                                                    {allFields.map(f => {
                                                        if (!chartForm.metrics.includes(f)) return <button key={f} onClick={() => setChartForm({...chartForm, metrics: [...chartForm.metrics, f]})} className="mr-2 mb-2 px-3 py-1.5 rounded-xl text-xs font-bold border bg-white border-slate-200 text-slate-500">{f}</button>;
                                                        return (
                                                            <div key={f} className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded-xl mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => setChartForm({...chartForm, metrics: chartForm.metrics.filter(m => m !== f)})} className="text-emerald-300 hover:text-emerald-600">×</button>
                                                                    <span className="text-xs font-bold text-emerald-800">{f}</span>
                                                                </div>
                                                                <select value={chartForm.aggregations[f] || 'AVG'} onChange={(e) => handleAggregationChange(f, e.target.value as AggregationType)} className="text-[10px] font-black bg-white border border-emerald-200 text-emerald-600 rounded-lg px-2 py-1">
                                                                    {['AVG', 'SUM', 'MAX', 'MIN', 'COUNT', 'LAST'].map(op => <option key={op} value={op}>{op}</option>)}
                                                                </select>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {activeTab === 'style' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">General Styling</label>
                                    
                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-400 mb-1">Background Color</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={chartForm.style.background || '#ffffff'} onChange={e => setChartForm({...chartForm, style: {...chartForm.style, background: e.target.value}})} className="h-8 w-10 p-0 border-none rounded cursor-pointer" />
                                            <button onClick={() => setChartForm({...chartForm, style: {...chartForm.style, background: undefined}})} className="text-xs bg-white border px-2 rounded h-8 text-slate-500">Reset</button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-400 mb-1">Text Color</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={chartForm.style.textColor || '#000000'} onChange={e => setChartForm({...chartForm, style: {...chartForm.style, textColor: e.target.value}})} className="h-8 w-10 p-0 border-none rounded cursor-pointer" />
                                            <button onClick={() => setChartForm({...chartForm, style: {...chartForm.style, textColor: undefined}})} className="text-xs bg-white border px-2 rounded h-8 text-slate-500">Reset</button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-400 mb-1">Border Radius (px)</label>
                                        <Input type="number" value={chartForm.style.borderRadius ?? 32} onChange={e => setChartForm({...chartForm, style: {...chartForm.style, borderRadius: parseInt(e.target.value)}})} className="w-full" />
                                    </div>
                                </div>

                                {chartForm.type === 'table' && (
                                    <div className="space-y-4 pt-4 border-t border-slate-50">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Table Options</label>
                                        
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-[9px] font-bold text-slate-400 mb-1">Page Size</label>
                                                    <Select 
                                                        value={chartForm.style.pageSize ?? 10} 
                                                        onChange={e => setChartForm({...chartForm, style: {...chartForm.style, pageSize: parseInt(e.target.value)}})}
                                                        options={[
                                                            {label:'5 Rows', value: 5},
                                                            {label:'10 Rows', value: 10},
                                                            {label:'20 Rows', value: 20},
                                                            {label:'50 Rows', value: 50}
                                                        ]} 
                                                    />
                                                </div>
                                                <div className="flex items-center mt-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={chartForm.style.showRowNumber ?? false} 
                                                            onChange={e => setChartForm({...chartForm, style: {...chartForm.style, showRowNumber: e.target.checked}})}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                                                        />
                                                        <span className="text-xs font-bold text-slate-600">Row Numbers</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[9px] font-bold text-slate-400 mb-2">Row Actions</label>
                                                <div className="flex gap-2 mb-2">
                                                    <Input placeholder="ID" value={newAction.id} onChange={e => setNewAction({ ...newAction, id: e.target.value })} className="w-20 text-[10px]" />
                                                    <Input placeholder="Label" value={newAction.label} onChange={e => setNewAction({ ...newAction, label: e.target.value })} className="flex-1 text-[10px]" />
                                                    <Select value={newAction.type} onChange={e => setNewAction({ ...newAction, type: e.target.value as any })} options={[{label:'Default',value:'default'},{label:'Primary',value:'primary'},{label:'Danger',value:'danger'}]} className="w-24 text-[10px]" />
                                                    <Button size="sm" onClick={handleAddAction}>+</Button>
                                                </div>
                                                <div className="space-y-2">
                                                    {chartForm.style.rowActions?.map((action, idx) => (
                                                        <div key={idx} className="flex justify-between p-2 bg-white rounded-lg border border-slate-100 text-xs items-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full ${action.type === 'primary' ? 'bg-indigo-500' : action.type === 'danger' ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
                                                                <span className="font-bold">{action.label}</span>
                                                                <span className="font-mono text-[9px] text-slate-400">({action.id})</span>
                                                            </div>
                                                            <button onClick={() => handleRemoveAction(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'interaction' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <Select 
                                    label="点击行为"
                                    value={chartForm.interaction.type}
                                    onChange={e => setChartForm({ ...chartForm, interaction: { ...chartForm.interaction, type: e.target.value as any } })}
                                    options={[
                                        { label: 'None', value: 'none' },
                                        { label: 'Navigate Dashboard', value: 'navigate_dashboard' },
                                        { label: 'Open Modal', value: 'open_modal' },
                                        { label: 'External Link', value: 'external_link' },
                                    ]}
                                />

                                {chartForm.interaction.type !== 'none' && (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                        {chartForm.interaction.type === 'external_link' ? (
                                            <Input label="URL Template" value={chartForm.interaction.url || ''} onChange={e => setChartForm({ ...chartForm, interaction: { ...chartForm.interaction, url: e.target.value } })} placeholder="https://example.com?id={value}" />
                                        ) : (
                                            <Select 
                                                label="Target Dashboard"
                                                value={chartForm.interaction.targetId || ''}
                                                onChange={e => setChartForm({ ...chartForm, interaction: { ...chartForm.interaction, targetId: e.target.value } })}
                                                options={dashboards.filter(d => d.id !== editingChart?.id).map(d => ({ label: d.name, value: d.id }))}
                                            />
                                        )}

                                        <div className="pt-4 border-t border-slate-200">
                                            <label className="block text-[9px] font-bold text-slate-400 mb-2">Parameter Mapping</label>
                                            <div className="flex gap-2 mb-2">
                                                <Select value={newParam.sourceKey} onChange={e => setNewParam({ ...newParam, sourceKey: e.target.value as any })} options={[{label:'Name(X)',value:'name'},{label:'Value(Y)',value:'value'},{label:'Series',value:'series'},{label:'Row Field',value:'row_field'}]} />
                                                {newParam.sourceKey === 'row_field' && <Input placeholder="Field" value={newParam.sourceField || ''} onChange={e => setNewParam({ ...newParam, sourceField: e.target.value })} className="w-20" />}
                                                <Input placeholder="Target Key" value={newParam.targetKey} onChange={e => setNewParam({ ...newParam, targetKey: e.target.value })} />
                                                <Button onClick={handleAddParam}>+</Button>
                                            </div>
                                            <div className="space-y-2">
                                                {chartForm.interaction.params?.map(p => (
                                                    <div key={p.id} className="flex justify-between p-2 bg-white rounded-lg border border-slate-100 text-xs">
                                                        <span>{p.sourceKey} → {p.targetKey}</span>
                                                        <button onClick={() => handleRemoveParam(p.id)} className="text-rose-500">Del</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Live Preview */}
                    <div className="w-1/2 flex flex-col bg-slate-50 rounded-[32px] p-6 border border-slate-200">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Real-time Preview</label>
                        <div className="flex-1 bg-white rounded-[24px] shadow-sm overflow-hidden relative p-4">
                             <RenderChart 
                                chart={{
                                    id: 'preview',
                                    name: chartForm.name || 'Preview',
                                    viewId: chartForm.viewId,
                                    type: chartForm.type,
                                    metrics: chartForm.metrics.length > 0 ? chartForm.metrics : ['preview'],
                                    dimensions: chartForm.dimensions,
                                    aggregations: chartForm.aggregations, 
                                    style: chartForm.style,
                                    format: chartForm.format,
                                    content: chartForm.content,
                                    analysis: chartForm.analysis,
                                    container: chartForm.container,
                                    interaction: chartForm.interaction
                                }} 
                                devices={devices} 
                                dataView={dataViews.find(v => v.id === chartForm.viewId)} 
                                dataViews={dataViews} 
                                allCharts={charts} 
                            />
                        </div>
                    </div>
               </div>
      </Modal>
    </div>
  );
};
