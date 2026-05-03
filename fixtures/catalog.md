# Fixture Catalog

本文档记录当前项目中的高频问题 PPT 样本、页面清单和问题标签。

如果需要先从机器可读入口了解 `public/` 下全部 PPT 当前覆盖状态，优先读取：

- [fixtures/visual-baselines/public-ppt-fixture-registry.json](/Applications/work/ppt-preview/fixtures/visual-baselines/public-ppt-fixture-registry.json)

状态说明：

- `active`: 当前仍在用于复现或回归
- `partial`: 已有部分修复，但仍有残留问题
- `backlog`: 已收录，但暂未进入当前修复优先级

## 1. `4b00a85c247c47bdaeb01aeec562c90f.pptx`

- 文件位置：[public/4b00a85c247c47bdaeb01aeec562c90f.pptx](/Applications/work/ppt-preview/public/4b00a85c247c47bdaeb01aeec562c90f.pptx)
- 状态：`active`
- 用途：当前最核心的高保真回归样本，覆盖文本、箭头、辅助框、单行/多行、shape 阴影与边框等问题；同时也包含大量 `random` 页间转场，且 slide XML 上存在 `p14:dur="1500"` 这类自定义转场时长，需要 parser 真实读取而不是只看 `spd`

重点页面：

- 第 1 页：封面页，标题定位、顶部小标签、多边形定位  
  标签：`text-position`, `shape-position`
- 第 3 页：学知识，左右文本布局、文本换行、图片左右说明文、箭头指向  
  标签：`text-inset`, `text-wrap`, `text-position`, `arrow-marker`
- 第 4 页：观察组成，辅助虚线框、标注线、底部说明文字换行；本轮浏览器复验确认 connector / arrow 已恢复可见，不再是大面积缺失，但箭头头尾样式、线长和与文字/虫体部位的对齐仍有明显偏差  
  标签：`helper-frame`, `text-wrap`, `connector`, `arrow-marker`
- 第 5 页：观察造型，虚线/实线辅助框显示错误  
  标签：`helper-frame`, `shape-border`
- 第 7 页：观察明暗，箭头缺失、箭头长度和方向错误；当前 renderer 已从“统一三角形 marker”升级为区分 `triangle / stealth / diamond / oval` 的最小 type-aware marker，本轮浏览器复验确认箭头/连线已恢复可见，能表达影子与明暗交界线标注，但下方多条 connector 仍偏拥挤，线长和落点不够统一  
  标签：`arrow-marker`, `connector`
- 第 10 页：作画工具，圆角黄色边框缺失或只显示局部  
  标签：`shape-border`, `shape-path`
- 第 20 页：再见，shape 阴影与文本布局相互干扰  
  标签：`shape-shadow`, `text-position`
- 浏览器视觉基线：已登记到 `public-ppt-page-visual-baselines.json`
  - `core-4b00-slide-1-cover-layout`
  - `core-4b00-slide-4-annotation-layout`
  - `core-4b00-slide-7-arrow-alignment`
  - `core-4b00-slide-20-shadow-layout`

## 2. `区级平台介绍.pptx`

- 文件位置：[public/区级平台介绍.pptx](/Applications/work/ppt-preview/public/%E5%8C%BA%E7%BA%A7%E5%B9%B3%E5%8F%B0%E4%BB%8B%E7%BB%8D.pptx)
- 状态：`active`
- 用途：bullet、标题单行、裁剪缩略图、小图显示异常的主回归样本

重点页面：

- 第 2 页：区级概览，标题不应换行，自定义 bullet 应为 `√`，空列表项不应残留  
  标签：`text-wrap`, `bullet`
- 第 4 页：学校信息，右侧缩略图是裁剪图，不应显示成细条  
  标签：`image-crop`, `thumbnail`
- 浏览器视觉基线：已登记到 `public-ppt-page-visual-baselines.json`
  - `district-slide-2-title-bullets`
  - `district-slide-4-thumbnail-crop`

## 3. `watercolor.pptx`

- 文件位置：[public/watercolor.pptx](/Applications/work/ppt-preview/public/watercolor.pptx)
- 状态：`active`
- 用途：英文模板中的空白字符、主题色、占位符颜色、英文大标题换行

重点页面：

- 第 1 页：大标题 `MINIMALIST AESTHETIC SLIDESHOW` 换行  
  标签：`text-wrap`, `single-line-heuristic`
- 第 3 页：目录页三列正文换行、颜色一致性  
  标签：`text-wrap`, `text-color`, `theme-color`
- 第 10 页：两列正文颜色应继承模板浅棕主题色  
  标签：`text-color`, `theme-color`, `placeholder`
- 浏览器视觉基线：已登记到 `public-ppt-page-visual-baselines.json`
  - `watercolor-slide-1-hero-title`
  - `watercolor-slide-3-columns-theme`
  - `watercolor-slide-10-body-theme-color`

## 4. `math_calculus_formulas.pptx`

- 文件位置：[public/math_calculus_formulas.pptx](/Applications/work/ppt-preview/public/math_calculus_formulas.pptx)
- 状态：`active`
- 用途：公式图片资源、伪 PNG 真 SVG 的媒体兼容样本

重点页面：

- 第 1 页：两张公式图实际是 SVG 内容，但资源扩展名是 `.png`  
  标签：`math-media`, `media-mime`, `image-fallback`

## 5. `AI.Tech.Agency.Infographics.by.Slidesgo.pptx`

- 文件位置：[public/AI.Tech.Agency.Infographics.by.Slidesgo.pptx](/Applications/work/ppt-preview/public/AI.Tech.Agency.Infographics.by.Slidesgo.pptx)
- 状态：`partial`
- 用途：大体量模板，压测 group、connector、arrow、table、复杂 text inset

关注点：

- 第 4 页：四段流程卡片之间的 connector/辅助线；本轮已确认 parser 能给出 `straightConnector1` path，但其中一批元素 `width=0` 或 `height=0`，需要 renderer 侧做最小可见盒子兜底，否则浏览器里会整段消失  
  标签：`connector`, `zero-size-bounds`, `shape-svg`
- 第 5 页：3 x 3 table；已完成浏览器视觉冒烟验证，结构稳定、无明显双线或重复渲染，但 `INTERMEDIATE` 等英文仍有硬拆分，正文 typography 仍待补强
- 第 24 页：5 x 2 table，包含 `gridSpan / hMerge` 合并单元格；已完成浏览器视觉冒烟验证，结构可读且未见明显内部双线；本轮已补基础 table typography 字段归一化与渲染样式映射
- 第 26 页：5 x 6 table；已完成浏览器视觉冒烟验证，结构对齐正常，未见明显重复渲染或内部双线，但单元格小字在舞台预览中仍偏小
- 第 31 页：4 x 5 table；已完成浏览器视觉冒烟验证，文字可读，边框与网格稳定，未见明显内部双线或布局破坏
- group 坐标体系
- connector / arrow 大量分布
- table 渲染
- 复杂文本盒模型

标签：

- `group`
- `arrow-marker`
- `connector`
- `table`
- `table-typography`
- `text-inset`

## 6. `AI Beatify Slides Example.pptx`

- 文件位置：[public/AI Beatify Slides Example.pptx](/Applications/work/ppt-preview/public/AI%20Beatify%20Slides%20Example.pptx)
- 状态：`partial`
- 用途：模板型回归样本，覆盖 bullet / table / 标题布局

重点页面：

- 第 4 页：4 x 2 table；已完成浏览器视觉冒烟验证，结构基本正确，但字号偏小、文本拥挤、局部有裁切感，当前主问题是 table typography

标签：

- `bullet`
- `table`
- `text-wrap`
- `table-typography`

## 7. `83f822650ce0499c835780f673faed2b.pptx`

- 文件位置：[public/83f822650ce0499c835780f673faed2b.pptx](/Applications/work/ppt-preview/public/83f822650ce0499c835780f673faed2b.pptx)
- 状态：`partial`
- 用途：表格和项目符号样本

重点页面：

- 第 4 页：4 x 2 table；已完成浏览器视觉冒烟验证，结构稳定、无明显双线/重复渲染，但小字偏小、行高偏紧

标签：

- `table`
- `bullet`
- `table-typography`

## 9. `演示文稿1.pptx`

- 文件位置：[public/演示文稿1.pptx](/Applications/work/ppt-preview/public/%E6%BC%94%E7%A4%BA%E6%96%87%E7%A8%BF1.pptx)
- 状态：`active`
- 用途：小型页面转场回归样本，覆盖 `fade / push / wipe` 与基于 `advTm` 的自动翻页

重点页面：

- 第 1 页：`fade` 转场，`advTm=6000`；已确认通过 slide XML enhancer 回填 `advanceAfterMs`
- 第 2 页：`push` 转场，`advTm=6500`；当前浏览器/WPS 对照表明 `slide1 -> slide2` 的视觉更接近目标页 `push` 语义，runtime 现已按 destination slide 读取转场元数据；同时 repo 当前这份二进制复验未解析出对象级 animation（runtime model `animations.length === 0`，且 `slide2.xml` 仍只有 timing root）
- 第 3 页：`wipe` 转场，`advTm=6500`；在 destination slide 语义下，对应 `slide2 -> slide3` 的页间转场；`wipe` 四向 helper 已完成，但仍待更系统的 WPS 对照
- 运行时语义：翻页时应使用 destination slide 的 `transition.type/duration`；WPS 对照下若继续按 source slide，会出现“每页转场都像慢一页/错位一页”的错配
- 全文档：未发现对象级 timing children，当前 XML 中只有 timing root；因此这份样本更适合作为“页面转场 + 自动播放”样本，而不是对象入场动画解析样本；但 WPS 对照已证明“当前 parser 没读出来”不能直接等同于“文件本身没有对象级效果”

标签：

- `transition`
- `timing`

## 10. `47e66b31f89d4b33b14c5010b92296c5.pptx`

- 文件位置：[public/47e66b31f89d4b33b14c5010b92296c5.pptx](/Applications/work/ppt-preview/public/47e66b31f89d4b33b14c5010b92296c5.pptx)
- 状态：`partial`
- 用途：媒体与 timing 样本，同时用于验证带 `dir` 的 `push` 转场，以及最小对象级 timing parser
- 已确认页面：
  - `slide2.xml`：`<p:push dir="u"/>`
  - `slide6.xml`：`<p:push dir="u"/>`
  - `slide7.xml`：`<p:push dir="u"/>`
- 浏览器回归：已确认 `slide2 -> slide3` 的 mid-transition 为双 viewport，上一页向下退出、下一页自上方进入，符合 `dir="u"` 的垂直推进
- timing 回归：当前浏览器 runtime 已能在 `slide2/3/4/6/7/8` 读到最小 click-triggered `slide.animations`，说明 `slide-animations.ts` 已经把 `p:timing` 中的 `clickEffect` 注入到模型；当前解析仍主要覆盖媒体/简单 shape target，不代表完整 Office 对象动画已打通
- 边界：当前仓库内仍缺少带 `dir` 的真实 `wipe` fixture，因此 `wipe r/l/u/d` 仍主要由纯函数测试覆盖

标签：

- `video`
- `audio`
- `timing`
- `transition`
- `media-sync`

## 11. `wipe-directions-fixture.pptx`

- 文件位置：[public/wipe-directions-fixture.pptx](/Applications/work/ppt-preview/public/wipe-directions-fixture.pptx)
- 状态：`active`
- 用途：真实 `wipe dir` 浏览器回归样本；由 `演示文稿1.pptx` 衍生，专门用于验证 `r/l/u/d` 四向 clip-path 渲染
- 已确认页面：
  - `slide1.xml`：`<p:wipe dir="r"/>`
  - `slide2.xml`：`<p:wipe dir="l"/>`
  - `slide3.xml`：`<p:wipe dir="u"/>`
  - `slide4.xml`：`<p:wipe dir="d"/>`
- 浏览器回归：
  - `slide1 -> slide2`：`clipPath = inset(0 44% 0 0)`，从左向右揭示
  - `slide2 -> slide3`：`clipPath = inset(0 0 0 42%)`，从右向左揭示
  - `slide3 -> slide4`：`clipPath = inset(33% 0 0 0)`，从下向上揭示
  - `slide4 -> slide5`：`clipPath = inset(0 0 35% 0)`，从上向下揭示
- 边界：当前已完成真实页 `dir` 行为核对，但仍未做系统截图对照与 Office/WPS 中间态像素级比对

标签：

- `transition`
- `timing`

## 12. `transition-cover-uncover-zoom-split-fixture.pptx`

- 文件位置：[public/transition-cover-uncover-zoom-split-fixture.pptx](/Applications/work/ppt-preview/public/transition-cover-uncover-zoom-split-fixture.pptx)
- 状态：`active`
- 用途：真实 `cover / pull(uncover) / zoom / split` 转场浏览器回归样本；由 `wipe-directions-fixture.pptx` 派生，专门用于补齐非 `fade/push/wipe` typed dispatch 的真实解析输入
- 已确认页面：
  - `slide2.xml`：`<p:cover dir="r"/>`
  - `slide3.xml`：`<p:pull dir="l"/>`，runtime 语义应映射为 `uncover`
  - `slide4.xml`：`<p:zoom/>`
  - `slide5.xml`：`<p:split orient="vert" dir="out"/>`
- 当前价值：
  - parser 已可复验 `pull -> uncover` 语义映射
  - 已有真实 PPTX regression test：`src/components/presentation/transitionFixtureRegression.test.ts`
  - 后续可直接接入 `transition-regression-harness.js`，固化 `frame.transitionType / transitionDirection / viewport transform / opacity`
  - 为 `zoom / cover / uncover / split` 从“纯函数 fallback”推进到“真实 PPTX 回归”提供固定输入
  - 已开始沉淀冻结态视觉基线，例如：
    [cover-right-real-browser.png](/Applications/work/ppt-preview/fixtures/visual-baselines/cover-right-real-browser.png)、
    [uncover-left-real-browser.png](/Applications/work/ppt-preview/fixtures/visual-baselines/uncover-left-real-browser.png)、
    [zoom-default-real-browser.png](/Applications/work/ppt-preview/fixtures/visual-baselines/zoom-default-real-browser.png)、
    [split-vert-out-real-browser.png](/Applications/work/ppt-preview/fixtures/visual-baselines/split-vert-out-real-browser.png)
- 边界：
  - 目前还没有把这份 fixture 的中间态接入自动截图比对
  - `zoom` 已升级到更强的 eased reciprocal scaling、`split` 已有第一版 center/outer `clip-path` 几何，但整体仍不是 Office/WPS 的高保真 mask/clip/easing 语义

标签：

- `transition`
- `timing`
- `cover`
- `uncover`
- `zoom`
- `split`

## 9. `math_probability_statistics_formulas.pptx`

- 文件位置：[public/math_probability_statistics_formulas.pptx](/Applications/work/ppt-preview/public/math_probability_statistics_formulas.pptx)
- 状态：`backlog`
- 用途：数学公式资源回归样本

标签：

- `math-media`
- `formula-layout`

## 10. `math_linear_algebra_formulas.pptx`

- 文件位置：[public/math_linear_algebra_formulas.pptx](/Applications/work/ppt-preview/public/math_linear_algebra_formulas.pptx)
- 状态：`backlog`
- 用途：数学公式资源回归样本

标签：

- `math-media`
- `formula-layout`

## 11. `f.pptx`

- 文件位置：[public/f.pptx](/Applications/work/ppt-preview/public/f.pptx)
- 状态：`partial`
- 用途：通用临时样本，目前未整理详细页面问题

标签：

- `unclassified`

## 12. XML enhancer synthetic regression fixtures

- 文件位置：
  - [src/adapters/pptxtojson/enhancers/bullets.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/bullets.test.ts)
  - [src/adapters/pptxtojson/enhancers/text-body.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/text-body.test.ts)
  - [src/adapters/pptxtojson/enhancers/line-markers.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/line-markers.test.ts)
  - [src/adapters/pptxtojson/enhancers/media-mime.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/media-mime.test.ts)
  - [src/adapters/pptxtojson/enhancers/raw-enhancements.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/raw-enhancements.test.ts)
- 状态：`covered-by-test`
- 用途：解析增强层拆分过程中的最小回归样本，先锁住 bullet 字符兼容、text body inset / placeholder 注入、line marker 元数据读取、伪 PNG 真 SVG MIME 修正、raw element enhancer-owned 字段写入边界

标签：

- `xml-enhancer`
- `text-inset`
- `placeholder`
- `bullet`
- `arrow-marker`
- `media-mime`
- `math-media`

## 13. Runtime synthetic regression fixtures

- 文件位置：
  - [src/runtime/createPresentationRuntime.test.ts](/Applications/work/ppt-preview/src/runtime/createPresentationRuntime.test.ts)
  - [src/runtime/sessionStore.test.ts](/Applications/work/ppt-preview/src/runtime/sessionStore.test.ts)
  - [src/runtime/input/inputEngine.test.ts](/Applications/work/ppt-preview/src/runtime/input/inputEngine.test.ts)
  - [src/runtime/media/mediaEngine.test.ts](/Applications/work/ppt-preview/src/runtime/media/mediaEngine.test.ts)
  - [src/runtime/evaluatePresentationFrame.test.ts](/Applications/work/ppt-preview/src/runtime/evaluatePresentationFrame.test.ts)
  - [src/runtime/timeline/timelineEngine.test.ts](/Applications/work/ppt-preview/src/runtime/timeline/timelineEngine.test.ts)
  - [src/runtime/transition/transitionEngine.test.ts](/Applications/work/ppt-preview/src/runtime/transition/transitionEngine.test.ts)
- 说明文档：[fixtures/runtime-regression-cases.md](./runtime-regression-cases.md)
- 状态：`covered-by-test`
- 用途：Runtime Engine 拆分过程中的合成回归样本，先锁住 Session Store、Playback Policy、Timeline Engine、Transition Engine、Media Engine 与 Input Engine 行为

标签：

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

## 14. Table renderer synthetic regression fixtures

- 文件位置：
  - [src/adapters/pptxtojson/normalizePresentation.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.test.ts)
  - [src/components/presentation/tableModel.test.ts](/Applications/work/ppt-preview/src/components/presentation/tableModel.test.ts)
- 状态：`covered-by-test`
- 用途：表格渲染首批最小回归样本，先锁住 pptxtojson `data / rowHeights / colWidths` 到 `NormalizedTableMeta` 的转换，以及 `TableRenderer` 消费的 grid track、cell span、fill/font/border/vAlign 样式映射；第二批补充 `hMerge / vMerge` continuation cell 过滤，避免合并单元格重复渲染撑乱 CSS grid；本轮补充基础 typography 字段 `fontFamily / fontSize / fontItalic / fontUnderline` 的 normalize 与 renderer helper 映射

标签：

- `table`
- `table-renderer`
- `table-merge`
- `table-typography`

## 15. Slide animation synthetic regression fixtures

- 文件位置：
  - [src/adapters/pptxtojson/enhancers/slide-animations.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/enhancers/slide-animations.test.ts)
  - [src/adapters/pptxtojson/normalizePresentation.test.ts](/Applications/work/ppt-preview/src/adapters/pptxtojson/normalizePresentation.test.ts)
- 状态：`covered-by-test`
- 用途：锁住 slide XML 中 `p:timing` / `p:bldLst` 的最小动画提取与标准化传播，避免后续继续只靠真实样本猜测“到底是 timing root、paragraph build，还是 parser 漏读”；当前重点是把 `clickEffect / withEffect / afterEffect`、`targetParagraphIndex` 和最小 `bldP` paragraph build 先稳定下来

标签：

- `timing`
- `animation`
- `paragraph-build`
- `object-animation`

## 16. Complex element synthetic regression fixture

- 文件位置：[public/chart-diagram-fixture.pptx](/Applications/work/ppt-preview/public/chart-diagram-fixture.pptx)
- 说明文档：[fixtures/complex-element-regression-cases.md](./complex-element-regression-cases.md)
- 状态：`targeted-fixture`
- 用途：补齐仓库当前缺失的 `chart / diagram` 页面样本，先锁住 parser -> normalize -> renderer 主链路

标签：

- `chart`
- `diagram`
- `smartart`
- `complex-element`

## 17. `0501.pptx` text margin regression fixture

- 文件位置：[public/0501.pptx](/Applications/work/ppt-preview/public/0501.pptx)
- 代表测试：
  - [src/components/presentation/p0501FixtureRegression.test.ts](/Applications/work/ppt-preview/src/components/presentation/p0501FixtureRegression.test.ts)
  - [src/components/presentation/textHtmlSanitizer.test.ts](/Applications/work/ppt-preview/src/components/presentation/textHtmlSanitizer.test.ts)
- 状态：`targeted-fixture`
- 用途：锁住真实课件里“文本内容已经解析出来，但被异常 paragraph margin 顶出文本框”的回归；当前已覆盖第 `5` 页章节列表样本，重点验证 `margin-top / margin-bottom` 清洗与 `margin-left / text-indent` 保留

标签：

- `text`
- `paragraph-margin`
- `html-sanitizer`
- `real-fixture`
- `0501`

补充覆盖：

- 第 `2` 页：真实 click timing 使用 `spid=7171 / 7172`，并带 `txEl > charRg` 的逐次 reveal；当前 fixture regression 已锁住真实 shape id 贯通和左侧列表逐条出现
- 第 `5` 页：异常 `paragraph margin` 把章节列表顶出文本框
- 第 `7` 页：深色模板下亮色标题 + 黑色正文混排，锁正文颜色矫正
