
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
  ACTUATOR = 'Actuator',
  WELDER = 'Welder',
  CUTTER = 'Cutter'
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

// [V3.1] Semantic Data Model Field Definition
export interface DataViewField {
    name: string;       // Original field name (key)
    alias?: string;     // Display Name (e.g., "核心温度")
    type?: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
    unit?: string;      // Unit suffix (e.g., "°C")
    format?: string;    // Format string (e.g., "#,##0.00")
    description?: string; // Tooltip description
    isVisible?: boolean; // Default visibility
}

export interface DataView {
  id: string;
  sourceId: string;
  tableName?: string; 
  name: string;
  fields: string[]; 
  // [V3.1] Semantic Model
  model?: Record<string, DataViewField>;
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

// [V3.3] Table Row Action Definition
export interface RowAction {
    id: string;
    label: string;
    type: 'primary' | 'danger' | 'default';
    icon?: string; // Optional icon SVG path definition
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
  textColor?: string; // [V3.1] Card Text Color
  borderRadius?: number; // [V3.2] Card Border Radius

  // [V3.0] Table Configuration
  enablePagination?: boolean;
  pageSize?: number;
  showRowNumber?: boolean;
  
  // [V3.3] Table Advanced Features
  columnWidths?: Record<string, number>; // Key: field name, Value: pixel width
  rowActions?: RowAction[]; // Custom action buttons
}

// [V3.2] Interaction Config
export type InteractionType = 'navigate_dashboard' | 'open_modal' | 'external_link' | 'none';

export interface InteractionParamMapping {
    id: string;
    sourceKey: 'name' | 'value' | 'series' | 'row_field'; // Data source from click event
    sourceField?: string; // If sourceKey is 'row_field', which field?
    targetKey: string; // Target filter key or URL param key
}

export interface ChartInteractionConfig {
    type: InteractionType;
    targetId?: string; // Dashboard ID or View ID
    url?: string; // External URL
    params?: InteractionParamMapping[]; // Parameter passing rules
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

  // [V3.2] Interaction
  interaction?: ChartInteractionConfig;
}

export interface ChartInteractionPayload {
    chartId?: string; // [V3.2] Added to identify source chart
    name: string;     
    value: number;    
    series?: string;  
    dimensionKey?: string; 
    row?: any; // [V3.0] Full row object for table clicks
    actionId?: string; // [V3.3] ID of the action button clicked
}

export type ControllerType = 'SELECT' | 'TIME_RANGE' | 'RADIO_GROUP' | 'TEXT_INPUT';

export interface ControllerConfig {
  id: string;
  label: string;
  type: ControllerType;
  key: string;       
  options?: string[]; 
  defaultValue?: any;
  placeholder?: string; // [V3.0] For text input
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

// [V3.4] Custom Page Definitions (Replaces SCADA)
// [V3.5] Added DASHBOARD type to allow embedding DIY dashboards
export type CustomPageType = 'IFRAME' | 'MARKDOWN' | 'DASHBOARD';

export interface CustomPage {
    id: string;
    name: string;
    type: CustomPageType;
    content: string; // URL for IFRAME, Markdown text for MARKDOWN, DashboardID for DASHBOARD
    description?: string;
}

// [V3.5] SCADA / Topology Types (Legacy Support)
export type ScadaNodeType = 'tank' | 'pump' | 'pipe' | 'led' | 'value' | 'label';

export interface ScadaBinding {
    deviceId: string;
    metricKey: string;
    targetProp: 'value' | 'level' | 'fill' | 'flow_anim';
    max?: number;
}

export interface ScadaNode {
    id: string;
    type: ScadaNodeType;
    x: number;
    y: number;
    w: number;
    h: number;
    text?: string;
    label?: string;
    fill?: string;
    rotation?: number;
    binding?: ScadaBinding;
}

// [V3.6] Secure Share Token
export interface ShareToken {
    id: string; // The Token (UUID)
    dashboardId: string;
    label: string; // Description of who this link is for
    createdAt: string;
    expiresAt?: string; // ISO Date or null (permanent)
    password?: string; // Optional access code
    status: 'active' | 'revoked';
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

// --- V3.0 Menu System Types ---
export type MenuTargetType = 'dashboard' | 'system_page' | 'custom_content';

// Defines the available system pages (hardcoded routes)
export type SystemPageKey = 
  | 'dashboard_monitor' // Default aggregator
  | 'monitor' 
  // | 'scada' // Removed
  | 'history_analysis' 
  | 'inventory' 
  | 'device_class' 
  | 'metric_def' 
  | 'source' 
  | 'view' 
  | 'dashboard_manage' 
  | 'chart' 
  | 'users' 
  | 'roles' 
  | 'security' 
  | 'llm'
  | 'menu_manage'
  | 'page_config'; // Added

export interface MenuItem {
  id: string;
  parentId?: string; // Optional, for flat list handling
  label: string;
  icon: string; // SVG path d
  type: 'FOLDER' | 'PAGE'; 
  targetType?: MenuTargetType; // Required if type is PAGE
  targetId?: string; // SystemPageKey or DashboardID or CustomPageID
  children?: MenuItem[];
  roles?: string[]; // [V3.1] Role-based access control. Array of Role IDs.
}
    