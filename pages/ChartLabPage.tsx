
import React, { useState, useEffect } from 'react';
import { ChartConfig, DataView, Device, ChartStyle, AggregationType, FormatConfig, ThresholdRule, ThresholdOperator, ReferenceLine, AnalysisConfig, ContainerConfig } from '../types';
import { RenderChart } from '../components/RenderChart';

interface ChartLabPageProps {
  charts: ChartConfig[];
  dataViews: DataView[];
  devices: Device[];
  onSaveChart: (chart: ChartConfig) => void;
  onDeleteChart: (id: string) => void;
}

// Preset color palettes
const COLOR_PALETTES = [
  { name: 'Default Indigo', colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] },
  { name: 'Ocean Blue', colors: ['#0ea5e9', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'] },
  { name: 'Forest Green', colors: ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'] },
  { name: 'Sunset Orange', colors: ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'] },
  { name: 'Berry Red', colors: ['#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'] },
  { name: 'Neon Cyber', colors: ['#00ff9f', '#00b8ff', '#001eff', '#bd00ff', '#d600ff'] },
];

export const ChartLabPage: React.FC<ChartLabPageProps> = ({ charts, dataViews, devices, onSaveChart, onDeleteChart }) => {
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'data' | 'style'>('data');
  
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
      background: 'transparent'
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
    }
  });

  // State for adding new threshold rule
  const [newThreshold, setNewThreshold] = useState<ThresholdRule>({ id: '', operator: '>', value: 80, color: '#ef4444' });
  // State for adding new reference line
  const [newRefLine, setNewRefLine] = useState<ReferenceLine>({ id: '', name: 'Limit', type: 'constant', value: 100, color: '#ef4444' });

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
          background: editingChart.style?.background || 'transparent'
        },
        format: editingChart.format || { type: 'number', precision: 1, unitSuffix: '' },
        content: editingChart.content || '',
        analysis: editingChart.analysis || { enableMovingAverage: false, movingAverageWindow: 5, trendLineColor: '#cbd5e1' },
        container: editingChart.container || { childChartIds: [], interval: 5 }
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

  const handleAggregationChange = (metric: string, type: AggregationType) => {
      setChartForm(prev => ({
          ...prev,
          aggregations: { ...prev.aggregations, [metric]: type }
      }));
  };

  const handleAddThreshold = () => {
      setChartForm(prev => ({
          ...prev,
          style: {
              ...prev.style,
              thresholds: [...(prev.style.thresholds || []), { ...newThreshold, id: `rule-${Date.now()}` }]
          }
      }));
  };

  const handleRemoveThreshold = (idx: number) => {
      setChartForm(prev => ({
          ...prev,
          style: {
              ...prev.style,
              thresholds: (prev.style.thresholds || []).filter((_, i) => i !== idx)
          }
      }));
  };

  const handleAddRefLine = () => {
      setChartForm(prev => ({
          ...prev,
          style: {
              ...prev.style,
              referenceLines: [...(prev.style.referenceLines || []), { ...newRefLine, id: `ref-${Date.now()}` }]
          }
      }));
  };

  const handleRemoveRefLine = (idx: number) => {
      setChartForm(prev => ({
          ...prev,
          style: {
              ...prev.style,
              referenceLines: (prev.style.referenceLines || []).filter((_, i) => i !== idx)
          }
      }));
  };

  // Toggle child chart for container
  const handleToggleChildChart = (chartId: string) => {
      setChartForm(prev => {
          const currentIds = prev.container.childChartIds || [];
          const newIds = currentIds.includes(chartId) 
              ? currentIds.filter(id => id !== chartId)
              : [...currentIds, chartId];
          return { ...prev, container: { ...prev.container, childChartIds: newIds } };
      });
  };

  const isRichMedia = chartForm.type === 'text' || chartForm.type === 'image';
  const isContainer = chartForm.type === 'container';

  return (
    <div>
        {/* Chart Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {charts.map(c => (
                <div key={c.id} className="h-64 cursor-pointer hover:ring-4 hover:ring-indigo-100 rounded-[32px] transition-all relative group bg-white border border-slate-100 shadow-sm" onClick={() => setEditingChart(c)}>
                   <div className="h-full p-4 pointer-events-none">
                       {/* Render preview non-interactive */}
                       {/* Pass allCharts to allow recursive container rendering in preview */}
                       <RenderChart chart={c} devices={devices} dataView={dataViews.find(v => v.id === c.viewId)} dataViews={dataViews} allCharts={charts} />
                   </div>
                   
                   {/* Delete Button */}
                   <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          if(window.confirm('确定要删除此图表吗？')) {
                              onDeleteChart(c.id);
                          }
                      }}
                      className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm z-20"
                      title="删除图表"
                   >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                </div>
            ))}
            {/* New Add Card */}
            <div
                onClick={handleCreateNewChart}
                className="h-64 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-300 hover:border-indigo-300 hover:text-indigo-400 hover:bg-white/50 transition-all cursor-pointer group"
            >
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-indigo-50 group-hover:border-indigo-100">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">创建新图表</span>
            </div>
        </div>

        {/* --- 图表配置弹窗 --- */}
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
                    <button 
                        onClick={() => setActiveTab('data')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'data' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        数据与内容
                    </button>
                    <button 
                        onClick={() => setActiveTab('style')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'style' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        样式与告警
                    </button>
               </div>

               <button onClick={() => setEditingChart(null)} className="p-3 text-slate-400 hover:text-rose-500 rounded-2xl transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
                {/* Configuration Panel */}
                <div className="w-1/2 overflow-y-auto custom-scrollbar p-8 border-r border-slate-50">
                    
                    {/* --- DATA TAB CONTENT --- */}
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

                            {/* [V2-5] Container Configuration */}
                            {isContainer && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                        <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">容器设置</label>
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 mb-1">轮播间隔 (秒)</label>
                                            <input 
                                                type="number" min="2" max="60"
                                                value={chartForm.container.interval}
                                                onChange={e => setChartForm({ ...chartForm, container: { ...chartForm.container, interval: parseInt(e.target.value) } })}
                                                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">选择子图表 (Multi-Select)</label>
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl bg-slate-50 p-2 space-y-2">
                                            {charts.filter(c => c.id !== editingChart?.id && c.type !== 'container').map(c => {
                                                // Exclude self and other containers to prevent deep nesting issues for now
                                                const isSelected = chartForm.container.childChartIds.includes(c.id);
                                                return (
                                                    <div 
                                                        key={c.id} 
                                                        onClick={() => handleToggleChildChart(c.id)}
                                                        className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                                                    >
                                                        <div>
                                                            <div className="text-xs font-bold">{c.name}</div>
                                                            <div className={`text-[9px] uppercase ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{c.type}</div>
                                                        </div>
                                                        {isSelected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                                    </div>
                                                );
                                            })}
                                            {charts.length === 0 && <div className="text-center text-xs text-slate-400 py-4">无可用图表</div>}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 pl-1">* 仅限选择非容器类型的已保存图表</p>
                                    </div>
                                </div>
                            )}

                            {/* Rich Media Content Editor */}
                            {isRichMedia ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                            {chartForm.type === 'text' ? '文本内容' : '图片 URL'}
                                        </label>
                                        {chartForm.type === 'text' ? (
                                            <textarea 
                                                value={chartForm.content} 
                                                onChange={e => setChartForm({ ...chartForm, content: e.target.value })} 
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-[20px] font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 h-32 resize-none"
                                                placeholder="输入显示文本..."
                                            />
                                        ) : (
                                            <input 
                                                type="text" 
                                                value={chartForm.content} 
                                                onChange={e => setChartForm({ ...chartForm, content: e.target.value })} 
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-[20px] font-mono text-sm text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100"
                                                placeholder="https://example.com/logo.png"
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Standard Chart Data Config (Skip for Container)
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
                                                        const isCalculated = calculatedFields.includes(f);
                                                        const isSelected = chartForm.dimensions.includes(f);
                                                        return (
                                                            <button key={f} onClick={() => {
                                                                const newDims = isSelected ? chartForm.dimensions.filter(d => d !== f) : [...chartForm.dimensions, f];
                                                                setChartForm({...chartForm, dimensions: newDims});
                                                            }} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                                                                {isCalculated && <span className="text-[9px] opacity-70">ƒ(x)</span>}
                                                                {f}
                                                            </button>
                                                        );
                                                    })}
                                                    {allFields.length === 0 && <span className="text-xs text-slate-300 italic">请先选择有效的数据视图</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">指标 (Metrics / Y-Axis)</label>
                                                <div className="space-y-2">
                                                    {allFields.map(f => {
                                                        const isCalculated = calculatedFields.includes(f);
                                                        const isSelected = chartForm.metrics.includes(f);
                                                        
                                                        // Only show available aggregation options if selected
                                                        if (!isSelected) {
                                                            return (
                                                                <button key={f} onClick={() => setChartForm({...chartForm, metrics: [...chartForm.metrics, f]})} className="mr-2 mb-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all inline-flex items-center gap-1.5 bg-white border-slate-200 text-slate-500 hover:bg-slate-50">
                                                                    {isCalculated && <span className="text-[9px] opacity-70">ƒ(x)</span>}
                                                                    {f}
                                                                </button>
                                                            );
                                                        }

                                                        // Selected metric with Aggregation Dropdown
                                                        return (
                                                            <div key={f} className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded-xl mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => setChartForm({...chartForm, metrics: chartForm.metrics.filter(m => m !== f)})} className="text-emerald-300 hover:text-emerald-600">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                    <span className="text-xs font-bold text-emerald-800">{f}</span>
                                                                    {isCalculated && <span className="text-[9px] text-emerald-600 opacity-70">ƒ(x)</span>}
                                                                </div>
                                                                <select 
                                                                    value={chartForm.aggregations[f] || 'AVG'} 
                                                                    onChange={(e) => handleAggregationChange(f, e.target.value as AggregationType)}
                                                                    className="text-[10px] font-black uppercase bg-white border border-emerald-200 text-emerald-600 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
                                                                >
                                                                    <option value="AVG">AVG (平均)</option>
                                                                    <option value="SUM">SUM (总和)</option>
                                                                    <option value="MAX">MAX (最大)</option>
                                                                    <option value="MIN">MIN (最小)</option>
                                                                    <option value="COUNT">COUNT (计数)</option>
                                                                    <option value="LAST">LAST (最新)</option>
                                                                </select>
                                                            </div>
                                                        );
                                                    })}
                                                    {allFields.length === 0 && <span className="text-xs text-slate-300 italic">请先选择有效的数据视图</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })())
                            )}

                            {/* [V2-8] Time-Series Analysis (Line/Area Only) */}
                            {!isRichMedia && !isContainer && (['line', 'area'].includes(chartForm.type)) && (
                                <div className="pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">高级分析 (Advanced Analysis)</label>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-600">启用趋势平滑 (Moving Average)</span>
                                            <button 
                                                onClick={() => setChartForm({ ...chartForm, analysis: { ...chartForm.analysis, enableMovingAverage: !chartForm.analysis.enableMovingAverage } })}
                                                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${chartForm.analysis.enableMovingAverage ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${chartForm.analysis.enableMovingAverage ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                            </button>
                                        </div>
                                        
                                        {chartForm.analysis.enableMovingAverage && (
                                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                                <div>
                                                    <label className="block text-[9px] font-bold text-slate-400 mb-1">窗口大小 (Points)</label>
                                                    <input 
                                                        type="number" min="2" max="50"
                                                        value={chartForm.analysis.movingAverageWindow}
                                                        onChange={e => setChartForm({ ...chartForm, analysis: { ...chartForm.analysis, movingAverageWindow: parseInt(e.target.value) } })}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-slate-400 mb-1">趋势线颜色</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={chartForm.analysis.trendLineColor}
                                                            onChange={e => setChartForm({ ...chartForm, analysis: { ...chartForm.analysis, trendLineColor: e.target.value } })}
                                                            className="h-8 w-8 p-0 border-none rounded cursor-pointer"
                                                        />
                                                        <input 
                                                            type="text" 
                                                            value={chartForm.analysis.trendLineColor}
                                                            onChange={e => setChartForm({ ...chartForm, analysis: { ...chartForm.analysis, trendLineColor: e.target.value } })}
                                                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* [V2-1] Value Formatting Config (Only for data charts) */}
                            {!isRichMedia && !isContainer && (
                                <div className="pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">数值格式化 (Value Format)</label>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[9px] font-bold text-slate-400 mb-1">格式类型</label>
                                                <select 
                                                    value={chartForm.format.type}
                                                    onChange={e => setChartForm({ ...chartForm, format: { ...chartForm.format, type: e.target.value as any } })}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                                >
                                                    <option value="number">数字 (Number)</option>
                                                    <option value="percent">百分比 (Percentage)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-bold text-slate-400 mb-1">小数位数</label>
                                                <input 
                                                    type="number" min="0" max="5" 
                                                    value={chartForm.format.precision}
                                                    onChange={e => setChartForm({ ...chartForm, format: { ...chartForm.format, precision: parseInt(e.target.value) } })}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 mb-1">单位后缀 (Suffix)</label>
                                            <input 
                                                type="text"
                                                value={chartForm.format.unitSuffix || ''}
                                                onChange={e => setChartForm({ ...chartForm, format: { ...chartForm.format, unitSuffix: e.target.value } })}
                                                placeholder="e.g. °C, kW, rpm"
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- STYLE TAB CONTENT --- */}
                    {activeTab === 'style' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                             {/* 1. Color Palette (Data Charts Only) */}
                             {!isRichMedia && !isContainer && (
                                 <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">色彩主题 (Color Palette)</label>
                                     <div className="grid grid-cols-2 gap-3">
                                         {COLOR_PALETTES.map((palette) => (
                                             <button 
                                                key={palette.name}
                                                onClick={() => setChartForm({ ...chartForm, style: { ...chartForm.style, colors: palette.colors } })}
                                                className={`p-3 rounded-2xl border transition-all text-left group ${JSON.stringify(chartForm.style.colors) === JSON.stringify(palette.colors) ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-100 hover:border-indigo-200 bg-white'}`}
                                             >
                                                 <div className="text-[10px] font-bold text-slate-600 mb-2">{palette.name}</div>
                                                 <div className="flex gap-1">
                                                     {palette.colors.map(c => (
                                                         <div key={c} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }}></div>
                                                     ))}
                                                 </div>
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             )}

                             {/* [V2-6] Rich Media & Container Styles */}
                             {(isRichMedia || isContainer) && (
                                 <div className="space-y-4">
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">外观设置</label>
                                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                         <div>
                                             <label className="block text-[9px] font-bold text-slate-400 mb-1">背景颜色</label>
                                             <div className="flex gap-2">
                                                 <input type="color" value={chartForm.style.background === 'transparent' ? '#ffffff' : chartForm.style.background} onChange={e => setChartForm({...chartForm, style: {...chartForm.style, background: e.target.value}})} className="h-8 w-10 p-0 border-none rounded cursor-pointer" />
                                                 <button onClick={() => setChartForm({...chartForm, style: {...chartForm.style, background: 'transparent'}})} className="text-xs bg-white border px-2 rounded">Transparent</button>
                                             </div>
                                         </div>
                                         {chartForm.type === 'text' && (
                                             <>
                                                 <div className="grid grid-cols-2 gap-4">
                                                     <div>
                                                         <label className="block text-[9px] font-bold text-slate-400 mb-1">字体大小</label>
                                                         <input type="number" value={chartForm.style.fontSize} onChange={e => setChartForm({...chartForm, style: {...chartForm.style, fontSize: parseInt(e.target.value)}})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                                                     </div>
                                                     <div>
                                                         <label className="block text-[9px] font-bold text-slate-400 mb-1">对齐方式</label>
                                                         <select value={chartForm.style.textAlign} onChange={e => setChartForm({...chartForm, style: {...chartForm.style, textAlign: e.target.value as any}})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none">
                                                             <option value="left">Left</option>
                                                             <option value="center">Center</option>
                                                             <option value="right">Right</option>
                                                         </select>
                                                     </div>
                                                 </div>
                                             </>
                                         )}
                                     </div>
                                 </div>
                             )}

                             {/* [V2-2] Thresholds Config (Data Only) */}
                             {!isRichMedia && !isContainer && (
                                 <div className="space-y-4 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">阈值告警规则 (Thresholds)</label>
                                     
                                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                                         <div className="flex gap-2 items-center">
                                             <select 
                                                value={newThreshold.operator}
                                                onChange={e => setNewThreshold({ ...newThreshold, operator: e.target.value as ThresholdOperator })}
                                                className="px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold w-16"
                                             >
                                                 <option value=">">&gt;</option>
                                                 <option value=">=">&ge;</option>
                                                 <option value="<">&lt;</option>
                                                 <option value="<=">&le;</option>
                                                 <option value="==">=</option>
                                             </select>
                                             <input 
                                                type="number" 
                                                value={newThreshold.value}
                                                onChange={e => setNewThreshold({ ...newThreshold, value: parseFloat(e.target.value) })}
                                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-20 outline-none"
                                             />
                                             <input 
                                                type="color" 
                                                value={newThreshold.color}
                                                onChange={e => setNewThreshold({ ...newThreshold, color: e.target.value })}
                                                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                                             />
                                             <button 
                                                onClick={handleAddThreshold}
                                                className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
                                             >
                                                 Add Rule
                                             </button>
                                         </div>

                                         <div className="space-y-2 mt-2">
                                             {chartForm.style.thresholds?.map((rule, idx) => (
                                                 <div key={rule.id || idx} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg">
                                                     <div className="flex items-center gap-2 text-xs font-mono">
                                                         <span className="font-bold text-slate-500">Value</span>
                                                         <span className="px-1.5 py-0.5 bg-slate-100 rounded text-indigo-600 font-black">{rule.operator}</span>
                                                         <span className="font-bold">{rule.value}</span>
                                                         <div className="w-4 h-4 rounded-full border border-slate-100" style={{ backgroundColor: rule.color }}></div>
                                                     </div>
                                                     <button onClick={() => handleRemoveThreshold(idx)} className="text-slate-400 hover:text-rose-500">
                                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                                     </button>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {/* [V2-3] Reference Lines Config (Line/Bar Only) */}
                             {['line', 'bar', 'area'].includes(chartForm.type) && (
                                <div className="space-y-4 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">参考线 (Reference Lines)</label>
                                    
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                                        <div className="flex gap-2 items-center">
                                            <input 
                                                type="text" 
                                                placeholder="Name (e.g. Limit)"
                                                value={newRefLine.name}
                                                onChange={e => setNewRefLine({ ...newRefLine, name: e.target.value })}
                                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-24 outline-none"
                                            />
                                            <select 
                                                value={newRefLine.type}
                                                onChange={e => setNewRefLine({ ...newRefLine, type: e.target.value as any })}
                                                className="px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-20"
                                            >
                                                <option value="constant">Fixed</option>
                                                <option value="average">Avg</option>
                                                <option value="max">Max</option>
                                                <option value="min">Min</option>
                                            </select>
                                            {newRefLine.type === 'constant' && (
                                                <input 
                                                    type="number" 
                                                    value={newRefLine.value}
                                                    onChange={e => setNewRefLine({ ...newRefLine, value: parseFloat(e.target.value) })}
                                                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-16 outline-none"
                                                />
                                            )}
                                            <input 
                                                type="color" 
                                                value={newRefLine.color}
                                                onChange={e => setNewRefLine({ ...newRefLine, color: e.target.value })}
                                                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                                            />
                                            <button 
                                                onClick={handleAddRefLine}
                                                className="p-2 bg-indigo-600 text-white rounded-lg"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                                            </button>
                                        </div>

                                        <div className="space-y-2 mt-2">
                                            {chartForm.style.referenceLines?.map((line, idx) => (
                                                <div key={line.id || idx} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-bold text-slate-600">{line.name}</span>
                                                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono text-[9px] uppercase">{line.type}</span>
                                                        {line.type === 'constant' && <span className="font-mono">{line.value}</span>}
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }}></div>
                                                    </div>
                                                    <button onClick={() => handleRemoveRefLine(idx)} className="text-slate-400 hover:text-rose-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             )}

                             {/* 2. Visual Toggles */}
                             {!isRichMedia && !isContainer && (
                                 <div className="space-y-4 pt-4 border-t border-slate-50">
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">显示组件</label>
                                     
                                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                         <span className="text-xs font-bold text-slate-600">显示网格线 (Grid)</span>
                                         <button 
                                            onClick={() => setChartForm({ ...chartForm, style: { ...chartForm.style, showGrid: !chartForm.style.showGrid } })}
                                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${chartForm.style.showGrid ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                         >
                                             <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${chartForm.style.showGrid ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                         </button>
                                     </div>

                                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                         <span className="text-xs font-bold text-slate-600">显示图例 (Legend)</span>
                                         <button 
                                            onClick={() => setChartForm({ ...chartForm, style: { ...chartForm.style, showLegend: !chartForm.style.showLegend } })}
                                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${chartForm.style.showLegend ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                         >
                                             <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${chartForm.style.showLegend ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                         </button>
                                     </div>

                                     {/* Legend Position - dependent on showLegend */}
                                     {chartForm.style.showLegend && (
                                        <div className="ml-4 pl-4 border-l-2 border-slate-100 animate-in fade-in slide-in-from-top-1">
                                            <label className="block text-[9px] font-bold text-slate-400 mb-2">图例位置</label>
                                            <div className="flex gap-2">
                                                {['top', 'bottom'].map((pos) => (
                                                    <button 
                                                        key={pos}
                                                        onClick={() => setChartForm({ ...chartForm, style: { ...chartForm.style, legendPosition: pos as 'top' | 'bottom' } })}
                                                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center gap-1 ${chartForm.style.legendPosition === pos ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                                    >
                                                        {pos === 'top' ? (
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10h14M5 14h14M5 6h14" /></svg>
                                                        ) : (
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10h14M5 6h14M5 18h14" /></svg>
                                                        )}
                                                        {pos}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                     )}
                                 </div>
                             )}

                             {/* 3. Axis Config */}
                             {!isRichMedia && !isContainer && (
                                 <div className="space-y-4 pt-4 border-t border-slate-50">
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">坐标轴 (Axes)</label>
                                     
                                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                         <span className="text-xs font-bold text-slate-600">显示 X 轴标签</span>
                                         <button 
                                            onClick={() => setChartForm({ ...chartForm, style: { ...chartForm.style, xAxisLabel: !chartForm.style.xAxisLabel } })}
                                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${chartForm.style.xAxisLabel ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                         >
                                             <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${chartForm.style.xAxisLabel ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                         </button>
                                     </div>
                                     
                                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                         <span className="text-xs font-bold text-slate-600">显示 Y 轴标签</span>
                                         <button 
                                            onClick={() => setChartForm({ ...chartForm, style: { ...chartForm.style, yAxisLabel: !chartForm.style.yAxisLabel } })}
                                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${chartForm.style.yAxisLabel ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                         >
                                             <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${chartForm.style.yAxisLabel ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                         </button>
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
                        {/* Mock Chart Config for Preview */}
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
                                content: chartForm.content, // V2-6
                                analysis: chartForm.analysis, // V2-8
                                container: chartForm.container // V2-5
                            }} 
                            devices={devices} 
                            dataView={dataViews.find(v => v.id === chartForm.viewId)} 
                            dataViews={dataViews} // FIX: Pass dataViews for container preview
                            allCharts={charts} // Pass all charts for container preview recursion
                        />
                        
                        {!isRichMedia && !isContainer && chartForm.metrics.length === 0 && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-20">
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-400">请选择至少一个指标</p>
                                    <p className="text-[10px] text-slate-300">Select at least one metric to preview</p>
                                </div>
                            </div>
                        )}
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
