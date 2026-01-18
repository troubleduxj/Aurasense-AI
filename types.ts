
// ... keep existing enums ...
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export enum DeviceType {
  GATEWAY = 'Gateway',
  SENSOR = 'Sensor',
  SERVER = 'Server',
  ACTUATOR = 'Actuator'
}

// ... existing Device interfaces ...
export interface DeviceMetric {
  timestamp: string;
  value: number;
  label: string;
}

export interface Device {
  id: string;
  name: string;
  categoryId?: string; 
  type: DeviceType;
  status: DeviceStatus;
  location: string;
  ip: string;
  lastActive: string;
  metrics: Record<string, DeviceMetric[]>;
}

export interface DeviceCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  deviceCount?: number;
  sourceId?: string;          
  tdengineSuperTable?: string; 
  defaultDisplayMetric?: string; 
  metricDefinitions?: string[];  
}

export interface MetricDefinition {
    label: string;
    unit: string;
    color: string;
    description?: string;
}

export type MetricConfig = Record<string, MetricDefinition>;

export interface DataSource {
  id: string;
  name: string;
  type: 'API' | 'MySQL' | 'PostgreSQL' | 'TDengine';
  config: string;
}

export interface CalculatedField {
    name: string;       
    expression: string; 
}

export interface DataView {
  id: string;
  sourceId: string;
  tableName?: string; 
  name: string;
  fields: string[]; 
  calculatedFields?: CalculatedField[]; 
  filter?: string;
  mode?: 'GUI' | 'SQL';
  customSql?: string;
}

// --- V2-1 & V2-2 New Types ---
export interface FormatConfig {
    type: 'number' | 'percent';
    precision: number;
    unitSuffix?: string;
}

export type ThresholdOperator = '>' | '>=' | '<' | '<=' | '==' | '!=';

export interface ThresholdRule {
    id: string; 
    operator: ThresholdOperator;
    value: number;
    color: string;
}

// [V2-3] Reference Lines
export interface ReferenceLine {
    id: string;
    name?: string;
    type: 'constant' | 'average' | 'max' | 'min';
    value?: number; // Only for 'constant'
    color?: string;
}

// [V2-8] Advanced Analysis Config
export interface AnalysisConfig {
    enableMovingAverage?: boolean;
    movingAverageWindow?: number; // e.g., 5 points
    trendLineColor?: string;
}

// [V2-5] Container Config
export interface ContainerConfig {
    childChartIds: string[];
    interval: number; // seconds
}

export interface ChartStyle {
  colSpan?: 1 | 2 | 3; 
  heightClass?: 'h-64' | 'h-80' | 'h-96' | 'h-[400px]' | 'h-[500px]';
  
  colors?: string[];        
  showGrid?: boolean;       
  showLegend?: boolean;     
  legendPosition?: 'top' | 'bottom'; 
  xAxisLabel?: boolean;     
  yAxisLabel?: boolean;
  
  // V2-2: Conditional Formatting
  thresholds?: ThresholdRule[];
  
  // [V2-3] Reference Lines
  referenceLines?: ReferenceLine[];
  
  // [V2-6] Rich Media Styles
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  background?: string;
}

export type AggregationType = 'AVG' | 'SUM' | 'MAX' | 'MIN' | 'COUNT' | 'LAST';

export interface ChartConfig {
  id: string;
  viewId: string;
  name: string;
  // [V2-5] Added 'container' type
  type: 'line' | 'bar' | 'pie' | 'table' | 'area' | 'radar' | 'kpi' | 'gauge' | 'text' | 'image' | 'container';
  metrics: string[]; 
  dimensions: string[]; 
  style?: ChartStyle; 
  aggregations?: Record<string, AggregationType>;
  
  // V2-1: Value Formatting
  format?: FormatConfig;
  
  // [V2-6] Rich Media Content
  content?: string; // Text content or Image URL

  // [V2-8] Analysis Configuration
  analysis?: AnalysisConfig;

  // [V2-5] Container Configuration
  container?: ContainerConfig;
}

export interface ChartInteractionPayload {
    name: string;     
    value: number;    
    series?: string;  
    dimensionKey?: string; 
}

export type ControllerType = 'SELECT' | 'TIME_RANGE' | 'RADIO_GROUP';

export interface ControllerConfig {
  id: string;
  label: string;
  type: ControllerType;
  key: string;       
  options?: string[]; 
  defaultValue?: any;
}

export type DashboardFilterState = Record<string, any>;

// [V2-4] React Grid Layout Item
export interface GridLayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    static?: boolean;
}

export interface Dashboard {
  id: string;
  name: string;
  charts: string[]; 
  controllers?: ControllerConfig[];
  
  // [V2-4] Layout Configuration
  layout?: GridLayoutItem[]; 
}

// [IoT-1] SCADA Topology Types
export type ScadaNodeType = 'tank' | 'pump' | 'pipe' | 'led' | 'value' | 'label';

export interface ScadaBinding {
    deviceId: string;
    metricKey: string;
    targetProp: 'value' | 'level' | 'fill' | 'flow_anim'; // level for tank, fill for color, flow_anim for pipe
    min?: number; // for scaling (e.g. 0-100 level)
    max?: number;
    thresholds?: ThresholdRule[]; // for color binding
}

export interface ScadaNode {
    id: string;
    type: ScadaNodeType;
    x: number;
    y: number;
    w: number;
    h: number;
    text?: string;      // label text
    label?: string;     // Added label property
    rotation?: number;  // degrees
    fill?: string;      // default color
    binding?: ScadaBinding; 
}

export interface DiagnosticReport {
  status: 'Healthy' | 'Risk' | 'Critical';
  summary: string;
  recommendations: string[];
  anomaliesFound: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: 'Active' | 'Inactive';
  lastLogin?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[]; 
  description: string;
}

export interface LLMConfig {
  provider: 'Gemini' | 'OpenAI' | 'Claude' | 'LocalLLM';
  apiKey: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  endpoint?: string;
}

export interface AuthConfig {
  enabled: boolean;
  provider: 'OIDC' | 'SAML' | 'LDAP';
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
  redirectUri: string;
}
