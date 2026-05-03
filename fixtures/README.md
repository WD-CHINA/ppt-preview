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
冻结态截图产物和可复用采集脚本维护在 [visual-baselines/](./visual-baselines/README.md)：当前已经覆盖 `push / wipe / cover / uncover / zoom / split`，并提供 `captureTransitionVisualBaselines.mjs` 供 in-app browser 的 `node_repl` 直接复采；本地一致性校验可直接运行 `pnpm test:visual-baselines`。此外，`public/` 下全部 PPT 现已统一登记到 [visual-baselines/public-ppt-fixture-registry.json](./visual-baselines/public-ppt-fixture-registry.json)，后续模型可先从这个 registry 判断每份样本当前已有的基线类型与缺口；非转场页面截图基线已登记到 [visual-baselines/public-ppt-page-visual-baselines.json](./visual-baselines/public-ppt-page-visual-baselines.json)，当前已覆盖 `0501.pptx`、`AI.Tech.Agency.Infographics.by.Slidesgo.pptx`、`4b00a85c247c47bdaeb01aeec562c90f.pptx`、`区级平台介绍.pptx` 和 `watercolor.pptx` 的关键问题页。
浏览器视觉基线已升级为项目规范，后续模型默认应先读取 [docs/browser-visual-baseline-spec.md](/Applications/work/ppt-preview/docs/browser-visual-baseline-spec.md) 再处理 registry / manifest / PNG。
复杂元素样本维护在 [complex-element-regression-cases.md](./complex-element-regression-cases.md)：当前先补了一份 targeted synthetic fixture [`public/chart-diagram-fixture.pptx`](/Applications/work/ppt-preview/public/chart-diagram-fixture.pptx) 来覆盖 `chart / diagram` 主链路；需要重建时可直接运行 `pnpm generate:complex-fixture`。

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
