# PPT Preview

基于 Vue 3、Vite 和 `pptxtojson` 的浏览器端 PPTX 预览播放器。项目目标是把 `.pptx` 文件解析为统一的 Presentation Model，再通过自研 runtime 和 Vue 渲染层进行播放、翻页、动画触发与视觉还原。

## 功能特性

- 浏览器端上传并解析 `.pptx` 文件。
- 基于 `pptxtojson` 输出构建标准化 PPT 模型。
- 支持幻灯片播放、上一页、下一页、上一步、下一步、暂停和全屏入口。
- 支持基础演讲者模式状态和播放状态展示。
- 支持文本、富文本 HTML、图片、形状、分组、音视频、公式图片等元素渲染。
- 针对 PPT 还原补充了背景填充、图片资源、文本 body inset、虚线边框、shape path、箭头 marker、自定义项目符号等解析增强。
- 统一处理 `pptxtojson` 的 point 单位到 CSS pixel 单位转换。

## 技术栈

- Vue 3
- TypeScript
- Vite
- pptxtojson
- JSZip

## 快速开始

安装依赖：

```bash
pnpm install
```

启动开发服务器：

```bash
pnpm dev
```

默认访问：

```text
http://localhost:5173/
```

构建生产版本：

```bash
pnpm build
```

本地预览构建产物：

```bash
pnpm preview
```

## 使用方式

1. 打开本地页面。
2. 点击上传 PPTX。
3. 选择 `.pptx` 文件。
4. 使用播放器工具栏进行播放、翻页或切换状态。

注意：部分解析增强是在上传阶段从 PPTX 内部 XML 读取并注入的。如果修改了解析逻辑，需要刷新页面并重新上传 PPTX 才能看到最新效果。

## 项目结构

```text
src/
  adapters/
    pptxtojson/
      parseWithPptxtojson.ts      # 调用 pptxtojson 解析 PPTX
      normalizePresentation.ts    # 转换为标准化 Presentation Model
      textBodyInsets.ts           # 从 PPT XML 补充 inset、箭头、项目符号等信息
      types.ts                    # pptxtojson 原始数据类型
  components/
    presentation/
      PresentationShell.vue       # 页面外壳、上传入口和播放器布局
      PresentationStage.vue       # 舞台缩放与画布容器
      SlideViewport.vue           # 单页幻灯片视口
      ElementRenderer.vue         # 元素渲染入口
      PlaybackToolbar.vue         # 播放控制栏
      PresenterPanel.vue          # 演讲者信息面板
  composables/
    presentation/
      usePresentationPlayer.ts    # 上传、解析、runtime 绑定
  runtime/
    createPresentationRuntime.ts  # 播放状态机
    evaluatePresentationFrame.ts  # 将状态计算为可渲染帧
  types/
    presentation.ts               # 标准化模型与 runtime 类型
```

## 数据流程

```text
PPTX File
  -> pptxtojson.parse()
  -> XML enhancement
  -> normalizePresentation()
  -> createPresentationRuntime()
  -> evaluatePresentationFrame()
  -> Vue components
```

## 还原细节

当前项目在 `pptxtojson` 的基础上额外处理了以下 PPT 细节：

- 将 `pt` 长度单位转换为 CSS `px`。
- 解析 slide XML 中的 `a:bodyPr`，补充文本 body inset。
- 解析 `a:headEnd` / `a:tailEnd`，为线条补充箭头 marker。
- 解析 `a:buChar`，将自定义项目符号渲染为可见 marker。
- 保留 shape path，并用 SVG 渲染虚线、填充和描边。
- 过滤图片内部的虚线矩形辅助框，避免解析辅助元素误显示。
- 清理空列表项，避免 PPT 空项目符号显示成多余点。

## 已知边界

- `pptxtojson` 不是完整 PowerPoint 渲染引擎，复杂排版仍可能与 WPS / PowerPoint 存在差异。
- 复杂动画、母版继承、图表细节、SmartArt 和高级效果仍需持续补强。
- 字体依赖浏览器和系统环境，缺失字体会造成文本宽度和换行差异。
- 解析增强依赖 PPTX XML 结构，个别文件可能需要新增兼容逻辑。

## 相关文档

架构设计说明见：

```text
pptxtojson-runtime-architecture.md
```
