
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export enum DeviceType {
  GATEWAY = 'GATEWAY',
  SENSOR = 'SENSOR',
  ACTUATOR = 'ACTUATOR',
  SERVER = 'SERVER',
  WELDER = 'WELDER',
  CUTTER = 'CUTTER'
}

export interface DeviceMetric {
  timestamp: string;
  value: number;
  label?: string;
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
  deviceCount: number;
  sourceId: string;
  tdengineSuperTable?: string;
  defaultDisplayMetric?: string;
  metricDefinitions?: string[];
}

export interface DataSource {
  id: string;
  name: string;
  type: 'API' | 'MySQL' | 'PostgreSQL' | 'TDengine' | 'MQTT' | 'Kafka' | 'InfluxDB' | 'Oracle' | 'SQLServer';
  config: string; // JSON string
}

export interface DataViewField {
  name: string;
  alias?: string;
  unit?: string;
  type?: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  description?: string;
}

export interface CalculatedField {
  name: string;
  expression: string;
}

export interface DataView {
  id: string;
  sourceId: string;
  name: string;
  fields: string[];
  tableName?: string; // For DB sources
  model?: Record<string, DataViewField>;
  calculatedFields?: CalculatedField[];
  filter?: string;
  mode?: 'GUI' | 'SQL';
  customSql?: string;
}

export type AggregationType = 'AVG' | 'SUM' | 'MAX' | 'MIN' | 'COUNT' | 'LAST';

export interface FormatConfig {
  type: 'number' | 'percent' | 'currency';
  precision?: number;
  unitSuffix?: string;
}

export type ThresholdOperator = '>' | '>=' | '<' | '<=' | '==' | '!=';

export interface ThresholdRule {
  id: string;
  operator: ThresholdOperator;
  value: number;
  color: string;
}

export interface ReferenceLine {
  id: string;
  name: string;
  type: 'constant' | 'average' | 'min' | 'max';
  value?: number;
  color: string;
}

export interface RowAction {
  id: string;
  label: string;
  type: 'default' | 'primary' | 'danger';
  icon?: string;
}

export interface AnalysisConfig {
  enableMovingAverage?: boolean;
  movingAverageWindow?: number;
  trendLineColor?: string;
}

export interface ContainerConfig {
  childChartIds: string[];
  interval: number;
}

export interface InteractionParamMapping {
  id: string;
  sourceKey: 'name' | 'value' | 'series' | 'row_field';
  sourceField?: string; // If sourceKey is row_field
  targetKey: string; // Dashboard filter key
}

export interface ChartInteractionConfig {
  type: 'none' | 'navigate_dashboard' | 'open_modal' | 'external_link';
  targetId?: string; // Dashboard ID
  url?: string; // External URL
  params?: InteractionParamMapping[];
}

export interface ChartStyle {
  colors: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom';
  xAxisLabel?: boolean;
  yAxisLabel?: boolean;
  colSpan?: number;
  heightClass?: string;
  thresholds?: ThresholdRule[];
  referenceLines?: ReferenceLine[];
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  background?: string;
  textColor?: string;
  borderRadius?: number;
  enablePagination?: boolean;
  pageSize?: number;
  showRowNumber?: boolean;
  rowActions?: RowAction[];
  columnWidths?: Record<string, number>;
}

export interface ChartConfig {
  id: string;
  viewId: string;
  name: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'radar' | 'kpi' | 'table' | 'gauge' | 'text' | 'image' | 'container';
  metrics: string[];
  dimensions: string[];
  aggregations?: Record<string, AggregationType>;
  style?: ChartStyle;
  format?: FormatConfig;
  content?: string; // For Text/Image charts
  analysis?: AnalysisConfig;
  container?: ContainerConfig;
  interaction?: ChartInteractionConfig;
}

export interface ControllerConfig {
  id: string;
  label: string;
  type: 'SELECT' | 'RADIO_GROUP' | 'TIME_RANGE' | 'TEXT_INPUT';
  key: string;
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
}

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
  charts: string[]; // Chart IDs
  controllers?: ControllerConfig[];
  layout?: GridLayoutItem[];
}

export type DashboardFilterState = Record<string, any>;

export type MenuTargetType = 'system_page' | 'dashboard' | 'custom_content';

export type SystemPageKey = 'monitor' | 'inventory' | 'history_analysis' | 'device_class' | 'source' | 'view' | 'chart' | 'dashboard_manage' | 'dashboard_monitor' | 'users' | 'roles' | 'security' | 'llm' | 'menu_manage' | 'metric_def' | 'page_config';

export interface MenuItem {
  id: string;
  parentId?: string;
  label: string;
  icon: string;
  type: 'FOLDER' | 'PAGE';
  targetType?: MenuTargetType;
  targetId?: string;
  children?: MenuItem[];
  roles?: string[];
}

export type CustomPageType = 'MARKDOWN' | 'IFRAME' | 'DASHBOARD';

export interface CustomPage {
  id: string;
  name: string;
  type: CustomPageType;
  content: string; // Markdown text, URL, or DashboardID
  description?: string;
}

export interface ShareToken {
  id: string;
  dashboardId: string;
  label: string;
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'revoked' | 'expired';
  password?: string;
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
  description: string;
  permissions: string[];
}

export interface AuthConfig {
  enabled: boolean;
  provider: 'OIDC' | 'SAML' | 'LDAP';
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
  redirectUri: string;
}

export interface LLMConfig {
  provider: 'Gemini' | 'OpenAI' | 'Claude' | 'LocalLLM';
  apiKey: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  endpoint?: string;
}

export interface DiagnosticReport {
  status: 'Healthy' | 'Risk' | 'Critical';
  summary: string;
  recommendations: string[];
  anomaliesFound: string[];
}

export interface MetricDefinition {
  label: string;
  unit: string;
  color: string;
  _source?: string;
  _isScoped?: boolean;
}

export type MetricConfig = Record<string, MetricDefinition>;

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp: number;
    isThinking?: boolean;
    action?: { type: 'navigate', payload: { target: string } };
}

export interface ChartInteractionPayload {
    name: string; // x-axis value or clicked item name
    value: number; // y-axis value
    series?: string; // series name
    dimensionKey?: string; // dimension if available
    row?: any; // table row data
    chartId?: string; // source chart
}

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
    rotation?: number;
    text?: string;
    label?: string;
    fill?: string;
    binding?: ScadaBinding;
}
