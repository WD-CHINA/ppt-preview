# 修复方案知识库

本文档记录已经在当前项目中验证有效的修复方案，以及对应代码落点。

## 1. 文本布局类

### 1.1 用 `padding` 还原 `a:bodyPr` inset

适用问题：

- 文本 left/top 偏移
- 文本框内容和 WPS 不对齐

实践方案：

- 从 slide XML 读取 `a:bodyPr`
- 将 `left/right/top/bottom` inset 注入 raw element
- 在渲染层作为 `padding` 参与布局，而不是只改 `margin`

代码落点：

- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)
- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

### 1.2 单行文本不要只按字数判断

适用问题：

- 窄文本框不该单行却被强制单行
- 标题应换行却被压成一行

实践方案：

- 单行模式同时参考：
  - 文本实际宽度
  - 元素宽度
  - 字号
  - 对齐方式
  - 是否是句子型文本
- 居中对齐、大字号、带标点的句子型文本，不进入单行压缩

代码落点：

- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

### 1.3 标准化不换行空格

适用问题：

- 英文句子完全不换行

实践方案：

- 在 HTML 清洗阶段把 `NBSP / 窄不换行空格` 转成普通空格

代码落点：

- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

## 2. 文本颜色类

### 2.1 同页重复文本颜色统一

适用问题：

- 左边颜色正确，中间和右边变黑

实践方案：

- 在同一页内，按“文案 + 字号 + 版式”构造签名
- 如果同组中有元素拿到了正确颜色，其余掉成默认黑色，则回填同组颜色

代码落点：

- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)

### 2.2 placeholder 主题色兜底

适用问题：

- 模板正文应继承主题色，但掉成默认黑色

实践方案：

- 从 enhancer 中读取 `placeholderType / placeholderIndex`
- 在 normalize 阶段，对 `body / subTitle` 占位符回填主题浅色文本色

代码落点：

- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)
- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)

## 3. bullet 与列表类

### 3.1 读取自定义 bullet 字符与字体

适用问题：

- `√` 显示成点或乱码

实践方案：

- 从 XML 读取 `a:buChar` 和 `a:buFont`
- 对 `Wingdings + ü` 做兼容映射，按 `√` 渲染

代码落点：

- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)

### 3.2 清理只有 bullet marker 的空列表项

适用问题：

- 最后一行只剩一个点或一个 `√`

实践方案：

- 清理空列表项时，先移除 `.ppt-bullet-marker` 再判断内容是否为空

代码落点：

- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

## 4. 箭头、线条与 shape 类

### 4.1 从 XML 读取 `headEnd / tailEnd`

适用问题：

- 线条没有箭头

实践方案：

- 解析 line XML 上的 `a:headEnd / a:tailEnd`
- 注入 shape meta
- 用 SVG marker 渲染头尾箭头
- 不要把所有 marker 都画成同一种三角形；至少先按 `triangle / stealth / diamond / oval` 区分 marker path，并保留 start/end 不同 orient 语义
- 将 marker path / size / refX / refY 提取到独立 helper，避免 `ElementRenderer.vue` 再次堆积路径细节
- 对 `straightConnector1` 这类 open line shape，不要继续把 `style.background` 当成 SVG fill；若缺显式 border，应把背景色回退为 stroke，并让 fill 为 `none`，否则浏览器只会看到箭头头而看不到线身

代码落点：

- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)
- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)
- [src/components/presentation/lineMarkerModel.ts](/Applications/work/ppt-preview/src/components/presentation/lineMarkerModel.ts)
- [src/components/presentation/lineMarkerModel.test.ts](/Applications/work/ppt-preview/src/components/presentation/lineMarkerModel.test.ts)
- [src/components/presentation/shapeSvgModel.ts](/Applications/work/ppt-preview/src/components/presentation/shapeSvgModel.ts)
- [src/components/presentation/shapeSvgModel.test.ts](/Applications/work/ppt-preview/src/components/presentation/shapeSvgModel.test.ts)

### 4.2 `rect / roundRect` 不要误走 SVG path

适用问题：

- 圆角边框只显示局部
- 盒子类 shape 边框异常

实践方案：

- `rect / roundRect` 优先走 CSS 盒子渲染
- 只有真正 path shape 才走 SVG

代码落点：

- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

### 4.3 把 shape 视觉层和文本层拆开

适用问题：

- `box-shadow` 干扰文本布局
- 背景、边框、阴影和文字相互影响

实践方案：

- 外层 `.element` 只负责定位
- 新增绝对定位的 `.element-shape` 作为纯背景层
- 文本单独渲染在 shape 层之上

代码落点：

- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

## 5. 图片与裁剪类

### 5.1 读取并应用 `srcRect`

适用问题：

- 缩略图显示成细条
- 图片显示区域和 PPT 裁剪结果不一致

实践方案：

- normalize 阶段提取图片 crop
- 渲染层根据 crop 调整图片尺寸和偏移

代码落点：

- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)
- [src/types/presentation.ts](/Applications/work/ppt-preview/src/types/presentation.ts)
- [src/components/presentation/ElementRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/ElementRenderer.vue)

## 6. 数学公式与媒体 MIME 类

### 6.1 修正“扩展名和真实内容不一致”的媒体 MIME

适用问题：

- 公式图片在浏览器里裂图
- 看起来是 PNG，实际内容是 SVG

实践方案：

- 读取 PPTX zip 中的原始媒体内容
- 检测文件头是否是 SVG/XML
- 如果是，重新创建 `image/svg+xml` 的 Blob

代码落点：

- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)

### 6.2 `math` 元素兜底读取 `picBlob / picRef`

适用问题：

- `math` 类型存在，但没有可用媒体源

实践方案：

- normalize 时优先从 `blob / picBlob / src / ref / picRef` 兜底取媒体

代码落点：

- [src/adapters/pptxtojson/types.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/types.ts)
- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)

## 7. 解析增强层拆分类

### 7.1 `textBodyInsets.ts` 只保留 orchestration，具体 enhancer 分模块

适用问题：

- 单文件同时处理 text inset、placeholder、bullet、line marker、media MIME，后续补 XML 规则容易互相影响
- enhancer 行为没有最小单测，改动只能靠真实 PPT 人工验证

实践方案：

- 将职责拆到 `src/adapters/pptxtojson/enhancers/`：
  - `text-body.ts`：text inset、placeholder、text element matching
  - `bullets.ts`：自定义 bullet 字符与 Wingdings 兼容
  - `line-markers.ts`：`a:headEnd / a:tailEnd` 读取与注入
  - `media-mime.ts`：伪 PNG 真 SVG 的 Blob MIME 修正
  - `raw-enhancements.ts`：统一 enhancer-owned raw element 字段写入边界
  - `shared.ts`：shape name / order 等公共读取工具
- `textBodyInsets.ts` 暂时保留对外入口 `enrichTextBodyInsets()`，只负责读取 zip、遍历 slide、编排 enhancer
- 先补最小合成测试，不依赖真实 PPTX 二进制：
  - bullet 字符兼容
  - text body inset EMU -> point 与 placeholder 注入
  - line marker 读取
  - media MIME 修正
  - raw element enhancer-owned 字段写入边界

代码落点：

- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)
- [src/adapters/pptxtojson/enhancers/text-body.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/text-body.ts)
- [src/adapters/pptxtojson/enhancers/bullets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/bullets.ts)
- [src/adapters/pptxtojson/enhancers/line-markers.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/line-markers.ts)
- [src/adapters/pptxtojson/enhancers/media-mime.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/media-mime.ts)
- [src/adapters/pptxtojson/enhancers/raw-enhancements.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/raw-enhancements.ts)
- [src/adapters/pptxtojson/enhancers/shared.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/shared.ts)
- [src/adapters/pptxtojson/enhancers/bullets.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/bullets.test.ts)
- [src/adapters/pptxtojson/enhancers/text-body.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/text-body.test.ts)
- [src/adapters/pptxtojson/enhancers/line-markers.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/line-markers.test.ts)
- [src/adapters/pptxtojson/enhancers/media-mime.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/media-mime.test.ts)
- [src/adapters/pptxtojson/enhancers/raw-enhancements.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/raw-enhancements.test.ts)

仍未完成：

- text-body / placeholder 的 DOMParser fixture 测试
- enhancer-level 真实 slide XML fixture
- raw element 扩展字段统一类型化

### 7.2 slide XML 动画提取先区分 timing root 与 build list

适用问题：

- 真实 PPTX 在 WPS/PowerPoint 里看起来有“逐条淡入”或分步出现，但当前 parser 只读到 `p:timing` root
- 不能只看 `p:timing` 有无对象级 children，就直接断言“没有对象动画”

实践方案：

- `slide-animations.ts` 先做最小 XML audit：
  - 提取 `clickEffect / withEffect / afterEffect`
  - 同时扫描 `p:bldLst` 里的最小 `bldP` paragraph build
  - 统一把 `targetParagraphIndex` 传到 normalize 层
- `evaluatePresentationFrame` 再把 paragraph build 可见性投影到 `EvaluatedElementFrame.renderedHtml`
- `ElementRenderer.vue` 优先渲染 `renderedHtml`，让逐条出现真正落到画面
- 先把“parser 没读出来”和“文件里确实没有”分开
- 对明显需要 WPS / PowerPoint 对照的样本，先记录为 `open` 或 `partial`，不要直接写成“样本无动画”

代码落点：

- [src/adapters/pptxtojson/enhancers/slide-animations.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/slide-animations.ts)
- [src/adapters/pptxtojson/enhancers/slide-animations.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/slide-animations.test.ts)
- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)


### 7.1 表格先标准化为 `NormalizedTableMeta`，Renderer 只消费稳定模型

适用问题：

- `pptxtojson` 已输出 `table`，但播放器只显示占位
- 表格文字不可读，行列尺寸和单元格样式丢失

实践方案：

- normalize 阶段把 `data / rowHeights / colWidths` 转成 `NormalizedTableMeta`
- 继续沿用 point -> CSS px 的长度转换，避免 renderer 再理解 pptxtojson 单位
- `TableRenderer` 只负责按 CSS grid 渲染行列、cell span、基础填充/字体/边框/垂直对齐
- `hMerge / vMerge` 是合并单元格的 continuation cell，渲染前要过滤掉；origin cell 继续通过 `colSpan / rowSpan` 占位，否则 CSS grid 会被重复单元格撑乱
- fallback border 不要继续写在 `.table-renderer__cell` CSS class 上，否则每个单元格四边都会叠加出双倍内部线；应由 `tableModel.ts` 根据 row/column position 只渲染 top/left 外边框和所有 right/bottom 边，显式 cell border 优先覆盖 fallback
- table cell typography 也必须先进入 normalize 稳定模型，再由 `tableModel.ts` 映射为 CSS：本轮已覆盖 `fontFamily / fontSize / fontItalic / fontUnderline`。其中字号继续按 point -> CSS px 转换；如果遇到 XML hundredths-of-a-point 形式的 `sz`，先除以 100 再转换。
- 小字号 table typography 首轮补强不要只靠 CSS class 上的统一 `line-height: 1.2` 和 `overflow-wrap: anywhere`。这会让英文单词更容易被硬拆分、正文显得更挤。当前更稳妥的做法是：在 `tableModel.ts` 里按 cell `fontSize` 输出 typography 样式——`fontSize <= 16px` 时用 `lineHeight: 1.35`、`padding: 6px 8px`；`TableRenderer.vue` 则把 `overflow-wrap` 收紧为 `break-word`，先降低单词断裂概率。
- 对单个长英文标签，第二轮补强不能只继续放宽 `line-height`。当前更有效的最小策略是：先检测“清洗 HTML 后无空格且长度 >= 10”的 cell 文本，再在 `tableModel.ts` 里把字号下调到 `fontSize * 0.9`，同时输出 `wordBreak: keep-all`、`overflowWrap: normal`。这能让 `INTERMEDIATE` 这类表头先优先尝试缩小，而不是立即硬拆词；但真实页验证表明，这一步只有小幅改善，后续仍需要列宽感知或 run 级 typography。
- 第三轮补强把“列宽”也纳入 typography 决策：`getTableCellStyle()` 接受 `table` 上下文后，可以结合 `position.columnIndex + colSpan + table.colWidths` 估算 cell 可用宽度。当前最小规则是：如果单个长英文标签落在 `<= 72px` 的窄列里，则进一步收紧到 `fontSize * 0.8`、`lineHeight: 1.15`、`padding: 4px 5px`，继续优先争取整词显示。
- 第四轮补强开始读取 paragraph 结构，而不是只看纯文本长度：当前最小规则是，若 table cell HTML 中 `<p>` 数量 > 1 且字号 `<= 16px`，则把 `lineHeight` 提到 `1.5`、padding 提到 `7px 8px`，并显式输出 `wordBreak: normal`、`overflowWrap: break-word`。这对多段正文的拥挤感和底部裁切风险有一定缓解，但仍不是 run 级排版。
- 第五轮补强开始读取 run 级 `font-size`：当前最小规则是从 table cell HTML 里提取所有内联 `font-size: Npx`，取最大 run 字号作为 effective font size，再参与 typography 分层决策。这样带大标题 run 的 cell 不会继续被按小字号正文处理。这个能力当前先用于 typography bucket 决策，还没有深入到 run 级逐段布局。
- 首轮只覆盖“结构可见、文本可读、尺寸基本正确”，不把完整 Office 表格主题系统塞进 renderer

代码落点：

- [src/types/presentation.ts](/Applications/work/ppt-preview/src/types/presentation.ts)
- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)
- [src/components/presentation/TableRenderer.vue](/Applications/work/ppt-preview/src/components/presentation/TableRenderer.vue)
- [src/components/presentation/tableModel.ts](/Applications/work/ppt-preview/src/components/presentation/tableModel.ts)

验证：

- `pnpm test:run src/adapters/pptxtojson/normalizePresentation.test.ts src/components/presentation/tableModel.test.ts`
- `pnpm test:run`
- `pnpm build`

真实 fixture 入口：

- [fixtures/table-regression-cases.md](/Applications/work/ppt-preview/fixtures/table-regression-cases.md)

视觉冒烟验证记录：

- `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 24 页：table 结构可读，未见明显内部双线；底部说明文字偏小且换行较紧，归入后续 text/table cell typography 完整度问题。
- `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 26 页：5 x 6 planning table 结构对齐正常，未见明显重复渲染、内部双线或布局破坏；但单元格小字在舞台预览中仍偏小。
- `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 31 页：4 x 5 tasks table 文字可读、边框网格稳定，未见明显内部双线或布局破坏。
- `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 5 页：结构稳定、无明显双线或重复渲染，但 `INTERMEDIATE` 等英文仍有硬拆分；说明小字号 typography 首轮补强有效但还不够。
- `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 5 页（二轮验证）：单个长英文标签缩小字号 + 禁止硬拆词后只有小幅改善，`INTERMEDIATE` 仍会被拆；说明问题不能只靠全局 CSS，需要结合列宽或更细的 run 级信息。
- `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 5 页（三轮验证）：列宽感知后表头拆词继续小幅改善，但 `INTERMEDIATE` 仍未彻底解决；说明 cell 级列宽启发式也只是过渡方案，下一步应转 paragraph/run 级 typography。
- `AI Beatify Slides Example.pptx` 第 4 页（四轮验证）：多段正文观感更松，说明 paragraph-aware typography 有帮助；但底部仍有轻微裁切风险，说明后续还要下沉到 run 级信息。
- run 级字号感知当前已经有 synthetic test 基线，但真实页收益暂不明显；至少现阶段未观察到新的双线、重复渲染或 JS error，因此可以保留该能力作为后续 run 级排版的基础，而不把它误判为已经足够解决真实页 typography。
- `AI Beatify Slides Example.pptx` 第 4 页：结构基本正确，但字号偏小、文本拥挤、局部有裁切感；当前主问题仍是 line-height / padding / run 级换行。
- `83f822650ce0499c835780f673faed2b.pptx` 第 4 页：结构稳定、无明显双线/重复渲染，但小字偏小、行高偏紧。

## 8. Runtime Engine 拆分

### 8.1 先抽 `Session Store` 与 `Playback Policy`，不要一口气重写 Runtime

适用问题：

- `createPresentationRuntime.ts` 同时承载状态初始化、slide reset、trigger waiting、自动翻页策略和播放速率裁剪
- Runtime 后续要继续拆 Timeline / Transition / Media，但缺少测试基线

实践方案：

- 新增 `session/sessionStore.ts`，集中维护：
  - 初始 `PresentationRuntimeState`
  - slide-scoped state reset
  - `waitingTrigger` 与 onClick animation 数量同步
  - `playbackRate` 边界裁剪
- 新增 `policy/playbackPolicy.ts`，把“是否继续 / 等待 trigger / 自动翻页”从 `tick()` 中抽出
- 先用合成 fixture 测状态机事实，再把真实 PPT fixture 接入视觉回归

代码落点：

- [src/runtime/session/sessionStore.ts](/Applications/work/ppt-preview/src/runtime/session/sessionStore.ts)
- [src/runtime/policy/playbackPolicy.ts](/Applications/work/ppt-preview/src/runtime/policy/playbackPolicy.ts)
- [src/runtime/sessionStore.test.ts](/Applications/work/ppt-preview/src/runtime/sessionStore.test.ts)
- [fixtures/runtime-regression-cases.md](/Applications/work/ppt-preview/fixtures/runtime-regression-cases.md)

验证命令：

```bash
pnpm test:run src/runtime/sessionStore.test.ts
pnpm build
```

### 7.2 `Timeline Engine` 先沉淀纯函数，再从 Evaluator 中替换内联逻辑

适用问题：

- `evaluatePresentationFrame.ts` 内联 click trigger index、自动动画序列和 opacity 计算
- 后续补更复杂动画效果时，Evaluator 会继续膨胀

实践方案：

- 新增 `timeline/timelineEngine.ts`，先提供无副作用纯函数：
  - `countOnClickAnimations()`
  - `getOnClickAnimationIndex()`
  - `buildAutoAnimationSequence()`
  - `evaluateAnimationVisibility()`
- `Session Store` 复用 `countOnClickAnimations()`，避免 click trigger 统计规则分叉
- `Evaluator` 只负责找到目标 animation，然后调用 timeline engine 计算 visibility/opacity

代码落点：

- [src/runtime/timeline/timelineEngine.ts](/Applications/work/ppt-preview/src/runtime/timeline/timelineEngine.ts)
- [src/runtime/timeline/timelineEngine.test.ts](/Applications/work/ppt-preview/src/runtime/timeline/timelineEngine.test.ts)
- [src/runtime/evaluatePresentationFrame.ts](/Applications/work/ppt-preview/src/runtime/evaluatePresentationFrame.ts)

### 7.6 `Timeline Engine` 先补最小 `motionPath` 描述符，不要直接跳到完整 PPT 动画系统

适用问题：

- 连线/箭头类元素即使拿到了 animation，也只能做基础 visible/opacity，无法推进几何位移
- `evaluatePresentationFrame.ts` 没有稳定的 line-specific geometry 输出，后续 connector/marker 高保真渲染缺接口

实践方案：

- 先在标准化层给 `NormalizedAnimation` 增加最小 `motionPath` 描述符：
  - `xFrom / yFrom`
  - `xTo / yTo`
  - `rotateFrom / rotateTo`
- `timelineEngine.ts` 继续保持纯函数，新增 `evaluateAnimationGeometry()`，统一根据 trigger/timeline 计算：
  - `progress`
  - `translateX`
  - `translateY`
  - `rotate`
- `evaluatePresentationFrame.ts` 不直接理解 raw animation，而是：
  - 聚合 target animations
  - 将 `motionPath` 投影到 `EvaluatedElementFrame.bounds`
  - 同时透出 `animationGeometry`，给 line/connector renderer 和后续 motion-path/marker fidelity 补强复用
- 当前阶段只先支持合成 fixture 驱动的最小 translate/rotate 模型；真实 PPT 的复杂 motion path、easing、repeat 和多段 path 仍后续再补

代码落点：

- [src/adapters/pptxtojson/types.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/types.ts)
- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)
- [src/runtime/timeline/timelineEngine.ts](/Applications/work/ppt-preview/src/runtime/timeline/timelineEngine.ts)
- [src/runtime/evaluatePresentationFrame.ts](/Applications/work/ppt-preview/src/runtime/evaluatePresentationFrame.ts)
- [src/runtime/timeline/timelineEngine.test.ts](/Applications/work/ppt-preview/src/runtime/timeline/timelineEngine.test.ts)
- [src/runtime/evaluatePresentationFrame.test.ts](/Applications/work/ppt-preview/src/runtime/evaluatePresentationFrame.test.ts)
- [src/adapters/pptxtojson/normalizePresentation.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.test.ts)

验证命令：

```bash
pnpm test:run src/adapters/pptxtojson/normalizePresentation.test.ts src/runtime/timeline/timelineEngine.test.ts src/runtime/evaluatePresentationFrame.test.ts
pnpm build
```

### 7.3 `Transition Engine` 先承接状态写入，不急着做 typed renderer

适用问题：

- `createPresentationRuntime.ts` 内联 transition start/progress/finish 逻辑
- 后续要做 typed transition dispatch，必须先让 transition 状态读写边界稳定

实践方案：

- 新增 `transition/transitionEngine.ts`：
  - `getSlideTransitionDurationMs()`
  - `beginSlideTransition()`
  - `tickSlideTransition()`
- facade 只负责决定何时跳页和传入目标 slide；progress 推进与 finish cleanup 交给 Transition Engine
- 当前阶段只抽状态机，不引入 renderer 分发，避免一次性扩大范围

代码落点：

- [src/runtime/transition/transitionEngine.ts](/Applications/work/ppt-preview/src/runtime/transition/transitionEngine.ts)
- [src/runtime/transition/transitionEngine.test.ts](/Applications/work/ppt-preview/src/runtime/transition/transitionEngine.test.ts)
- [src/runtime/createPresentationRuntime.ts](/Applications/work/ppt-preview/src/runtime/createPresentationRuntime.ts)

### 7.3a 先从 slide XML 回填 `advTm`，再在 `SlideViewport` 做最小 typed transition style

适用问题：

- `pptxtojson` 当前可给出 `transition.type / durationMs`，但会漏掉 `p:transition advTm`，导致 runtime 自动翻页节奏丢失
- `SlideViewport.vue` 之前无论什么转场都只走同一套 opacity/translateY 样式，无法区分 `fade / push / wipe`

实践方案：

- 新增 `enhancers/slide-transitions.ts`，直接从 slide XML 读取 `p:transition`：
  - 子节点类型（如 `fade / push / wipe / random`）
  - `dir`
  - `spd`
  - `advTm`
  - `p14:dur`（custom duration，优先级高于 `spd`）
  - `pull` 这类 OOXML 原生标签要在 enhancer 层映射成 runtime 语义名；当前已补 `pull -> uncover`
- `parseWithPptxtojson.ts` 现在不再依赖 npm 包入口，而是直接加载 `src/vendor/pptxtojson/pptxtojson.js`。后续如果增强解析能力，优先修改 vendored 源码，再由 `parseWithPptxtojson.ts` 统一对外暴露，避免让 runtime 或测试直接耦合 `import('pptxtojson')` / `pptxtojson/dist/index.js`
- `textBodyInsets.ts` 不要因为 `DOMParser` 不存在就整段提前返回。`text inset / line markers` 确实依赖 DOMParser，但 `slide transition / slide animations / media MIME` 增强不应一起丢失；当前已改成只对需要 DOMParser 的增强做条件分支，让真实 PPTX regression test 能在 Node/Vitest 下继续跑通 transition/timing 链路
- 在 `textBodyInsets.ts` orchestration 里把 transition metadata 回填到 raw slide；再由 `normalizePresentation.ts` 把 `transition.advanceAfterMs/advTm` 归一化到 `slide.autoplay.advanceAfterMs`
- 新增 `transitionViewportModel.ts`，先以纯函数方式对 `fade / push / wipe / cover / uncover / split / zoom` 输出最小 viewport 中间态样式：
  - `fade`：延续当前 crossfade
  - `push`：previous/current 双 viewport 水平推进
  - `cover`：current viewport 盖住 previous viewport，previous 继续停留在原位
  - `uncover`：previous viewport 移开，current 维持静止
  - `wipe`：current viewport 用 `clip-path` 逐步揭示
  - `split`：当前已补第一版 orientation-aware clip-path 几何。`orient="vert"` 走上下 center/outer band，`orient="horz"` 走左右 center/outer band；`dir="in/out"` 决定 current/previous 哪一层显示中心带、哪一层显示外围带
  - `zoom`：当前已升级为更强的 eased reciprocal zoom。current 从更小比例更快贴近，previous 做更明显但仍受控的放大退出，并保留 crossfade；这样比线性 `scale(...)` 更接近真实转场的前后景层次
- `random` 目前先以 `random` 作为语义标记保留，parser 侧已可识别 custom duration，renderer 侧把它收敛为中性 crossfade fallback（current/previous 仅做 opacity 互补，不额外加 fade 的 translate/scale）；但 `random` 本身仍是 open case（未知具体视觉效果）
- 后续补 `push`/`wipe` 方向时，不要只在 helper 里硬编码；要把 `direction` 从 slide XML 一路带到 runtime frame：`slide-transitions.ts -> RawPptxSlide.transition.direction -> normalizePresentation -> evaluatePresentationFrame -> stageViewportModel -> SlideViewport`
- `push` 当前已支持 `r/l/u/d` 四向 previous/current 位移；`wipe` 当前已支持 `r/l/u/d` 四向 clip-path 揭示，先锁纯函数测试，再做真实页视觉回归
- 真实样本要区分两件事：`47e66b31f89d4b33b14c5010b92296c5.pptx` 已能验证 `push dir="u"`；`wipe` 则建议直接从现有小 deck 派生一个真实 fixture（如把 `演示文稿1.pptx` 的前四页 transition 改成 `wipe dir="r/l/u/d"`），再用浏览器逐页卡 mid-transition 检查 `frame.transitionDirection` 与 `.viewport` 的 `clipPath` 是否一致。这样可以把“纯函数四向测试”补成“真实 PPTX 四向回归”
- 为了避免每次都手写一大段 `browser_console` 表达式，建议把这套流程沉淀成 repo 内可复用 harness（如 `public/transition-regression-harness.js`），并把固定 case 与预期结果记入 `fixtures/transition-regression-cases.md`。后续只要换 fixture / sourceSlideIndex / tickMs，就能重复收集 `frame + viewport styles` 证据。
- 对于本地开发页，优先补一个 dev-only fixture loader，而不是把浏览器回归完全绑死在隐藏 `input[type=file]` 上。当前 runtime 已支持 `?fixture=<public-file-name>` 自动加载，并在浏览器上下文暴露 `window.__pptPreviewLoadFixture(fileName)`，供 `transition-regression-harness.js` 直接复用。
- 如果浏览器回归需要稳定卡住某个 mid-transition case，不要每次都在 console 里手写 `runtime.pause() / state.activeSlideIndex / nextSlide() / tick(...)`。更稳的做法是把 case catalog 提升为页面内 helper：当前 runtime 已支持 `?transitionCase=<caseId>` 自动加载并冻结到目标中间态，同时暴露 `window.__pptPreviewPrepareTransitionCase(caseId)` 供 harness 复用。
- 如果暂时还没有像素级截图对照，也先不要空着。至少落一份结构化 baseline（如 `fixtures/transition-regression-baseline.json`），把 `frame.transitionType / transitionDirection / transitionProgress` 与 viewport 的 `clipPath / transform / opacity` 固定下来；这样后续任何改动都能先做行为级 diff，再决定是否需要重新采集视觉基线。
- 若主人要求“直接拿本机 WPS 做对照”，在 macOS 权限已开的前提下，可走一条真实链路：`osascript` 负责激活 WPS/触发放映与翻页，`screencapture -l <windowId>` 负责编辑态窗口截图，`ffmpeg -f avfoundation -i '1:none'` 负责录制放映中的全屏帧。对比时不要只信 `browser_vision` 主观判断，必须同时记录：
  - WPS 录屏帧路径（如 `/tmp/wps-compare/video/...`）
  - 浏览器 runtime 冻结态的结构化证据（`transitionFromSlideIndex / transitionProgress / viewport clipPath/transform/opacity`）
  - 二进制 XML 复验结果（例如 `slide2.xml` 是否真的存在 `anim/seq/animEffect`）
- `演示文稿1.pptx` 这类样本要明确区分“解析层当前读到了什么”和“WPS 放映主观表现像什么”：当前二进制里 `slide2.xml` 只有 timing root，runtime model 五页 `animations.length === 0`；上游 `pptxtojson@2.0.2` 源码当前也只覆盖 `p:transition`，没有对象级 timing/build parser。但 WPS 对照若仍显示出第 2 张逐步出现的感知，就应把它记成“WPS 对照与当前解析不一致”的 open case，而不是继续写死成“这份文件没有对象动画”。当前已补最小 `slide-animations.ts` timing parser，可提取 `clickEffect / withEffect / afterEffect` 到 `slide.animations`；下一步若要真正逼近“逐条淡入”，应继续补 `bldLst / paragraph build / txEl pRg` 与渲染消费层，而不是继续只看 WPS 截帧猜测。
- 先把页面转场与 autoplay 节奏跑通；对象级 entrance animation 解析另行处理，不和这一刀混写

代码落点：

- [src/adapters/pptxtojson/enhancers/slide-transitions.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/slide-transitions.ts)
- [src/adapters/pptxtojson/enhancers/slide-transitions.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/slide-transitions.test.ts)
- [src/adapters/pptxtojson/textBodyInsets.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/textBodyInsets.ts)
- [src/adapters/pptxtojson/normalizePresentation.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.ts)
- [src/adapters/pptxtojson/normalizePresentation.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.test.ts)
- [src/components/presentation/transitionViewportModel.ts](/Applications/work/ppt-preview/src/components/presentation/transitionViewportModel.ts)
- [src/components/presentation/transitionViewportModel.test.ts](/Applications/work/ppt-preview/src/components/presentation/transitionViewportModel.test.ts)
- [src/components/presentation/SlideViewport.vue](/Applications/work/ppt-preview/src/components/presentation/SlideViewport.vue)
- [src/components/presentation/PresentationStage.vue](/Applications/work/ppt-preview/src/components/presentation/PresentationStage.vue)
- [src/runtime/evaluatePresentationFrame.ts](/Applications/work/ppt-preview/src/runtime/evaluatePresentationFrame.ts)

验证命令：

```bash
pnpm test:run src/adapters/pptxtojson/enhancers/slide-transitions.test.ts src/adapters/pptxtojson/normalizePresentation.test.ts src/components/presentation/transitionViewportModel.test.ts
pnpm build
```

### 7.4 Facade 层必须保护 transition 中的导航入口

适用问题：

- transition 进行中再次调用 `goToSlide()` / `nextSlide()` / `previousSlide()`，可能造成 `sessionStatus` 与 `transitionToSlideIndex` 不一致
- Evaluator 以 `transitionToSlideIndex != null` 判断 transitioning，但 Runtime tick 以 `sessionStatus` 判断是否推进，二者分歧会造成冻结帧

实践方案：

- 在 `goToSlide()`、`nextSlide()`、`previousSlide()` 入口优先判断 `transitionToSlideIndex != null`，transition active 时拒绝直接导航
- 增加 facade 级回归测试，而不是只测底层 engine helper

代码落点：

- [src/runtime/createPresentationRuntime.ts](/Applications/work/ppt-preview/src/runtime/createPresentationRuntime.ts)
- [src/runtime/createPresentationRuntime.test.ts](/Applications/work/ppt-preview/src/runtime/createPresentationRuntime.test.ts)

### 7.4a 翻页中的 transition type / duration 要取 destination slide，不要取 source slide

适用问题：

- WPS 对照里每一页转场都看起来“慢一页”或类型错位：例如 `slide1=fade, slide2=push`，从第 1 页翻到第 2 页时，真实 WPS 更像渲染成 push
- `演示文稿1.pptx` 的 `slide3 -> slide4`，若继续沿用 source slide，会被错误渲染成 `wipe`；而 WPS 对照与目标页 `fade` 更接近

实践方案：

- `createPresentationRuntime.goToSlide()` 开始 transition 前，读取目标页 `toSlide` 的 `transition.durationMs`
- `beginSlideTransition()` 与 `tickSlideTransition()` 期间都沿用 `transitionToSlideIndex` 指向的 destination slide 元数据
- `evaluatePresentationFrame()` 在 `isTransitioning` 时用 `transitionToSlideIndex` 读取 `transitionType / direction`，同时保留 `transitionFromSlideIndex` 给 previous viewport 内容来源
- 增加 facade/evaluator 回归测试，锁住“翻页中的 transition 元数据属于目标页，而 previous viewport 仍来自源页”的语义

代码落点：

- [src/runtime/createPresentationRuntime.ts](/Applications/work/ppt-preview/src/runtime/createPresentationRuntime.ts)
- [src/runtime/createPresentationRuntime.test.ts](/Applications/work/ppt-preview/src/runtime/createPresentationRuntime.test.ts)
- [src/runtime/transition/transitionEngine.ts](/Applications/work/ppt-preview/src/runtime/transition/transitionEngine.ts)
- [src/runtime/transition/transitionEngine.test.ts](/Applications/work/ppt-preview/src/runtime/transition/transitionEngine.test.ts)
- [src/runtime/evaluatePresentationFrame.ts](/Applications/work/ppt-preview/src/runtime/evaluatePresentationFrame.ts)
- [src/runtime/evaluatePresentationFrame.test.ts](/Applications/work/ppt-preview/src/runtime/evaluatePresentationFrame.test.ts)

### 7.4b Transition 渲染层不要在非转场态保留 previous viewport，也不要让 CSS 再做第二次插值

适用问题：

- 转场结束后还能看到上一页残影、当前页 opacity/transform 没有立刻回到最终态
- 浏览器里 `.viewport` 数量在非转场态仍为 2，或 computed style 仍残留上一轮 transition 的 opacity/transform

实践方案：

- 抽 `stageViewportModel.ts` 纯函数：只有 `frame.isTransitioning` 时才返回 previous viewport descriptor；平时只渲染 current viewport
- 给 viewport descriptor 加稳定 key，避免 previous/current 组件实例跨角色复用
- `transitionViewportModel.ts` 对转场中和转场结束后的 viewport 都显式输出 `transition: none`，让 runtime 的 `transitionProgress` 成为唯一插值来源，不再叠加 `.viewport` CSS transition

代码落点：

- [src/components/presentation/stageViewportModel.ts](/Applications/work/ppt-preview/src/components/presentation/stageViewportModel.ts)
- [src/components/presentation/stageViewportModel.test.ts](/Applications/work/ppt-preview/src/components/presentation/stageViewportModel.test.ts)
- [src/components/presentation/PresentationStage.vue](/Applications/work/ppt-preview/src/components/presentation/PresentationStage.vue)
- [src/components/presentation/transitionViewportModel.ts](/Applications/work/ppt-preview/src/components/presentation/transitionViewportModel.ts)
- [src/components/presentation/transitionViewportModel.test.ts](/Applications/work/ppt-preview/src/components/presentation/transitionViewportModel.test.ts)

### 7.5 `Media Engine` 先做 registry/cache/playback plan，再接 DOM 控制

适用问题：

- 媒体生命周期不能继续散落在 Vue 组件里，否则 preload/release/play/pause/seek/mute 规则会分叉
- 浏览器 DOM 媒体控制有副作用，直接一口气接 DOM 容易让 Runtime 状态机和渲染耦合

实践方案：

- 新增 `media/mediaEngine.ts`，先做纯状态层：
  - `collectMediaRegistry()`：收集 image/video/audio/math 媒体元素
  - `createMediaEngineState()`：建立 registry
  - `syncMediaEngine()`：按 active slide 维护 current/previous/next 缓存窗口，远页标记 released
  - `getMediaPlaybackPlan()`：根据 runtime state 输出 video/audio 的 play/pause/mute/rate/seek 计划
- `createPresentationRuntime()` 持有 `runtime.media`，跳页和 transition tick 后同步 media engine；`dispose()` 在 runtime teardown 时统一 revoke object URL，避免旧模型切换后资源悬挂
- `evaluatePresentationFrame()` 输出 slide-level `media` frames，给后续 `MediaRenderer` 或 DOM sync 层消费
- transition active 时，`syncMediaEngine()` 需要同时保留 source / destination slide 的媒体 active 状态；否则 previous viewport 上的可见 video/audio 会冻结
- `ElementRenderer.vue` 现在会把 `mediaPlayback` 同步到实际 `HTMLMediaElement`，让 video/audio 能跟随 runtime 的 play/pause/mute/seek 指令
- `MediaRenderer.vue` 已把媒体类型分流成独立边界，后续可再抽成真正的 `MediaRenderer` / `MediaStage`
- 如果媒体源加载失败，`ElementRenderer` / `MediaRenderer` 会优先使用 poster（video/audio）或回退 placeholder（image/math/video/audio 无 poster），避免整块空白

代码落点：

- [src/runtime/media/mediaEngine.ts](/Applications/work/ppt-preview/src/runtime/media/mediaEngine.ts)
- [src/runtime/media/mediaEngine.test.ts](/Applications/work/ppt-preview/src/runtime/media/mediaEngine.test.ts)
- [src/runtime/createPresentationRuntime.ts](/Applications/work/ppt-preview/src/runtime/createPresentationRuntime.ts)
- [src/runtime/evaluatePresentationFrame.ts](/Applications/work/ppt-preview/src/runtime/evaluatePresentationFrame.ts)
- [src/runtime/evaluatePresentationFrame.test.ts](/Applications/work/ppt-preview/src/runtime/evaluatePresentationFrame.test.ts)

仍未完成：

- 实际 DOM `HTMLMediaElement` play/pause/seek/mute 同步
- media load error fallback
- poster/首帧策略
- 大媒体懒加载和 object URL 更细粒度释放

### 7.6 `Input Engine` 先做 command mapping，UI 只负责事件采集和执行

适用问题：

- 键盘、舞台点击、触摸滑动如果直接写在 Vue 组件里，后续快捷键规则会散落并难以测试
- Runtime facade 不应该直接依赖 DOM `KeyboardEvent / TouchEvent`，否则状态机单测会变复杂

实践方案：

- 新增 `input/inputEngine.ts`，先做纯映射层：
  - keyboard：左右翻页、Enter 前进、Space 播放/暂停、F 全屏、P 演讲者模式、Esc 退出全屏
  - pointer：主键点击舞台触发 `advance`
  - touch：水平滑动触发前后翻页，忽略 tap 和纵向滚动
- 对 editable target 与 ctrl/meta/alt 组合键直接返回 `none`，避免劫持输入框和浏览器/系统快捷键
- `PresentationShell.vue` 负责监听全局 keydown 并执行 command；`PresentationStage.vue` 只采集舞台点击和触摸起止点

代码落点：

- [src/runtime/input/inputEngine.ts](/Applications/work/ppt-preview/src/runtime/input/inputEngine.ts)
- [src/runtime/input/inputEngine.test.ts](/Applications/work/ppt-preview/src/runtime/input/inputEngine.test.ts)
- [src/components/presentation/PresentationShell.vue](/Applications/work/ppt-preview/src/components/presentation/PresentationShell.vue)
- [src/components/presentation/PresentationStage.vue](/Applications/work/ppt-preview/src/components/presentation/PresentationStage.vue)

仍未完成：

- 可配置快捷键 schema
- Presenter 专用快捷键扩展
- 激光笔 / 标注模式输入路由
- 触摸双指 / 长按等更复杂手势
