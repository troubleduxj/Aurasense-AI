
# AuraSense AI 🔮

<div align="center">

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/AI-Gemini-8E75B2.svg?style=for-the-badge&logo=google&logoColor=white)

**下一代工业物联网智能监控与数据分析平台**

[功能特性](#-功能特性) • [技术栈](#-技术栈) • [快速开始](#-快速开始) • [系统截图](#-系统截图) • [路线图](#-演进路线)

</div>

---

## 📖 项目简介

**AuraSense AI** 是一款专为现代工业场景设计的综合性 IoT 监控平台。它不仅仅是一个数据大屏，更是一个集成了实时遥测、资产管理、AI 智能诊断和低代码看板配置的操作系统。

通过集成 **Google Gemini AI** 模型，AuraSense 能够对设备运行数据进行实时分析，提供故障预警与维护建议。结合强大的 **SCADA 组态编辑器** 和 **BI 级图表配置**，用户可以零代码构建符合业务需求的监控大屏。

## ✨ 功能特性

### 🧠 AI 智能诊断
- 集成 **Google Gemini** 大语言模型。
- 基于实时指标（温度、振动、电流等）生成设备健康诊断报告。
- 提供故障根因分析与可执行的维护建议，支持导出 PDF 报告。

### 📊 深度可视化与 BI
- **拖拽式看板**：基于 React-Grid-Layout 的自由布局，支持多 Tab 与轮播容器。
- **图表实验室**：支持折线、面积、柱状、雷达、仪表盘等多种图表。
- **精细化配置**：自定义阈值告警颜色、参考线（均值/极值）、数据格式化。
- **超级表格**：支持海量数据分页、排序、列宽调整及自定义行操作。

### 🏭 资产与数据管理
- **设备全生命周期管理**：涵盖网关、传感器、焊机、切割机等多种设备类型。
- **数据源集成**：模拟支持 TDengine、MySQL、PostgreSQL 及 REST API 连接。
- **SCADA 拓扑图**：内置 Web 组态编辑器，支持储罐、泵阀、管道的拖拽绘制与数据绑定。

### 🛡️ 企业级系统管理
- **RBAC 权限控制**：细粒度的用户与角色权限管理。
- **动态菜单引擎**：完全可配置的侧边栏导航结构。
- **安全分享**：支持生成带密码和有效期的看板分享链接。

## 🛠 技术栈

*   **核心框架**: React 19, TypeScript
*   **样式方案**: Tailwind CSS
*   **可视化引擎**: Apache ECharts, Recharts (Legacy)
*   **布局引擎**: React Grid Layout
*   **AI 服务**: Google GenAI SDK (Gemini Models)
*   **工具库**: Lodash, jsPDF, html2canvas

## 🚀 快速开始

### 前置要求
*   Node.js (v16+)
*   Google Gemini API Key (用于 AI 诊断功能)

### 安装与运行

1.  **克隆仓库**
    ```bash
    git clone https://github.com/your-username/aurasense-ai.git
    cd aurasense-ai
    ```

2.  **配置环境变量**
    在项目根目录创建 `.env` 文件（或直接在代码中注入，注意安全）：
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

3.  **安装依赖**
    ```bash
    npm install
    ```

4.  **启动开发服务器**
    ```bash
    npm run dev
    ```

5.  **访问应用**
    打开浏览器访问 `http://localhost:3000`

## 📸 系统截图

| **实时监控大屏** | **图表配置实验室** |
|:---:|:---:|
| ![Dashboard](https://via.placeholder.com/600x330?text=Dashboard+Preview) | ![Chart Lab](https://via.placeholder.com/600x330?text=Chart+Configurator) |
| *支持拖拽布局与自动轮播* | *丰富的图表类型与样式配置* |

| **AI 智能诊断** | **SCADA 组态编辑** |
|:---:|:---:|
| ![AI Diagnostic](https://via.placeholder.com/600x330?text=AI+Analysis) | ![Topology](https://via.placeholder.com/600x330?text=Topology+Editor) |
| *基于 LLM 的健康度分析* | *拖拽式工艺流程图绘制* |

## 🗺 演进路线 (Roadmap)

### ✅ V1.0: 基础监控
- [x] 设备资产清单与状态监控
- [x] 基础图表展示
- [x] 静态系统菜单

### ✅ V2.0: 深度可视化 (Current)
- [x] **BI 级图表配置**：阈值着色、辅助线、格式化。
- [x] **自由布局看板**：支持拖拽与缩放。
- [x] **SCADA 拓扑图**：Web 组态编辑器。
- [x] **AI 诊断集成**：Gemini 接入。

### 🚧 V3.0: 业务平台化 (In Progress)
- [x] **动态菜单引擎**：菜单结构完全配置化。
- [x] **全局筛选器**：看板级的时间与维度筛选控制器。
- [x] **超级表格**：支持分页与复杂查询。
- [ ] **数据钻取**：图表点击下钻至明细页。
- [ ] **SQL 视图模式**：支持前端 SQL 数据处理。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1.  Fork 本仓库
2.  创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  开启一个 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

---

<div align="center">
  <strong>Designed with ❤️ by AuraSense Team</strong>
</div>
