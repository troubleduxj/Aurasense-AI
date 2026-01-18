
// ... imports ...
import { Device, DeviceType, DeviceStatus, DataSource, DataView, ChartConfig, Dashboard, DeviceCategory, MenuItem, CustomPage, ShareToken } from './types';

// ... (keep generateMetrics, MOCK_TDENGINE_SCHEMA, MOCK_CATEGORIES, MOCK_DEVICES, BI_SOURCES) ...
const generateMetrics = (label: string, base: number, variance: number, count: number = 20) => {
  return Array.from({ length: count }).map((_, i) => ({
    timestamp: new Date(Date.now() - (count - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: Math.max(0, Number((base + (Math.random() * variance * 2 - variance)).toFixed(1))),
    label
  }));
};

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
  },
  // Added Schema for Welders
  'welding': {
    tags: ['device_name', 'device_model', 'device_code'],
    columns: ['preset_current', 'preset_voltage', 'weld_current', 'weld_voltage', 'status']
  },
  // Added Schema for Cutters
  'Cutter': {
    tags: ['device_name', 'device_model', 'device_code'],
    columns: ['cutting_speed', 'arc_voltage', 'gas_pressure', 'nozzle_temperature', 'status']
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
  },
  // New Category: Welder
  {
      id: 'cat-weld',
      name: '焊机',
      code: 'weld',
      description: '工业自动焊机设备，监控焊接电流电压及状态',
      deviceCount: 2,
      sourceId: 'src-td-default',
      tdengineSuperTable: 'welding',
      defaultDisplayMetric: 'weld_current',
      metricDefinitions: ['preset_current', 'preset_voltage', 'weld_current', 'weld_voltage', 'status', 'ts']
  },
  // New Category: Cutter
  {
      id: 'cat-cutter',
      name: '气割机',
      code: 'cutter',
      description: '数控火焰/等离子切割设备',
      deviceCount: 2,
      sourceId: 'src-td-default',
      tdengineSuperTable: 'Cutter',
      defaultDisplayMetric: 'cutting_speed',
      metricDefinitions: ['cutting_speed', 'arc_voltage', 'gas_pressure', 'nozzle_temperature', 'status', 'ts']
  }
];

export const MOCK_DEVICES: Device[] = [
  {
    id: 'DEV-001',
    name: 'Gateway-A1', 
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
    name: 'Sensor-W1', 
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
    name: 'Actuator-Pump', 
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
    name: 'Server-Core', 
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
    name: 'Gateway-Virt', 
    categoryId: 'cat-1',
    type: DeviceType.GATEWAY,
    status: DeviceStatus.ONLINE,
    location: 'Virtual',
    ip: '10.0.0.5',
    lastActive: '',
    metrics: {
        status_count: generateMetrics('Count', 15, 0)
    }
  },
  { // Extra device for interaction demo
    id: 'DEV-006',
    name: 'Gateway-Edge', 
    categoryId: 'cat-1',
    type: DeviceType.GATEWAY,
    status: DeviceStatus.WARNING,
    location: 'Virtual',
    ip: '10.0.0.6',
    lastActive: '',
    metrics: {
        status_count: generateMetrics('Count', 5, 0)
    }
  },
  { // Extra devices for Table Pagination Demo
    id: 'DEV-007', name: 'Sensor-X1', categoryId: 'cat-2', type: DeviceType.SENSOR, status: DeviceStatus.ONLINE, location: 'Zone A', ip: '192.168.2.1', lastActive: '', metrics: { temperature: generateMetrics('Temp', 22, 1) }
  },
  {
    id: 'DEV-008', name: 'Sensor-X2', categoryId: 'cat-2', type: DeviceType.SENSOR, status: DeviceStatus.ONLINE, location: 'Zone A', ip: '192.168.2.2', lastActive: '', metrics: { temperature: generateMetrics('Temp', 23, 1) }
  },
  {
    id: 'DEV-009', name: 'Sensor-X3', categoryId: 'cat-2', type: DeviceType.SENSOR, status: DeviceStatus.CRITICAL, location: 'Zone B', ip: '192.168.2.3', lastActive: '', metrics: { temperature: generateMetrics('Temp', 95, 5) }
  },
  // --- New Simulated Welders ---
  {
    id: 'WELD-001',
    name: 'Auto-Welder-Alpha',
    categoryId: 'cat-weld',
    type: DeviceType.WELDER,
    status: DeviceStatus.ONLINE,
    location: 'Workstation 3',
    ip: '192.168.3.10',
    lastActive: new Date().toISOString(),
    metrics: {
        preset_current: generateMetrics('Preset I', 180, 0),
        preset_voltage: generateMetrics('Preset V', 24, 0),
        weld_current: generateMetrics('Actual I', 178, 5),
        weld_voltage: generateMetrics('Actual V', 23.5, 1.5),
        // Simulate discrete status: 0 or 1
        status: Array.from({length: 20}).map((_, i) => ({
            timestamp: new Date(Date.now() - (20 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: i % 5 === 0 ? 0 : 1, // Fluctuate between 0 and 1
            label: 'Status'
        }))
    }
  },
  {
    id: 'WELD-002',
    name: 'Manual-Welder-Beta',
    categoryId: 'cat-weld',
    type: DeviceType.WELDER,
    status: DeviceStatus.ONLINE,
    location: 'Workstation 4',
    ip: '192.168.3.11',
    lastActive: new Date().toISOString(),
    metrics: {
        preset_current: generateMetrics('Preset I', 200, 0),
        preset_voltage: generateMetrics('Preset V', 26, 0),
        weld_current: generateMetrics('Actual I', 195, 10),
        weld_voltage: generateMetrics('Actual V', 25.5, 2),
        status: generateMetrics('Status', 1, 0)
    }
  },
  // --- New Simulated Cutters ---
  {
    id: 'CUTTER-001',
    name: 'Plasma-Cutter-X',
    categoryId: 'cat-cutter',
    type: DeviceType.CUTTER,
    status: DeviceStatus.ONLINE,
    location: 'Fab Lab 1',
    ip: '192.168.4.20',
    lastActive: new Date().toISOString(),
    metrics: {
        cutting_speed: generateMetrics('Speed', 1200, 100),
        arc_voltage: generateMetrics('Arc V', 130, 5),
        gas_pressure: generateMetrics('Gas P', 0.6, 0.05),
        nozzle_temperature: generateMetrics('Nozzle T', 150, 20),
        status: Array.from({length: 20}).map((_, i) => ({
            timestamp: new Date(Date.now() - (20 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: i > 15 ? 0 : 1, // Recently stopped
            label: 'Status'
        }))
    }
  },
  {
    id: 'CUTTER-002',
    name: 'Flame-Cutter-Y',
    categoryId: 'cat-cutter',
    type: DeviceType.CUTTER,
    status: DeviceStatus.WARNING,
    location: 'Fab Lab 2',
    ip: '192.168.4.21',
    lastActive: new Date().toISOString(),
    metrics: {
        cutting_speed: generateMetrics('Speed', 800, 50),
        arc_voltage: generateMetrics('Arc V', 0, 0), // Not applicable for flame maybe, but kept for schema consistency
        gas_pressure: generateMetrics('Gas P', 0.8, 0.1),
        nozzle_temperature: generateMetrics('Nozzle T', 350, 40),
        status: generateMetrics('Status', 0, 0) // 0 = Idle/Error
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

// ... (BI_VIEWS is unchanged) ...
export const BI_VIEWS: DataView[] = [
  { id: 'view-1', sourceId: 'src-1', name: '设备健康度宽表', fields: ['name', 'status', 'temperature', 'cpu', 'humidity', 'rpm', 'pressure', 'voltage'] },
  { 
      id: 'view-as-1', 
      sourceId: 'src-1', 
      name: 'AuraSense1 (趋势分析)', 
      fields: ['timestamp', 'temperature', 'voltage', 'current', 'name'],
      // [V3.1] Semantic Model Demonstration
      model: {
          'temperature': { name: 'temperature', alias: '核心温度', unit: '°C', type: 'NUMBER', description: '设备主芯片表面温度' },
          'voltage': { name: 'voltage', alias: '输入电压', unit: 'V', type: 'NUMBER' },
          'current': { name: 'current', alias: '工作电流', unit: 'A', type: 'NUMBER' },
          'timestamp': { name: 'timestamp', alias: '采集时间', type: 'DATE' },
          'name': { name: 'name', alias: '设备名称', type: 'STRING' }
      }
  },
  { id: 'view-as-2', sourceId: 'src-1', name: 'AuraSense2 (负载分布)', fields: ['name', 'cpu', 'memory', 'rpm', 'status'] },
  { id: 'view-as-3', sourceId: 'src-1', name: 'AuraSense3 (环境监测)', fields: ['name', 'humidity', 'pressure', 'flow_rate', 'vibration'] },
  { id: 'view-weld-1', sourceId: 'src-1', name: '焊机运行数据', fields: ['timestamp', 'weld_current', 'weld_voltage', 'status', 'name'] }, // View for Welder
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
      ],
      model: {
          'temp_f': { name: 'temp_f', alias: '温度 (华氏)', unit: '°F', type: 'NUMBER' },
          'power_kW': { name: 'power_kW', alias: '实时功率', unit: 'kW', type: 'NUMBER' },
          'efficiency_index': { name: 'efficiency_index', alias: '能效指数', unit: '', type: 'NUMBER' }
      }
  }
];

const PALETTE_NEON = ['#00ff9f', '#00b8ff', '#001eff', '#bd00ff', '#d600ff'];
const PALETTE_OCEAN = ['#0ea5e9', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'];
const PALETTE_ROSE = ['#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337'];
const PALETTE_AMBER = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#78350f'];

export const BI_CHARTS: ChartConfig[] = [
  // ... existing charts ...
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
  {
      id: 'chart-demo-table',
      viewId: 'view-as-3',
      name: '实时业务台账 (支持排序/分页)',
      type: 'table',
      metrics: ['pressure', 'temperature', 'cpu'],
      dimensions: ['name', 'ip', 'status', 'location'],
      style: {
          colSpan: 3,
          heightClass: 'h-[500px]', 
          colors: ['#ec4899'],
          enablePagination: true,
          pageSize: 6,
          showRowNumber: true
      }
  },
  // --- New Step Chart for Welder Status ---
  {
      id: 'chart-weld-status',
      viewId: 'view-weld-1',
      name: '焊机运行状态时序 (阶梯图)',
      type: 'area', // Area chart with step property
      metrics: ['status'], 
      dimensions: ['timestamp'],
      style: {
          colSpan: 2,
          heightClass: 'h-80',
          colors: ['#10b981'], // Green for running
          showGrid: true,
          showLegend: true,
          xAxisLabel: true,
          yAxisLabel: false // Hide Y axis numbers as it's just 0/1
      }
  },
  // --- P3 Demo Charts (Calculated) ...
  {
      id: 'chart-calc-temp-f',
      viewId: 'view-p3-demo',
      name: 'Temp Fahrenheit (Calculated)',
      type: 'line',
      metrics: ['temp_f'],
      dimensions: ['timestamp'],
      style: {
          colSpan: 2,
          heightClass: 'h-80',
          colors: ['#ef4444'], 
          showGrid: true,
          yAxisLabel: true
      }
  },
  {
      id: 'chart-calc-power',
      viewId: 'view-p3-demo',
      name: 'Power kW (Calculated)',
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
      name: 'Efficiency Index (Calc)',
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
          'chart-weld-status' // Add the status chart here
      ],
      controllers: [
          { id: 'c1', label: 'Device Status', type: 'RADIO_GROUP', key: 'status', options: ['online', 'warning', 'critical'] },
          { id: 'c2', label: 'Device Type', type: 'SELECT', key: 'type', options: ['Gateway', 'Sensor', 'Server', 'Actuator', 'Welder'] },
          { id: 'c3', label: 'Time Range', type: 'TIME_RANGE', key: '_time_range', options: ['1h', '6h', '24h'], defaultValue: '24h' }
      ]
  },
  // ... (keep other dashboards: dash-query-table, dash-calc-demo, dash-1) ...
  {
      id: 'dash-query-table',
      name: '业务台账查询 (超级表格)',
      charts: ['chart-demo-table'], 
      controllers: [
          { id: 'cq1', label: '设备名称/ID', type: 'TEXT_INPUT', key: 'name', placeholder: '模糊搜索...' },
          { id: 'cq2', label: '物理位置', type: 'TEXT_INPUT', key: 'location', placeholder: '搜索位置...' },
          { id: 'cq3', label: '运行状态', type: 'RADIO_GROUP', key: 'status', options: ['online', 'warning', 'critical'] },
          { id: 'cq4', label: '设备类型', type: 'SELECT', key: 'type', options: ['Gateway', 'Sensor', 'Actuator', 'Server'] }
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
      controllers: [
          { id: 'c_time_calc', label: 'Analysis Window', type: 'TIME_RANGE', key: '_time_range', options: ['1h', '6h', '24h'], defaultValue: '1h' }
      ]
  },
  { 
      id: 'dash-1', 
      name: '全球设备监控大屏', 
      charts: ['chart-demo-line', 'chart-demo-bar'],
      controllers: [
          { id: 'c_global_status', label: 'Filter Status', type: 'RADIO_GROUP', key: 'status', options: ['online', 'offline', 'warning', 'critical'] },
          { id: 'c_global_type', label: 'Device Class', type: 'SELECT', key: 'type', options: ['Gateway', 'Sensor', 'Actuator'] }
      ]
  }
];

export const MOCK_CUSTOM_PAGES: CustomPage[] = [
    {
        id: 'page-help',
        name: '系统操作指南',
        type: 'MARKDOWN',
        content: '# 系统操作指南\n\n欢迎使用 AuraSense AI 工业物联网平台。\n\n## 快速开始\n\n1. **设备接入**: 前往“数据管理 > 数据源配置”添加连接。\n2. **定义模型**: 在“资产管理”中定义设备类型和指标。\n3. **可视化**: 使用“图表实验室”创建可视化组件。\n\n## 常见问题\n\n- **数据延迟**: 检查网关连接状态。\n- **告警配置**: 请在图表配置中设置阈值。\n\n如需更多帮助，请联系 IT 支持部门。'
    },
    {
        id: 'page-external-mes',
        name: 'MES 生产系统集成',
        type: 'IFRAME',
        content: 'https://en.wikipedia.org/wiki/Manufacturing_execution_system', // Using Wiki as placeholder
        description: '集成外部 MES 系统的生产排程页面'
    }
];

// ... (keep INITIAL_MENU_CONFIG, MOCK_SHARE_TOKENS) ...
export const INITIAL_MENU_CONFIG: MenuItem[] = [
    {
        id: 'group_monitor',
        label: '监测与分析',
        type: 'FOLDER',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        children: [
            { id: 'menu_mon_1', label: '监测看板', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', type: 'PAGE', targetType: 'system_page', targetId: 'dashboard_monitor' },
            { id: 'menu_query', label: '业务台账查询', icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', type: 'PAGE', targetType: 'dashboard', targetId: 'dash-query-table' },
            { id: 'menu_mon_2', label: '实时监控中心', icon: 'M13 10V3L4 14h7v7l9-11h-7z', type: 'PAGE', targetType: 'system_page', targetId: 'monitor' },
            { id: 'menu_mon_3', label: '历史数据分析', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', type: 'PAGE', targetType: 'system_page', targetId: 'history_analysis' },
            { id: 'menu_help', label: '操作指南', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', type: 'PAGE', targetType: 'custom_content', targetId: 'page-help' }
        ]
    },
    {
        id: 'group_asset',
        label: '资产管理',
        type: 'FOLDER',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
        children: [
            { id: 'menu_ast_1', label: '设备资产管理', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', type: 'PAGE', targetType: 'system_page', targetId: 'inventory' },
            { id: 'menu_ast_2', label: '设备分类定义', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4zm2 5a2 2 0 110-4 2 2 0 010 4z', type: 'PAGE', targetType: 'system_page', targetId: 'device_class' },
            { id: 'menu_ast_3', label: '指标定义管理', icon: 'M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z M13.5 9a4.5 4.5 0 114.5 4.5H13.5V9z', type: 'PAGE', targetType: 'system_page', targetId: 'metric_def' }
        ]
    },
    {
        id: 'group_data',
        label: '数据管理',
        type: 'FOLDER',
        icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
        children: [
            { id: 'menu_dat_1', label: '数据源配置', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', type: 'PAGE', targetType: 'system_page', targetId: 'source' },
            { id: 'menu_dat_2', label: '数据视图定义', icon: 'M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm3-2a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zm-9-8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm12 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2 2V7z', type: 'PAGE', targetType: 'system_page', targetId: 'view' },
            { id: 'menu_dat_3', label: '图表实验室', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z', type: 'PAGE', targetType: 'system_page', targetId: 'chart' },
            { id: 'menu_dat_4', label: '看板配置', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', type: 'PAGE', targetType: 'system_page', targetId: 'dashboard_manage' },
            { id: 'menu_sys_pages', label: '页面配置', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', type: 'PAGE', targetType: 'system_page', targetId: 'page_config' }, 
        ]
    },
    {
        id: 'group_sys',
        label: '系统管理',
        type: 'FOLDER',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        children: [
            { id: 'menu_sys_1', label: '用户管理', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', type: 'PAGE', targetType: 'system_page', targetId: 'users' },
            { id: 'menu_sys_2', label: '角色管理', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', type: 'PAGE', targetType: 'system_page', targetId: 'roles' },
            { id: 'menu_sys_menu', label: '菜单管理', icon: 'M4 6h16M4 12h16M4 18h16', type: 'PAGE', targetType: 'system_page', targetId: 'menu_manage' },
            { id: 'menu_sys_3', label: '安全权限', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', type: 'PAGE', targetType: 'system_page', targetId: 'security' },
            { id: 'menu_sys_4', label: 'LLM 配置', icon: 'M13 10V3L4 14h7v7l9-11h-7z', type: 'PAGE', targetType: 'system_page', targetId: 'llm' },
        ]
    }
];

export const MOCK_SHARE_TOKENS: ShareToken[] = [
    {
        id: 'token-demo-123',
        dashboardId: 'dash-gallery',
        label: 'Public Demo Link',
        createdAt: new Date().toISOString(),
        status: 'active'
    },
    {
        id: 'token-client-abc',
        dashboardId: 'dash-1',
        label: 'Client ABC Review',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 6).toISOString(), // 6 days left
        status: 'active',
        password: 'secure'
    }
];
    