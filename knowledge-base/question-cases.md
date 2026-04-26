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
- 已覆盖基线：
  - `slide-transitions.ts` 已从 slide XML 读取 `p:transition` 的 `type / spd / advTm`
  - `textBodyInsets.ts` orchestration 已把 transition metadata 回填到 raw slide
  - `normalizePresentation` 已把 `transition.advanceAfterMs/advTm` 作为 autoplay fallback 归一化到 `slide.autoplay.advanceAfterMs`
  - `transitionViewportModel.ts` 已开始按 `fade / push / wipe` 派发不同的 viewport 中间态样式
  - 浏览器回归已确认 `演示文稿1.pptx` 第 2 页 push 中间态表现为 previous/current 双 viewport 水平推进
  - `createPresentationRuntime/evaluatePresentationFrame` 已补回归：翻页中的 transition duration/type 取 source slide，避免整份 deck 的转场类型与节奏整体错位一页
- 仍未覆盖：
  - 更复杂的转场方向参数
  - wipe 的更系统视觉回归
  - 对象级 entrance animation 解析；当前 `演示文稿1.pptx` 的 slide XML 只有 timing root，没有对象级 timing children，不能作为 entrance parser 回归样本
- 代表测试：
  - `src/adapters/pptxtojson/enhancers/slide-transitions.test.ts`
  - `src/adapters/pptxtojson/normalizePresentation.test.ts`
  - `src/components/presentation/transitionViewportModel.test.ts`

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
