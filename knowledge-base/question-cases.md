# 问题知识库

本文档把当前项目里用户已经实际提出过的问题，按问题模式整理成知识库。

状态说明：

- `resolved`: 已有稳定方案
- `partial`: 已部分处理，但仍可能复发
- `open`: 还没有稳定方案

## 1. 文本定位与换行

### 1.1 文本框位置偏移

- 状态：`partial`
- 典型现象：
  - 文本整体偏到中间
  - 左右说明文跑到图片中间
  - 短文本被压到左侧
- 代表案例：
  - `4b00...pptx` 第 1 页封面标题
  - `4b00...pptx` 第 3 页左右说明文
  - `4b00...pptx` 第 20 页“再见”
- 关键标签：
  - `text-position`
  - `text-inset`
  - `single-line-heuristic`

### 1.2 文本不该单行时被强制单行

- 状态：`resolved`
- 典型现象：
  - 右侧窄文本框不换行
  - 说明文字被压成一行
  - 英文展示型标题被错误压成单行
- 代表案例：
  - `4b00...pptx` 第 3 页右侧说明文
  - `4b00...pptx` 第 4 页底部说明文字
  - `watercolor.pptx` 第 1 页大标题

### 1.3 英文文本完全不换行

- 状态：`resolved`
- 典型现象：
  - 一整句英文横向溢出
  - 看起来像浏览器把句子当成单词
- 代表案例：
  - `watercolor.pptx` 第 3 页目录说明文
- 根因方向：
  - `NBSP / 窄不换行空格`

## 2. 文本颜色

### 2.1 同页相同文案颜色不一致

- 状态：`resolved`
- 典型现象：
  - 左边文字颜色正确，中间和右边变黑
- 代表案例：
  - `watercolor.pptx` 第 3 页目录说明文

### 2.2 placeholder 正文掉成默认黑色

- 状态：`resolved`
- 典型现象：
  - 模板正文应是浅棕色，但浏览器显示成黑色
- 代表案例：
  - `watercolor.pptx` 第 10 页 `Mercury / Venus` 正文
- 关键标签：
  - `theme-color`
  - `placeholder`

## 3. 项目符号与列表

### 3.1 自定义 bullet 显示错误

- 状态：`resolved`
- 典型现象：
  - WPS 里是 `√`
  - 浏览器里显示成普通点、乱码或空白
- 代表案例：
  - `区级平台介绍.pptx` 第 2 页

### 3.2 空列表项残留多余点或多余一行

- 状态：`resolved`
- 典型现象：
  - 列表最后多出一个点
  - 最后一行只有一个 `√`
- 代表案例：
  - `区级平台介绍.pptx` 第 2 页

## 4. 箭头、连接线和辅助框

### 4.1 箭头不显示

- 状态：`partial`
- 典型现象：
  - 线在，箭头头尾不显示
  - 指向正确但 marker 丢失
- 代表案例：
  - `4b00...pptx` 第 7 页观察明暗

### 4.2 箭头长度、方向、位置错误

- 状态：`partial`
- 典型现象：
  - 箭头太短
  - 指向错位
  - 终点和目标不重合
- 代表案例：
  - `4b00...pptx` 第 3、4、7 页
- 当前进展：
  - 已不再把所有 marker 一律画成同一个三角形，renderer 已开始区分 `triangle / stealth / diamond / oval`
  - 真实页 browser 复验显示：第 4 / 7 页的 connector 已恢复可见，不再是“整批线条不见”
  - 但真实 PPT 里的 marker size 比例、refX/refY、路径端点与 line geometry 的精确对齐仍未完成
  - 第 4 页仍存在箭头头尾不够明确、线长不自然、文字锚点和虫体部位落点偏差
  - 第 7 页虽已能表达影子与明暗交界线，但下方多条 connector 仍偏拥挤，长度与落点统一性不足

### 4.3 辅助虚线框误显示

- 状态：`partial`
- 典型现象：
  - WPS 里不显示的辅助框，在浏览器里显示出来
  - 该显示虚线的地方反而显示成实线
- 代表案例：
  - `4b00...pptx` 第 4、5 页

### 4.4 connector 线条因为零尺寸 bounds 完全不显示

- 状态：`resolved`
- 典型现象：
  - 明明 parser 已经给出了 `straightConnector1` path
  - 但浏览器里横线或竖线整段消失
- 代表案例：
  - `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 4 页
- 根因方向：
  - `width=0` 或 `height=0` 的 connector 被直接渲染成 `0px` SVG 容器

## 5. Shape 边框、阴影与背景层

### 5.1 圆角边框只显示局部

- 状态：`resolved`
- 典型现象：
  - 本应完整的黄色圆角边框只显示左上角几段
- 代表案例：
  - `4b00...pptx` 第 10 页作画工具

### 5.2 shape 阴影影响文本布局

- 状态：`resolved`
- 典型现象：
  - 去掉 `box-shadow` 后文本立刻恢复正常
  - 文本像被挤到左边或只露一截
- 代表案例：
  - `4b00...pptx` 第 20 页“再见”

## 6. 图片与裁剪

### 6.1 缩略图显示成细条或错误区域

- 状态：`resolved`
- 典型现象：
  - 小图显示成蓝色细条
  - 没有按 PPT 裁剪结果显示
- 代表案例：
  - `区级平台介绍.pptx` 第 4 页右侧缩略图
- 关键标签：
  - `image-crop`
  - `srcRect`

## 7. 数学公式与媒体资源

### 7.1 公式图片不显示

- 状态：`resolved`
- 典型现象：
  - 页面里应该有公式
  - 浏览器里只剩裂图占位
- 代表案例：
  - `math_calculus_formulas.pptx` 第 1 页
- 根因方向：
  - 媒体扩展名和真实 MIME 不一致

### 7.2 媒体加载失败后应有兜底，不要整块空白

- 状态：`partial`
- 典型现象：
  - video/audio/image/math 的 `src` 或 `objectUrl` 无法加载时，页面整块空白
  - video/audio 明明带了 poster，却在加载失败后没有任何替代
- 代表案例：
  - 解析得到的媒体资源损坏、跨域失败或 object URL 失效
- 当前进展：
  - `ElementRenderer` 已支持媒体错误兜底：video/audio 优先用 poster；没有 poster 时回退 placeholder
  - `mediaPlayback` 已能同步到真实 `HTMLMediaElement`
  - `runtime.dispose()` / `disposeMediaEngine()` 已能在 teardown 时 revoke object URL，避免切换模型或卸载后资源悬挂
  - `MediaRenderer.vue` 已抽离媒体渲染边界，ElementRenderer 只保留文本/形状/容器逻辑
- 关键标签：
  - `media-load-error`
  - `poster`
  - `placeholder`
  - `object-url`

## 8. 主题与模板兼容

### 8.1 主题解析依赖过强，可能触发 `a:theme` 空引用

- 状态：`open`
- 典型现象：
  - `Cannot read properties of null (reading 'a:theme')`
- 说明：
  - 这类问题已出现过，但还没有整理成稳定修复方案

## 9. 解析增强层拆分

### 9.1 单个 XML enhancer 文件继续膨胀会放大维护风险

- 状态：`partial`
- 典型现象：
  - `textBodyInsets.ts` 同时承担 text inset、placeholder、bullet、line marker、media MIME 修正
  - 新增 XML 补丁时容易把不相关逻辑耦合到同一文件
- 已覆盖基线：
  - `bullets.ts` 的 Wingdings `ü` -> `√` 兼容
  - `text-body.ts` 的 text inset EMU -> point 与 placeholder 注入
  - `line-markers.ts` 的 `a:headEnd / a:tailEnd` 元数据读取
  - `media-mime.ts` 的伪 PNG 真 SVG Blob 修正
  - `raw-enhancements.ts` 的 enhancer-owned raw element 字段写入边界
- 代表测试：
  - `src/adapters/pptxtojson/enhancers/bullets.test.ts`
  - `src/adapters/pptxtojson/enhancers/text-body.test.ts`
  - `src/adapters/pptxtojson/enhancers/line-markers.test.ts`
  - `src/adapters/pptxtojson/enhancers/media-mime.test.ts`
  - `src/adapters/pptxtojson/enhancers/raw-enhancements.test.ts`
- 关键标签：
  - `xml-enhancer`
  - `text-inset`
  - `placeholder`
  - `bullet`
  - `arrow-marker`
  - `media-mime`
  - `math-media`

## 10. 表格渲染

### 10.1 table 元素只显示占位或缺失结构

- 状态：`partial`
- 典型现象：
  - `pptxtojson` 已经解析出 `type='table'`
  - 播放器里只出现 table 占位框，无法阅读单元格内容
  - 行高、列宽、单元格填充、字体颜色、基础边框丢失
- 已覆盖基线：
  - `normalizePresentation` 已把 `data / rowHeights / colWidths` 标准化为 `NormalizedTableMeta`
  - `TableRenderer` 已按 CSS grid 渲染基础行列、cell span、fill/font/border/vAlign
  - `tableModel` 已过滤 `hMerge / vMerge` continuation cell，避免合并单元格重复渲染
  - `tableModel` 已把 fallback border 从 CSS class 收敛到按 row/column position 生成，避免内部边框双线
  - 基础 table typography 已覆盖 `fontFamily / fontSize / fontItalic / fontUnderline` 的 normalize 与渲染映射
  - 小字号 table cell 已补第一轮 typography 策略：`fontSize <= 16px` 时提高 `lineHeight/padding`，并把 `overflow-wrap` 从 `anywhere` 收紧到 `break-word`
  - 单个长英文标签已补第二轮 typography 策略：对“无空格且长度 >= 10”的文本优先缩小字号并禁止硬拆词，而不是直接继续依赖浏览器断词
  - 已补第三轮列宽感知策略：结合 `table.colWidths` 与 `columnIndex/colSpan` 估算窄列可用宽度，对极窄列里的单个长英文标签进一步缩小字号和收紧 padding
  - 已补第四轮 paragraph-aware 策略：对多段正文（`<p>` 数量 > 1）的小字号 cell 单独提高 `lineHeight/padding`，并明确用 `word-break: normal + overflow-wrap: break-word`
  - 已补第五轮 run-level font-size 策略：从 cell HTML 的内联 `font-size` 提取最大 run 字号，作为 effective font size 参与 typography bucket 决策
  - 已通过浏览器视觉冒烟验证 `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 24 / 26 / 31 页：结构可读，未见明显内部双线、重复渲染或布局破坏；其中第 24、26 页小字偏小，仍待后续 typography 补强
  - 已通过浏览器视觉冒烟验证剩余真实 table 页：`AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 5 页、`AI Beatify Slides Example.pptx` 第 4 页、`83f822650ce0499c835780f673faed2b.pptx` 第 4 页；当前共识是结构已相对稳定，主问题集中到 typography
  - 已通过 XML 扫描定位真实 table 页：`AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 5/24/26/31 页、`AI Beatify Slides Example.pptx` 第 4 页、`83f822650ce0499c835780f673faed2b.pptx` 第 4 页
- 代表测试：
  - `src/adapters/pptxtojson/normalizePresentation.test.ts`
  - `src/components/presentation/tableModel.test.ts`
- 仍未覆盖：
  - 完整 Office table style/theme 继承
  - 真实 PPTX 截图回归
  - 更完整的 table cell typography（cell padding、line-height、paragraph run 级字号与换行）
  - 英文单词断裂和局部裁切仍未完全解决；真实页说明即使补了列宽感知、paragraph-aware 和 run-level font-size 策略，cell 级启发式仍不够，后续需要更完整的 paragraph/run 级策略
  - 更精细的显式 border 冲突优先级 / overlapping border 策略
- 关键标签：
  - `table`
  - `table-renderer`
  - `table-merge`
  - `table-typography`

## 11. Runtime Engine 拆分

### 11.2 页面转场自动播放时间丢失时，优先从 slide XML 的 `p:transition advTm` 回填

- 状态：`partial`
- 典型现象：
  - PPT 原文件设置了自动翻页节奏，但 runtime 里 `slide.autoplay.advanceAfterMs` 为空
  - 点击“播放”后页面不会按预期自动翻页
- 代表案例：
  - `演示文稿1.pptx` 全文档
- 已覆盖基线:
  - `slide-transitions.ts` 已从 slide XML 读取 `p:transition` 的 `type / spd / advTm`
  - `textBodyInsets.ts` orchestration 已把 transition metadata 回填到 raw slide
  - `normalizePresentation` 已把 `transition.advanceAfterMs/advTm` 作为 autoplay fallback 归一化到 `slide.autoplay.advanceAfterMs`
  - `transitionViewportModel.ts` 已开始按 `fade / push / wipe` 派发不同的 viewport 中间态样式
- 浏览器回归已确认 `演示文稿1.pptx` 在 destination-slide 语义下与 WPS 更接近：`slide1 -> slide2` 的 mid-transition 为 previous/current 双 viewport 水平推进（对应目标页 `push`），`slide3 -> slide4` 则应按目标页 `fade` 处理而不是继续按 source 页 `wipe`
- `createPresentationRuntime/evaluatePresentationFrame` 已补回归：翻页中的 transition duration/type 改为取 destination slide，修正 WPS 对照下“整份 deck 都慢一页/错位一页”的问题；`transitionFromSlideIndex` 仅保留给 previous viewport 内容来源
- `Media Engine` 已补 transition-aware retention：转场进行时同时保留 source / destination slide 的媒体 active，避免 previous viewport 上的 video/audio 冻结
- `ElementRenderer.vue` 已开始把 `mediaPlayback` 同步到实际 `HTMLMediaElement`，video/audio 可跟随 runtime 的 play/pause/mute/seek 指令

  - 已补 `transition.direction` 通路：slide XML enhancer -> raw slide -> normalizePresentation -> evaluatePresentationFrame -> SlideViewport；浏览器已用 `47e66b31f89d4b33b14c5010b92296c5.pptx` 复验 `push dir="u"` 垂直推进，且真实 XML 已确认 `slide2/6/7` 都带 `dir="u"`
  - `wipe` 已补四向 `dir="r/l/u/d"` clip-path 派发；当前已新增真实样本 `wipe-directions-fixture.pptx`，浏览器中间态已逐个确认四向 reveal 与 frame.direction 一致
  - 已新增 `fixtures/transition-regression-cases.md` + `public/transition-regression-harness.js`，把 `fade / push / wipe` 的真实 PPTX 中间态检查流程沉淀成可重复执行的浏览器回归资产
  - 已补 `fixtures/transition-regression-baseline.json`，把当前确认过的 `frame.transition* + viewport clipPath/transform/opacity` 固定成结构化 baseline，后续改动可先做行为级 diff，再升级到截图 diff
- 已完成一轮真实 WPS 对照链路探测：macOS 权限打开后，可用 `osascript + screencapture + ffmpeg(avfoundation)` 录制 WPS 放映；实测 `演示文稿1.pptx` 的 WPS 放映帧与浏览器 runtime 存在可复验差异
- 仍未覆盖:
  - 更系统的视觉回归：虽然 `wipe-directions-fixture.pptx` 已完成真实 `dir` 行为核对，但还没做系统截图对照与 Office/WPS 中间态像素级比对
  - 对象级 entrance animation 解析；当前 repo 中这份 `演示文稿1.pptx` 的二进制经复验，`slide2.xml` 只有 timing root，且 runtime model 五页 `animations.length === 0`。同时上游 `pptxtojson@2.0.2` 源码当前只实现了 `p:transition` 解析，没有对象级 timing/build parser。也就是说：现阶段不仅这份样本没被当前链路读出对象动画，连解析器能力本身也缺这一层。但本轮已补最小 timing parser（`enhancers/slide-animations.ts`），现可从 `p:timing` 中提取 `clickEffect / withEffect / afterEffect` 到 `slide.animations`，并已在真实 `47e66b31...pptx` 中复验出多页 click-triggered animation。它仍然不足以解释 `演示文稿1.pptx` 第二张的“逐条出现”感知，因此不能再把“XML 当前没读到对象动画”直接等同于“文件里肯定没有对象动画”
  - `4b00a85c247c47bdaeb01aeec562c90f.pptx` 的 `random` 转场也属于类似的 open case：XML 明确给出 `<p:random/>` 与 `p14:dur="1500"`，parser 已能读到 custom duration，但 visual semantics 仍未知；当前 renderer 只给出中性 crossfade fallback，不要把它误记成已知的 fade/push/wipe
  - `演示文稿1.pptx` 的 slide3 -> slide4：此前浏览器 runtime 被固定在 `transitionFromSlideIndex=2 / transitionProgress≈0.58` 时，会错误按 source 页渲染成 `wipe`（current viewport `clipPath = inset(0px 42% 0px 0px)`）；现已改为按 destination 页 `fade` 读取转场元数据。后续仍需继续看它与 WPS 的像素级细节是否完全贴合
- 代表测试:
  - `src/adapters/pptxtojson/enhancers/slide-transitions.test.ts`
  - `src/adapters/pptxtojson/normalizePresentation.test.ts`
  - `src/components/presentation/transitionViewportModel.test.ts`

### 11.3 `cover / uncover / split` 先做最小占位渲染，不要过早声称完整支持

- 状态：`partial`
- 典型现象：
  - 真实 PPT 里可见 `cover / uncover / split / zoom` 一类转场，但 renderer 还没有对应的完整几何语义
  - 如果没有分支处理，所有未知转场会继续掉到同一套 `fade`/opacity 行为
- 当前进展：
  - `transitionViewportModel.ts` 已把 `cover / uncover / split / zoom` 接入 typed dispatch
  - 其中 `cover` / `uncover` 用最小方向性移动占位
  - `zoom` 已从线性 scale + crossfade fallback 提升到更强的 eased reciprocal zoom，至少不再掉回普通 `fade`，并且 current/previous 的层次更明确
  - `split` 已补第一版 orientation-aware clip-path 几何：当前按 `orient=vert/horz` 切 center/outer band，并按 `dir=in/out` 切换 current/previous 的 reveal/collapse
  - 已新增真实样本 `transition-cover-uncover-zoom-split-fixture.pptx`，并用 `src/components/presentation/transitionFixtureRegression.test.ts` 锁住 `pptx -> parse -> normalize -> runtime -> viewport style` 链路
- 仍未覆盖：
  - 真实页 WPS / PowerPoint 中间态对照
  - `split` 与 Office / WPS 的更高保真 clip/mask 几何、easing 和边界细节
  - 更完整的 mask / 方向 / easing 细节
- 关键做法：
  - 先把未知转场从 `fade` 里分出来，避免语义污染
  - 保留占位行为时要明确写成 open/partial，不要把它写成“已完成”

### 11.4 `random` 转场只读到 `<p:random/>` 时，不要硬猜成某一种已知转场

- 状态：`partial`
- 典型现象：
  - slide XML 里可以读到 `<p:random/>`，同时还有 `p14:dur="1500"` 之类的自定义时长
  - 如果仍然只看 `spd`，会把时长低估成 500/800/1200 之一
  - renderer 如果继续套用 `fade` 的 translate/scale，就会把“随机转场”伪装成一个确定效果
- 当前进展：
  - `slide-transitions.ts` 已优先读取 `p14:dur`
  - `transitionViewportModel.ts` 已把 `random` 收敛成中性 crossfade fallback（current/previous 仅做 opacity 互补）
  - `fixtures/transition-regression-cases.md` 已加入 `random-default-open-case`
- 代表测试：
  - `src/adapters/pptxtojson/enhancers/slide-transitions.test.ts`
  - `src/components/presentation/transitionViewportModel.test.ts`
- 关键标签：
  - `transition`
  - `random`
  - `p14:dur`

### 11.1 集中式 Runtime 继续堆逻辑会放大回归风险

- 状态：`partial`
- 典型现象：
  - `createPresentationRuntime.ts` 同时负责 state、policy、tick、trigger、transition
  - 后续补 Timeline / Transition / Media 时容易互相影响
- 已覆盖基线：
  - `Session Store` 初始状态、slide state reset、`waitingTrigger` 同步
  - `Playback Policy` 自动翻页与 click trigger 的优先级
  - `Timeline Engine` click trigger 计数、自动动画序列、基础 visibility/opacity
  - `Timeline Engine` 已补最小 `motionPath` 几何描述：`translateX / translateY / rotate / progress`
  - `Transition Engine` transition start / progress / finish
  - `Media Engine` registry/cache/playback plan 与 Evaluator media frame
  - `Input Engine` keyboard / pointer / touch gesture 到 runtime command 的映射
  - `Runtime Facade` transition active 期间拒绝直接跳页 / 前后翻页，避免状态冻结
  - `Evaluator` 已把 `motionPath` 投影到 `EvaluatedElementFrame.bounds` 与 `animationGeometry`，给 line/connector 后续高保真渲染留接口
- 代表测试：
  - `src/runtime/createPresentationRuntime.test.ts`
  - `src/runtime/sessionStore.test.ts`
  - `src/runtime/input/inputEngine.test.ts`
  - `src/runtime/media/mediaEngine.test.ts`
  - `src/runtime/evaluatePresentationFrame.test.ts`
  - `src/runtime/timeline/timelineEngine.test.ts`
  - `src/runtime/transition/transitionEngine.test.ts`
- 关键标签：
  - `runtime`
  - `session-store`
  - `playback-policy`
  - `timeline-engine`
  - `transition-engine`
  - `media-engine`
  - `input-engine`
  - `keyboard-shortcuts`
  - `touch-swipe`
- `media-sync`
- `timing`

### 11.2 真实 PPT 文本内容都在，但被异常 paragraph margin 顶出文本框

- 状态：`fixed`
- 典型现象：
  - `0501.pptx` 第 `5` 页只剩页头，章节列表大段缺失，看起来像“文本没解析出来”
  - 实际 `parseWithPptxtojson -> normalizePresentation` 已经拿到完整 HTML，问题发生在 renderer 消费阶段
- 根因特征：
  - raw/normalized `html` 中的 `<p>` 内联样式带有 `margin-top: 20em`、`margin-bottom: 0em`
  - 这类样式在浏览器 DOM 里会把段落整体推出 PPT 文本框可视区域
  - 同时 `margin-left / text-indent` 仍然是有效的项目符号/缩进语义，不能粗暴清空全部段落样式
- 已覆盖基线：
  - `textHtmlSanitizer.ts` 现会移除 block-level `margin-top / margin-bottom`，但保留 `margin-left / text-indent / color`
  - 无 `DOMParser` 环境下也有 fallback，避免 Vitest/Node 环境把 sanitizer 直接退化成空串
  - `0501.pptx` 第 `5` 页已补 fixture regression，锁住“原始 HTML 含异常 margin，但 sanitizing 后章节正文仍可见”
- 代表测试：
  - `src/components/presentation/textHtmlSanitizer.test.ts`
  - `src/components/presentation/p0501FixtureRegression.test.ts`
- 关键标签：
  - `text`
  - `html-sanitizer`
  - `paragraph-margin`
- `real-fixture`
- `0501`

### 11.3 深色模板里的正文 run 被 parser 解析成黑色，导致浏览器里接近不可读

- 状态：`fixed`
- 典型现象：
  - `0501.pptx` 第 `7` 页这类深绿色底图页面里，标题还是亮黄/亮青，但正文段落被渲成黑色或近黑色
  - 页面不是“没文字”，而是文字颜色过暗，肉眼看起来像缺字或严重发灰
- 根因特征：
  - 同一个文本框里混合出现了亮色标题 run（如 `#FFFF00 / #00FFCC / #66FFFF`）和带真实内容的 `#000000` 正文 run
  - 这通常不是作者真的想做“黑字配深绿底”，更像 parser/vendor 在 placeholder/theme 继承链上把正文默认色塌成了黑色
  - 与 11.2 不同，这类问题不是 spacing 把内容顶飞，而是颜色语义本身已经偏掉
- 已覆盖基线：
  - `textHtmlSanitizer.ts` 已补最小颜色启发式：仅当同一文本框里同时存在亮色标题 run 和带内容的深色正文 run，且没有现成的近白正文 run 时，才把这些可见深色 run 提升为 `#FFFFFF`
  - `0501.pptx` 第 `7` 页已补 fixture regression，锁住亮色标题保留、正文黑字提升为白字的行为
- 代表测试：
  - `src/components/presentation/textHtmlSanitizer.test.ts`
  - `src/components/presentation/p0501FixtureRegression.test.ts`
- 关键标签：
  - `text`
  - `color`
  - `theme-inheritance`
  - `dark-template`
  - `real-fixture`
  - `0501`

### 11.4 真实 PPT 点击动画目标用的是 OOXML shape id，但 runtime 元素还在用合成 id

- 状态：`fixed`
- 典型现象：
  - `0501.pptx` 第 `2` 页左侧黄框和右侧绿框在浏览器里一上来就全部显示，点击触发节奏和 WPS 不一致
  - 用户主观感受是“动画线/逐条出现没了”，但 raw slide 里其实已经有 `clickEffect`
- 根因特征：
  - `slide2.xml` 的 timing target 用的是真实 `spid="7171" / "7172"`
  - parser 之前没有把 `cNvPr id` 写回 raw element，normalize 后元素只能退回 `slide-2-element-*` 这类合成 id
  - 同一页里还存在 `txEl > charRg` 目标；这类动画不是整块 appear，而是更接近“按文本块逐次 reveal”
- 已覆盖基线：
  - vendor parser 现已把 `cNvPr id` 贯通到 `shape / connector / pic / group / graphicFrame`
  - timing parser 现会保留 `charRg`，并把同 target 的字符范围点击动画收敛成可被 runtime 消费的顺序 paragraph build
  - runtime paragraph build 现可同时裁切 `<p>` 和 `<li>`，并且当元素先有 whole-element click reveal、后有 paragraph build 时，会先显示首条内容再逐步展开
  - `0501.pptx` 第 `2` 页已补 fixture regression，锁住 `7171 / 7172` 的真实 target id 和点击后逐步显示行为
- 代表测试：
  - `src/vendor/pptxtojson/animation.test.ts`
  - `src/adapters/pptxtojson/enhancers/slide-animations.test.ts`
  - `src/runtime/timeline/paragraphBuild.test.ts`
  - `src/components/presentation/p0501FixtureRegression.test.ts`
- 关键标签：
  - `timing`
  - `shape-id`
  - `char-range-build`
  - `list-build`
  - `real-fixture`
  - `0501`
