
import { MetricConfig } from './types';

// Centralized configuration for Device Metrics (Initial State)
export const METRIC_METADATA: MetricConfig = {
  // --- Global Defaults ---
  cpu: { label: 'CPU 使用率', unit: '%', color: '#6366f1' }, // Indigo
  memory: { label: '内存使用率', unit: '%', color: '#8b5cf6' }, // Violet
  temperature: { label: '温度', unit: '°C', color: '#f59e0b' }, // Amber
  humidity: { label: '湿度', unit: '%', color: '#10b981' }, // Emerald
  voltage: { label: '电压', unit: 'V', color: '#ef4444' }, // Rose
  current: { label: '电流', unit: 'A', color: '#ec4899' }, // Pink
  
  // --- Specific Overrides (Examples) ---
  // If a Sensor has 'cpu', maybe it means MCU Load?
  'Sensor__cpu': { label: 'MCU 负载', unit: '%', color: '#0ea5e9' }, // Light Blue
  // Different meaning for pressure
  'Actuator__pressure': { label: '液压压力', unit: 'MPa', color: '#dc2626' }, // Red (High pressure)
};

// Pure Helper to resolve metadata with Scope Priority
// 1. Try "DeviceType__Key" (Specific)
// 2. Try "Key" (Global)
// 3. Fallback
export const resolveMetricMetadata = (config: MetricConfig, key: string, deviceType?: string) => {
    if (!key) return { label: 'Unknown', unit: '', color: '#94a3b8' };

    // 1. Check Specific Scope (if type provided)
    if (deviceType) {
        const scopedKey = `${deviceType}__${key}`;
        if (config[scopedKey]) {
            return { ...config[scopedKey], _isScoped: true }; // internal flag
        }
    }

    // 2. Check Global Scope
    if (config[key]) {
        return config[key];
    }

    // 3. Fallback
    return { 
        label: key.charAt(0).toUpperCase() + key.slice(1), 
        unit: '', 
        color: '#94a3b8' // Default Slate
    };
};

// Deprecated: kept for backward compatibility if imported directly without config
export const getMetricMetadata = (key: string) => resolveMetricMetadata(METRIC_METADATA, key);
