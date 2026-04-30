# `src/vendor/pptxtojson` 增强路线图

本文档用于整理当前 `src/vendor/pptxtojson/` 在 `ppt-preview` 项目中的能力现状、已知缺口，以及建议的增强顺序。

目标不是泛泛讨论 parser，而是结合当前仓库已经存在的 adapter enhancer、runtime gap、fixture 和知识库，明确：

- 哪些能力应该继续留在 adapter
- 哪些能力应当回收下沉到 vendor parser
- 哪些能力属于后续可分阶段推进的中长期增强

---

## 1. 当前结论

当前 `src/vendor/pptxtojson/` 已经具备：

- PPTX zip 读取
- slide / layout / master / theme 基本关系遍历
- 文本、图片、shape、table、chart、audio、video、math、diagram 的基础解析
- slide note / background / transition 的基础读取
- base64 / blob 资源抽取

但它距离当前项目想要的“商业级播放上游 parser”还差几类关键能力：

1. **对象级动画 timing 解析缺失**
2. **文本段落系统仍不完整**
3. **table / chart / SmartArt 仍然只有首轮结构化**
4. **部分原始语义仍靠 adapter 二次扫 XML 回填**
5. **健壮性、能力标记和测试基线还不够系统**

一句话概括：

> 当前 vendor 更像“覆盖面很广的内容抽取器”，还不是“能稳定支撑高保真播放 runtime 的结构化 parser”。

---

## 2. 当前 vendor 已有能力概览

### 2.1 主解析链路

主入口：`src/vendor/pptxtojson/pptxtojson.js`

当前已完成：

- 从 `[Content_Types].xml` 获取 slide / layout 列表
- 从 `presentation.xml` 获取尺寸和默认文本样式
- 从 `presentation.xml.rels` 获取 theme
- 逐页读取：
  - slide rels
  - layout
  - master
  - theme rels
  - tableStyles
  - notes
- 汇总输出：
  - `slides`
  - `usedFonts`
  - `themeColors`
  - `size.width / size.height`

### 2.2 当前已覆盖的对象类型

从主入口引用和现有输出看，vendor 已覆盖：

- `text`
- `image`
- `shape`
- `table`
- `chart`
- `video`
- `audio`
- `math`
- `diagram`
- `group`

### 2.3 当前已覆盖的基础能力

- 文本 HTML 生成：`src/vendor/pptxtojson/text.js`
- 段落对齐 / spacing / autofit 基础读取：`src/vendor/pptxtojson/paragraph.js`
- fill / gradient / pattern / media loading：`src/vendor/pptxtojson/fill.js`
- border 基础读取：`src/vendor/pptxtojson/border.js`
- 自定义 shape path / 基础识别：`src/vendor/pptxtojson/shape.js`
- chart 基础数据模型：`src/vendor/pptxtojson/chart.js`
- SmartArt 依赖和文本抽取：`src/vendor/pptxtojson/diagram.js`
- slide transition 基础读取：`src/vendor/pptxtojson/animation.js`
- XML 读取与简化：`src/vendor/pptxtojson/readXmlFile.js`

---

## 3. 当前 adapter 正在替 vendor 兜底的能力

这是决定 vendor 演进优先级的关键依据。

当前 `src/adapters/pptxtojson/` 已经在做下面这些“按理更适合下沉到 parser”的事情：

### 3.1 transition 增强

相关文件：

- `src/adapters/pptxtojson/enhancers/slide-transitions.ts`

当前 adapter 补了：

- `orientation`
- 更稳的 `p14:dur`
- `advTm`
- `pull -> uncover` 语义映射

说明：`src/vendor/pptxtojson/animation.js` 目前的 transition parser 仍不完整。

### 3.2 对象级动画 timing / build list 增强

相关文件：

- `src/adapters/pptxtojson/enhancers/slide-animations.ts`

当前 adapter 已补：

- `p:timing` 最小解析
- `clickEffect / withEffect / afterEffect`
- `spTgt spid`
- `cBhvr > cTn dur`
- 最小 `animMotion`
- `p:bldLst / p:bldP`
- `targetParagraphIndex`

说明：对象动画能力现在还不在 vendor 主 parser 内，仍靠后置 enhancer 从 slide xml 字符串二次解析。

### 3.3 text body / placeholder / bullet / marker 回填

相关文件：

- `src/adapters/pptxtojson/textBodyInsets.ts`
- `src/adapters/pptxtojson/enhancers/text-body.ts`
- `src/adapters/pptxtojson/enhancers/line-markers.ts`
- `src/adapters/pptxtojson/enhancers/bullets.ts`

当前 adapter 补了：

- `textBodyInset`
- `placeholderType / placeholderIndex`
- 自定义 bullet marker
- `lineHeadEnd / lineTailEnd`

说明：这些都属于元素原始语义，长期不应依赖 parse 后再扫 xml 回填。

### 3.4 media MIME 修正

相关文件：

- `src/adapters/pptxtojson/enhancers/media-mime.ts`

当前 adapter 补了：

- “扩展名是 png、内容其实是 svg” 的 MIME 修正

说明：这更像 vendor 媒体资源层职责。

---

## 4. 增强优先级

这里按 `P0 / P1 / P2` 排序。

---

## 5. P0：优先下沉的能力

这些是当前最该做的 vendor 增强，因为：

- 项目里已经有 adapter 版本的验证经验
- 不下沉会让 adapter 越来越厚
- 直接影响 runtime / normalize / renderer 的输入稳定性

### 5.1 对象级动画 timing parser

建议落点：

- `src/vendor/pptxtojson/animation.js`
- 或拆出新的 `src/vendor/pptxtojson/timing.js`

建议补齐：

- `p:timing`
- `p:tnLst`
- `p:par`
- `p:seq`
- `p:childTnLst`
- `p:anim`
- `p:animEffect`
- `p:animMotion`
- `p:set`
- `p:cBhvr`
- `p:cTn`
- `p:stCondLst / p:endCondLst`
- `p:tgtEl / p:spTgt`

最小目标：

- 输出对象动画列表
- 包含 trigger、duration、target element id、effect、最小 motion path
- 能覆盖当前项目已经支持的 `appear / fade / onClick / withPrevious / afterPrevious`

### 5.2 paragraph build / bullet build parser

建议补齐：

- `p:bldLst`
- `p:bldP`
- `p:txEl`
- `p:pRg st/end`

最小目标：

- 直接由 vendor 输出 paragraph build 元数据
- 不再由 adapter 二次扫描 slide xml

### 5.3 transition parser 合并 adapter 增强

当前 vendor `parseTransition()` 建议补齐：

- `orientation`
- 更稳的 `p14:dur`
- `advTm`
- `pull -> uncover` 映射
- 更完整的 child effect attrs

最小目标：

- vendor 输出字段与当前 normalize/runtime 需要的字段一致：
  - `type`
  - `direction`
  - `orientation`
  - `duration`
  - `autoNextAfter`

### 5.4 text body / placeholder / line marker 原生输出

建议补齐：

- `a:bodyPr` inset
- `p:ph type / idx`
- `a:headEnd / a:tailEnd`
- 自定义 bullet 字符 / bullet font

最小目标：

- 元素 raw 输出直接包含：
  - `textBodyInset`
  - `placeholderType`
  - `placeholderIndex`
  - `lineHeadEnd`
  - `lineTailEnd`
  - `bulletMarkers`

### 5.5 embedded media MIME 修正下沉

建议补齐：

- 媒体加载时识别真实文件内容
- 对 SVG / XML 类资源使用正确 MIME 创建 Blob

最小目标：

- 不再需要 adapter 的 `media-mime.ts` 为 math / image 二次修正 MIME

---

## 6. P1：文本与表格系统增强

### 6.1 bullet indent / hanging indent / list semantics

当前状态：已完成首轮增强。

本轮已完成：

- vendor 输出和保留 `marL`
- vendor 输出和保留 `indent`
- `hanging indent` 已在 bullet marker 元数据中直出
- HTML 生成改为走段落样式继承链，不再只读本地 `a:pPr`
- 已覆盖 `a:lstStyle / layout / master / defaultTextStyle` 链路中的列表缩进 fallback

后续可继续补：

- 更细的编号样式语义
- renderer 侧对复杂嵌套 list 的更稳定布局策略
- adapter `bullets.ts` 的现存 TS 类型问题单独清理

### 6.2 vertical text / writing mode

当前状态：已完成首轮下沉与渲染打通。

已完成：

- vendor 输出 `bodyPr vert` 原始值到 `verticalMode`
- 保留更明确的 vertical text 标记 `isVertical`
- renderer 按 `verticalMode` 区分 `vertical-rl / vertical-lr / sideways-rl`
- 补充 `textOrientation` 映射与回归测试

后续可继续补：

- 其他较少见 vertical mode 的细粒度语义
- 与 placeholder/master/default style 继承链的进一步联动

### 6.3 autofit / shrink text

当前状态：已完成首轮增强。

本轮已完成：

- `fontScale` 明确输出
- `shape autofit / text autofit / no autofit` 更完整区分
- vendor 输出 `enabled`、`source`、`lineSpacingReduction`
- 已接入 shape -> layout -> master 的 autofit 继承链

后续可继续补：

- placeholder/default text style 侧更深的 autofit 继承语义
- renderer/runtime 侧是否消费 `lineSpacingReduction` 的产品策略

### 6.4 paragraph/run richer style

建议补齐：

- baseline / superscript / subscript 更规范输出
- strike / caps / highlight
- lang / script / kerning
- tab stop
- richer paragraph defaults

### 6.5 table style/theme 继承补齐

当前状态：本轮已完成首批增强，P1 里的核心缺口已补齐。

此前 `table.js` 已经做了：

- `wholeTbl`
- `firstRow / lastRow`
- `band1H / band2H`
- cell fill/font/border/vAlign

本轮新增完成：

- first/last column
- vertical banding
- cell margin / padding
- 更完整的多层 theme style fallback
- richer cell typography metadata 继续补齐到 `fontItalic / highlight / letterSpacing / textTransform / lang`
- `wholeTbl -> row/col/band -> corner -> local cell` 的优先级继承与集成测试

后续可继续补：

- 更多 border/detail theme case 的回归样例
- 复杂合并单元格与 band/corner 组合下的更多 fixture 验证

---

## 7. P1：chart 与 SmartArt 增强

### 7.1 chart 数据模型升级

当前 `chart.js` 已有：

- type
- data
- colors
- grouping
- barDir / holeSize / marker / radarStyle 等部分字段

建议继续补：

- axis
- legend
- data label
- title
- category/value schema 统一化
- stacked / percent / series order 信息

目标：

- 让 chart renderer 不必只依赖松散 data 结构自行推断

### 7.2 SmartArt 结构化

当前 `diagram.js` 更偏：

- 加载 data/layout/quickStyle/colors/drawing
- 抽取 SmartArt 文本

建议继续补：

- node tree
- parent/child relation
- layout kind
- drawing object 映射
- 每个 node 的文本与 visual target 对应关系

目标：

- 即便短期没有完整 SmartArt renderer，也先输出稳定结构语义

---

## 8. P2：shape / media / 健壮性增强

### 8.1 shape geometry 精细化

建议方向：

- connector/open line shape 几何更稳定
- line cap/join/compound/dash 更完整
- custom path / adjust value 更精细
- 与 line marker 参数联动更紧密

### 8.2 media metadata 丰富化

建议方向：

- natural size
- poster candidate
- trim start/end
- autoplay / loop / volume flags
- 更系统的 image effect 输出

### 8.3 theme / xml 健壮性

建议方向：

- `a:theme` 缺失或空引用容错
- 单个 part 解析失败时按 slide/part 降级，而不是静默吞掉全部上下文
- 输出 warning / capability 标记

### 8.4 parser capability / warning 输出

建议方向：

- 输出 `capabilities`
- 输出 `warnings`
- 明确某份 PPT 是否解析到了：
  - timing
  - build list
  - chart semantics
  - SmartArt semantics
  - table style inheritance

这样 normalize / runtime 可以更明确判断是否走 fallback。

---

## 9. 推荐实施顺序

### 阶段 1：回收当前 adapter 已验证的 XML 补丁

优先回收：

1. transition orientation / duration / advTm 增强
2. 对象 timing 最小 parser
3. build list parser
4. textBodyInset / placeholder
5. line marker
6. media MIME 修正

原因：

- 现成经验最多
- 风险可控
- 收益立刻可见
- 能明显减轻 adapter 复杂度

### 阶段 2：补文本系统和 table 系统

当前状态：已部分完成。

优先补：

1. bullet/list indent
2. vertical text（已完成）
3. autofit/shrink
4. table style/theme inheritance（已完成）
5. richer cell typography metadata（本轮已完成首批补齐）

### 阶段 3：补 chart 和 SmartArt

优先补：

1. chart axis/legend/data label/schema
2. SmartArt node tree / relation / layout kind

### 阶段 4：健壮性和 parser 工程化

优先补：

1. capability / warning output
2. theme/xml 容错
3. parser fixture regression tests

---

## 10. 建议保留在 adapter 的职责

即使 vendor 增强后，下面这些仍适合保留在 adapter：

- 项目专属字段重命名和 normalize
- 与 runtime 强相关的默认值补齐
- 商业产品专属降级策略
- 同页颜色兜底、placeholder 主题色兜底这类“产品层修正”
- renderer/runtime 导向的行为性 patch

原则：

> vendor 负责“尽量真实、尽量完整地把 OOXML 解析成结构化 JSON”；adapter 负责“把该 JSON 适配成当前项目稳定、可消费的标准化模型”。

---

## 11. 当前最值得立刻立项的 vendor 任务

如果只做第一批，我建议就立这 5 个：

1. 对象动画 `p:timing` parser
2. `p:bldLst / p:bldP` parser
3. transition parser 合并当前 adapter 增强
4. `textBodyInset / placeholder / line marker` 原生输出
5. embedded media MIME 修正下沉

这是当前收益最大、也最能减少 adapter 负担的一组改造。
