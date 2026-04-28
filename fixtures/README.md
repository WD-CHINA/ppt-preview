# Fixtures

这个目录用于收敛当前项目里高频复现问题的 PPTX 样本，以及每个样本对应的页面清单和问题标签。

目标：

- 固定高频回归样本
- 给 vendor parser / adapter enhancers / normalize / renderer 提供稳定输入
- 为后续截图回归和 fixture 测试提供索引

当前样本目录中的源文件仍然放在 [public/](/Applications/work/ppt-preview/public)，这里先维护“索引和标签”，不复制二进制文件。

补充约定：Runtime / Policy / Engine 拆分类问题可以使用不依赖 PPTX 的合成 fixture，记录在 [runtime-regression-cases.md](./runtime-regression-cases.md)。真实 PPTX fixture 用于校验 `src/vendor/pptxtojson/` + `src/adapters/pptxtojson/` 的解析/标准化输出，以及最终视觉还原；合成 fixture 用于锁住状态机行为边界。

表格类问题同时维护 [table-regression-cases.md](./table-regression-cases.md)：用合成测试锁住 `NormalizedTableMeta` 与 renderer helper 行为，用真实 PPTX 页面索引推进视觉回归。

转场类真实视觉回归维护在 [transition-regression-cases.md](./transition-regression-cases.md)：记录固定 `transitionProgress` 下的真实 PPTX 中间态证据，并配套浏览器可直接 `import('/transition-regression-harness.js')` 的 harness [`public/transition-regression-harness.js`](/Applications/work/ppt-preview/public/transition-regression-harness.js)。当前还补了一份结构化基线 [`transition-regression-baseline.json`](./transition-regression-baseline.json)，先用 `frame + viewport styles` 守住行为，再逐步升级成截图/像素级对照。

## 使用约定

每个 fixture 至少记录以下信息：

- 文件名
- 用途
- 重点页面
- 问题标签
- 当前状态

问题标签建议复用以下集合：

- `xml-enhancer`
- `text-inset`
- `text-wrap`
- `text-color`
- `text-position`
- `placeholder`
- `vertical-text`
- `bullet`
- `arrow-marker`
- `connector`
- `helper-frame`
- `shape-border`
- `shape-shadow`
- `image-crop`
- `theme-color`
- `math-media`
- `table`
- `table-renderer`
- `table-merge`
- `table-typography`
- `chart`
- `diagram`
- `transition`
- `timing`
- `media-sync`
- `media-mime`
- `input-engine`
- `keyboard-shortcuts`
- `touch-swipe`

## 维护原则

1. 新增 fixture 时，优先写页面用途和问题标签，不要求一次写全所有页面。
2. 同一个问题如果已经在旧 fixture 中稳定复现，不重复新增相似样本。
3. 修复完成后不要删除 fixture，只更新状态为 `resolved` 或 `covered-by-test`。
4. 如果问题只在 WPS / PowerPoint 对比中出现，应在页面说明里明确标注“对照依赖”。
