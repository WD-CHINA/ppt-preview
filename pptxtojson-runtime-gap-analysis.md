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
- 最小 `motionPath` 描述符（translate/rotate）

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
- `table`（首批基础结构/文本/行列尺寸/单元格样式；已补基础 typography 字段）
- `video`
- `audio`
- `math`
- `group`

### 2.5 XML 增强层已经明显强于旧分析，并开始模块化

旧 gap 文档里把这部分描述得偏保守。实际上，当前 XML enhancer 已经承担一批高保真增强职责，并已开始从单文件拆成模块。

当前入口仍是 [textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)，但具体职责已经落到：

- [enhancers/text-body.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/text-body.ts)：读取 `a:bodyPr` text inset、placeholder `type / idx`
- [enhancers/bullets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/bullets.ts)：读取自定义 bullet 字符与 bullet font，并兼容 `Wingdings + ü -> √`
- [enhancers/line-markers.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/line-markers.ts)：读取 `headEnd / tailEnd`
- [enhancers/media-mime.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/media-mime.ts)：修正“扩展名是 png，文件内容其实是 svg”的媒体 MIME
- [enhancers/raw-enhancements.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/raw-enhancements.ts)：统一 enhancer-owned raw element 字段写入边界
- [enhancers/shared.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/shared.ts)：共享 shape name / order 工具

这意味着解析层已经不仅是“补 inset”，而是在逐步承担 parser enhancer 的角色，并开始具备可测试边界。

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
- line marker 已从“统一三角形”升级到最小 type-aware 渲染（`triangle / stealth / diamond / oval`），并通过独立 helper 输出 marker path/size/orient
- `straightConnector1` 等 open line shape 已不再误把 `background` 当成 SVG fill；当前会把背景色回退为 stroke，使真实页中的箭头连线重新可见

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

当前 `NormalizedAnimation` 与 evaluator 已支持：

- `appear`
- `fade`
- `onClick`
- `withPrevious`
- `afterPrevious`
- 最小 `motionPath` 描述符（`xFrom / yFrom / xTo / yTo / rotateFrom / rotateTo`）
- `Timeline Engine` 纯函数输出 motion geometry：`progress / translateX / translateY / rotate`
- `Evaluator` 将 motion geometry 投影到 `EvaluatedElementFrame.bounds`，并额外透出 `animationGeometry`

仍然缺少：

- entrance 动画细分效果
- exit 动画
- emphasis 动画
- 真实 PPT 复杂 motion path（二次路径、多段 path、相对路径）
- trigger group
- 段落级触发
- delay / easing / repeat
- 更完整的动画时间线建模

所以当前已不再只是“基础可见性/透明度调度”，而是进入了“基础可见性/透明度 + 最小 motion geometry”的阶段；但距离完整 PPT timeline runtime 还很远。

补充：在真实 `4b00...pptx` 第 4 / 7 页 browser 复验中，connector 缺失的主因之一已被定位并修正：`straightConnector1` 这类 open line shape 过去把 `style.background` 当成 SVG fill，导致线身不可见而只剩 marker。当前 renderer 已改为 line-like shape 用背景色回退成 stroke、fill 设为 `none`，箭头/连线已重新可见；剩余问题主要收敛到 marker 精度、线长统一性和端点/文字锚点对齐。

补充：在真实 `演示文稿1.pptx` 里，slide XML 的 `p:timing` 当前只有 timing root，没有对象级 timing children；因此它适合作为“页面转场 + 自动播放”回归样本，不适合作为对象入场动画解析样本。对象级 entrance animation 解析仍需另找包含 `anim/animEffect/seq` 等 timing children 的真实 PPTX。

补充：但这条判断现在必须和真实 WPS 对照分开写。macOS 权限打开后，已经可以用 `osascript + screencapture + ffmpeg(avfoundation)` 直接录制 WPS 放映；该链路下，`演示文稿1.pptx` 仍会给出“第 2 张内容按顺序出现”“slide3 -> slide4 的视觉过渡不像当前浏览器里的固定 wipe 边界”这类用户可感知差异。当前更准确的说法应是：**当前 parser/runtime 没有从这份二进制里读出对象级动画，也还没把转场视觉还原对齐到 WPS；但不能再把它表述成‘文件本身没有这些效果’。** 另外，上游 `pptxtojson@2.0.2` 源码当前只实现了 `p:transition` 解析，没有对象级 timing/build parser，因此对象动画解析缺口不仅在这份样本，也在当前 parser 能力本身。当前仓库已经补了一个最小 timing parser 切片：可从 slide XML 的 `p:timing` 中提取 `clickEffect / withEffect / afterEffect`、`spTgt spid`、`cBhvr > cTn dur` 以及可选 `p:pRg st`，并注入 `slide.animations`；这足以覆盖 `47e66b31...pptx` 一类 click-triggered timing 样本，但距离完整 paragraph build / `bldLst` / Office 对象动画仍有明显差距。

### 3.3 Transition 只有简化过渡

当前系统有：

- transition 元数据
- 通过 slide XML enhancer 回填 `advTm -> slide.autoplay.advanceAfterMs`
- `transitionViewportModel.ts` 中针对 `fade / push / wipe` 的最小 typed viewport 中间态
- `push` 已开始支持 `direction`，当前已用真实 `47e66b31f89d4b33b14c5010b92296c5.pptx` 复验 `dir="u"` 的垂直推进（XML 实际命中 `slide2/6/7` 的 `<p:push dir="u"/>`）
- `wipe` 已支持 `direction`，当前最小 renderer 会按 `dir="r/l/u/d"` 派发四向 clip-path 揭示；仓库内已新增 `wipe-directions-fixture.pptx` 作为真实 `wipe dir` browser regression 样本
- 已开始把真实转场回归流程系统化：新增 `fixtures/transition-regression-cases.md`、`fixtures/transition-regression-baseline.json` 与 `public/transition-regression-harness.js`，覆盖 `fade / push / wipe` 的固定 progress 中间态证据收集
- `SlideViewport.vue` 中按 `transition.type` 派发对应的 opacity / translateX / clip-path 样式
- Runtime / Evaluator 已按 WPS 对照修正为 destination-slide transition 语义：翻页中 current viewport 与 transition `type/duration/direction` 都取目标页；`transitionFromSlideIndex` 仅继续用于 previous viewport 内容来源。`演示文稿1.pptx` 下已复验：`slide1 -> slide2` 更接近 `push`，`slide3 -> slide4` 更接近 `fade`
- `PresentationStage` 已改为只在 transition active 时挂 previous viewport，且 viewport style 显式 `transition: none`，避免非转场态 residual DOM + CSS 插值造成拖尾

但仍然没有形成完整的 Transition Engine renderer 分发系统。

仍未系统支持：

- wipe 的更系统视觉回归（方向虽已支持，但还没做真实页中间态对照）
- cover
- uncover
- split
- zoom
- 更高保真的 easing / mask / clip 几何
- 对照真实 PPT 的系统截图回归

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

当前已经有基础输入系统。

已经支持：

- 键盘快捷键体系基础版
- Space 播放/暂停
- 左右方向键翻页
- Enter / 舞台点击推进
- 触摸横向滑动翻页
- F 全屏切换
- Esc 退出全屏
- P 切换 Presenter 模式
- editable target 与 ctrl/meta/alt 组合键保护

仍然缺少：

- 可配置快捷键 schema
- 空格“播放/暂停或下一步”的可配置策略
- Presenter 模式专用快捷控制
- 激光笔 / 标注模式输入路由
- 更复杂触摸手势

### 4.2 复杂元素 renderer

类型层已经声明了：

- `table`（已有首批基础 renderer）
- `chart`
- `diagram`

但当前复杂元素 renderer 仍不完整。

这意味着：

- table 已能渲染基础结构、文本、行列尺寸、cell span、基础 fill/font/border/vAlign，并已过滤 `hMerge / vMerge` continuation cell；fallback border 已按 row/column position 收敛以避免内部双线；基础 typography 已支持 `fontFamily / fontSize / fontItalic / fontUnderline`，且已对小字号 cell 增加首轮 `lineHeight/padding` 补强并把 `overflow-wrap` 从 `anywhere` 收紧为 `break-word`，又对单个长英文标签补了第二轮“缩小字号 + keep-all”策略，并在第三轮把列宽感知（`colWidths + columnIndex + colSpan`）纳入 typography 决策，第四轮开始读取 HTML paragraph 结构，对多段正文走单独的 line-height/padding 策略，第五轮开始读取 run 级 `font-size` 作为 effective font size 参与 typography bucket；已定位真实 table 页进入 fixture 索引，并已完成 `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 5 / 24 / 26 / 31 页、`AI Beatify Slides Example.pptx` 第 4 页、`83f822650ce0499c835780f673faed2b.pptx` 第 4 页的浏览器视觉冒烟验证；当前未见明显结构错位、重复渲染或内部双线，但 typography 仍是主问题，尤其是小字偏小、行高偏紧、英文单词断裂与局部裁切；真实页表明即使补了列宽感知、paragraph-aware 和 run-level font-size 规则，cell 级启发式仍不够，后续需要更完整的 paragraph/run 级策略；还缺完整 Office table theme/style、更完整的 cell padding/line-height/run 级 typography 与真实 PPT 截图回归
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

- enhancer 模块继续拆分（首批 `text-body / bullets / line-markers / media-mime / raw-enhancements / shared` 已完成）
- fixture 测试（首批 bullet / text-body / line marker / media MIME / raw enhancement 合成测试已完成）
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
- chart/diagram renderer（`TableRenderer` 首批基础版已完成）
- overlay layer
- annotation / laser pointer
- timeline scrubber

---

## 6. 当前最核心的未完成项

如果只挑最影响项目演进的几项，当前最核心还没做的是：

1. **没有模块化 Runtime engine**
2. **没有完整 Timeline / Transition / Media 系统**
3. **复杂元素 renderer 仍不完整（table 首批基础版已完成，chart/diagram 未做）**
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

当前进展：

- `table` 首批基础版已完成：`NormalizedTableMeta`、`TableRenderer.vue`、`tableModel.ts`、normalize/tableModel 合成测试
- `table` 第二批合并单元格补强已完成：过滤 `hMerge / vMerge` continuation cell，并已扫描真实 PPTX table 页写入 fixture 索引
- `table` 第三批边框补强已完成：fallback border 由 `tableModel.ts` 按 row/column position 生成，避免 CSS class 四边框造成内部双线
- `table` 第四批真实页验证已完成：浏览器加载 `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 24 页，table 结构可读且 console 无错误；底部说明文字偏小/换行紧，归入后续 table cell typography

优先顺序建议：

1. table 完整度补强（Office table theme/style、合并隐藏项、真实 PPT 截图回归）
2. chart
3. diagram / SmartArt

### P4：补演示增强能力

建议做：

- configurable keyboard hotkeys
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
- XML enhancer 的最小单元测试（首批 bullet / text-body / line marker / media MIME / raw enhancement 已完成）
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

- 将 [textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts) 按职责拆分（首批已完成，入口保留 orchestration）
- 已建立首批 enhancer 模块：
  - `enhancers/text-body.ts`
  - `enhancers/bullets.ts`
  - `enhancers/line-markers.ts`
  - `enhancers/media-mime.ts`
  - `enhancers/raw-enhancements.ts`
  - `enhancers/shared.ts`
- 明确 `placeholder / bullet / line marker / text inset / media mime` 几类 enhancer 边界
- 为 enhancer 增加 fixture 测试（首批 bullet / text-body / line marker / media MIME / raw enhancement 已完成）
- 统一 raw element 扩展字段定义（已先用 `raw-enhancements.ts` 收敛 enhancer-owned 字段写入）

建议拆分方向：

- `enhancers/text-body.ts`（已完成首批拆分）
- `enhancers/bullets.ts`（已完成首批拆分）
- `enhancers/line-markers.ts`（已完成首批拆分）
- `enhancers/placeholders.ts`
- `enhancers/media-mime.ts`（已完成首批拆分）
- `enhancers/raw-enhancements.ts`（已完成首批字段写入收敛）

这一阶段结束标准：

- enhancer 不再是单个大文件堆逻辑
- 新增某类 PPT XML 补丁时，有明确落点

### 阶段 C：拆 Runtime Engine

当前进展（本轮更新）：

- 已先抽出 `Session Store`：`src/runtime/session/sessionStore.ts`
- 已先抽出 `Playback Policy`：`src/runtime/policy/playbackPolicy.ts`
- 已抽出基础 `Timeline Engine`：`src/runtime/timeline/timelineEngine.ts`
- 已抽出基础 `Transition Engine`：`src/runtime/transition/transitionEngine.ts`
- 已抽出基础 `Media Engine`：`src/runtime/media/mediaEngine.ts`
- 已抽出基础 `Input Engine`：`src/runtime/input/inputEngine.ts`
- 已增加 Runtime 合成回归测试：
  - `src/runtime/createPresentationRuntime.test.ts`
  - `src/runtime/sessionStore.test.ts`
  - `src/runtime/input/inputEngine.test.ts`
  - `src/runtime/media/mediaEngine.test.ts`
  - `src/runtime/evaluatePresentationFrame.test.ts`
  - `src/runtime/timeline/timelineEngine.test.ts`
  - `src/runtime/transition/transitionEngine.test.ts`
- `createPresentationRuntime.ts` 仍是 facade + tick 编排入口，后续继续把 Timeline/Transition/Media/Input 扩展到更完整效果与可配置策略

目标：

- 把当前集中在 [createPresentationRuntime.ts](/Applications/work/ppt-preview/src/runtime/createPresentationRuntime.ts) 的逻辑拆成可演进模块

建议周期：

- 1 到 2 周

建议交付物：

- `session-store.ts`
- `playback-policy.ts`
- `timeline-engine.ts`
- `transition-engine.ts`
- `media-engine.ts`（基础 registry/cache/playback plan 已完成，仍需 DOM sync 与失败回退）
- `input-engine.ts`（基础 keyboard/pointer/touch command mapping 已完成，仍需可配置快捷键与扩展输入路由）

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

- `TableRenderer`（首批基础版已完成：结构/文本/行列尺寸/基础 cell 样式；第二批已补 `hMerge / vMerge` continuation 过滤与真实 table 页索引；第三批已补 fallback border collapse；第四批已做真实页浏览器冒烟验证；第五批已补基础 typography 字段；第六批已补 `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 26 / 31 页浏览器冒烟验证；第七批已完成剩余真实 table 页验证并补小字号 typography 首轮策略；仍需完整 table theme、cell padding/line-height/run 级 typography 与真实 PPT 截图回归）
- `ChartRenderer`
- `DiagramRenderer`
- 对应 fixture 与回归样例

建议优先顺序：

1. `table` 完整度补强
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

- configurable keyboard hotkeys
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
5. 补 table 完整度
6. 再补 chart / diagram / presenter 增强

这条路线的核心是：

> 先让“修复是可控的”，再让“架构是可演进的”，最后补“功能完整性”。
