# pptxtojson Runtime 架构落地差距分析（按当前代码状态更新）

本文档基于 [pptxtojson-runtime-architecture.md](./pptxtojson-runtime-architecture.md)，结合当前 `ppt-preview` 仓库代码，对“已经完成、部分完成、仍未完成”的能力做一次按现状更新的梳理。

结论先行：

- 当前项目已经不是“只有 demo 级骨架”，主链路和一批高保真补丁已经落地。
- 当前最大差距不在上传/解析/基础播放，而在：
  - Runtime engine 还没有拆分
  - Timeline / Transition / Media 还没有形成独立系统
  - table / chart / diagram 等复杂元素仍未渲染
  - 测试、fixture、视觉回归体系仍然缺失

---

## 1. 当前总体结论

当前项目已经具备下面这条可运行主链路：

```text
PPTX File
  -> pptxtojson.parse()
  -> normalizePresentation()
  -> createPresentationRuntime()
  -> evaluatePresentationFrame()
  -> Vue Render Components
```

也就是说：

- 解析输入层已经切到 `pptxtojson`
- 已经有标准化模型层
- 已经有基础 Runtime facade
- 已经有 Evaluator
- 已经有 Vue 渲染层

但对照架构文档，当前实现还没有达到“完整商业级 PPT Runtime”的目标。它现在更接近：

> 一个已经能持续修 PPT 还原问题的播放内核雏形，而不是完整模块化、可验证、可扩展的播放平台。

---

## 2. 已经完成的部分

### 2.1 解析与标准化主链路

当前项目已经完成 `pptxtojson -> normalize -> runtime` 这条主链路。

相关文件：

- [src/adapters/pptxtojson/parseWithPptxtojson.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/parseWithPptxtojson.ts)
- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)
- [src/types/presentation.ts](/Applications/work/ppt-preview/src/types/presentation.ts)

当前标准化模型已经覆盖：

- presentation 尺寸、主题色、字体
- slide 背景、备注、transition、autoplay
- element 坐标、尺寸、旋转、样式
- image / video / audio / math 媒体
- shape 元信息
- 基础 animation 元数据

### 2.2 基础 Runtime facade

当前已经有统一播放入口 [createPresentationRuntime.ts](/Applications/work/ppt-preview/src/runtime/createPresentationRuntime.ts)。

已支持：

- 播放 / 暂停
- 下一步 / 上一步
- 下一页 / 上一页
- 跳页
- seek
- 静音
- 全屏状态
- 演讲者模式状态
- 循环播放
- 倍速
- `requestAnimationFrame` 驱动的 `tick`

### 2.3 基础 Evaluator

[evaluatePresentationFrame.ts](/Applications/work/ppt-preview/src/runtime/evaluatePresentationFrame.ts) 已经可以根据 runtime state 输出 frame。

当前已输出：

- 当前页
- 上一页
- 下一页
- transition progress
- element visible
- element opacity
- element transform
- element style
- element bounds
- element media
- element shape

### 2.4 Vue 播放器渲染层

当前已经具备基础播放器 UI 和页面渲染。

相关组件：

- [src/components/presentation/PresentationShell.vue](/Applications/work/ppt-preview/src/components/presentation/PresentationShell.vue)
- [src/components/presentation/PresentationStage.vue](/Applications/work/ppt-preview/src/components/presentation/PresentationStage.vue)
- [src/components/presentation/SlideViewport.vue](/Applications/work/ppt-preview/src/components/presentation/SlideViewport.vue)
- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)
- [src/components/presentation/PlaybackToolbar.vue](/Applications/work/ppt-preview/src/components/presentation/PlaybackToolbar.vue)
- [src/components/presentation/PresenterPanel.vue](/Applications/work/ppt-preview/src/components/presentation/PresenterPanel.vue)

当前实际可渲染的元素包括：

- `text`
- `image`
- `shape`
- `video`
- `audio`
- `math`
- `group`

### 2.5 XML 增强层已经明显强于旧分析

旧 gap 文档里把这部分描述得偏保守。实际上，[textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts) 现在已经承担了一批高保真增强职责：

- 读取 `a:bodyPr` 的 text inset
- 读取自定义 bullet 字符与 bullet font
- 读取 `headEnd / tailEnd`
- 读取 placeholder `type / idx`
- 修正“扩展名是 png，文件内容其实是 svg”的媒体 MIME

这意味着解析层已经不仅是“补 inset”，而是在逐步承担 parser enhancer 的角色。

### 2.6 高保真渲染补丁已经落地一批

[normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts) 和 [ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue) 里，已经补了不少旧文档里还没更新进去的能力：

- 图片裁剪 `srcRect`
- 重复文本颜色统一
- placeholder 主题色兜底
- math 媒体资源兜底
- text inset 作为 `padding` 参与布局
- `NBSP / 窄不换行空格` 标准化
- bullet 空白项过滤
- 短文本单行显示启发式
- 字号从 HTML run 里回读
- 居中标题不误压成单行
- `rect / roundRect` 走 CSS 盒子渲染而不是 SVG path
- shape 背景层与文本层拆开
- media crop 的 CSS 渲染

换句话说，当前项目已经开始形成“解析增强 + 归一化兜底 + 渲染层修正”的三层补丁体系。

---

## 3. 部分完成但还不完整的部分

### 3.1 Runtime 还没有拆成独立 engine

架构文档目标是：

```text
Presentation Runtime Facade
├─ Session Store
├─ Timeline Engine
├─ Transition Engine
├─ Media Engine
├─ Playback Policy Engine
└─ Input Engine
```

当前这些能力仍然主要集中在 [createPresentationRuntime.ts](/Applications/work/ppt-preview/src/runtime/createPresentationRuntime.ts) 一个文件里。

已经有的只是：

- facade
- 一份集中式 runtime state
- 基础 tick
- 基础 slide/trigger/transition 处理

还没有真正拆出：

- Session Store
- Timeline Engine
- Transition Engine
- Media Engine
- Playback Policy Engine
- Input Engine

### 3.2 Timeline 只有基础时序

当前 `NormalizedAnimation` 与 evaluator 只支持：

- `appear`
- `fade`
- `onClick`
- `withPrevious`
- `afterPrevious`

仍然缺少：

- entrance 动画细分效果
- exit 动画
- emphasis 动画
- motion path
- trigger group
- 段落级触发
- delay / easing / repeat
- 更完整的动画时间线建模

所以当前更像是“基础可见性/透明度调度”，不是完整 PPT timeline runtime。

### 3.3 Transition 只有简化过渡

当前系统有：

- transition 元数据
- transition progress
- `SlideViewport.vue` 中基础 opacity / transform 过渡

但仍然没有按 `transition.type` 派发真实转场 renderer。

仍未形成独立的 Transition Engine，也还没有系统支持：

- fade
- push
- cover
- uncover
- wipe
- split
- zoom

### 3.4 Media 还没有生命周期调度

当前媒体层已经有：

- object URL 生成
- 释放旧 presentation 的 object URL
- image / video / audio / math 的基础渲染
- MIME 修正和部分资源兜底

但还没有形成架构文档要求的 Media Engine。

仍然缺少：

- 媒体注册表
- preload current / next
- release far slides
- video/audio 与 runtime play/pause 同步
- video/audio seek / mute 同步
- 媒体加载失败 fallback
- poster / 首帧策略
- 大媒体懒加载

### 3.5 Evaluator 还只是基础 frame evaluator

当前 Evaluator 已经够基础播放使用，但还没有扩展成完整 frame 计算层。

仍然缺少：

- `clipPath`
- 精细 animation progress frame
- typed transition frame
- media playback frame
- overlay frame
- pointer / annotation frame

### 3.6 Presenter Mode 仍然只是基础面板

当前 [PresenterPanel.vue](/Applications/work/ppt-preview/src/components/presentation/PresenterPanel.vue) 已经能显示：

- 当前页名称
- 当前页备注
- 页内时间
- 点击触发计数
- 自动翻页进度
- 字体数
- 主题色

但还不是完整演讲者模式。

仍然缺：

- 当前页 / 下一页双预览
- 演讲计时器
- 备注字号控制
- 专用快捷操作
- 演讲者视图和观众视图分离

---

## 4. 仍然没做的部分

### 4.1 Input Engine

当前没有独立输入系统。

仍然缺少：

- 键盘快捷键体系
- 空格播放/暂停或下一步
- 左右方向键翻页
- 触摸滑动
- 点击舞台推进
- 全屏快捷控制
- Presenter 模式快捷控制

### 4.2 复杂元素 renderer

类型层已经声明了：

- `table`
- `chart`
- `diagram`

但当前真正渲染层并没有完整 renderer。

这意味着：

- table 还没做
- chart 还没做
- diagram / SmartArt 类还没做

当前系统对复杂 PPT 的兼容瓶颈，已经明显落到这里。

### 4.3 渲染层专用组件体系

架构文档里建议的组件中，当前还缺：

- `TransitionStage.vue`
- `MediaRenderer.vue`
- `TimelineScrubber.vue`
- `overlays/FullscreenOverlay.vue`
- `overlays/LaserPointerLayer.vue`
- `overlays/AnnotationLayer.vue`

目前媒体、文本、形状等都继续堆在 [ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue) 中，后续复杂度会继续上升。

### 4.4 文本布局系统的系统化能力

虽然这部分已经修了很多具体问题，但系统化能力仍然不足。

仍然缺少：

- 字体加载策略
- 缺失字体 fallback 策略
- 段落 spacing 精准映射
- bullet indent / hanging indent 系统化解析
- rich text run 级样式完整映射
- CJK 换行策略
- vertical text 的系统化处理
- autofit / shrink text
- 系统化的文本布局测试

### 4.5 性能层与大文件策略

架构文档提到的大文件策略，当前基本还没落地。

仍然缺少：

- slide runtime cache
- 关键页索引预计算
- Worker 解析
- 分页懒 normalize
- 图片 decode 预热
- 媒体缓存窗口

### 4.6 测试与视觉回归体系

这部分仍然是当前项目最明显的工程短板之一。

仍然缺少：

- normalize 单元测试
- XML 增强 fixture 测试
- runtime 状态机测试
- timeline 测试
- transition 测试
- media 测试
- Playwright 截图回归
- WPS / PowerPoint 对比基准图

目前大量问题都来自“某个具体 PPT 页面还原不一致”，如果没有 fixture 和视觉回归，修复会持续互相影响。

---

## 5. 当前代码状态与架构文档的阶段对应

### 阶段 1：替换解析输入层

完成度：高。

已经完成：

- 接入 `pptxtojson`
- 建立标准化模型
- 建立 XML enhancer
- 归一化后直接驱动播放器

仍需补齐：

- enhancer 模块继续拆分
- fixture 测试
- 更系统的主题/字体/文本布局增强

### 阶段 2：重构 Runtime

完成度：中等偏低。

已经完成：

- 有 runtime facade
- 有集中 state
- 有基础 tick
- 有基础 trigger
- 有基础 transition progress

仍需补齐：

- Session Store 独立化
- Timeline Engine 独立化
- Transition Engine 独立化
- Media Engine 独立化
- Playback Policy Engine 独立化
- Input Engine 实现

### 阶段 3：重构渲染层

完成度：中等。

已经完成：

- Vue 组件只消费 frame/runtime
- 有基础 slide viewport
- 有 element renderer
- 有 presenter 面板

仍需补齐：

- `TransitionStage`
- `MediaRenderer`
- table/chart/diagram renderer
- overlay layer
- annotation / laser pointer
- timeline scrubber

---

## 6. 当前最核心的未完成项

如果只挑最影响项目演进的几项，当前最核心还没做的是：

1. **没有模块化 Runtime engine**
2. **没有完整 Timeline / Transition / Media 系统**
3. **没有 table/chart/diagram renderer**
4. **没有回归测试和视觉基准**

这 4 项决定了项目是否能从“持续 patch 某些 PPT”走向“稳定支持一批 PPT 模板”。

---

## 7. 建议的后续优先级

### P0：先补回归能力，而不是继续堆散点修复

建议先做：

- 建立 PPT fixture 集
- 为 XML enhancer 加 fixture 测试
- 为关键页面加截图回归
- 固定一批 WPS / PowerPoint 对照基准图

原因：

当前项目最容易出问题的环节，是“某个具体 PPT 页面还原细节”。没有回归体系，修一个页面很容易影响另一个。

### P1：拆 Runtime engine

建议拆分顺序：

1. Session Store
2. Playback Policy Engine
3. Timeline Engine
4. Transition Engine
5. Media Engine
6. Input Engine

### P2：补完整 Timeline / Transition / Media

建议优先做：

- animation progress
- 更多 animation effect
- typed transition dispatch
- media play/pause/seek/mute 同步

### P3：补复杂元素 renderer

优先顺序建议：

1. table
2. chart
3. diagram / SmartArt

### P4：补演示增强能力

建议做：

- keyboard hotkeys
- presenter dual view
- timeline scrubber
- laser pointer
- annotation
- fullscreen overlay

---

## 8. 一句话判断

当前项目已经具备“继续修高保真问题”的技术底座，但还没有完成架构文档里定义的完整播放平台能力。

如果后续目标是“稳定支持更多真实 PPT 模板”，接下来最该补的不是再加一层零散 patch，而是：

> 回归体系、Runtime engine 拆分、Timeline/Transition/Media 系统化、复杂元素 renderer。

---

## 9. 实施路线图

下面这份路线图按“先稳住正确性，再拆架构，再补能力”的顺序安排。

### 阶段 A：建立回归基线

目标：

- 让后续改动可验证，避免继续靠人工比对单页问题回归

建议周期：

- 1 周

建议交付物：

- `fixtures/` 目录，收敛当前高频问题 PPT
- 每个 fixture 的页面清单和问题标签
- XML enhancer 的最小单元测试
- 关键页面截图基准
- 一份“当前支持范围”清单

建议优先覆盖的 fixture：

- `4b00a85c247c47bdaeb01aeec562c90f.pptx`
- `区级平台介绍.pptx`
- `watercolor.pptx`
- `math_calculus_formulas.pptx`

这一阶段结束标准：

- 能稳定复现文本、颜色、箭头、bullet、crop、math 资源问题
- 每次修复后可以自动验证是否影响既有页面

### 阶段 B：整理解析增强层

目标：

- 把当前分散在 enhancer 和 normalize 里的高保真补丁整理成可维护结构

建议周期：

- 1 周

建议交付物：

- 将 [textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts) 按职责拆分
- 明确 `placeholder / bullet / line marker / text inset / media mime` 几类 enhancer 边界
- 为 enhancer 增加 fixture 测试
- 统一 raw element 扩展字段定义

建议拆分方向：

- `enhancers/text-body.ts`
- `enhancers/bullets.ts`
- `enhancers/line-markers.ts`
- `enhancers/placeholders.ts`
- `enhancers/media-mime.ts`

这一阶段结束标准：

- enhancer 不再是单个大文件堆逻辑
- 新增某类 PPT XML 补丁时，有明确落点

### 阶段 C：拆 Runtime Engine

目标：

- 把当前集中在 [createPresentationRuntime.ts](/Applications/work/ppt-preview/src/runtime/createPresentationRuntime.ts) 的逻辑拆成可演进模块

建议周期：

- 1 到 2 周

建议交付物：

- `session-store.ts`
- `playback-policy.ts`
- `timeline-engine.ts`
- `transition-engine.ts`
- `media-engine.ts`
- `input-engine.ts`

建议拆分顺序：

1. Session Store
2. Playback Policy
3. Timeline Engine
4. Transition Engine
5. Media Engine
6. Input Engine

原因：

- Session 与 Policy 最容易先抽离
- Timeline / Transition / Media 是后续功能增量的主要落点
- Input 最后接入，避免过早耦合 UI

这一阶段结束标准：

- `createPresentationRuntime.ts` 只剩 facade 和装配逻辑
- runtime state 读写边界明确

### 阶段 D：补完整 Timeline / Transition / Media

目标：

- 从“基础播放”升级到“像 PPT 的播放”

建议周期：

- 2 周

建议交付物：

- animation progress frame
- 更多 animation effect 支持
- typed transition dispatch
- video/audio 与 runtime 同步
- preload / release 策略
- transition renderer 组件

建议优先做的能力：

- `fade / appear` 之外的基础动画
- transition type 到 renderer 的映射
- 媒体 `play/pause/seek/mute` 同步
- slide 级 preload current / next

这一阶段结束标准：

- 动画和转场不再只是“统一 opacity/transform 过渡”
- 媒体元素开始真正受 runtime 控制

### 阶段 E：补复杂元素 Renderer

目标：

- 解决当前类型声明存在、但实际不能渲染的问题

建议周期：

- 2 周

建议交付物：

- `TableRenderer`
- `ChartRenderer`
- `DiagramRenderer`
- 对应 fixture 与回归样例

建议优先顺序：

1. `table`
2. `chart`
3. `diagram`

原因：

- `table` 是业务 PPT 中最常见且最容易暴露缺口的复杂元素
- `chart` 和 `diagram` 适合放在有回归体系之后做

这一阶段结束标准：

- `NormalizedElementType` 中声明的复杂元素，不再只是类型占位

### 阶段 F：补演示增强能力

目标：

- 让播放器从“可预览”升级到“可演示”

建议周期：

- 1 到 2 周

建议交付物：

- keyboard hotkeys
- presenter dual view
- timeline scrubber
- laser pointer
- annotation layer
- fullscreen overlay

这一阶段结束标准：

- 演示模式不再只是基础面板
- 用户可以用接近真实演示工具的方式操作播放器

### 里程碑建议

如果按里程碑看，建议分成 3 个版本：

- `M1 正确性版本`
  - 完成阶段 A + B
  - 重点是回归体系和 enhancer 整理

- `M2 Runtime 版本`
  - 完成阶段 C + D
  - 重点是 engine 拆分、动画、转场、媒体调度

- `M3 完整展示版本`
  - 完成阶段 E + F
  - 重点是复杂元素与演示增强

### 最低可执行顺序

如果只保留最必要的顺序，建议按下面执行：

1. 建 fixture 和截图回归
2. 拆 enhancer
3. 拆 runtime facade
4. 补 timeline / transition / media
5. 补 table
6. 再补 chart / diagram / presenter 增强

这条路线的核心是：

> 先让“修复是可控的”，再让“架构是可演进的”，最后补“功能完整性”。
