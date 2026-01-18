
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface BaseEChartProps {
  options: echarts.EChartsOption;
  theme?: 'light' | 'dark';
  style?: React.CSSProperties;
  onEvents?: Record<string, (params: any) => void>;
}

export const BaseEChart: React.FC<BaseEChartProps> = ({ options, theme = 'light', style, onEvents }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Initialize Chart
  useEffect(() => {
    if (chartRef.current) {
      // Dispose existing instance if theme changes to ensure clean re-init
      if (chartInstance.current) {
          chartInstance.current.dispose();
      }
      
      chartInstance.current = echarts.init(chartRef.current, theme === 'dark' ? 'dark' : undefined, {
          renderer: 'svg' // Use SVG for sharper rendering on high-DPI screens
      });

      // Bind events
      if (onEvents) {
          Object.entries(onEvents).forEach(([eventName, handler]) => {
              chartInstance.current?.on(eventName, handler);
          });
      }
    }

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [theme]); // Re-init on theme change

  // Update Options
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption(options, true); // true = notMerge (replace config)
    }
  }, [options]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    
    // Use ResizeObserver for container resize detection
    const resizeObserver = new ResizeObserver(() => {
        chartInstance.current?.resize();
    });
    
    if (chartRef.current) {
        resizeObserver.observe(chartRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height: '100%', ...style }} />;
};
