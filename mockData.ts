
import { Device, DeviceType, DeviceStatus, DataSource, DataView, ChartConfig, Dashboard, DeviceCategory } from './types';

const generateMetrics = (label: string, base: number, variance: number, count: number = 20) => {
  return Array.from({ length: count }).map((_, i) => ({
    timestamp: new Date(Date.now() - (count - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: Math.max(0, Number((base + (Math.random() * variance * 2 - variance)).toFixed(1))),
    label
  }));
};

// Mock Schema for TDengine Super Tables
// ALIGNED keys with Device Metrics for seamless demo
export const MOCK_TDENGINE_SCHEMA: Record<string, { tags: string[], columns: string[] }> = {
  'st_gateway': {
    tags: ['region', 'location', 'device_type', 'fw_version', 'serial_no'],
    columns: ['cpu', 'memory', 'temperature', 'voltage', 'packet_loss'] // Aligned: cpu_usage -> cpu
  },
  'st_env_sensor': {
    tags: ['building', 'floor', 'room_id', 'sensor_model'],
    columns: ['temperature', 'humidity', 'co2_level', 'battery', 'lux']
  },
  'st_smart_meter': {
    tags: ['customer_id', 'meter_type', 'district', 'phase_type'],
    columns: ['current', 'voltage', 'power_active', 'energy_total']
  },
  'st_actuator': {
    tags: ['line_id', 'station_id', 'model'],
    columns: ['pressure', 'flow_rate', 'voltage', 'vibration', 'cpu', 'current']
  },
  'st_server_metrics': {
    tags: ['rack_id', 'os_version'],
    columns: ['rpm', 'current', 'temperature', 'cpu']
  }
};

export const MOCK_CATEGORIES: DeviceCategory[] = [
  { 
      id: 'cat-1', 
      name: 'IoT 智能网关', 
      code: 'GATEWAY', 
      description: '负责边缘计算与协议转换的核心网关设备', 
      deviceCount: 12, 
      sourceId: 'src-td-default',
      tdengineSuperTable: 'st_gateway', 
      defaultDisplayMetric: 'cpu',
      metricDefinitions: ['cpu', 'memory', 'temperature', 'voltage', 'packet_loss', 'ts']
  },
  { 
      id: 'cat-2', 
      name: '环境传感器', 
      code: 'SENSOR', 
      description: '采集温度、湿度、气压等环境数据的感知设备', 
      deviceCount: 45, 
      sourceId: 'src-td-default',
      tdengineSuperTable: 'st_env_sensor', 
      defaultDisplayMetric: 'temperature',
      metricDefinitions: ['temperature', 'humidity', 'co2_level', 'battery', 'ts']
  },
  { 
      id: 'cat-3', 
      name: '工业服务器', 
      code: 'SERVER', 
      description: '用于数据存储与后端处理的计算单元', 
      deviceCount: 3, 
      sourceId: 'src-td-default',
      tdengineSuperTable: 'st_server_metrics', 
      defaultDisplayMetric: 'rpm',
      metricDefinitions: ['rpm', 'current', 'temperature', 'cpu', 'ts']
  },
  { 
      id: 'cat-4', 
      name: '执行控制单元', 
      code: 'ACTUATOR', 
      description: '接收指令并执行机械动作的终端设备', 
      deviceCount: 8, 
      sourceId: 'src-td-default',
      tdengineSuperTable: 'st_actuator',
      defaultDisplayMetric: 'pressure',
      metricDefinitions: ['pressure', 'flow_rate', 'voltage', 'vibration', 'cpu', 'current', 'ts']
  }
];

export const MOCK_DEVICES: Device[] = [
  {
    id: 'DEV-001',
    name: 'Gateway', 
    categoryId: 'cat-1',
    type: DeviceType.GATEWAY,
    status: DeviceStatus.ONLINE,
    location: '机房 A',
    ip: '192.168.1.101',
    lastActive: new Date().toISOString(),
    metrics: {
      cpu: generateMetrics('CPU Load', 45, 15),
      memory: generateMetrics('Memory', 60, 10),
      temperature: generateMetrics('Temp', 38, 5),
    }
  },
  {
    id: 'DEV-002',
    name: 'Sensor', 
    categoryId: 'cat-2',
    type: DeviceType.SENSOR,
    status: DeviceStatus.WARNING,
    location: '仓库 B',
    ip: '192.168.1.105',
    lastActive: new Date().toISOString(),
    metrics: {
      temperature: generateMetrics('Temp', 82, 12),
      humidity: generateMetrics('Humidity', 45, 5),
      cpu: generateMetrics('CPU Load', 12, 2), 
    }
  },
  {
    id: 'DEV-003',
    name: 'Actuator', 
    categoryId: 'cat-4',
    type: DeviceType.ACTUATOR,
    status: DeviceStatus.ONLINE,
    location: '车间 C-02',
    ip: '192.168.1.210',
    lastActive: new Date().toISOString(),
    metrics: {
      pressure: generateMetrics('Pressure', 120, 10),
      flow_rate: generateMetrics('Flow', 8.5, 0.5),
      voltage: generateMetrics('Voltage', 220, 2),
      vibration: generateMetrics('Vibration', 12, 4),
      cpu: generateMetrics('CPU Load', 25, 5),
      current: generateMetrics('Current', 5, 0.5) // Added current for P3 calculation
    }
  },
  {
    id: 'DEV-004',
    name: 'Server', 
    categoryId: 'cat-3',
    type: DeviceType.SERVER,
    status: DeviceStatus.OFFLINE,
    location: '产线 L1',
    ip: '192.168.1.211',
    lastActive: new Date().toISOString(),
    metrics: {
      rpm: generateMetrics('Speed', 1500, 50),
      current: generateMetrics('Current', 4.2, 0.3),
      temperature: generateMetrics('Temp', 65, 3),
      cpu: generateMetrics('CPU Load', 30, 8), 
    }
  },
  { // Extra device for interaction demo
    id: 'DEV-005',
    name: 'online', 
    categoryId: 'cat-1',
    type: DeviceType.GATEWAY,
    status: DeviceStatus.ONLINE,
    location: 'Virtual',
    ip: '0.0.0.0',
    lastActive: '',
    metrics: {
        status_count: generateMetrics('Count', 15, 0)
    }
  },
  { // Extra device for interaction demo
    id: 'DEV-006',
    name: 'warning', 
    categoryId: 'cat-1',
    type: DeviceType.GATEWAY,
    status: DeviceStatus.WARNING,
    location: 'Virtual',
    ip: '0.0.0.0',
    lastActive: '',
    metrics: {
        status_count: generateMetrics('Count', 5, 0)
    }
  }
];

export const BI_SOURCES: DataSource[] = [
  { id: 'src-1', name: 'IoT 实时 API', type: 'API', config: 'https://api.aurasense.io/v1' },
  { 
    id: 'src-td-default', 
    name: '核心生产库 (TDengine)', 
    type: 'TDengine', 
    config: JSON.stringify({
      host: '192.168.237.172',
      port: '6030',
      user: 'root',
      password: 'taosdata',
      db: 'hlzg_db',
      stable: 'st_gateway' 
    })
  }
];

export const BI_VIEWS: DataView[] = [
  { id: 'view-1', sourceId: 'src-1', name: '设备健康度宽表', fields: ['name', 'status', 'temperature', 'cpu', 'humidity', 'rpm', 'pressure', 'voltage'] },
  { id: 'view-as-1', sourceId: 'src-1', name: 'AuraSense1 (趋势分析)', fields: ['timestamp', 'temperature', 'voltage', 'current', 'name'] },
  { id: 'view-as-2', sourceId: 'src-1', name: 'AuraSense2 (负载分布)', fields: ['name', 'cpu', 'memory', 'rpm', 'status'] },
  { id: 'view-as-3', sourceId: 'src-1', name: 'AuraSense3 (环境监测)', fields: ['name', 'humidity', 'pressure', 'flow_rate', 'vibration'] },
  // P3: View with Calculated Fields
  { 
      id: 'view-p3-demo', 
      sourceId: 'src-1', 
      name: 'AuraSense P3 (Calculated Fields)', 
      fields: ['timestamp', 'temperature', 'voltage', 'current', 'cpu'],
      calculatedFields: [
          { name: 'temp_f', expression: 'temperature * 1.8 + 32' },
          { name: 'power_kW', expression: '(voltage * current) / 1000' },
          { name: 'efficiency_index', expression: '100 - cpu' }
      ]
  }
];

// --- Color Palettes ---
const PALETTE_NEON = ['#00ff9f', '#00b8ff', '#001eff', '#bd00ff', '#d600ff'];
const PALETTE_OCEAN = ['#0ea5e9', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'];
const PALETTE_ROSE = ['#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337'];
const PALETTE_AMBER = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#78350f'];

export const BI_CHARTS: ChartConfig[] = [
  // 1. Line Chart
  { 
    id: 'chart-demo-line', 
    viewId: 'view-as-1', 
    name: '核心设备温度趋势 (Line)', 
    type: 'line', 
    metrics: ['temperature'], 
    dimensions: ['timestamp'],
    style: { 
        colSpan: 2, 
        heightClass: 'h-80', 
        colors: PALETTE_OCEAN,
        showGrid: true, 
        showLegend: true,
        xAxisLabel: true,
        yAxisLabel: true
    } 
  },
  // 2. Bar Chart (Interactable)
  { 
    id: 'chart-demo-bar', 
    viewId: 'view-as-2', 
    name: '设备类型钻取 (点击柱子筛选)', 
    type: 'bar', 
    metrics: ['cpu'], 
    dimensions: ['name'],
    style: { 
        colSpan: 1, 
        heightClass: 'h-80',
        colors: PALETTE_NEON,
        showGrid: false, 
        showLegend: false,
        xAxisLabel: true
    }
  },
  // 3. Pie Chart (Status Distribution Interaction)
  {
      id: 'chart-demo-status-pie',
      viewId: 'view-as-2',
      name: '状态分布 (点击图例筛选)', 
      type: 'pie',
      metrics: ['status_count'], 
      dimensions: ['name'],
      style: {
          colSpan: 1,
          heightClass: 'h-80',
          colors: ['#10b981', '#f59e0b', '#ef4444', '#cbd5e1'], 
          showLegend: true,
          legendPosition: 'bottom' 
      }
  },
  // 4. Area Chart
  {
      id: 'chart-demo-area',
      viewId: 'view-as-1',
      name: '电压波动监控 (Area)',
      type: 'area',
      metrics: ['voltage'], 
      dimensions: ['timestamp'],
      style: {
          colSpan: 2,
          heightClass: 'h-80',
          colors: PALETTE_ROSE,
          showGrid: true,
          showLegend: true
      }
  },
  // 5. Table (Drilldown)
  {
      id: 'chart-demo-table',
      viewId: 'view-as-3',
      name: '实时压力遥测表 (点击行查看)',
      type: 'table',
      metrics: ['pressure'],
      dimensions: ['name'],
      style: {
          colSpan: 3,
          heightClass: 'h-64',
          colors: ['#ec4899']
      }
  },
  // --- P3 Demo Charts (Calculated) ---
  {
      id: 'chart-calc-temp-f',
      viewId: 'view-p3-demo',
      name: 'Temp Fahrenheit (Calculated: C*1.8+32)',
      type: 'line',
      metrics: ['temp_f'],
      dimensions: ['timestamp'],
      style: {
          colSpan: 2,
          heightClass: 'h-80',
          colors: ['#ef4444'], // Red for hot F
          showGrid: true,
          yAxisLabel: true
      }
  },
  {
      id: 'chart-calc-power',
      viewId: 'view-p3-demo',
      name: 'Power kW (Calculated: V*A/1000)',
      type: 'area',
      metrics: ['power_kW'],
      dimensions: ['timestamp'],
      style: {
          colSpan: 1,
          heightClass: 'h-80',
          colors: PALETTE_AMBER, 
          showGrid: true
      }
  },
  {
      id: 'chart-calc-efficiency',
      viewId: 'view-p3-demo',
      name: 'Efficiency Index (Calc: 100-CPU)',
      type: 'bar',
      metrics: ['efficiency_index'],
      dimensions: ['name'],
      style: {
          colSpan: 1,
          heightClass: 'h-80',
          colors: ['#10b981'], 
          showLegend: false
      }
  }
];

export const BI_DASHBOARDS: Dashboard[] = [
  { 
      id: 'dash-gallery', 
      name: '交互演示中心 (P1 & P2)', 
      charts: [
          'chart-demo-bar', 
          'chart-demo-status-pie',
          'chart-demo-line', 
          'chart-demo-area', 
          'chart-demo-table'
      ],
      controllers: [
          { id: 'c1', label: 'Device Status', type: 'RADIO_GROUP', key: 'status', options: ['online', 'warning', 'critical'] },
          { id: 'c2', label: 'Device Type', type: 'SELECT', key: 'type', options: ['Gateway', 'Sensor', 'Server', 'Actuator'] },
          { id: 'c3', label: 'Time Range', type: 'TIME_RANGE', key: '_time_range', options: ['1h', '6h', '24h'], defaultValue: '24h' }
      ]
  },
  { 
      id: 'dash-calc-demo', 
      name: 'P3 Demo: Data Calculation', 
      charts: [
          'chart-calc-temp-f',
          'chart-calc-power',
          'chart-calc-efficiency'
      ],
      // ADDED: Controllers for Calculation Demo
      controllers: [
          { id: 'c_time_calc', label: 'Analysis Window', type: 'TIME_RANGE', key: '_time_range', options: ['1h', '6h', '24h'], defaultValue: '1h' }
      ]
  },
  { 
      id: 'dash-1', 
      name: '全球设备监控大屏', 
      charts: ['chart-demo-line', 'chart-demo-bar'],
      // ADDED: Controllers for Global Monitor
      controllers: [
          { id: 'c_global_status', label: 'Filter Status', type: 'RADIO_GROUP', key: 'status', options: ['online', 'offline', 'warning', 'critical'] },
          { id: 'c_global_type', label: 'Device Class', type: 'SELECT', key: 'type', options: ['Gateway', 'Sensor', 'Actuator'] }
      ]
  }
];
