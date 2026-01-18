
import { MetricConfig, DataView } from './types';

// Centralized configuration for Device Metrics (Initial State)
export const METRIC_METADATA: MetricConfig = {
  // --- Global Defaults ---
  cpu: { label: 'CPU 使用率', unit: '%', color: '#6366f1' }, // Indigo
  memory: { label: '内存使用率', unit: '%', color: '#8b5cf6' }, // Violet
  temperature: { label: '温度', unit: '°C', color: '#f59e0b' }, // Amber
  humidity: { label: '湿度', unit: '%', color: '#10b981' }, // Emerald
  voltage: { label: '电压', unit: 'V', color: '#ef4444' }, // Rose
  current: { label: '电流', unit: 'A', color: '#ec4899' }, // Pink
  pressure: { label: '压力', unit: 'MPa', color: '#dc2626' }, 
  rpm: { label: '转速', unit: 'r/min', color: '#0ea5e9' },

  // --- Welder Metrics ---
  preset_current: { label: '预置电流', unit: 'A', color: '#60a5fa' },
  preset_voltage: { label: '预置电压', unit: 'V', color: '#818cf8' },
  weld_current: { label: '实际焊接电流', unit: 'A', color: '#2563eb' },
  weld_voltage: { label: '实际焊接电压', unit: 'V', color: '#4f46e5' },

  // --- Cutter Metrics ---
  cutting_speed: { label: '切割速度', unit: 'mm/min', color: '#10b981' },
  arc_voltage: { label: '切割弧压', unit: 'V', color: '#f59e0b' },
  gas_pressure: { label: '气路压力', unit: 'MPa', color: '#06b6d4' },
  nozzle_temperature: { label: '喷嘴温度', unit: '°C', color: '#ef4444' },
  
  // --- Specific Overrides (Examples) ---
  // If a Sensor has 'cpu', maybe it means MCU Load?
  'Sensor__cpu': { label: 'MCU 负载', unit: '%', color: '#0ea5e9' }, // Light Blue
  // Different meaning for pressure
  'Actuator__pressure': { label: '液压压力', unit: 'MPa', color: '#dc2626' }, // Red (High pressure)
};

// Pure Helper to resolve metadata with Scope Priority
// 1. Try DataView Model (User Configured for specific view)
// 2. Try "DeviceType__Key" (Specific Global)
// 3. Try "Key" (Global)
// 4. Fallback
export const resolveMetricMetadata = (config: MetricConfig, key: string, deviceType?: string, dataView?: DataView) => {
    if (!key) return { label: 'Unknown', unit: '', color: '#94a3b8' };

    // 1. Check DataView Semantic Model
    if (dataView?.model && dataView.model[key]) {
        const field = dataView.model[key];
        // Merge with global defaults for color if missing
        const globalDef = config[key];
        return { 
            label: field.alias || globalDef?.label || key, 
            unit: field.unit || globalDef?.unit || '', 
            color: globalDef?.color || '#94a3b8',
            _source: 'view' 
        };
    }

    // 2. Check Specific Scope (if type provided)
    if (deviceType) {
        const scopedKey = `${deviceType}__${key}`;
        if (config[scopedKey]) {
            return { ...config[scopedKey], _isScoped: true }; 
        }
    }

    // 3. Check Global Scope
    if (config[key]) {
        return config[key];
    }

    // 4. Fallback
    return { 
        label: key.charAt(0).toUpperCase() + key.slice(1), 
        unit: '', 
        color: '#94a3b8' // Default Slate
    };
};

// Deprecated: kept for backward compatibility if imported directly without config
export const getMetricMetadata = (key: string) => resolveMetricMetadata(METRIC_METADATA, key);
    