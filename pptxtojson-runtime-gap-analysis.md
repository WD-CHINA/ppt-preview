# pptxtojson Runtime 架构落地差距分析

本文档基于 `pptxtojson-runtime-architecture.md`，对当前 `ppt-preview` 项目的代码还原程度进行对照梳理，用于记录已经完成的能力、部分落地的能力、尚未实现的架构模块，以及后续建议优先级。

## 1. 当前总体结论

当前项目已经完成了从 PPTX 文件到 Web 预览的基础闭环：

```text
PPTX File
  -> pptxtojson.parse()
  -> normalizePresentation()
  -> createPresentationRuntime()
  -> evaluatePresentationFrame()
  -> Vue Components Render
```

也就是说，项目已经具备“可运行 PPT 预览器骨架”。

但对照架构文档中的目标，当前实现还没有达到“商业级 PPT 播放 Runtime”的完整形态。主要差距集中在：

- Runtime 还没有拆成独立 engine。
- Timeline 只支持基础动画。
- Transition 只有简单过渡表现。
- Media Engine 还没有生命周期调度。
- Input、Overlay、Annotation、Laser Pointer 等演示能力尚未建立。
- 文本、形状、表格、图表、SmartArt 等高保真还原仍需要持续补齐。
- 缺少测试、fixture 和视觉回归体系。

## 2. 已经做到的部分

### 2.1 解析与标准化主链路

当前项目已经接入 `pptxtojson`，并通过适配层将原始 JSON 转成播放器内部模型。

相关文件：

- `src/adapters/pptxtojson/parseWithPptxtojson.ts`
- `src/adapters/pptxtojson/normalizePresentation.ts`
- `src/types/presentation.ts`

已经覆盖的标准化内容包括：

- 页面尺寸
- 页面背景
- 页面备注
- 页面切换元数据
- 自动翻页策略
- 元素坐标与尺寸
- 元素类型
- 媒体资源
- 基础动画描述
- 主题色与字体列表

### 2.2 基础 Runtime

当前已经有 `createPresentationRuntime()` 作为播放 facade。

已支持：

- 播放
- 暂停
- 下一页
- 上一页
- 下一步
- 上一步
- 跳转到指定页
- seek
- 静音状态
- 全屏状态
- 演讲者模式状态
- 循环播放
- 播放倍速
- `requestAnimationFrame` 驱动的 `tick`

相关文件：

- `src/runtime/createPresentationRuntime.ts`
- `src/composables/presentation/usePresentationPlayer.ts`

### 2.3 Render Evaluation Layer 基础实现

当前已经有 `evaluatePresentationFrame()`，可以根据 runtime state 输出渲染帧。

已输出：

- 当前页
- 上一页
- 下一页
- transition progress
- 元素 visible
- 元素 opacity
- 元素 transform
- 元素 style
- 元素 bounds
- 元素 media
- 元素 shape meta

相关文件：

- `src/runtime/evaluatePresentationFrame.ts`

### 2.4 Vue 渲染层基础组件

当前已经具备基础播放器 UI。

已有组件：

- `PresentationShell.vue`
- `PresentationStage.vue`
- `SlideViewport.vue`
- `ElementRenderer.vue`
- `PlaybackToolbar.vue`
- `PresenterPanel.vue`

当前 `ElementRenderer.vue` 已经支持基础元素渲染：

- text
- image
- shape
- video
- audio
- math
- group

### 2.5 部分 PPT 高保真补丁

当前代码已经针对具体 PPT 还原问题补了一些增强能力：

- PPT XML 中 `a:bodyPr` 的 text body inset 读取。
- 自定义 bullet 字符读取，例如 `√` 项目符号。
- 线条箭头 `headEnd` / `tailEnd` 读取。
- shape path 的 SVG 渲染。
- dashed border 映射为 SVG stroke dasharray。
- 空白 list item 过滤。
- 图片内部辅助虚线框过滤。
- 文本短行不强制换行的基础处理。

相关文件：

- `src/adapters/pptxtojson/textBodyInsets.ts`
- `src/adapters/pptxtojson/normalizePresentation.ts`
- `src/components/presentation/ElementRenderer.vue`

## 3. 部分做到但还不完整的部分

### 3.1 Runtime 模块拆分不足

架构文档建议 Runtime 拆为：

```text
Presentation Runtime Facade
├─ Session Store
├─ Timeline Engine
├─ Transition Engine
├─ Media Engine
├─ Playback Policy Engine
└─ Input Engine
```

当前这些能力大多集中在 `src/runtime/createPresentationRuntime.ts` 一个文件里。

目前的问题：

- Session Store 没有单独模块。
- Timeline Engine 没有单独模块。
- Transition Engine 没有单独模块。
- Media Engine 没有单独模块。
- Playback Policy Engine 没有单独模块。
- Input Engine 尚未实现。

这会导致后续继续补动画、媒体、输入、转场时，`createPresentationRuntime.ts` 容易变成大型状态机文件。

### 3.2 Timeline Engine 只支持基础动画

当前动画能力主要是：

- `appear`
- `fade`
- `onClick`
- `withPrevious`
- `afterPrevious`

还缺少：

- 进入动画细分效果。
- 退出动画。
- 强调动画。
- 路径动画。
- 组合动画。
- 动画延迟。
- 动画缓动。
- 动画重复。
- 按段落触发。
- trigger group。
- 更完整的 PPT XML 动画解析。

当前更像是“基础可见性/透明度控制”，还不是完整 PPT Timeline Runtime。

### 3.3 Transition Engine 只有简化表现

当前 runtime 有 `transitionProgress`，`SlideViewport.vue` 也有上一页和当前页的基础 opacity / transform 过渡。

但架构文档中要求的转场还没有完整实现：

- fade
- push
- cover
- uncover
- zoom
- wipe
- split
- morph 类效果

当前还没有根据 `transition.type` 分发不同转场 renderer。

### 3.4 Media Engine 只有资源生成与释放

当前媒体处理已经包括：

- Blob 转 object URL。
- video / audio / image / math 基础渲染。
- 旧 presentation 卸载时 revoke object URL。

但还缺少商业播放场景需要的 Media Engine：

- 媒体资源注册表。
- 当前页与下一页预加载。
- 上一页/远离页资源释放策略。
- video/audio 跟随 runtime play/pause。
- video/audio 跟随 seek。
- mute 状态同步到实际 media element。
- 媒体加载失败 fallback。
- 大媒体懒加载。
- poster 和首帧策略。

### 3.5 Evaluator 输出还不完整

架构文档建议 Evaluator 输出：

- `visible`
- `opacity`
- `transform`
- `clipPath`
- `style`
- media frame
- overlay state

当前已经有 `visible / opacity / transform / style`，但还缺少：

- `clipPath`
- 精细 transform 插值
- animation progress
- transition typed frame
- media playback frame
- overlay frame
- pointer / annotation frame

### 3.6 Vue 渲染层组件还不完整

架构文档建议的组件中，当前缺少：

- `TransitionStage.vue`
- `MediaRenderer.vue`
- `TimelineScrubber.vue`
- `overlays/FullscreenOverlay.vue`
- `overlays/LaserPointerLayer.vue`
- `overlays/AnnotationLayer.vue`

目前媒体、形状、文本等都集中在 `ElementRenderer.vue` 内部，继续补下去会让该组件越来越复杂。

### 3.7 演讲者模式还只是基础面板

当前 `PresenterPanel.vue` 已经能显示：

- 当前页名称
- 当前页备注
- 页内时间
- 点击触发计数
- 自动翻页进度
- 字体数
- 主题色

但还不是完整演讲者模式。

还缺少：

- 当前页 / 下一页双预览。
- 演讲计时器。
- 备注字号控制。
- 快捷翻页控制。
- 演讲者窗口与观众窗口分离。
- 演讲者模式专用布局。

## 4. 尚未做到的部分

### 4.1 Input Engine

当前没有独立输入系统。

还缺少：

- 键盘快捷键。
- 空格播放/暂停或下一步。
- 左右方向键翻页。
- 触摸滑动。
- 鼠标点击舞台推进。
- 全屏快捷控制。
- 演讲者模式快捷控制。

### 4.2 完整表格、图表、SmartArt 渲染

类型层已经声明了：

- `table`
- `chart`
- `diagram`

但当前渲染层还没有完整 renderer。

还缺少：

- 表格边框、单元格背景、合并单元格、文本样式。
- 图表转换为 SVG / Canvas / HTML。
- SmartArt 结构化布局。
- diagram 子节点高保真还原。

### 4.3 字体与文本布局系统

当前文本依赖浏览器 HTML/CSS 渲染，已经修复了一些具体问题，但距离 WPS/PowerPoint 还原还有差距。

还缺少：

- 字体加载策略。
- 缺失字体 fallback 策略。
- PPT 段落 spacing。
- bullet indent / hanging indent。
- rich text run 级样式精确映射。
- CJK 换行策略。
- vertical text 精细处理。
- 文本框 autofit / shrink text。
- text body margin/inset 更系统的解析与测试。

### 4.4 大文件性能策略

架构文档提到的大文件策略尚未完整落地。

还缺少：

- slide runtime cache。
- 关键页索引预计算。
- Worker 解析。
- 分页懒 normalize。
- 图片 decode 预热。
- 媒体缓存窗口。

### 4.5 测试与回归体系

当前仓库没有成体系的测试文件。

还缺少：

- normalize 单元测试。
- XML 增强 fixture 测试。
- Runtime 状态机测试。
- Timeline Engine 测试。
- Transition Engine 测试。
- Media Engine 测试。
- Playwright 截图回归。
- WPS / PowerPoint 对比基准图。

这部分非常重要，因为当前问题主要来自 PPT 还原细节，没有测试就容易出现“修了这一页，影响另一页”的情况。

## 5. 当前实现与架构文档的阶段对应

### 阶段 1：替换解析输入层

完成度：较高。

已经完成：

- 引入 `pptxtojson`。
- 新增 `parseWithPptxtojson.ts`。
- 新增 `normalizePresentation.ts`。
- 基础渲染器可消费 normalized model。

仍需补齐：

- parser enhancement 模块拆分。
- 更多 PPT XML 细节增强。
- fixture 测试。

### 阶段 2：重构 Runtime

完成度：中等偏低。

已经完成：

- 有 Runtime facade。
- 有 session state。
- 有基础 tick。
- 有基础 trigger。
- 有基础 transition progress。

仍需补齐：

- Session Store 独立化。
- Timeline Engine 独立化。
- Transition Engine 独立化。
- Media Engine 独立化。
- Playback Policy Engine 独立化。
- Input Engine 实现。

### 阶段 3：重构渲染层

完成度：中等。

已经完成：

- Vue 组件只消费 frame 和 runtime props。
- 有 `ElementRenderer` 分发基础元素。
- 有 `SlideViewport` 和 `PresentationStage`。

仍需补齐：

- `TransitionStage`。
- `MediaRenderer`。
- table/chart/diagram renderer。
- overlay layer。
- annotation / laser pointer。
- timeline scrubber。

## 6. 建议后续优先级

### P0：先稳住高保真还原基础设施

优先原因：

当前用户反馈的问题主要集中在 PPT/WPS 对比还原，例如：

- 文本位置偏移。
- 文本换行不一致。
- bullet 符号不一致。
- 箭头不显示。
- 虚线框显示错误。
- 背景缺失。

建议先做：

- 建立 PPT fixture。
- 建立 WPS 对比截图。
- 为 `textBodyInsets.ts` 这类 XML 增强逻辑加测试。
- 将 XML 增强拆成多个模块。
- 对文本、形状、线条、图片辅助框建立回归用例。

### P1：拆 Runtime Engine

建议拆分顺序：

1. Session Store
2. Playback Policy Engine
3. Timeline Engine
4. Transition Engine
5. Input Engine
6. Media Engine

先拆 Session 和 Policy，可以降低当前 `createPresentationRuntime.ts` 的复杂度。

### P2：补完整 Timeline / Transition

建议先做：

- 支持更多 animation effect。
- 支持动画 delay。
- 支持 animation progress 输出。
- 支持按 `transition.type` 分发转场。
- 新增 `TransitionStage.vue`。

### P3：补 Media Engine 与大文件策略

建议做：

- media registry。
- preload current / next。
- release far slides。
- sync play / pause / seek / mute。
- Worker 解析。
- slide runtime cache。

### P4：补演示增强能力

建议做：

- keyboard hotkeys。
- TimelineScrubber。
- LaserPointerLayer。
- AnnotationLayer。
- FullscreenOverlay。
- 完整 Presenter Mode。

## 7. 当前最值得先处理的问题

从当前项目状态看，最优先的不是继续大拆架构，而是先把“还原一致性”做稳。

建议下一步从这几件事开始：

1. 把 `textBodyInsets.ts` 拆成更明确的 XML 增强模块。
2. 增加 fixture 测试，覆盖文本 inset、bullet、line marker、辅助框过滤。
3. 给当前用户反馈过的 PPT 页面建立截图回归。
4. 再逐步拆 Runtime engine，避免一边大重构一边继续引入还原偏差。

这样可以先保证“看起来对”，再逐步补齐“架构上完整”。
