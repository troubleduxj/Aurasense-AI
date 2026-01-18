
import React, { useState, useEffect } from 'react';
import { ChartConfig, DataView, Device, ChartStyle, AggregationType, FormatConfig, ThresholdRule, ThresholdOperator, ReferenceLine, AnalysisConfig, ContainerConfig, RowAction, ChartInteractionConfig, InteractionParamMapping, Dashboard } from '../types';
import { RenderChart } from '../components/RenderChart';

// Preset color palettes
const COLOR_PALETTES = [
  { name: 'Default Indigo', colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] },
  { name: 'Ocean Blue', colors: ['#0ea5e9', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'] },
  { name: 'Forest Green', colors: ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'] },
  { name: 'Sunset Orange', colors: ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'] },
  { name: 'Berry Red', colors: ['#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'] },
  { name: 'Neon Cyber', colors: ['#00ff9f', '#00b8ff', '#001eff', '#bd00ff', '#d600ff'] },
];

const ACTION_ICONS = [
    { label: '无图标', value: '' },
    { label: '查看 (Eye)', value: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { label: '编辑 (Pencil)', value: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { label: '删除 (Trash)', value: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
    { label: '导出 (Download)', value: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { label: '发送 (Send)', value: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
    { label: '设置 (Cog)', value: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
];

interface ChartLabPageProps {
  charts: ChartConfig[];
  dataViews: DataView[];
  devices: Device[];
  dashboards?: Dashboard[]; // [V3.2] Add dashboards for interaction config
  onSaveChart: (chart: ChartConfig) => void;
  onDeleteChart: (id: string) => void;
}

export const ChartLabPage: React.FC<ChartLabPageProps> = ({ charts, dataViews, devices, dashboards = [], onSaveChart, onDeleteChart }) => {
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'data' | 'style' | 'interaction'>('data');
  
  // ... (keep state initializations) ...
  const [chartForm, setChartForm] = useState<{
    name: string;
    viewId: string;
    type: ChartConfig['type'];
    metrics: string[];
    dimensions: string[];
    aggregations: Record<string, AggregationType>;
    style: ChartStyle;
    format: FormatConfig; 
    content: string; // V2-6
    analysis: AnalysisConfig; // V2-8
    container: ContainerConfig; // V2-5
    interaction: ChartInteractionConfig; // V3.2
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
      borderRadius: 32, // Default
      enablePagination: false, // V3.0
      pageSize: 10,
      showRowNumber: false,
      rowActions: [] // V3.3
    },
    format: {
        type: 'number',
        precision: 1,
        unitSuffix: ''
    },
    content: '',
    analysis: {
        enableMovingAverage: false,
        movingAverageWindow: 5,
        trendLineColor: '#cbd5e1'
    },
    container: {
        childChartIds: [],
        interval: 5
    },
    interaction: {
        type: 'none',
        params: []
    }
  });

  // State for adding new threshold rule
  const [newThreshold, setNewThreshold] = useState<ThresholdRule>({ id: '', operator: '>', value: 80, color: '#ef4444' });
  // State for adding new reference line
  const [newRefLine, setNewRefLine] = useState<ReferenceLine>({ id: '', name: 'Limit', type: 'constant', value: 100, color: '#ef4444' });
  // State for adding new action
  const [newAction, setNewAction] = useState<RowAction>({ id: '', label: 'View', type: 'default', icon: '' });
  // State for adding interaction param
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
        style: {
          colors: COLOR_PALETTES[0].colors,
          showGrid: true,
          showLegend: true,
          xAxisLabel: true,
          yAxisLabel: true
        }
    };
    setEditingChart(newChart);
  };

  const handleSave = () => {
    if (!editingChart) return;
    const updated: ChartConfig = {
      ...editingChart,
      ...chartForm
    };
    onSaveChart(updated);
    setEditingChart(null);
  };

  // ... (keep aggregation and threshold handlers) ...
  const handleAggregationChange = (metric: string, type: AggregationType) => {
      setChartForm(prev => ({ ...prev, aggregations: { ...prev.aggregations, [metric]: type } }));
  };
  const handleAddThreshold = () => setChartForm(prev => ({ ...prev, style: { ...prev.style, thresholds: [...(prev.style.thresholds || []), { ...newThreshold, id: `rule-${Date.now()}` }] } }));
  const handleRemoveThreshold = (idx: number) => setChartForm(prev => ({ ...prev, style: { ...prev.style, thresholds: (prev.style.thresholds || []).filter((_, i) => i !== idx) } }));
  const handleAddRefLine = () => setChartForm(prev => ({ ...prev, style: { ...prev.style, referenceLines: [...(prev.style.referenceLines || []), { ...newRefLine, id: `ref-${Date.now()}` }] } }));
  const handleRemoveRefLine = (idx: number) => setChartForm(prev => ({ ...prev, style: { ...prev.style, referenceLines: (prev.style.referenceLines || []).filter((_, i) => i !== idx) } }));
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

  // --- Interaction Handlers ---
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
    <div>
        {/* Chart Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {charts.map(c => (
                <div 
                    key={c.id} 
                    className="h-64 cursor-pointer hover:ring-4 hover:ring-indigo-100 rounded-[32px] transition-all relative group" 
                    onClick={() => setEditingChart(c)}
                >
                   <div className="h-full w-full pointer-events-none">
                       <RenderChart chart={c} devices={devices} dataView={dataViews.find(v => v.id === c.viewId)} dataViews={dataViews} allCharts={charts} />
                   </div>
                   <button 
                      onClick={(e) => { e.stopPropagation(); if(window.confirm('Confirm delete?')) onDeleteChart(c.id); }}
                      className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm z-20"
                   >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                </div>
            ))}
            <div onClick={handleCreateNewChart} className="h-64 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-white/50 transition-all cursor-pointer group">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-indigo-50 group-hover:border-indigo-100"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg></div>
                <span className="text-xs font-bold uppercase tracking-widest">创建新图表</span>
            </div>
        </div>

      {editingChart && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] shadow-2xl border border-white/40 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/30 flex justify-between items-center">
               <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">图表配置实验室</h3>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1">Visualization Configuration</p>
               </div>
               
               {/* Tab Switcher */}
               <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('data')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'data' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>数据配置</button>
                    <button onClick={() => setActiveTab('style')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'style' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>样式告警</button>
                    <button onClick={() => setActiveTab('interaction')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'interaction' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>交互钻取</button>
               </div>

               <button onClick={() => setEditingChart(null)} className="p-3 text-slate-400 hover:text-rose-500 rounded-2xl transition-all duration-300"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
                {/* Configuration Panel */}
                <div className="w-1/2 overflow-y-auto custom-scrollbar p-8 border-r border-slate-50">
                    
                    {activeTab === 'data' && (
                        <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">组件名称</label>
                                <input type="text" value={chartForm.name} onChange={e => setChartForm({...chartForm, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">可视化类型</label>
                                    <div className="relative">
                                        <select value={chartForm.type} onChange={e => setChartForm({...chartForm, type: e.target.value as any})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-slate-700 outline-none appearance-none cursor-pointer hover:bg-white">
                                            <option value="line">Line Chart (折线图)</option>
                                            <option value="area">Area Chart (面积图)</option>
                                            <option value="bar">Bar Chart (柱状图)</option>
                                            <option value="pie">Pie Chart (饼图)</option>
                                            <option value="radar">Radar Chart (雷达图)</option>
                                            <option value="kpi">KPI Card (指标卡)</option>
                                            <option value="gauge">Gauge Chart (仪表盘)</option>
                                            <option value="table">Table (表格)</option>
                                            <option value="text">Text (纯文本)</option>
                                            <option value="image">Image (图片)</option>
                                            <option value="container">Carousel Container (轮播容器)</option>
                                        </select>
                                        <svg className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                                {!isRichMedia && !isContainer && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">数据视图来源</label>
                                        <div className="relative">
                                            <select value={chartForm.viewId} onChange={e => setChartForm({...chartForm, viewId: e.target.value, metrics: [], dimensions: []})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-[20px] font-bold text-slate-700 outline-none appearance-none cursor-pointer hover:bg-white">
                                                {dataViews.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                            </select>
                                            <svg className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* [V2-5] Container Configuration - Keep existing code */}
                            {isContainer && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                        <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">容器设置</label>
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 mb-1">轮播间隔 (秒)</label>
                                            <input type="number" min="2" max="60" value={chartForm.container.interval} onChange={e => setChartForm({ ...chartForm, container: { ...chartForm.container, interval: parseInt(e.target.value) } })} className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">选择子图表 (Multi-Select)</label>
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl bg-slate-50 p-2 space-y-2">
                                            {charts.filter(c => c.id !== editingChart?.id && c.type !== 'container').map(c => {
                                                const isSelected = chartForm.container.childChartIds.includes(c.id);
                                                return (
                                                    <div key={c.id} onClick={() => handleToggleChildChart(c.id)} className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}>
                                                        <div><div className="text-xs font-bold">{c.name}</div><div className={`text-[9px] uppercase ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{c.type}</div></div>
                                                        {isSelected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isRichMedia ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{chartForm.type === 'text' ? '文本内容' : '图片 URL'}</label>
                                        {chartForm.type === 'text' ? (
                                            <textarea value={chartForm.content} onChange={e => setChartForm({ ...chartForm, content: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-[20px] font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 h-32 resize-none" placeholder="输入显示文本..." />
                                        ) : (
                                            <input type="text" value={chartForm.content} onChange={e => setChartForm({ ...chartForm, content: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-[20px] font-mono text-sm text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100" placeholder="https://example.com/logo.png" />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                (!isContainer && (() => {
                                    const view = dataViews.find(v => v.id === chartForm.viewId);
                                    const standardFields = view ? view.fields : [];
                                    const calculatedFields = view?.calculatedFields?.map(f => f.name) || [];
                                    const allFields = [...standardFields, ...calculatedFields];

                                    return (
                                        <div className="space-y-6 pt-4 border-t border-slate-50">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">维度 (Dimensions / X-Axis)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {allFields.map(f => {
                                                        const isSelected = chartForm.dimensions.includes(f);
                                                        return (
                                                            <button key={f} onClick={() => {
                                                                const newDims = isSelected ? chartForm.dimensions.filter(d => d !== f) : [...chartForm.dimensions, f];
                                                                setChartForm({...chartForm, dimensions: newDims});
                                                            }} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                                                                {f}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">指标 (Metrics / Y-Axis)</label>
                                                <div className="space-y-2">
                                                    {allFields.map(f => {
                                                        const isSelected = chartForm.metrics.includes(f);
                                                        if (!isSelected) return <button key={f} onClick={() => setChartForm({...chartForm, metrics: [...chartForm.metrics, f]})} className="mr-2 mb-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all inline-flex items-center gap-1.5 bg-white border-slate-200 text-slate-500 hover:bg-slate-50">{f}</button>;
                                                        return (
                                                            <div key={f} className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded-xl mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => setChartForm({...chartForm, metrics: chartForm.metrics.filter(m => m !== f)})} className="text-emerald-300 hover:text-emerald-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                                    <span className="text-xs font-bold text-emerald-800">{f}</span>
                                                                </div>
                                                                <select value={chartForm.aggregations[f] || 'AVG'} onChange={(e) => handleAggregationChange(f, e.target.value as AggregationType)} className="text-[10px] font-black uppercase bg-white border border-emerald-200 text-emerald-600 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer">
                                                                    <option value="AVG">AVG</option><option value="SUM">SUM</option><option value="MAX">MAX</option><option value="MIN">MIN</option><option value="COUNT">COUNT</option><option value="LAST">LAST</option>
                                                                </select>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })())
                            )}
                        </div>
                    )}

                    {/* --- STYLE TAB --- */}
                    {activeTab === 'style' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                             {/* ... existing styles ... */}
                             <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">卡片样式</label>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                    <div><label className="block text-[9px] font-bold text-slate-400 mb-1">背景颜色</label><div className="flex gap-2"><input type="color" value={chartForm.style.background || '#ffffff'} onChange={e => setChartForm({...chartForm, style: {...chartForm.style, background: e.target.value}})} className="h-8 w-10 p-0 border-none rounded cursor-pointer" /><button onClick={() => setChartForm({...chartForm, style: {...chartForm.style, background: undefined}})} className="text-xs bg-white border px-2 rounded h-8 text-slate-500 hover:bg-slate-50">Default</button></div></div>
                                    <div><label className="block text-[9px] font-bold text-slate-400 mb-1">文字颜色</label><div className="flex gap-2"><input type="color" value={chartForm.style.textColor || '#1e293b'} onChange={e => setChartForm({...chartForm, style: {...chartForm.style, textColor: e.target.value}})} className="h-8 w-10 p-0 border-none rounded cursor-pointer" /><button onClick={() => setChartForm({...chartForm, style: {...chartForm.style, textColor: undefined}})} className="text-xs bg-white border px-2 rounded h-8 text-slate-500 hover:bg-slate-50">Default</button></div></div>
                                </div>
                             </div>
                             {chartForm.type === 'table' && (
                                <div className="space-y-4 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">表格配置</label>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <input type="text" placeholder="ID" value={newAction.id} onChange={e => setNewAction({ ...newAction, id: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-24 outline-none flex-grow" />
                                            <input type="text" placeholder="Label" value={newAction.label} onChange={e => setNewAction({ ...newAction, label: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-20 outline-none" />
                                            <select value={newAction.type} onChange={e => setNewAction({ ...newAction, type: e.target.value as any })} className="px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-20"><option value="default">Default</option><option value="primary">Primary</option><option value="danger">Danger</option></select>
                                            <button onClick={handleAddAction} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg></button>
                                        </div>
                                        <div className="space-y-2 mt-2">
                                            {chartForm.style.rowActions?.map((action, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg">
                                                    <div className="flex items-center gap-2 text-xs"><span className="font-mono text-slate-400">{action.id}</span><span className={`px-2 py-0.5 rounded font-bold ${action.type === 'primary' ? 'bg-indigo-50 text-indigo-600' : action.type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{action.label}</span></div>
                                                    <button onClick={() => handleRemoveAction(idx)} className="text-slate-400 hover:text-rose-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             )}
                        </div>
                    )}

                    {/* --- INTERACTION TAB [V3.2] --- */}
                    {activeTab === 'interaction' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">点击交互行为</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['none', 'navigate_dashboard', 'open_modal', 'external_link'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setChartForm({ ...chartForm, interaction: { ...chartForm.interaction, type: type as any } })}
                                            className={`p-3 rounded-xl border text-xs font-bold uppercase transition-all ${chartForm.interaction.type === type ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-slate-200 text-slate-500 hover:border-purple-300'}`}
                                        >
                                            {type.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {chartForm.interaction.type !== 'none' && (
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-2">
                                    {/* Target Config */}
                                    {chartForm.interaction.type === 'navigate_dashboard' || chartForm.interaction.type === 'open_modal' ? (
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 mb-2">目标看板 (Target Dashboard)</label>
                                            <div className="relative">
                                                <select
                                                    value={chartForm.interaction.targetId || ''}
                                                    onChange={e => setChartForm({ ...chartForm, interaction: { ...chartForm.interaction, targetId: e.target.value } })}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none appearance-none"
                                                >
                                                    <option value="">-- Select Dashboard --</option>
                                                    {dashboards.filter(d => d.id !== editingChart?.id).map(d => ( // Prevent self-reference loops mostly
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </select>
                                                <svg className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 mb-2">外部链接 (URL Template)</label>
                                            <input 
                                                type="text" 
                                                value={chartForm.interaction.url || ''} 
                                                onChange={e => setChartForm({ ...chartForm, interaction: { ...chartForm.interaction, url: e.target.value } })} 
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-mono text-indigo-600 outline-none"
                                                placeholder="https://example.com/details?id={value}"
                                            />
                                            <p className="text-[9px] text-slate-400 mt-1">Available vars: {'{name}, {value}, {series}'}</p>
                                        </div>
                                    )}

                                    {/* Param Mapping */}
                                    <div className="pt-4 border-t border-slate-200">
                                        <label className="block text-[9px] font-bold text-slate-400 mb-2">参数传递映射 (Parameter Mapping)</label>
                                        
                                        {/* Add New Param */}
                                        <div className="flex gap-2 items-center mb-3">
                                            <select 
                                                value={newParam.sourceKey} 
                                                onChange={e => setNewParam({ ...newParam, sourceKey: e.target.value as any })}
                                                className="px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-24"
                                            >
                                                <option value="name">Name (X)</option>
                                                <option value="value">Value (Y)</option>
                                                <option value="series">Series</option>
                                                <option value="row_field">Row Field</option>
                                            </select>
                                            {newParam.sourceKey === 'row_field' && (
                                                <input 
                                                    type="text" 
                                                    placeholder="Field Name" 
                                                    value={newParam.sourceField || ''} 
                                                    onChange={e => setNewParam({ ...newParam, sourceField: e.target.value })}
                                                    className="px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-24 outline-none"
                                                />
                                            )}
                                            <span className="text-slate-400">→</span>
                                            <input 
                                                type="text" 
                                                placeholder="Target Key" 
                                                value={newParam.targetKey} 
                                                onChange={e => setNewParam({ ...newParam, targetKey: e.target.value })}
                                                className="flex-1 px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                                            />
                                            <button onClick={handleAddParam} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg></button>
                                        </div>

                                        {/* List */}
                                        <div className="space-y-2">
                                            {chartForm.interaction.params?.map(p => (
                                                <div key={p.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500">{p.sourceKey === 'row_field' ? p.sourceField : p.sourceKey}</span>
                                                        <span className="text-slate-300">→</span>
                                                        <span className="font-bold text-purple-700">{p.targetKey}</span>
                                                    </div>
                                                    <button onClick={() => handleRemoveParam(p.id)} className="text-slate-400 hover:text-rose-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                </div>
                                            ))}
                                            {(!chartForm.interaction.params || chartForm.interaction.params.length === 0) && (
                                                <p className="text-[10px] text-slate-400 italic text-center">No parameters mapped.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Live Preview Panel */}
                <div className="w-1/2 bg-slate-50 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Preview</label>
                        <span className="text-[9px] bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-400 font-mono">
                            {chartForm.type.toUpperCase()}
                        </span>
                    </div>
                    
                    <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden relative p-4">
                         <RenderChart 
                            chart={{
                                id: 'preview',
                                name: chartForm.name || '图表预览',
                                viewId: chartForm.viewId,
                                type: chartForm.type,
                                metrics: chartForm.metrics.length > 0 ? chartForm.metrics : ['preview_metric'],
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
            
            <div className="p-8 bg-white border-t border-slate-100 flex gap-4">
                <button onClick={handleSave} className="flex-1 py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">保存图表配置</button>
                <button onClick={() => setEditingChart(null)} className="px-10 py-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
