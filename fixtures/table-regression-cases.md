# Table Regression Cases

本文档记录 table renderer 的真实 PPTX 页面与合成测试边界。

## Synthetic cases

- `src/adapters/pptxtojson/normalizePresentation.test.ts`
  - 覆盖 `data / rowHeights / colWidths` 到 `NormalizedTableMeta` 的标准化
  - 覆盖 `colSpan / rowSpan / hMerge / vMerge / fillColor / fontColor / fontFamily / fontSize / fontItalic / fontUnderline / borders / vAlign` 字段保留
- `src/components/presentation/tableModel.test.ts`
  - 覆盖 CSS grid track 输出
  - 覆盖 cell span、fill/font typography/border/vAlign 样式映射
  - 覆盖 `hMerge / vMerge` continuation cell 过滤，避免合并单元格重复渲染

## Real PPTX table pages found by XML scan

扫描方法：读取 `ppt/slides/slide*.xml`，查找 `http://schemas.openxmlformats.org/drawingml/2006/table` / `<a:tbl`。

| File | Slide | Shape |
| --- | ---: | --- |
| `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` | 5 | 3 x 3 table |
| `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` | 24 | 5 x 2 table, contains `gridSpan / hMerge`; visual smoke checked in browser, table structure readable and no obvious doubled borders |
| `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` | 26 | 5 x 6 table; browser smoke checked, structure aligned, no obvious duplicated render or doubled borders; cell text remains small in stage preview |
| `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` | 31 | 4 x 5 table; browser smoke checked, text readable, borders/grid stable, no obvious doubled borders or layout break |
| `AI Beatify Slides Example.pptx` | 4 | 4 x 2 table |
| `83f822650ce0499c835780f673faed2b.pptx` | 4 | 4 x 2 table |

## Current support boundary

已覆盖：

- 基础 table model
- 行高/列宽
- 单元格文本
- `colSpan / rowSpan`
- `hMerge / vMerge` continuation 过滤
- 基础 fill/font/border/vAlign
- 基础 table cell typography：`fontFamily / fontSize / fontItalic / fontUnderline` 先在 normalize 层归一化、renderer helper 消费，不让 Vue 直接理解 pptxtojson raw cell 字段
- 小字号 table typography 首轮补强：对 `fontSize <= 16px` 的 cell 统一提高 `line-height` 到 `1.35`、padding 到 `6px 8px`，并把 `overflow-wrap` 从 `anywhere` 收紧为 `break-word`，降低英文单词被硬拆分的概率
- 第二轮 typography 补强：对单个长英文标签（当前规则：清洗 HTML 后无空格且长度 >= 10）优先走“缩小字号 + 禁止硬拆词”策略：`fontSize * 0.9`、`word-break: keep-all`、`overflow-wrap: normal`，避免继续把 `INTERMEDIATE` 这类表头完全压成硬拆分
- 第三轮 typography 补强：把窄列宽纳入 `tableModel.ts`，按 `position + table.colWidths + colSpan` 计算 cell 可用宽度；当单个长英文标签落在 `<= 72px` 的窄列时，进一步收紧到 `fontSize * 0.8`、`lineHeight: 1.15`、`padding: 4px 5px`，优先通过缩小和 keep-all 争取整词显示
- 第四轮 typography 补强：开始读取 table cell HTML 的 paragraph 结构；对多段内容（当前规则：`<p>` 数量 > 1）的小字号 cell 提高 `lineHeight` 到 `1.5`、padding 到 `7px 8px`，并明确输出 `word-break: normal`、`overflow-wrap: break-word`，优先缓解多段正文的拥挤和底部裁切感
- 第五轮 typography 补强：开始读取 run 级 `font-size` 信息；若 table cell HTML 内部 span/run 的字号大于 cell 自身 `fontSize`，则以更大的 run 级字号作为 typography 决策的 effective font size，避免继续把带大标题 run 的 cell 当成“小字号正文 cell”处理
- fallback border collapse：按单元格位置只绘制必要 fallback 边，避免内部双线
- 真实页浏览器冒烟验证已覆盖 `AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 24 / 26 / 31 页，当前未见明显结构错位、重复渲染或内部双线

仍需后续补强：

- 完整 Office table theme/style 继承
- 真实页面截图回归
- 更精细的显式 border 冲突优先级 / overlapping border 策略
- 更完整的 table typography：cell padding / line-height / paragraph run 级字号与换行策略
- 已完成剩余真实 table 页验证：`AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 5 页、`AI Beatify Slides Example.pptx` 第 4 页、`83f822650ce0499c835780f673faed2b.pptx` 第 4 页；当前结论是结构稳定但 typography 仍是主问题
- 第二轮浏览器验证结果：`AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 5 页在单个长英文标签上只有小幅改善，`INTERMEDIATE` 仍会被拆词，说明后续需要更细的列宽感知或 run 级策略，而不仅是全局 CSS 调整
- 第三轮浏览器验证结果：加入列宽感知后，`AI.Tech.Agency.Infographics.by.Slidesgo.pptx` 第 5 页表头拆词继续小幅改善，但 `INTERMEDIATE` 仍未彻底解决；说明仅靠 cell 级列宽启发式仍不够，下一步应转 paragraph/run 级 typography，而不是继续堆更多全局 CSS
- 第四轮浏览器验证结果：`AI Beatify Slides Example.pptx` 第 4 页多段正文观感更松，但底部仍有轻微裁切风险；说明 paragraph-aware typography 有帮助，但距离 run 级排版仍有差距
- 第五轮回归结论：run 级字号感知已通过 synthetic test 覆盖，但真实页收益暂不明显；当前至少未观察到新的双线、重复渲染或 JS error，run 级策略后续仍需结合真实页继续验证
- 下一步更聚焦：按 paragraph/run 级信息细化 cell line-height、padding 与 wrapping，而不是再回头重做 merge/border 基线
