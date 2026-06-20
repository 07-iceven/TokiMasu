# 时格 · TokiMasu

时格 · TokiMasu是一个极简的时间格子生成网站。设定日期，打印网格，每天用笔涂黑一格，用最真实的动作感知时间的流逝。

## 在线试用

- 试用网页：[tokimasu.iceven.com](https://tokimasu.iceven.com)

## 项目特点

- 支持按起止日期自动生成时间格内容
- 支持多种纸张尺寸，包括 `A4`、`B5`、`A5`、`A6` 和自定义纸张
- 支持调整格子宽高、边框、圆角、间距、排列方向和流式布局
- 支持标题、副标题、统计信息、周起始日、周末高亮等显示选项
- 支持导出 / 导入配置（demo），便于演示和复用基础模板
- 支持打印预览、全屏预览和移动端适配

## 技术栈

- `React 19`
- `TypeScript`
- `Vite`
- `Tailwind CSS 4`
- `lucide-react`

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

默认会启动在：

```text
http://localhost:3000
```

### 3. 生产构建

```bash
npm run build
```

### 4. 类型检查

```bash
npm run lint
```

## 使用说明

1. 在左侧面板设置日期范围、纸张大小和格子样式。
2. 在预览区域实时查看打印效果。
3. 使用底部缩放工具调整查看比例，或切换全屏预览。
4. 需要复用模板时，可使用导出 / 导入配置功能。
5. 确认后直接使用浏览器打印。

## 打印建议

- 建议开启浏览器打印选项中的“背景图形”
- 建议将页边距设置为“无”
- 打印前优先在预览区确认纸张尺寸和格子范围是否溢出

## 项目结构

```text
TokiMasu/
├─ public/
│  └─ 404.html
├─ src/
│  ├─ App.tsx
│  ├─ index.css
│  ├─ main.tsx
│  ├─ types.ts
│  └─ vite-env.d.ts
├─ Logo.svg
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 资源说明

- `Logo.svg` 同时用于页面头部 logo 和浏览器标签页 favicon
- `public/404.html` 是 404 页面
- `Maple Mono NF CN` 已随项目一起打包，不依赖用户本地安装

## 字体说明

- `Inter`：项目主界面与大部分 UI 文本的默认字体
- `Noto Serif SC`：用于需要更强印刷感的衬线文本
- `JetBrains Mono`：用于界面中的通用等宽文本、参数值和辅助信息
- `Maple Mono NF CN`：用于时间格子里的主数字显示，已随项目一起打包，不依赖用户本地安装
- 当 `Maple Mono NF CN` 加载失败时，格子数字会回退到 `JetBrains Mono`

## 环境变量

当前项目运行不依赖环境变量。
