# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

- `pnpm install`：安装依赖。
- `pnpm dev`：启动 Vite 开发服务器，脚本使用 `vite --host`。
- `pnpm build`：先运行 `vue-tsc -b` 类型检查，再执行 `vite build`。
- `pnpm preview`：本地预览生产构建产物。
- `pnpm test`：以 Vitest watch 模式运行测试。
- `pnpm test:run`：运行完整 Vitest 测试套件。
- `pnpm vitest run src/runtime/createPresentationRuntime.test.ts`：运行单个测试文件；替换路径即可聚焦其他测试。
- `pnpm vitest run -t "case name"`：按测试名称过滤运行。

## 项目定位

这是一个基于 Vue 3、Vite、TypeScript 和本地 vendored `pptxtojson` 的浏览器端 PPTX 预览播放器。目标链路是把 `.pptx` 上传文件解析成统一的 `NormalizedPresentation`，再通过 runtime/evaluator 计算播放帧，最后由 Vue 组件渲染幻灯片、动画、转场和媒体状态。

## 核心数据流

```text
PPTX File
  -> src/vendor/pptxtojson/
  -> src/adapters/pptxtojson/parseWithPptxtojson.ts
  -> adapter enhancers
  -> src/adapters/pptxtojson/normalizePresentation.ts
  -> src/runtime/createPresentationRuntime.ts
  -> src/runtime/evaluatePresentationFrame.ts
  -> src/components/presentation/*
```

关键入口：

- `src/App.vue` 只挂载 `PresentationShell`，状态来自 `usePresentationPlayer()`。
- `src/composables/presentation/usePresentationPlayer.ts` 负责上传文件、调用 parser/normalizer、创建 runtime、启动 `requestAnimationFrame` tick，并暴露当前 frame。
- `src/types/presentation.ts` 定义标准化模型、runtime state、evaluated frame，是跨层协作的中心契约。

## 分层结构

- `src/vendor/pptxtojson/`：本地 vendored 的 parser 源码，负责底层 OOXML 解析。这里包含 JS parser 文件以及部分针对 parser 行为的测试。
- `src/adapters/pptxtojson/`：项目专属适配层。`parseWithPptxtojson.ts` 动态加载本地 vendor parser；`enhancers/` 从 PPTX XML 补充 text body、line marker、bullet、media mime、slide animation/transition 等信息；`normalizePresentation.ts` 将 raw parser 输出转换成标准化模型，并处理 point 到 CSS px、背景、媒体、shape、table、animation 等归一化。
- `src/runtime/`：播放运行时。`createPresentationRuntime.ts` 管理 session 状态、播放/暂停、翻页、触发动画、转场、媒体同步；`evaluatePresentationFrame.ts` 把 model + state 转成 renderer 可消费的 frame。子目录按职责拆分为 `input/`、`media/`、`policy/`、`session/`、`timeline/`、`transition/`。
- `src/components/presentation/`：Vue 渲染层。`PresentationShell.vue` 组织上传、工具栏、舞台、演讲者面板和输入事件；`PresentationStage.vue` / `SlideViewport.vue` 负责舞台与视口；`ElementRenderer.vue` 是元素渲染入口，分发文本/shape/SVG marker/媒体/表格/group；模型 helper 文件通常与对应 `.test.ts` colocate。
- `fixtures/`：维护真实 PPTX 样本索引、标签和合成 runtime/table/transition 回归用例说明。真实二进制样本当前仍放在 `public/`，fixtures 目录主要记录索引和基线。
- `knowledge-base/`：沉淀问题模式与已验证修复方案；解析相关问题按 vendor parser、adapter enhancer、normalize、renderer/runtime 归类。

## 测试约定

测试使用 Vitest，测试文件与实现文件 colocate，命名为 `*.test.ts`。常见覆盖范围包括：

- adapter enhancer 和 normalize 输出。
- runtime 状态机、timeline、transition、media、input、session 行为。
- renderer helper，例如 line marker、shape SVG、table、viewport、media fallback/playback。
- `src/vendor/pptxtojson/pptxtojson.integration.test.ts` 覆盖本地 vendored parser 的集成行为。

运行视觉/UI 相关改动时，除 Vitest/类型检查外，还应启动 `pnpm dev` 并在浏览器中上传 fixture PPTX 或使用对应 `public/` harness 验证关键路径。转场真实视觉回归可参考 `fixtures/transition-regression-cases.md` 与 `public/transition-regression-harness.js`。

## 变更落点建议

- PPTX XML 原始信息缺失：优先检查 `src/vendor/pptxtojson/` 是否应解析底层字段；如果是项目增强逻辑，落在 `src/adapters/pptxtojson/enhancers/`。
- raw 输出已包含信息但标准化模型缺失：修改 `normalizePresentation.ts` 和 `src/types/presentation.ts`。
- 播放、点击触发、自动翻页、时间线、转场或媒体同步问题：优先看 `src/runtime/` 对应子模块。
- 视觉还原问题：先确认 `NormalizedElement`/`PresentationFrame` 是否已有所需数据；若已有，修改 `src/components/presentation/` 的 renderer 或 helper。
- 表格问题通常跨 `normalizePresentation.ts` 的 `NormalizedTableMeta` 生成和 `TableRenderer.vue`/`tableModel.ts` 渲染 helper。

## 仓库注意事项

- `pnpm-workspace.yaml` 当前只包含 `allowBuilds.esbuild: true`，不是多包 workspace 定义。
- README 提醒：解析增强发生在上传阶段；修改解析逻辑后需要刷新页面并重新上传 PPTX 才能看到最新效果。
- 当前 git 工作区在会话开始时已有 `pnpm-lock.yaml` 修改；不要无关覆盖或重置用户已有变更。
