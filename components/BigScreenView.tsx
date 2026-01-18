
import React, { useState, useEffect } from 'react';
import { Dashboard, ChartConfig, Device, DataView } from '../types';
import { RenderChart } from './RenderChart';

interface BigScreenViewProps {
  dashboards: Dashboard[]; // Changed to accept an array for carousel support
  charts: ChartConfig[];
  devices: Device[];
  dataViews: DataView[];
  onExit: () => void;
  cycleInterval?: number; // Optional interval in ms, default 15000
}

export const BigScreenView: React.FC<BigScreenViewProps> = ({ dashboards, charts, devices, dataViews, onExit, cycleInterval = 15000 }) => {
  const [time, setTime] = useState(new Date());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen trigger
  useEffect(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.log("Fullscreen request denied", err));
    }
    return () => {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);

  // Carousel Logic
  useEffect(() => {
      if (dashboards.length <= 1 || isPaused) return;

      const cycleTimer = setInterval(() => {
          setCurrentIndex(prev => (prev + 1) % dashboards.length);
      }, cycleInterval);

      return () => clearInterval(cycleTimer);
  }, [dashboards.length, isPaused, cycleInterval]);

  const currentDashboard = dashboards[currentIndex];

  if (!currentDashboard) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] text-white overflow-hidden flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Header */}
        <header className="relative z-10 flex justify-between items-center px-8 py-5 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase">{currentDashboard.name}</h1>
                        {dashboards.length > 1 && (
                            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-cyan-400">
                                {currentIndex + 1} / {dashboards.length}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                        Live Monitoring System
                        {dashboards.length > 1 && !isPaused && (
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        )}
                        {isPaused && <span className="text-rose-500 font-black">PAUSED</span>}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-8">
                {/* Carousel Controls (Only if multiple) */}
                {dashboards.length > 1 && (
                    <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                        <button onClick={() => setCurrentIndex(prev => (prev - 1 + dashboards.length) % dashboards.length)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                        <button onClick={() => setIsPaused(!isPaused)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                            {isPaused ? 
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> : 
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            }
                        </button>
                        <button onClick={() => setCurrentIndex(prev => (prev + 1) % dashboards.length)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                    </div>
                )}

                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-white leading-none">{time.toLocaleTimeString([], { hour12: false })}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{time.toLocaleDateString()}</div>
                </div>
                <button 
                    onClick={onExit}
                    className="p-3 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all group"
                    title="退出大屏模式 (ESC)"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        </header>

        {/* Grid Content - Key change triggers re-render animation */}
        <main 
            className="flex-1 p-6 overflow-y-auto custom-scrollbar relative z-10" 
            onMouseEnter={() => setIsPaused(true)} 
            onMouseLeave={() => setIsPaused(false)}
        >
            <div key={currentDashboard.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 h-full auto-rows-min pb-20 animate-in fade-in slide-in-from-right-4 duration-700">
                {currentDashboard.charts.map((chartId) => {
                    const chart = charts.find(c => c.id === chartId);
                    if (!chart) return null;
                    
                    const chartView = dataViews.find(v => v.id === chart.viewId);
                    
                    // Adapt Grid Logic for Big Screen
                    const colSpan = chart.style?.colSpan || 1;
                    const colSpanClass = colSpan === 3 ? 'lg:col-span-3 xl:col-span-3' : colSpan === 2 ? 'lg:col-span-2 xl:col-span-2' : 'lg:col-span-1 xl:col-span-1';
                    const heightClass = chart.style?.heightClass ? chart.style.heightClass : 'h-80';

                    return (
                        <div key={chart.id} className={`${colSpanClass} ${heightClass}`}>
                             <RenderChart 
                                chart={chart} 
                                devices={devices} 
                                dataView={chartView} 
                                dataViews={dataViews}
                                theme="dark" 
                                allCharts={charts}
                             />
                        </div>
                    );
                })}
            </div>
        </main>

        {/* Footer Ticker */}
        <div className="absolute bottom-0 left-0 w-full h-8 bg-slate-900 border-t border-slate-800 flex items-center overflow-hidden z-20">
             <div className="flex items-center gap-8 animate-marquee whitespace-nowrap pl-4">
                 <span className="text-[10px] font-mono text-cyan-500">SYSTEM STATUS: NORMAL</span>
                 <span className="text-[10px] font-mono text-slate-500">|</span>
                 <span className="text-[10px] font-mono text-slate-400">ACTIVE DASHBOARD: <span className="text-white">{currentDashboard.name}</span></span>
                 <span className="text-[10px] font-mono text-slate-500">|</span>
                 <span className="text-[10px] font-mono text-slate-400">GATEWAY_01: <span className="text-emerald-500">ONLINE</span></span>
                 <span className="text-[10px] font-mono text-slate-500">|</span>
                 <span className="text-[10px] font-mono text-slate-400">LAST SYNC: {time.toLocaleTimeString()}</span>
             </div>
        </div>
    </div>
  );
};
